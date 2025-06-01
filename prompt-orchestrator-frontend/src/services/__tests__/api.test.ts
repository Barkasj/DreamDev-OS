/**
 * Unit tests for DreamDevApiService
 * Tests all API methods and error handling
 */

import axios from 'axios';
import { DreamDevApiService, ApiError, handleApiError } from '../api';
import { PromptCompositionResult } from '@/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DreamDevApiService', () => {
  let apiService: DreamDevApiService;

  beforeEach(() => {
    apiService = new DreamDevApiService();
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return health status on successful request', async () => {
      const mockResponse = {
        data: { status: 'healthy', message: 'API is running' }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await apiService.healthCheck();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual({ status: 'healthy', message: 'API is running' });
    });

    it('should throw ApiError on request failure', async () => {
      const mockError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(apiService.healthCheck()).rejects.toThrow(ApiError);
      await expect(apiService.healthCheck()).rejects.toThrow('Health check failed');
    });

    it('should log error on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(mockError);

      try {
        await apiService.healthCheck();
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Health check failed:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('processPrd', () => {
    const mockPrdText = 'Sample PRD text';
    const mockGlobalContext = 'Test project context';

    it('should process PRD successfully and return ProjectDocument', async () => {
      const mockApiResponse = {
        data: {
          data: {
            projectId: 'test-project-id',
            taskTree: [
              {
                id: 'task-1',
                taskName: 'Test Task',
                level: 1,
                contentSummary: 'Test content',
                entities: { actors: [], systems: [], features: [] },
                subTasks: [],
                status: 'pending',
                dependencies: []
              }
            ],
            totalTasks: 1,
            levelDistribution: { 1: 1 },
            entityStats: {
              totalActors: 0,
              totalSystems: 0,
              totalFeatures: 0,
              uniqueActors: [],
              uniqueSystems: [],
              uniqueFeatures: []
            },
            processingMetadata: {
              processingDuration: 100
            }
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await apiService.processPrd(mockPrdText, mockGlobalContext);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/prd/process', {
        prdText: mockPrdText,
        globalProjectContext: mockGlobalContext
      });

      expect(result).toMatchObject({
        _id: 'test-project-id',
        originalPrdText: mockPrdText,
        globalContext: mockGlobalContext,
        taskTree: mockApiResponse.data.data.taskTree,
        metadata: {
          totalTasks: 1,
          rootTasks: 1,
          levelDistribution: { 1: 1 },
          entityStats: mockApiResponse.data.data.entityStats,
          processingDuration: 100
        }
      });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should process PRD without global context', async () => {
      const mockApiResponse = {
        data: {
          data: {
            projectId: 'test-project-id',
            taskTree: [],
            totalTasks: 0
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await apiService.processPrd(mockPrdText);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/prd/process', {
        prdText: mockPrdText,
        globalProjectContext: undefined
      });

      expect(result.globalContext).toBe('');
    });

    it('should throw ApiError for empty PRD text', async () => {
      await expect(apiService.processPrd('')).rejects.toThrow(ApiError);
      await expect(apiService.processPrd('')).rejects.toThrow('PRD text is required');
      
      await expect(apiService.processPrd('   ')).rejects.toThrow(ApiError);
      await expect(apiService.processPrd('   ')).rejects.toThrow('PRD text is required');
    });

    it('should throw ApiError for invalid response data', async () => {
      const mockApiResponse = {
        data: {
          data: null
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow(ApiError);
      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow('PRD processing failed');
    });

    it('should throw ApiError for response missing required fields', async () => {
      const mockApiResponse = {
        data: {
          data: {
            projectId: 'test-id'
            // Missing taskTree
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow(ApiError);
      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow('PRD processing failed');
    });

    it('should handle axios error with response', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request' }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow(ApiError);
      
      try {
        await apiService.processPrd(mockPrdText);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Bad request');
        expect((error as ApiError).status).toBe(400);
      }
    });

    it('should handle axios error without response message', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {}
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow(ApiError);
      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow('PRD processing failed');
    });

    it('should handle non-axios errors', async () => {
      const mockError = new Error('Generic error');
      mockedAxios.post.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow(ApiError);
      await expect(apiService.processPrd(mockPrdText)).rejects.toThrow('PRD processing failed');
    });

    it('should handle missing optional fields in response', async () => {
      const mockApiResponse = {
        data: {
          data: {
            projectId: 'test-project-id',
            taskTree: []
            // Missing optional fields
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await apiService.processPrd(mockPrdText);

      expect(result.metadata).toEqual({
        totalTasks: 0,
        rootTasks: 0,
        levelDistribution: {},
        entityStats: {
          totalActors: 0,
          totalSystems: 0,
          totalFeatures: 0,
          uniqueActors: [],
          uniqueSystems: [],
          uniqueFeatures: []
        },
        processingDuration: 0
      });
    });

    it('should trim PRD text before sending', async () => {
      const mockApiResponse = {
        data: {
          data: {
            projectId: 'test-project-id',
            taskTree: []
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await apiService.processPrd('  ' + mockPrdText + '  ');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/prd/process', {
        prdText: mockPrdText,
        globalProjectContext: undefined
      });
    });
  });

  describe('getProjectTaskPrompt', () => {
    const mockProjectId = 'test-project-id';
    const mockTaskId = 'test-task-id';

    it('should get project task prompt successfully', async () => {
      const mockResponse: PromptCompositionResult = {
        promptText: 'Generated prompt text',
        metadata: {
          taskId: mockTaskId,
          taskName: 'Test Task',
          level: 1,
          characterCount: 100,
          lineCount: 5,
          generatedAt: new Date(),
          detectedEntities: { actors: [], systems: [], features: [] }
        }
      };

      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await apiService.getProjectTaskPrompt(mockProjectId, mockTaskId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/project/${mockProjectId}/task/${mockTaskId}/prompt`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError for missing project ID', async () => {
      await expect(apiService.getProjectTaskPrompt('', mockTaskId)).rejects.toThrow(ApiError);
      await expect(apiService.getProjectTaskPrompt('', mockTaskId)).rejects.toThrow('Project ID and Task ID are required');
    });

    it('should throw ApiError for missing task ID', async () => {
      await expect(apiService.getProjectTaskPrompt(mockProjectId, '')).rejects.toThrow(ApiError);
      await expect(apiService.getProjectTaskPrompt(mockProjectId, '')).rejects.toThrow('Project ID and Task ID are required');
    });

    it('should handle axios error with response', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Task not found' }
        }
      };

      mockedAxios.get.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(apiService.getProjectTaskPrompt(mockProjectId, mockTaskId)).rejects.toThrow(ApiError);
      
      try {
        await apiService.getProjectTaskPrompt(mockProjectId, mockTaskId);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Task not found');
        expect((error as ApiError).status).toBe(404);
      }
    });

    it('should handle axios error without response message', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {}
        }
      };

      mockedAxios.get.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(apiService.getProjectTaskPrompt(mockProjectId, mockTaskId)).rejects.toThrow(ApiError);
      await expect(apiService.getProjectTaskPrompt(mockProjectId, mockTaskId)).rejects.toThrow('Prompt generation failed');
    });

    it('should handle non-axios errors', async () => {
      const mockError = new Error('Generic error');
      mockedAxios.get.mockRejectedValue(mockError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(apiService.getProjectTaskPrompt(mockProjectId, mockTaskId)).rejects.toThrow(ApiError);
      await expect(apiService.getProjectTaskPrompt(mockProjectId, mockTaskId)).rejects.toThrow('Prompt generation failed');
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError with message only', () => {
      const error = new ApiError('Test error');
      
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBeUndefined();
    });

    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 400);
      
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
    });
  });

  describe('handleApiError utility', () => {
    it('should handle ApiError', () => {
      const error = new ApiError('API error message');
      const result = handleApiError(error);
      
      expect(result).toBe('API error message');
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error message');
      const result = handleApiError(error);
      
      expect(result).toBe('Generic error message');
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const result = handleApiError(error);
      
      expect(result).toBe('An unknown error occurred');
    });

    it('should handle null/undefined errors', () => {
      expect(handleApiError(null)).toBe('An unknown error occurred');
      expect(handleApiError(undefined)).toBe('An unknown error occurred');
    });
  });
});