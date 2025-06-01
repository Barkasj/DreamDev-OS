/**
 * Project Task Prompt API Route
 * GET /api/project/[projectId]/task/[taskId]/prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { PromptComposerService } from '@/lib/promptComposer.service';
import { projectService } from '@/lib/projectService';

interface RouteParams {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { projectId, taskId } = await params;

    // Validasi parameters
    if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
      return NextResponse.json(
        { 
          message: 'projectId is required and must be a non-empty string',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
      return NextResponse.json(
        { 
          message: 'taskId is required and must be a non-empty string',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Generating prompt for task:', {
        projectId,
        taskId
      });
    }

    // Get project from database
    const project = await projectService.getProjectById(projectId);
    
    if (!project || !project.taskTree) {
      return NextResponse.json(
        { 
          message: `Project with ID ${projectId} or its task tree not found`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Find specific task
    const task = projectService.findTaskByIdRecursive(project.taskTree, taskId);
    
    if (!task) {
      return NextResponse.json(
        { 
          message: `Task with ID ${taskId} not found in project ${projectId}`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Initialize prompt composer service
    const promptComposer = new PromptComposerService();

    // Generate enhanced prompt using ProjectDocument
    const promptResult = promptComposer.composePromptWithMetadataFromProject(
      task,
      project
    );

    // Prepare response
    const response = {
      message: 'Prompt generated successfully',
      data: {
        projectId: project._id,
        task: {
          id: task.id,
          name: task.taskName,
          level: task.level,
          contentSummary: task.contentSummary,
          entities: task.entities
        },
        promptResult: promptResult,
        projectContext: {
          globalContext: project.globalContext,
          totalTasks: project.taskTree.length,
          createdAt: project.createdAt
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('❌ Error in /api/project/[projectId]/task/[taskId]/prompt:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error generating prompt';

    return NextResponse.json(
      {
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function POST() {
  return NextResponse.json(
    { 
      message: 'Method POST not allowed. Use GET to retrieve task prompt.',
      timestamp: new Date().toISOString()
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      message: 'Method PUT not allowed. Use GET to retrieve task prompt.',
      timestamp: new Date().toISOString()
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      message: 'Method DELETE not allowed. Use GET to retrieve task prompt.',
      timestamp: new Date().toISOString()
    },
    { status: 405 }
  );
}
