/**
 * Unit Tests untuk ProjectService
 * Testing CRUD operations untuk MongoDB ProjectDocument
 */

// Set environment variables before any imports
Object.assign(process.env, {
  MONGODB_URI: 'mongodb+srv://kooetimui999:nzJNSie3kGrpIsG1@cluster0.f2bdrfx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  MONGODB_DB_NAME: 'dreamdev_test',
  NODE_ENV: 'test'
});

import { ProjectService } from '../projectService.ts';
import { TaskNode, ProjectDocument } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Mock MongoDB connection
jest.mock('../mongodb.ts', () => ({
  getDatabase: jest.fn(),
  COLLECTIONS: {
    PROJECTS: 'projects'
  }
}));

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockDb: jest.Mocked<{ collection: jest.Mock }>;
  let mockCollection: jest.Mocked<{ insertOne: jest.Mock; findOne: jest.Mock; updateOne: jest.Mock }>;

  beforeEach(async () => {
    projectService = new ProjectService();
    
    // Setup mock collection
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn()
    };

    // Setup mock database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Mock getDatabase to return our mock
    const mongodb = await import('../mongodb');
    (mongodb.getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const mockTaskTree: TaskNode[] = [
        {
          id: uuidv4(),
          taskName: 'Test Task',
          level: 1,
          contentSummary: 'Test content',
          entities: { actors: [], systems: [], features: [] },
          subTasks: [],
          status: 'pending',
          dependencies: []
        }
      ];

      const mockMetadata = {
        totalTasks: 1,
        rootTasks: 1,
        levelDistribution: { 1: 1 },
        entityStats: {
          totalActors: 0,
          totalSystems: 0,
          totalFeatures: 0,
          uniqueActors: [],
          uniqueSystems: [],
          uniqueFeatures: []
        },
        processingDuration: 100
      };

      mockCollection.insertOne.mockResolvedValue({
        acknowledged: true,
        insertedId: 'test-id'
      });

      const result = await projectService.createProject(
        'Test PRD text',
        mockTaskTree,
        'Test global context',
        mockMetadata
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(String),
          originalPrdText: 'Test PRD text',
          taskTree: mockTaskTree,
          globalContext: 'Test global context',
          metadata: mockMetadata,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should throw error when insert fails', async () => {
      mockCollection.insertOne.mockResolvedValue({
        acknowledged: false
      });

      await expect(
        projectService.createProject(
          'Test PRD',
          [],
          'Test context'
        )
      ).rejects.toThrow('Failed to create project');
    });
  });

  describe('getProjectById', () => {
    it('should return project when found', async () => {
      const mockProject: ProjectDocument = {
        _id: 'test-id',
        originalPrdText: 'Test PRD',
        taskTree: [],
        globalContext: 'Test context',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(mockProject);

      const result = await projectService.getProjectById('test-id');

      expect(result).toEqual(mockProject);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-id' });
    });

    it('should return null when project not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await projectService.getProjectById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findTaskByIdRecursive', () => {
    it('should find task at root level', () => {
      const taskId = uuidv4();
      const tasks: TaskNode[] = [
        {
          id: taskId,
          taskName: 'Root Task',
          level: 1,
          contentSummary: 'Root content',
          entities: { actors: [], systems: [], features: [] },
          subTasks: [],
          status: 'pending',
          dependencies: []
        }
      ];

      const result = projectService.findTaskByIdRecursive(tasks, taskId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(taskId);
      expect(result?.taskName).toBe('Root Task');
    });

    it('should find task in nested subtasks', () => {
      const rootTaskId = uuidv4();
      const subTaskId = uuidv4();
      
      const tasks: TaskNode[] = [
        {
          id: rootTaskId,
          taskName: 'Root Task',
          level: 1,
          contentSummary: 'Root content',
          entities: { actors: [], systems: [], features: [] },
          subTasks: [
            {
              id: subTaskId,
              taskName: 'Sub Task',
              level: 2,
              contentSummary: 'Sub content',
              entities: { actors: [], systems: [], features: [] },
              subTasks: [],
              status: 'pending',
              dependencies: []
            }
          ],
          status: 'pending',
          dependencies: []
        }
      ];

      const result = projectService.findTaskByIdRecursive(tasks, subTaskId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(subTaskId);
      expect(result?.taskName).toBe('Sub Task');
    });

    it('should return undefined when task not found', () => {
      const tasks: TaskNode[] = [
        {
          id: uuidv4(),
          taskName: 'Root Task',
          level: 1,
          contentSummary: 'Root content',
          entities: { actors: [], systems: [], features: [] },
          subTasks: [],
          status: 'pending',
          dependencies: []
        }
      ];

      const result = projectService.findTaskByIdRecursive(tasks, 'non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      mockCollection.updateOne.mockResolvedValue({
        modifiedCount: 1
      });

      const updates = {
        globalContext: 'Updated context'
      };

      const result = await projectService.updateProject('test-id', updates);

      expect(result).toBe(true);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'test-id' },
        { 
          $set: {
            ...updates,
            updatedAt: expect.any(Date)
          }
        }
      );
    });

    it('should return false when no project updated', async () => {
      mockCollection.updateOne.mockResolvedValue({
        modifiedCount: 0
      });

      const result = await projectService.updateProject('non-existent-id', {});

      expect(result).toBe(false);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1
      });

      const result = await projectService.deleteProject('test-id');

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'test-id' });
    });

    it('should return false when no project deleted', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0
      });

      const result = await projectService.deleteProject('non-existent-id');

      expect(result).toBe(false);
    });
  });
});
