/**
 * Komponen untuk menampilkan Task Tree dalam format hierarkis
 */

'use client';

import React, { useState } from 'react';
import { Users, Settings, Star, Loader2, TreePine, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { TaskTreeDisplayProps } from '@/types';
import TaskNodeItem from './TaskNodeItem';

const TaskTreeDisplay: React.FC<TaskTreeDisplayProps> = ({
  tasks,
  availableTasks,
  onTaskSelect,
  selectedTaskId,
  isLoading
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleToggleExpand = (taskId: string) => {
    toggleExpanded(taskId);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
          <span className="text-gray-600">Loading task tree...</span>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <TreePine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Task Tree Available</h3>
          <p className="text-gray-600">
            Please upload and process a PRD document to generate the task tree.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <TreePine className="mr-2 h-6 w-6 text-green-600" />
          Task Tree
        </h2>
        <p className="text-gray-600">
          Click on any task to generate its corresponding prompt.
        </p>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{availableTasks.length}</div>
          <div className="text-sm text-blue-700">Total Tasks</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {availableTasks.filter(t => t.hasSubTasks).length}
          </div>
          <div className="text-sm text-green-700">Parent Tasks</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Math.max(...availableTasks.map(t => t.level), 0)}
          </div>
          <div className="text-sm text-purple-700">Max Depth</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {availableTasks.filter(t => t.hasDependencies).length}
          </div>
          <div className="text-sm text-orange-700">With Dependencies</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setExpandedNodes(new Set(tasks.map(t => t.id)))}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedNodes(new Set())}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Collapse All
          </button>
        </div>
        
        {selectedTaskId && (
          <div className="text-sm text-blue-600 font-medium">
            Selected: {availableTasks.find(t => t.id === selectedTaskId)?.name}
          </div>
        )}
      </div>

      {/* Task Tree */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tasks.map(task => (
          <TaskNodeItem
            key={task.id}
            task={task}
            onTaskSelect={onTaskSelect}
            selectedTaskId={selectedTaskId}
            level={0}
            isExpanded={expandedNodes.has(task.id)}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">Legend:</h4>

        {/* Entity Types */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Entity Types:</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Actors</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-3 w-3 text-green-500" />
              <span className="text-gray-600">Systems</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-3 w-3 text-purple-500" />
              <span className="text-gray-600">Features</span>
            </div>
          </div>
        </div>

        {/* Task Status */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Task Status:</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">Blocked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTreeDisplay;
