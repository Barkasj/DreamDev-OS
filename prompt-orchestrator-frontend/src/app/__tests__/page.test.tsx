/**
 * Comprehensive Tests for Main Page Component
 * Testing the main orchestration logic and user workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the child components
jest.mock('../../components/PrdUpload', () => {
  return function MockPrdUpload({ onPrdTextUploaded, isProcessing, error }: any) {
    return (
      <div data-testid="prd-upload">
        <button 
          onClick={() => onPrdTextUploaded('test prd text')}
          disabled={isProcessing}
          data-testid="upload-button"
        >
          Upload PRD
        </button>
        {error && <div data-testid="upload-error">{error}</div>}
        {isProcessing && <div data-testid="upload-processing">Processing...</div>}
      </div>
    );
  };
});

jest.mock('../../components/TaskTreeDisplay', () => {
  return function MockTaskTreeDisplay({ tasks, onTaskSelect, selectedTaskId, isLoading }: any) {
    return (
      <div data-testid="task-tree-display">
        {isLoading && <div data-testid="tree-loading">Loading...</div>}
        {tasks.map((task: any) => (
          <button
            key={task.id}
            onClick={() => onTaskSelect(task.id)}
            data-testid={`task-${task.id}`}
            className={selectedTaskId === task.id ? 'selected' : ''}
          >
            {task.taskName}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/PromptDisplay', () => {
  return function MockPromptDisplay({ prompt, metadata, isLoading }: any) {
    return (
      <div data-testid="prompt-display">
        {isLoading && <div data-testid="prompt-loading">Loading...</div>}
        {prompt && <div data-testid="prompt-content">{prompt}</div>}
        {metadata && <div data-testid="prompt-metadata">{JSON.stringify(metadata)}</div>}
      </div>
    );
  };
});

describe('Home Page - Main Orchestration Logic', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the main page with correct initial state', () => {
      render(<Home />);
      
      // Check header
      expect(screen.getByText('DreamDev OS')).toBeInTheDocument();
      expect(screen.getByText('Prompt Orchestrator - AI Task Management System')).toBeInTheDocument();
      
      // Check navigation tabs
      expect(screen.getByText('Upload PRD')).toBeInTheDocument();
      expect(screen.getByText('Task Tree')).toBeInTheDocument();
      expect(screen.getByText('Generated Prompt')).toBeInTheDocument();
      
      // Check initial active tab
      expect(screen.getByTestId('prd-upload')).toBeInTheDocument();
    });

    it('should have correct initial tab states', () => {
      render(<Home />);
      
      // Upload tab should be active
      const uploadTab = screen.getByRole('button', { name: /upload prd/i });
      expect(uploadTab).toHaveClass('border-blue-500', 'text-blue-600');
      
      // Tree and prompt tabs should be disabled initially
      const treeTab = screen.getByRole('button', { name: /task tree/i });
      const promptTab = screen.getByRole('button', { name: /generated prompt/i });
      
      expect(treeTab).toHaveClass('cursor-not-allowed');
      expect(promptTab).toHaveClass('cursor-not-allowed');
    });

    it('should display footer with correct information', () => {
      render(<Home />);
      
      expect(screen.getByText(/© 2024 DreamDev OS/)).toBeInTheDocument();
      expect(screen.getByText(/Built with Next.js and TypeScript/)).toBeInTheDocument();
    });
  });

  describe('PRD Processing Workflow', () => {
    it('should handle successful PRD processing', async () => {
      const mockResponse = {
        data: {
          projectId: 'test-project-id',
          taskTree: [
            {
              id: 'task-1',
              taskName: 'Test Task 1',
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
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      render(<Home />);
      
      // Trigger PRD upload
      const uploadButton = screen.getByTestId('upload-button');
      
      await act(async () => {
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/prd/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prdText: 'test prd text' }),
        });
      });

      // Should switch to tree tab and show success indicator
      await waitFor(() => {
        expect(screen.getByText('1 tasks ready')).toBeInTheDocument();
        expect(screen.getByTestId('task-tree-display')).toBeInTheDocument();
      });
    });

    it('should handle PRD processing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid PRD format',
      } as Response);

      render(<Home />);
      
      const uploadButton = screen.getByTestId('upload-button');
      
      await act(async () => {
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to process PRD \(400\)/)).toBeInTheDocument();
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('should handle network errors during PRD processing', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);
      
      const uploadButton = screen.getByTestId('upload-button');
      
      await act(async () => {
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show processing state during PRD upload', async () => {
      // Mock a delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ data: { projectId: 'test', taskTree: [], totalTasks: 0 } }),
          } as Response), 100)
        )
      );

      render(<Home />);
      
      const uploadButton = screen.getByTestId('upload-button');
      
      act(() => {
        fireEvent.click(uploadButton);
      });

      // Should show processing state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('upload-processing')).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Task Selection and Prompt Generation', () => {
    beforeEach(async () => {
      // Setup initial state with processed PRD
      const mockPrdResponse = {
        data: {
          projectId: 'test-project-id',
          taskTree: [
            {
              id: 'task-1',
              taskName: 'Test Task 1',
              level: 1,
              contentSummary: 'Test content',
              entities: { actors: [], systems: [], features: [] },
              subTasks: [],
              status: 'pending',
              dependencies: []
            }
          ],
          totalTasks: 1
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrdResponse,
      } as Response);

      render(<Home />);
      
      const uploadButton = screen.getByTestId('upload-button');
      await act(async () => {
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-tree-display')).toBeInTheDocument();
      });

      mockFetch.mockClear();
    });

    it('should handle successful prompt generation', async () => {
      const mockPromptResponse = {
        data: {
          promptText: 'Generated prompt text',
          metadata: {
            taskId: 'task-1',
            taskName: 'Test Task 1',
            level: 1,
            characterCount: 100,
            lineCount: 5,
            generatedAt: new Date(),
            detectedEntities: { actors: [], systems: [], features: [] }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPromptResponse,
      } as Response);

      // Click on task to generate prompt
      const taskButton = screen.getByTestId('task-task-1');
      
      await act(async () => {
        fireEvent.click(taskButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/project/test-project-id/task/task-1/prompt');
      });

      // Should switch to prompt tab and show generated prompt
      await waitFor(() => {
        expect(screen.getByTestId('prompt-display')).toBeInTheDocument();
        expect(screen.getByTestId('prompt-content')).toHaveTextContent('Generated prompt text');
      });
    });

    it('should handle prompt generation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);

      const taskButton = screen.getByTestId('task-task-1');
      
      await act(async () => {
        fireEvent.click(taskButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate prompt \(500\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should allow manual tab switching', async () => {
      render(<Home />);
      
      // Initially on upload tab
      expect(screen.getByTestId('prd-upload')).toBeInTheDocument();
      
      // Tree tab should be disabled initially
      const treeTab = screen.getByRole('button', { name: /task tree/i });
      expect(treeTab).toBeDisabled();
      
      // Prompt tab should be disabled initially
      const promptTab = screen.getByRole('button', { name: /generated prompt/i });
      expect(promptTab).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should allow error dismissal', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(<Home />);
      
      const uploadButton = screen.getByTestId('upload-button');
      await act(async () => {
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });
});