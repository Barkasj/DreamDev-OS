/**
 * Unit tests for TaskNodeItem component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskNodeItem from '../TaskNodeItem';
import { TaskNode } from '@/types';

// Mock data for testing
const mockTask: TaskNode = {
  id: 'task-1',
  taskName: 'Test Task',
  level: 1,
  contentSummary: 'This is a test task summary',
  entities: {
    actors: ['User', 'Admin'],
    systems: ['Database', 'API'],
    features: ['Authentication', 'Authorization']
  },
  subTasks: [],
  status: 'pending',
  dependencies: ['dep-1', 'dep-2'],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    priority: 'high',
    riskLevel: 'medium'
  }
};

const mockTaskWithSubTasks: TaskNode = {
  ...mockTask,
  id: 'task-with-subtasks',
  taskName: 'Parent Task',
  subTasks: [
    {
      id: 'subtask-1',
      taskName: 'Subtask 1',
      level: 2,
      contentSummary: 'First subtask',
      entities: { actors: [], systems: [], features: [] },
      subTasks: [],
      status: 'completed',
      dependencies: []
    },
    {
      id: 'subtask-2',
      taskName: 'Subtask 2',
      level: 2,
      contentSummary: 'Second subtask',
      entities: { actors: [], systems: [], features: [] },
      subTasks: [],
      status: 'in-progress',
      dependencies: []
    }
  ]
};

const defaultProps = {
  task: mockTask,
  onTaskSelect: jest.fn(),
  selectedTaskId: null,
  level: 0,
  isExpanded: false,
  onToggleExpand: jest.fn()
};

describe('TaskNodeItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders task name correctly', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('renders task level correctly', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('L1')).toBeInTheDocument();
    });

    it('renders content summary correctly', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('This is a test task summary')).toBeInTheDocument();
    });

    it('renders priority badge when priority is set', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders dependencies count when dependencies exist', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('2 deps')).toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    it('renders pending status icon by default', () => {
      render(<TaskNodeItem {...defaultProps} />);
      const statusElement = screen.getByTitle('Status: pending');
      expect(statusElement).toBeInTheDocument();
    });

    it('renders completed status icon', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      render(<TaskNodeItem {...defaultProps} task={completedTask} />);
      const statusElement = screen.getByTitle('Status: completed');
      expect(statusElement).toBeInTheDocument();
    });

    it('renders in-progress status icon', () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      render(<TaskNodeItem {...defaultProps} task={inProgressTask} />);
      const statusElement = screen.getByTitle('Status: in-progress');
      expect(statusElement).toBeInTheDocument();
    });

    it('renders blocked status icon', () => {
      const blockedTask = { ...mockTask, status: 'blocked' as const };
      render(<TaskNodeItem {...defaultProps} task={blockedTask} />);
      const statusElement = screen.getByTitle('Status: blocked');
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('Priority Colors', () => {
    it('renders critical priority with correct styling', () => {
      const criticalTask = { 
        ...mockTask, 
        metadata: { ...mockTask.metadata!, priority: 'critical' as const }
      };
      render(<TaskNodeItem {...defaultProps} task={criticalTask} />);
      const priorityElement = screen.getByText('critical');
      expect(priorityElement).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('renders medium priority with correct styling', () => {
      const mediumTask = { 
        ...mockTask, 
        metadata: { ...mockTask.metadata!, priority: 'medium' as const }
      };
      render(<TaskNodeItem {...defaultProps} task={mediumTask} />);
      const priorityElement = screen.getByText('medium');
      expect(priorityElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('renders low priority with correct styling', () => {
      const lowTask = { 
        ...mockTask, 
        metadata: { ...mockTask.metadata!, priority: 'low' as const }
      };
      render(<TaskNodeItem {...defaultProps} task={lowTask} />);
      const priorityElement = screen.getByText('low');
      expect(priorityElement).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Entities Display', () => {
    it('renders actors count and tooltip', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('2 actors')).toBeInTheDocument();
      expect(screen.getByTitle('Actors: User, Admin')).toBeInTheDocument();
    });

    it('renders systems count and tooltip', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('2 systems')).toBeInTheDocument();
      expect(screen.getByTitle('Systems: Database, API')).toBeInTheDocument();
    });

    it('renders features count and tooltip', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.getByText('2 features')).toBeInTheDocument();
      expect(screen.getByTitle('Features: Authentication, Authorization')).toBeInTheDocument();
    });

    it('does not render entity sections when empty', () => {
      const taskWithoutEntities = {
        ...mockTask,
        entities: { actors: [], systems: [], features: [] }
      };
      render(<TaskNodeItem {...defaultProps} task={taskWithoutEntities} />);
      expect(screen.queryByText(/actors/)).not.toBeInTheDocument();
      expect(screen.queryByText(/systems/)).not.toBeInTheDocument();
      expect(screen.queryByText(/features/)).not.toBeInTheDocument();
    });
  });

  describe('Task Selection', () => {
    it('calls onTaskSelect when task is clicked', () => {
      const onTaskSelect = jest.fn();
      render(<TaskNodeItem {...defaultProps} onTaskSelect={onTaskSelect} />);
      
      fireEvent.click(screen.getByText('Test Task'));
      expect(onTaskSelect).toHaveBeenCalledWith('task-1');
    });

    it('applies selected styling when task is selected', () => {
      render(<TaskNodeItem {...defaultProps} selectedTaskId="task-1" />);
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
      // Task should be clickable and visible when selected
      expect(taskElement.closest('div')).toBeInTheDocument();
    });

    it('applies default styling when task is not selected', () => {
      render(<TaskNodeItem {...defaultProps} selectedTaskId="other-task" />);
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
      // Task should be clickable and visible when not selected
      expect(taskElement.closest('div')).toBeInTheDocument();
    });
  });

  describe('SubTasks Functionality', () => {
    it('shows expand button when task has subtasks', () => {
      render(<TaskNodeItem {...defaultProps} task={mockTaskWithSubTasks} />);
      expect(screen.getByTitle('Expand subtasks')).toBeInTheDocument();
    });

    it('shows subtasks count badge', () => {
      render(<TaskNodeItem {...defaultProps} task={mockTaskWithSubTasks} />);
      expect(screen.getByText('2 subtasks')).toBeInTheDocument();
    });

    it('does not show expand button when task has no subtasks', () => {
      render(<TaskNodeItem {...defaultProps} />);
      expect(screen.queryByTitle('Expand subtasks')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Collapse subtasks')).not.toBeInTheDocument();
    });

    it('calls onToggleExpand when expand button is clicked', () => {
      const onToggleExpand = jest.fn();
      render(
        <TaskNodeItem 
          {...defaultProps} 
          task={mockTaskWithSubTasks} 
          onToggleExpand={onToggleExpand}
        />
      );
      
      fireEvent.click(screen.getByTitle('Expand subtasks'));
      expect(onToggleExpand).toHaveBeenCalledWith('task-with-subtasks');
    });

    it('shows subtasks when expanded', () => {
      render(
        <TaskNodeItem 
          {...defaultProps} 
          task={mockTaskWithSubTasks} 
          isExpanded={true}
        />
      );
      
      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
      expect(screen.getByText('Subtask 2')).toBeInTheDocument();
    });

    it('hides subtasks when collapsed', () => {
      render(
        <TaskNodeItem 
          {...defaultProps} 
          task={mockTaskWithSubTasks} 
          isExpanded={false}
        />
      );
      
      expect(screen.queryByText('Subtask 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Subtask 2')).not.toBeInTheDocument();
    });

    it('uses local state when onToggleExpand is not provided', () => {
      render(
        <TaskNodeItem 
          {...defaultProps} 
          task={mockTaskWithSubTasks} 
          onToggleExpand={undefined}
        />
      );
      
      // Initially collapsed
      expect(screen.queryByText('Subtask 1')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(screen.getByTitle('Expand subtasks'));
      
      // Should now show subtasks
      expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    });
  });

  describe('Content Truncation', () => {
    it('truncates long content summary', () => {
      const longContentTask = {
        ...mockTask,
        contentSummary: 'This is a very long content summary that should be truncated because it exceeds the maximum length limit set for display purposes in the component'
      };
      
      render(<TaskNodeItem {...defaultProps} task={longContentTask} />);
      const truncatedText = screen.getByText(/This is a very long content summary that should be truncated because it exceeds the maximum/);
      expect(truncatedText.textContent).toMatch(/\.\.\.$/);
    });

    it('does not truncate short content summary', () => {
      render(<TaskNodeItem {...defaultProps} />);
      const fullText = screen.getByText('This is a test task summary');
      expect(fullText.textContent).not.toMatch(/\.\.\.$/);
    });
  });

  describe('Indentation', () => {
    it('renders task at different levels', () => {
      render(<TaskNodeItem {...defaultProps} level={2} />);
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
      // Task should render regardless of level
    });

    it('renders task at level 0', () => {
      render(<TaskNodeItem {...defaultProps} level={0} />);
      const taskElement = screen.getByText('Test Task');
      expect(taskElement).toBeInTheDocument();
      // Task should render at base level
    });
  });

  describe('Edge Cases', () => {
    it('handles task without metadata', () => {
      const taskWithoutMetadata = { ...mockTask, metadata: undefined };
      render(<TaskNodeItem {...defaultProps} task={taskWithoutMetadata} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.queryByText(/high|medium|low|critical/)).not.toBeInTheDocument();
    });

    it('handles task without dependencies', () => {
      const taskWithoutDeps = { ...mockTask, dependencies: [] };
      render(<TaskNodeItem {...defaultProps} task={taskWithoutDeps} />);
      expect(screen.queryByText(/deps/)).not.toBeInTheDocument();
    });

    it('prevents event propagation when expand button is clicked', () => {
      const onTaskSelect = jest.fn();
      render(
        <TaskNodeItem 
          {...defaultProps} 
          task={mockTaskWithSubTasks} 
          onTaskSelect={onTaskSelect}
        />
      );
      
      fireEvent.click(screen.getByTitle('Expand subtasks'));
      expect(onTaskSelect).not.toHaveBeenCalled();
    });
  });
});