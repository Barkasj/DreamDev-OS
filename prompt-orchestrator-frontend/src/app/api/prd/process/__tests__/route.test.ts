/**
 * PRD Processing API Route Tests
 * Testing PRD processing endpoint functionality
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
jest.mock('../../../../../lib/prdParser.service', () => ({
  PrdParserService: jest.fn().mockImplementation(() => ({
    processPrd: jest.fn()
  }))
}));

jest.mock('../../../../../lib/projectService', () => ({
  projectService: {
    createProjectWithContext: jest.fn()
  }
}));

jest.mock('../../../../../lib/contextStackManager.service', () => ({
  ContextStackManagerService: jest.fn().mockImplementation(() => ({
    extractGlobalContext: jest.fn(),
    extractModuleContexts: jest.fn()
  }))
}));

import { PrdParserService } from '../../../../../lib/prdParser.service';
import { projectService } from '../../../../../lib/projectService';
import { ContextStackManagerService } from '../../../../../lib/contextStackManager.service';

const mockPrdParserService = PrdParserService as jest.MockedClass<typeof PrdParserService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockContextStackManagerService = ContextStackManagerService as jest.MockedClass<typeof ContextStackManagerService>;

describe('/api/prd/process', () => {
  let mockPrdParser: jest.Mocked<PrdParserService>;
  let mockContextManager: jest.Mocked<ContextStackManagerService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockPrdParser = {
      processPrd: jest.fn()
    };
    mockContextManager = {
      extractGlobalContext: jest.fn(),
      extractModuleContexts: jest.fn()
    };

    mockPrdParserService.mockImplementation(() => mockPrdParser);
    mockContextStackManagerService.mockImplementation(() => mockContextManager);
  });

  describe('POST', () => {
    const samplePrdText = `# Sample PRD
## Feature 1
Description of feature 1

## Feature 2
Description of feature 2`;

    const sampleTaskTree = [
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
    ];

    // Flatten tasks untuk menyesuaikan dengan implementasi route
    const flattenedTasks = [
      sampleTaskTree[0], // parent task
      sampleTaskTree[0].subTasks[0] // subtask
    ];

    const sampleProcessingResult = {
      taskTree: sampleTaskTree,
      totalTasks: 2,
      levelDistribution: { 1: 1, 2: 1 },
      entityStats: {
        totalActors: 0,
        totalSystems: 0,
        totalFeatures: 1,
        uniqueActors: [],
        uniqueSystems: [],
        uniqueFeatures: ['feature']
      },
      processingMetadata: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        processingDuration: 0,
        inputSize: samplePrdText.length
      }
    };

    it('should process PRD successfully', async () => {
      const projectId = 'test-project-id';
      
      mockPrdParser.processPrd.mockReturnValueOnce(sampleProcessingResult);
      mockContextManager.extractGlobalContext.mockReturnValueOnce({
        summary: 'Test global context',
        projectType: 'web-application',
        complexity: 'medium',
        techStack: ['next.js', 'typescript']
      });
      mockContextManager.extractModuleContexts.mockReturnValueOnce([]);
      mockProjectService.createProjectWithContext.mockResolvedValueOnce(projectId);

      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: samplePrdText })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'PRD processed successfully',
        data: {
          projectId,
          taskTree: sampleTaskTree,
          totalTasks: 2,
          levelDistribution: { 1: 1, 2: 1 },
          entityStats: {
            totalActors: 0,
            totalSystems: 0,
            totalFeatures: 1,
            uniqueActors: [],
            uniqueSystems: [],
            uniqueFeatures: ['feature']
          },
          processingMetadata: expect.objectContaining({
            startTime: expect.any(String),
            endTime: expect.any(String),
            processingDuration: expect.any(Number),
            inputSize: samplePrdText.length
          }),
          allTasks: flattenedTasks
        },
        timestamp: expect.any(String)
      });

      expect(mockPrdParser.processPrd).toHaveBeenCalledWith(samplePrdText);
      expect(mockContextManager.extractGlobalContext).toHaveBeenCalled();
      expect(mockContextManager.extractModuleContexts).toHaveBeenCalled();
      expect(mockProjectService.createProjectWithContext).toHaveBeenCalledWith(
        samplePrdText,
        sampleTaskTree,
        expect.any(String), // globalContext
        expect.any(Object), // projectMetadata
        expect.objectContaining({
          summary: 'Test global context'
        }),
        []
      );
    });

    it('should return 400 for missing prdText', async () => {
      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'prdText is required and must be a non-empty string',
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for empty prdText', async () => {
      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: '' })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'prdText is required and must be a non-empty string',
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for whitespace-only prdText', async () => {
      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: '   \n\t  ' })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'prdText is required and must be a non-empty string',
        timestamp: expect.any(String)
      });
    });

    it('should handle PRD parsing errors', async () => {
      mockPrdParser.processPrd.mockImplementationOnce(() => {
        throw new Error('Parsing failed');
      });

      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: samplePrdText })
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Failed to process PRD',
        error: 'Parsing failed',
        timestamp: expect.any(String)
      });
    });

    it('should handle project creation errors', async () => {
      mockPrdParser.processPrd.mockReturnValueOnce(sampleProcessingResult);
      mockContextManager.extractGlobalContext.mockReturnValueOnce({
        summary: 'Test global context'
      });
      mockContextManager.extractModuleContexts.mockReturnValueOnce([]);
      mockProjectService.createProjectWithContext.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: samplePrdText })
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toEqual({
        message: 'Failed to process PRD',
        error: 'Database error',
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.message).toBe('Failed to process PRD');
    });

    it('should handle context extraction gracefully when it fails', async () => {
      const projectId = 'test-project-id';
      
      mockPrdParser.processPrd.mockReturnValueOnce(sampleProcessingResult);
      mockContextManager.extractGlobalContext.mockReturnValueOnce(null);
      mockContextManager.extractModuleContexts.mockReturnValueOnce([]);
      mockProjectService.createProjectWithContext.mockResolvedValueOnce(projectId);

      const request = new NextRequest('http://localhost:3000/api/prd/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdText: samplePrdText })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.projectId).toBe(projectId);

      expect(mockProjectService.createProjectWithContext).toHaveBeenCalledWith(
        samplePrdText,
        sampleTaskTree,
        expect.any(String), // globalContext
        expect.any(Object), // projectMetadata
        null, // globalContextData
        [] // moduleContexts
      );
    });
  });
});