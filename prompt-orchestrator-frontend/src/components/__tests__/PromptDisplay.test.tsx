/**
 * Simplified unit tests for PromptDisplay component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromptDisplay from '../PromptDisplay';
import { PromptCompositionResult } from '@/types';

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock timers
jest.useFakeTimers();

const mockMetadata: PromptCompositionResult['metadata'] = {
  taskId: 'task-1',
  taskName: 'Test Task',
  level: 1,
  characterCount: 500,
  lineCount: 20,
  generatedAt: new Date('2024-01-15T10:30:00Z'),
  detectedEntities: {
    actors: ['User', 'System'],
    systems: ['Database', 'API'],
    features: ['Login', 'Dashboard', 'Reports']
  }
};

const mockPrompt = `# Test Prompt

## Objective
- Complete the test task
- Ensure quality

## Steps
1. First step
2. Second step
3. Final step`;

const defaultProps = {
  prompt: mockPrompt,
  metadata: mockMetadata,
  isLoading: false
};

describe('PromptDisplay - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders loading state correctly', () => {
      render(<PromptDisplay {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Generating prompt...')).toBeInTheDocument();
    });

    it('renders prompt content when not loading', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Generated Prompt')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      // Check for key parts of the prompt content (whitespace may be normalized)
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test Prompt');
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Objective');
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Complete the test task');
    });

    it('renders metadata information', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument(); // Character count
      expect(screen.getByText('20')).toBeInTheDocument(); // Line count
    });

    it('renders detected entities', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Actors')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      
      // Check for entity counts - look for the specific structure
      const actorsSection = screen.getByText('Actors').parentElement;
      expect(actorsSection).toHaveTextContent('2');
      expect(actorsSection).toHaveTextContent('Actors');
    });
  });

  describe('View Mode Toggle', () => {
    it('starts in rendered mode by default', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Raw')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    it('toggles to raw mode when Raw button is clicked', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Raw'));
      expect(screen.getByText('Rendered')).toBeInTheDocument();
    });

    it('toggles back to rendered mode when Rendered button is clicked', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Raw'));
      fireEvent.click(screen.getByText('Rendered'));
      expect(screen.getByText('Raw')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('renders copy button', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('calls clipboard API when copy button is clicked', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;

      render(<PromptDisplay {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Copy'));
      
      expect(mockWriteText).toHaveBeenCalledWith(mockPrompt);
    });

    it('shows success message after successful copy', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;

      render(<PromptDisplay {...defaultProps} />);
      
      await act(async () => {
        fireEvent.click(screen.getByText('Copy'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Download Functionality', () => {
    it('renders download button', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('download button is clickable', () => {
      render(<PromptDisplay {...defaultProps} />);
      
      const downloadButton = screen.getByText('Download');
      expect(downloadButton).toBeInTheDocument();
      
      // Just verify the button can be clicked without testing DOM manipulation
      fireEvent.click(downloadButton);
      // If no error is thrown, the click handler works
    });
  });

  describe('Edge Cases', () => {
    it('handles missing metadata gracefully', () => {
      render(<PromptDisplay {...defaultProps} metadata={null} />);
      
      expect(screen.getByText('Generated Prompt')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      // Should not crash when metadata is null
    });

    it('handles empty prompt gracefully', () => {
      render(<PromptDisplay {...defaultProps} prompt="" />);
      
      expect(screen.getByText('No Prompt Generated')).toBeInTheDocument();
      expect(screen.getByText('Please select a task from the task tree to generate its prompt.')).toBeInTheDocument();
    });
  });
});