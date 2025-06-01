/**
 * Komponen TaskNodeItem untuk rendering individual task node secara rekursif
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Users,
  Settings,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { TaskNode } from '@/types';

interface TaskNodeItemProps {
  task: TaskNode;
  onTaskSelect: (taskId: string) => void;
  selectedTaskId: string | null;
  level?: number;
  isExpanded?: boolean;
  onToggleExpand?: (taskId: string) => void;
}

const TaskNodeItem: React.FC<TaskNodeItemProps> = ({
  task,
  onTaskSelect,
  selectedTaskId,
  level = 0,
  isExpanded = false,
  onToggleExpand
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  
  const isSelected = selectedTaskId === task.id;
  const hasSubTasks = task.subTasks && task.subTasks.length > 0;
  const expanded = onToggleExpand ? isExpanded : localExpanded;
  const indentLevel = level * 20;

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(task.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const getStatusIcon = (status: TaskNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEntityIcon = (entityType: 'actors' | 'systems' | 'features') => {
    switch (entityType) {
      case 'actors':
        return <Users className="h-3 w-3 text-blue-500" />;
      case 'systems':
        return <Settings className="h-3 w-3 text-green-500" />;
      case 'features':
        return <Star className="h-3 w-3 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high' | 'critical') => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-1">
      {/* Task Node */}
      <div
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
        }`}
        style={{ marginLeft: `${indentLevel}px` }}
        onClick={() => onTaskSelect(task.id)}
      >
        {/* Expand/Collapse Button */}
        <div className="flex items-center mr-3">
          {hasSubTasks ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand();
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <FileText className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Status Icon */}
        <div className="mr-3" title={`Status: ${task.status}`}>
          {getStatusIcon(task.status)}
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gray-300 text-gray-800 px-2 py-1 rounded font-mono font-semibold">
                L{task.level}
              </span>
              {task.metadata?.priority && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(task.metadata.priority)}`}>
                  {task.metadata.priority}
                </span>
              )}
              <h3 className={`font-semibold truncate text-base ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`} title={task.taskName}>
                {task.taskName}
              </h3>
            </div>
            
            {/* Task Metadata */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {task.dependencies.length > 0 && (
                <span 
                  className="bg-orange-100 text-orange-700 px-2 py-1 rounded"
                  title={`Dependencies: ${task.dependencies.length}`}
                >
                  {task.dependencies.length} deps
                </span>
              )}
              {hasSubTasks && (
                <span 
                  className="bg-green-100 text-green-700 px-2 py-1 rounded"
                  title={`Subtasks: ${task.subTasks.length}`}
                >
                  {task.subTasks.length} subtasks
                </span>
              )}
            </div>
          </div>

          {/* Content Summary */}
          <p className="text-sm text-gray-800 mb-2 line-clamp-2 leading-relaxed" title={task.contentSummary}>
            {task.contentSummary.length > 100
              ? `${task.contentSummary.substring(0, 100)}...`
              : task.contentSummary
            }
          </p>

          {/* Entities */}
          <div className="flex items-center space-x-4">
            {task.entities.actors.length > 0 && (
              <div className="flex items-center space-x-1" title={`Actors: ${task.entities.actors.join(', ')}`}>
                {getEntityIcon('actors')}
                <span className="text-xs text-gray-700 font-medium">
                  {task.entities.actors.length} actors
                </span>
              </div>
            )}
            {task.entities.systems.length > 0 && (
              <div className="flex items-center space-x-1" title={`Systems: ${task.entities.systems.join(', ')}`}>
                {getEntityIcon('systems')}
                <span className="text-xs text-gray-700 font-medium">
                  {task.entities.systems.length} systems
                </span>
              </div>
            )}
            {task.entities.features.length > 0 && (
              <div className="flex items-center space-x-1" title={`Features: ${task.entities.features.join(', ')}`}>
                {getEntityIcon('features')}
                <span className="text-xs text-gray-700 font-medium">
                  {task.entities.features.length} features
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tasks */}
      {hasSubTasks && expanded && (
        <div className="mt-2">
          {task.subTasks.map(subTask => (
            <TaskNodeItem
              key={subTask.id}
              task={subTask}
              onTaskSelect={onTaskSelect}
              selectedTaskId={selectedTaskId}
              level={level + 1}
              isExpanded={false} // Sub-tasks start collapsed
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskNodeItem;
