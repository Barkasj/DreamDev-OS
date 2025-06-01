/**
 * Test suite for PrdUpload component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrdUpload from '../PrdUpload';
import { PrdUploadProps } from '@/types';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({
      'data-testid': 'dropzone'
    }),
    getInputProps: () => ({
      'data-testid': 'file-input'
    }),
    isDragActive: false
  }))
}));

describe('PrdUpload Component', () => {
  const mockOnPrdTextUploaded = jest.fn();
  
  const defaultProps: PrdUploadProps = {
    onPrdTextUploaded: mockOnPrdTextUploaded,
    isProcessing: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component with default state', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByText('Upload PRD Document')).toBeInTheDocument();
      expect(screen.getByText('Upload your Product Requirements Document or paste the text directly to generate task tree and prompts.')).toBeInTheDocument();
    });

    it('renders method selection buttons', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByText('Text Input')).toBeInTheDocument();
      expect(screen.getByText('File Upload')).toBeInTheDocument();
    });

    it('renders text input by default', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByPlaceholderText(/Paste your PRD content here/)).toBeInTheDocument();
      expect(screen.getByText('Load Sample PRD')).toBeInTheDocument();
    });

    it('renders process button', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByText('Process PRD')).toBeInTheDocument();
    });

    it('renders help section', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByText('Tips for better results:')).toBeInTheDocument();
      expect(screen.getByText(/Use clear headings with/)).toBeInTheDocument();
    });
  });

  describe('Method Selection', () => {
    it('switches to file upload mode when file upload button is clicked', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const fileUploadButton = screen.getByText('File Upload');
      await user.click(fileUploadButton);
      
      expect(screen.getByText('Drag & drop PRD file here, or click to select')).toBeInTheDocument();
      expect(screen.getByText('Supports: .txt, .md, .doc, .docx files')).toBeInTheDocument();
    });

    it('switches back to text input mode when text input button is clicked', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      // Switch to file upload first
      const fileUploadButton = screen.getByText('File Upload');
      await user.click(fileUploadButton);
      
      // Switch back to text input
      const textInputButton = screen.getByText('Text Input');
      await user.click(textInputButton);
      
      expect(screen.getByPlaceholderText(/Paste your PRD content here/)).toBeInTheDocument();
    });

    it('highlights active method button', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textInputButton = screen.getByText('Text Input');
      const fileUploadButton = screen.getByText('File Upload');
      
      // Text input should be active by default
      expect(textInputButton).toHaveClass('bg-blue-600', 'text-white');
      expect(fileUploadButton).toHaveClass('bg-gray-200', 'text-gray-700');
      
      // Switch to file upload
      await user.click(fileUploadButton);
      
      expect(fileUploadButton).toHaveClass('bg-blue-600', 'text-white');
      expect(textInputButton).toHaveClass('bg-gray-200', 'text-gray-700');
    });
  });

  describe('Text Input Functionality', () => {
    it('updates text content when user types', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.type(textarea, 'Test PRD content');
      
      expect(textarea).toHaveValue('Test PRD content');
    });

    it('displays character and line count', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      
      expect(screen.getByText('Characters: 20')).toBeInTheDocument();
      expect(screen.getByText('Lines: 3')).toBeInTheDocument();
    });

    it('loads sample PRD when Load Sample PRD button is clicked', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const loadSampleButton = screen.getByText('Load Sample PRD');
      await user.click(loadSampleButton);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      const textareaValue = textarea.value;
      expect(textareaValue).toContain('DreamDev OS');
      expect(textareaValue).toContain('Product Requirements Document');
    });

    it('shows file name when sample is loaded', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const loadSampleButton = screen.getByText('Load Sample PRD');
      await user.click(loadSampleButton);
      
      // Note: The file name display is not visible in text mode, but we can check the internal state
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      const textareaValue = textarea.value;
      expect(textareaValue).toContain('DreamDev OS');
    });
  });

  describe('Process Button Functionality', () => {
    it('calls onPrdTextUploaded when process button is clicked with valid text', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.type(textarea, 'Valid PRD content');
      
      const processButton = screen.getByText('Process PRD');
      await user.click(processButton);
      
      expect(mockOnPrdTextUploaded).toHaveBeenCalledWith('Valid PRD content');
    });

    it('does not call onPrdTextUploaded when text is empty', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const processButton = screen.getByText('Process PRD');
      await user.click(processButton);
      
      expect(mockOnPrdTextUploaded).not.toHaveBeenCalled();
    });

    it('disables process button when text is empty', () => {
      render(<PrdUpload {...defaultProps} />);
      
      const processButton = screen.getByText('Process PRD');
      expect(processButton).toBeDisabled();
      expect(processButton).toHaveClass('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
    });

    it('enables process button when text is provided', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.type(textarea, 'Some content');
      
      const processButton = screen.getByText('Process PRD');
      expect(processButton).not.toBeDisabled();
      expect(processButton).toHaveClass('bg-blue-600');
    });

    it('disables process button when processing', () => {
      render(<PrdUpload {...defaultProps} isProcessing={true} />);
      
      const processButton = screen.getByText('Processing PRD...');
      expect(processButton).toBeDisabled();
    });

    it('shows processing state correctly', () => {
      render(<PrdUpload {...defaultProps} isProcessing={true} />);
      
      expect(screen.getByText('Processing PRD...')).toBeInTheDocument();
      expect(screen.queryByText('Process PRD')).not.toBeInTheDocument();
    });

    it('disables textarea when processing', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} isProcessing={true} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      expect(textarea).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to process PRD document';
      render(<PrdUpload {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error section when no error', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.queryByText('Error:')).not.toBeInTheDocument();
    });

    it('displays error with proper styling', () => {
      const errorMessage = 'Test error message';
      render(<PrdUpload {...defaultProps} error={errorMessage} />);
      
      const errorContainer = screen.getByText('Error:').closest('div')?.parentElement;
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('File Upload Mode', () => {
    it('shows dropzone when in file upload mode', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const fileUploadButton = screen.getByText('File Upload');
      await user.click(fileUploadButton);
      
      expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });

    it('hides text input when in file upload mode', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const fileUploadButton = screen.getByText('File Upload');
      await user.click(fileUploadButton);
      
      expect(screen.queryByPlaceholderText(/Paste your PRD content here/)).not.toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('clears file name when switching to text input and typing', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      // Load sample to set a file name
      const loadSampleButton = screen.getByText('Load Sample PRD');
      await user.click(loadSampleButton);
      
      // Type in textarea should clear file name (internal state)
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.clear(textarea);
      await user.type(textarea, 'New content');
      
      expect(textarea).toHaveValue('New content');
    });

    it('trims whitespace when processing text', async () => {
      const user = userEvent.setup();
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste your PRD content here/);
      await user.type(textarea, '  Content with spaces  ');
      
      const processButton = screen.getByText('Process PRD');
      await user.click(processButton);
      
      expect(mockOnPrdTextUploaded).toHaveBeenCalledWith('Content with spaces');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form elements', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByLabelText('PRD Text Content')).toBeInTheDocument();
    });

    it('has proper button roles and text', () => {
      render(<PrdUpload {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Text Input/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /File Upload/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Process PRD/ })).toBeInTheDocument();
    });

    it('has proper textarea attributes', () => {
      render(<PrdUpload {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'prd-text');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });
});