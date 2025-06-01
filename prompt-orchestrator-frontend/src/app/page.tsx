'use client';

import React, { useState, useCallback } from 'react';
import { Upload, TreePine, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import PrdUpload from '@/components/PrdUpload';
import TaskTreeDisplay from '@/components/TaskTreeDisplay';
import PromptDisplay from '@/components/PromptDisplay';
import { AppState, TaskNode, AvailableTask } from '@/types';

// Interface untuk API responses
interface PrdProcessResponse {
  projectId: string;
  taskTree: TaskNode[];
  totalTasks: number;
  levelDistribution: Record<number, number>;
  entityStats: {
    totalActors: number;
    totalSystems: number;
    totalFeatures: number;
    uniqueActors: string[];
    uniqueSystems: string[];
    uniqueFeatures: string[];
  };
  processingMetadata?: {
    processingDuration: number;
  };
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    projectId: null,
    prdText: '',
    isProcessing: false,
    taskTree: [],
    availableTasks: [],
    selectedTask: null,
    selectedTaskId: null,
    currentPrompt: '',
    promptMetadata: null,
    activeTab: 'upload',
    isLoading: false,
    error: null,
    globalProjectContext: 'Membangun "Prompt Orchestrator - DreamDev OS" sesuai PRD. Fokus pada Fase 1. Teknologi: Node.js/TypeScript backend, Next.js frontend.',
    customConfig: null
  });

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handlePrdTextUploaded = async (text: string) => {
    updateState({
      isProcessing: true,
      error: null,
      prdText: text
    });

    try {
      // Call the PRD processing API
      const response = await fetch('/api/prd/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prdText: text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to process PRD (${response.status}): ${errorText || response.statusText}`;
        updateState({
          isProcessing: false,
          error: errorMessage
        });
        return;
      }

      const apiResponse = await response.json();
      const result: PrdProcessResponse = apiResponse.data || apiResponse;

      // Extract available tasks from the task tree
      const flattenTasks = (tasks: TaskNode[]): AvailableTask[] => {
        const result: AvailableTask[] = [];
        for (const task of tasks) {
          result.push({
            id: task.id,
            name: task.taskName,
            level: task.level,
            hasSubTasks: task.subTasks && task.subTasks.length > 0,
            hasDependencies: task.dependencies && task.dependencies.length > 0
          });
          if (task.subTasks && task.subTasks.length > 0) {
            result.push(...flattenTasks(task.subTasks));
          }
        }
        return result;
      };

      const availableTasks = flattenTasks(result.taskTree || []);

      updateState({
        isProcessing: false,
        projectId: result.projectId,
        taskTree: result.taskTree || [],
        availableTasks,
        activeTab: 'tree',
        error: null
      });

    } catch (error) {
      updateState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const handleTaskSelect = async (taskId: string) => {
    if (taskId === state.selectedTaskId || !state.projectId) return;

    updateState({
      isLoading: true,
      selectedTaskId: taskId,
      error: null
    });

    try {
      // Call the enhanced prompt generation API
      const response = await fetch(`/api/project/${state.projectId}/task/${taskId}/prompt`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Failed to generate prompt (${response.status}): ${errorText || response.statusText}`;
        updateState({
          isLoading: false,
          error: errorMessage
        });
        return;
      }

      const apiResponse = await response.json();
      const result = apiResponse.data || apiResponse;

      // Find selected task from task tree for UI purposes
      const findTaskInTree = (tasks: TaskNode[], targetId: string): TaskNode | null => {
        for (const task of tasks) {
          if (task.id === targetId) return task;
          if (task.subTasks && task.subTasks.length > 0) {
            const found = findTaskInTree(task.subTasks, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedTask = findTaskInTree(state.taskTree, taskId);

      updateState({
        isLoading: false,
        selectedTask: selectedTask || null,
        currentPrompt: result.promptResult?.promptText || result.promptText || '',
        promptMetadata: result.promptResult?.metadata || result.metadata || null,
        activeTab: 'prompt',
        error: null
      });

    } catch (error) {
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const handleTabChange = (tab: 'upload' | 'tree' | 'prompt') => {
    updateState({ activeTab: tab, error: null });
  };

  const handleErrorDismiss = () => {
    updateState({ error: null });
  };

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'upload':
        return (
          <PrdUpload
            onPrdTextUploaded={handlePrdTextUploaded}
            isProcessing={state.isProcessing}
            error={state.error}
          />
        );

      case 'tree':
        return (
          <TaskTreeDisplay
            tasks={state.taskTree}
            availableTasks={state.availableTasks}
            onTaskSelect={handleTaskSelect}
            selectedTaskId={state.selectedTaskId}
            isLoading={state.isLoading}
          />
        );

      case 'prompt':
        return (
          <PromptDisplay
            prompt={state.currentPrompt}
            metadata={state.promptMetadata}
            isLoading={state.isLoading}
          />
        );

      default:
        return null;
    }
  };

  const getTabIcon = (tab: 'upload' | 'tree' | 'prompt') => {
    switch (tab) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'tree':
        return <TreePine className="h-5 w-5" />;
      case 'prompt':
        return <FileText className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTabLabel = (tab: 'upload' | 'tree' | 'prompt') => {
    switch (tab) {
      case 'upload':
        return 'Upload PRD';
      case 'tree':
        return 'Task Tree';
      case 'prompt':
        return 'Generated Prompt';
      default:
        return '';
    }
  };

  const isTabDisabled = (tab: 'upload' | 'tree' | 'prompt') => {
    switch (tab) {
      case 'tree':
        return state.availableTasks.length === 0;
      case 'prompt':
        return !state.currentPrompt;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  DreamDev OS
                </h1>
                <p className="text-sm text-gray-600">
                  Prompt Orchestrator - AI Task Management System
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-4">
              {state.isProcessing && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}

              {state.error && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Error occurred</span>
                  <button
                    onClick={handleErrorDismiss}
                    className="ml-2 text-red-400 hover:text-red-600"
                    title="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}

              {state.availableTasks.length > 0 && !state.error && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{state.availableTasks.length} tasks ready</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['upload', 'tree', 'prompt'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                disabled={isTabDisabled(tab)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  state.activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : isTabDisabled(tab)
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabIcon(tab)}
                <span>{getTabLabel(tab)}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Error occurred
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleErrorDismiss}
                    className="bg-red-50 text-red-800 rounded-md text-sm font-medium px-3 py-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 DreamDev OS. Built with Next.js and TypeScript.
            </div>
            <div className="text-sm text-gray-500">
              Backend API: {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
