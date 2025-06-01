/**
 * Prompt Generation API Route Tests
 * Testing prompt generation endpoint functionality
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
jest.mock('@/lib/projectService', () => ({
  projectService: {
    getProjectById: jest.fn(),
    findTaskByIdRecursive: jest.fn()
  }
}));

jest.mock('@/lib/promptComposer.service', () => ({
  PromptComposerService: jest.fn().mockImplementation(() => ({
    composePromptWithMetadataFromProject: jest.fn()
  }))
}));

import { projectService } from '@/lib/projectService';
import { PromptComposerService } from '@/lib/promptComposer.service';

const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockPromptComposerService = PromptComposerService as jest.MockedClass<typeof PromptComposerService>;

describe('/api/project/[projectId]/task/[taskId]/prompt', () => {

  let mockPromptComposerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPromptComposerInstance = {
      composePromptWithMetadataFromProject: jest.fn()
    };

    mockPromptComposerService.mockImplementation(() => mockPromptComposerInstance);
  });

  describe('GET', () => {
    const sampleProject = {
      _id: 'test-project-id',
      projectId: 'test-project-id',
      prdText: '# Sample PRD\n## Feature 1\nDescription',
      taskTree: [
        {
          id: 'task-1',
          taskName: 'Sample PRD',
          level: 1,
          contentSummary: '',
          entities: { actors: [], systems: [], features: [] },
          subTasks: [
            {
              id: 'task-2',
              taskName: 'Feature 1',
              level: 2,
              contentSummary: 'Description of feature 1',
              entities: { actors: [], systems: [], features: ['feature'] },
              subTasks: [],
              status: 'pending',
              dependencies: [],
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                priority: 'medium',
                riskLevel: 'low'
              }
            }
          ],
          status: 'pending',
          dependencies: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: 'medium',
            riskLevel: 'low'
          }
        }
      ],
      globalContext: 'Test global context',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sampleTask = sampleProject.taskTree[0].subTasks[0];

    const samplePromptResult = {
      promptText: '## Step 2.task-2: Feature 1\n\n### 🎯 Objective\nImplement Feature 1...',
      metadata: {
        taskId: 'task-2',
        taskName: 'Feature 1',
        level: 2,
        characterCount: 100,
        lineCount: 10,
        generatedAt: new Date().toISOString(),
        detectedEntities: {
          actors: [],
          systems: [],
          features: ['feature']
        }
      }
    };

    it('should generate prompt successfully', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce(sampleProject);
      mockProjectService.findTaskByIdRecursive.mockReturnValueOnce(sampleTask);
      mockPromptComposerInstance.composePromptWithMetadataFromProject.mockReturnValueOnce(samplePromptResult);

      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: 'task-2' })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Prompt generated successfully',
        data: {
          projectId: 'test-project-id',
          task: {
            id: 'task-2',
            name: 'Feature 1',
            level: 2,
            contentSummary: 'Description of feature 1',
            entities: { actors: [], systems: [], features: ['feature'] }
          },
          promptResult: samplePromptResult,
          projectContext: {
            globalContext: 'Test global context',
            totalTasks: expect.any(Number),
            createdAt: expect.any(String)
          }
        },
        timestamp: expect.any(String)
      });

      expect(mockProjectService.getProjectById).toHaveBeenCalledWith('test-project-id');
      expect(mockProjectService.findTaskByIdRecursive).toHaveBeenCalledWith(
        sampleProject.taskTree,
        'task-2'
      );
      expect(mockPromptComposerInstance.composePromptWithMetadataFromProject).toHaveBeenCalledWith(
        sampleTask,
        sampleProject
      );
    });

    it('should return 404 when project not found', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/project/non-existent/task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'non-existent', taskId: 'task-2' })
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Project with ID non-existent or its task tree not found',
        timestamp: expect.any(String)
      });
    });

    it('should return 404 when task not found', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce(sampleProject);
      mockProjectService.findTaskByIdRecursive.mockReturnValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task/non-existent/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: 'non-existent' })
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Task with ID non-existent not found in project test-project-id',
        timestamp: expect.any(String)
      });
    });

    it('should handle database errors', async () => {
      mockProjectService.getProjectById.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: 'task-2' })
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Database error',
        timestamp: expect.any(String)
      });
    });

    it('should handle prompt generation errors', async () => {
      mockProjectService.getProjectById.mockResolvedValueOnce(sampleProject);
      mockProjectService.findTaskByIdRecursive.mockReturnValueOnce(sampleTask);
      mockPromptComposerInstance.composePromptWithMetadataFromProject.mockImplementationOnce(() => {
        throw new Error('Prompt generation failed');
      });

      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: 'task-2' })
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Prompt generation failed',
        timestamp: expect.any(String)
      });
    });

    it('should handle missing projectId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/project//task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: '', taskId: 'task-2' })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'projectId is required and must be a non-empty string',
        timestamp: expect.any(String)
      });
    });

    it('should handle missing taskId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task//prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: '' })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'taskId is required and must be a non-empty string',
        timestamp: expect.any(String)
      });
    });

    it('should calculate total tasks correctly', async () => {
      const projectWithMultipleTasks = {
        ...sampleProject,
        taskTree: [
          ...sampleProject.taskTree,
          {
            id: 'task-3',
            taskName: 'Another Task',
            level: 1,
            contentSummary: 'Another task description',
            entities: { actors: [], systems: [], features: [] },
            subTasks: [],
            status: 'pending',
            dependencies: [],
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              priority: 'medium',
              riskLevel: 'low'
            }
          }
        ]
      };

      mockProjectService.getProjectById.mockResolvedValueOnce(projectWithMultipleTasks);
      mockProjectService.findTaskByIdRecursive.mockReturnValueOnce(sampleTask);
      mockPromptComposerInstance.composePromptWithMetadataFromProject.mockReturnValueOnce(samplePromptResult);

      const request = new NextRequest('http://localhost:3000/api/project/test-project-id/task/task-2/prompt');
      const response = await GET(request, {
        params: Promise.resolve({ projectId: 'test-project-id', taskId: 'task-2' })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.projectContext.totalTasks).toBe(2); // Actual calculation from implementation
    });
  });
});