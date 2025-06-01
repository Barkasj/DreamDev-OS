/**
 * API Service untuk komunikasi dengan DreamDev OS Next.js API Routes
 */

import axios from 'axios';
import { ApiService, ProjectDocument, PromptCompositionResult } from '@/types';

// Konfigurasi base URL untuk Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Custom error class untuk API errors
 */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Implementation of API Service untuk MongoDB-based DreamDev OS
 */
export class DreamDevApiService implements ApiService {
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new ApiError('Health check failed');
    }
  }

  /**
   * Process PRD text dan simpan ke MongoDB
   */
  async processPrd(prdText: string, globalProjectContext?: string): Promise<ProjectDocument> {
    if (!prdText || prdText.trim().length === 0) {
      throw new ApiError('PRD text is required');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/prd/process`, {
        prdText: prdText.trim(),
        globalProjectContext
      });

      // Transform response to match ProjectDocument interface
      const data = response.data.data;

      // Validate response data
      if (!data || !data.projectId || !data.taskTree) {
        throw new ApiError('Invalid response data from server');
      }

      return {
        _id: data.projectId,
        originalPrdText: prdText,
        taskTree: data.taskTree,
        globalContext: globalProjectContext || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          totalTasks: data.totalTasks || 0,
          rootTasks: Array.isArray(data.taskTree) ? data.taskTree.length : 0,
          levelDistribution: data.levelDistribution || {},
          entityStats: data.entityStats || {
            totalActors: 0,
            totalSystems: 0,
            totalFeatures: 0,
            uniqueActors: [],
            uniqueSystems: [],
            uniqueFeatures: []
          },
          processingDuration: data.processingMetadata?.processingDuration || 0
        }
      };
    } catch (error) {
      console.error('PRD processing failed:', error);
      if (axios.isAxiosError(error)) {
        throw new ApiError(error.response?.data?.message || 'PRD processing failed', error.response?.status);
      }
      throw new ApiError('PRD processing failed');
    }
  }

  /**
   * Generate prompt untuk task tertentu dari project
   */
  async getProjectTaskPrompt(projectId: string, taskId: string): Promise<PromptCompositionResult> {
    if (!projectId || !taskId) {
      throw new ApiError('Project ID and Task ID are required');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/project/${projectId}/task/${taskId}/prompt`);
      return response.data;
    } catch (error) {
      console.error('Prompt generation failed:', error);
      if (axios.isAxiosError(error)) {
        throw new ApiError(error.response?.data?.message || 'Prompt generation failed', error.response?.status);
      }
      throw new ApiError('Prompt generation failed');
    }
  }

  // Removed deprecated composePrompt method - use getProjectTaskPrompt instead
}

// Singleton instance
export const apiService = new DreamDevApiService();

// Utility functions untuk error handling
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};

// Export default instance
export default apiService;
