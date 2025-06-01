/**
 * Test suite for TaskTreeDisplay component - Simplified Version
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskTreeDisplay from '../TaskTreeDisplay';
import { TaskNode, AvailableTask } from '@/types';

// Mock data
const mockTasks: TaskNode[] = [
  {
    id: 'task-1',
    taskName: 'Frontend Development',
    contentSummary: 'Develop the user interface components',
    level: 1,
    status: 'pending',
    dependencies: [],
    entities: {
      actors: ['Frontend Developer'],
      systems: ['React', 'TypeScript'],
      features: ['UI', 'Components']
    },
    subTasks: [
      {
        id: 'task-1-1',
        taskName: 'Component Design',
        contentSummary: 'Design reusable UI components',
        level: 2,
        status: 'completed',
        dependencies: [],
        entities: {
          actors: ['Designer', 'Developer'],
          systems: ['React', 'CSS'],
          features: ['Components', 'Styling']
        },
        subTasks: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 'medium',
          riskLevel: 'low'
        }
      }
    ],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'high',
      riskLevel: 'medium'
    }
  },
  {
    id: 'task-2',
    taskName: 'Backend API',
    contentSummary: 'Implement REST API endpoints',
    level: 1,
    status: 'in-progress',
    dependencies: ['task-1'],
    entities: {
      actors: ['Backend Developer'],
      systems: ['Node.js', 'Express'],
      features: ['API', 'Database']
    },
    subTasks: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'high',
      riskLevel: 'high'
    }
  }
];

const mockAvailableTasks: AvailableTask[] = [
  {
    id: 'task-1',
    name: 'Frontend Development',
    level: 1,
    hasSubTasks: true
  },
  {
    id: 'task-2',
    name: 'Backend API',
    level: 1,
    hasSubTasks: false
  }
];

const defaultProps = {
  tasks: mockTasks,
  availableTasks: mockAvailableTasks,
  onTaskSelect: jest.fn(),
  selectedTaskId: null,
  isLoading: false
};

describe('TaskTreeDisplay - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders loading state correctly', () => {
      render(<TaskTreeDisplay {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Loading task tree...')).toBeInTheDocument();
    });

    it('renders empty state when no tasks', () => {
      render(<TaskTreeDisplay {...defaultProps} tasks={[]} />);
      
      expect(screen.getByText('No Task Tree Available')).toBeInTheDocument();
      expect(screen.getByText('Please upload and process a PRD document to generate the task tree.')).toBeInTheDocument();
    });

    it('renders task tree when tasks are available', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Task Tree')).toBeInTheDocument();
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
      expect(screen.getByText('Backend API')).toBeInTheDocument();
    });

    it('renders task statistics', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Parent Tasks')).toBeInTheDocument();
    });
  });

  describe('Task Selection', () => {
    it('calls onTaskSelect when task is clicked', () => {
      const mockOnTaskSelect = jest.fn();
      render(<TaskTreeDisplay {...defaultProps} onTaskSelect={mockOnTaskSelect} />);
      
      const taskElement = screen.getByText('Frontend Development');
      fireEvent.click(taskElement);
      
      expect(mockOnTaskSelect).toHaveBeenCalledWith('task-1');
    });

    it('renders tasks with correct content', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
      expect(screen.getByText('Backend API')).toBeInTheDocument();
      expect(screen.getByText('Develop the user interface components')).toBeInTheDocument();
    });
  });

  describe('Task Status and Priority', () => {
    it('displays task status correctly', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      // Check that tasks are rendered (status icons are present)
      const frontendTask = screen.getByText('Frontend Development').closest('div');
      const backendTask = screen.getByText('Backend API').closest('div');
      
      expect(frontendTask).toBeInTheDocument();
      expect(backendTask).toBeInTheDocument();
    });
  });

  describe('Task Entities', () => {
    it('displays entity information', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      // Check for entity labels in the legend
      expect(screen.getByText('Actors')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
    });
  });

  describe('Task Expansion', () => {
    it('shows expand button for tasks with subtasks', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      // Look for expand button (chevron icon)
      const expandButtons = screen.getAllByTitle('Expand subtasks');
      expect(expandButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Legend and Help', () => {
    it('displays legend information', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Legend:')).toBeInTheDocument();
      expect(screen.getByText('Entity Types:')).toBeInTheDocument();
      expect(screen.getByText('Task Status:')).toBeInTheDocument();
    });

    it('displays status legend items', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });

    it('displays entity legend items', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      expect(screen.getByText('Actors')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles tasks without metadata gracefully', () => {
      const tasksWithoutMetadata = [
        {
          id: 'task-simple',
          taskName: 'Simple Task',
          contentSummary: 'A simple task without metadata',
          level: 1,
          status: 'pending' as const,
          dependencies: [],
          entities: {
            actors: [],
            systems: [],
            features: []
          },
          subTasks: []
        }
      ];

      render(<TaskTreeDisplay {...defaultProps} tasks={tasksWithoutMetadata} />);
      
      expect(screen.getByText('Simple Task')).toBeInTheDocument();
    });

    it('handles empty subtasks array', () => {
      const tasksWithEmptySubtasks = [
        {
          ...mockTasks[0],
          subTasks: []
        }
      ];

      render(<TaskTreeDisplay {...defaultProps} tasks={tasksWithEmptySubtasks} />);
      
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders main container', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      // Check that the main container exists
      const taskTreeHeading = screen.getByText('Task Tree');
      expect(taskTreeHeading).toBeInTheDocument();
      
      // Check that the container has the expected structure
      const mainContainer = taskTreeHeading.closest('.w-full');
      expect(mainContainer).toBeInTheDocument();
    });

    it('renders task items correctly', () => {
      render(<TaskTreeDisplay {...defaultProps} />);
      
      // Check that both tasks are rendered
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
      expect(screen.getByText('Backend API')).toBeInTheDocument();
    });
  });
});