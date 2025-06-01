/**
 * PRD Process API Route
 * POST /api/prd/process
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrdParserService } from '@/lib/prdParser.service';
import { ContextStackManagerService } from '@/lib/contextStackManager.service';
import { projectService } from '@/lib/projectService';
import { TaskNode, ProjectDocument } from '@/types';

interface RequestBody {
  prdText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { prdText } = body;

    // Validasi input
    if (!prdText || prdText.trim().length === 0) {
      return NextResponse.json(
        { 
          message: 'prdText is required and must be a non-empty string',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    console.log('🚀 Processing PRD...', {
      prdTextLength: prdText.length
    });

    // Initialize services
    const prdParser = new PrdParserService();
    const contextStackManager = new ContextStackManagerService();

    // Process PRD
    const processingResult = prdParser.processPrd(prdText);

    // Store project in MongoDB with enhanced context
    const globalContext = 'Membangun "Prompt Orchestrator - DreamDev OS" sesuai PRD. Fokus pada Fase 1. Teknologi: Node.js/TypeScript backend, Next.js frontend.';

    const projectMetadata = {
      totalTasks: processingResult.totalTasks,
      rootTasks: processingResult.taskTree.length,
      levelDistribution: processingResult.levelDistribution,
      entityStats: processingResult.entityStats,
      processingDuration: processingResult.processingMetadata.processingDuration,
    };

    // Create temporary ProjectDocument for context extraction
    const tempProjectDoc: ProjectDocument = {
      _id: '', // Will be set by projectService
      originalPrdText: prdText,
      taskTree: processingResult.taskTree,
      globalContext: globalContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: projectMetadata,
    };

    // Extract enhanced context data
    const globalContextData = contextStackManager.extractGlobalContext(tempProjectDoc);
    const moduleContexts = contextStackManager.extractModuleContexts(tempProjectDoc);

    console.log('🧠 Context extraction results:', {
      globalContextData: globalContextData ? 'extracted' : 'failed',
      moduleContextsCount: moduleContexts.length,
      globalSummary: globalContextData?.summary?.substring(0, 100) + '...',
      moduleNames: moduleContexts.map(mc => mc.moduleTitle)
    });

    // Create project with enhanced context
    const projectId = await projectService.createProjectWithContext(
      prdText,
      processingResult.taskTree,
      globalContext,
      projectMetadata,
      globalContextData,
      moduleContexts
    );

    // Flatten all tasks untuk response
    const flattenTasks = (tasks: TaskNode[]): TaskNode[] => {
      const result: TaskNode[] = [];
      for (const task of tasks) {
        result.push(task);
        if (task.subTasks.length > 0) {
          result.push(...flattenTasks(task.subTasks));
        }
      }
      return result;
    };

    const allTasks = flattenTasks(processingResult.taskTree);

    // Prepare response
    const response = {
      message: 'PRD processed successfully',
      data: {
        projectId: projectId, // Include project ID in response
        taskTree: processingResult.taskTree,
        totalTasks: processingResult.totalTasks,
        levelDistribution: processingResult.levelDistribution,
        entityStats: processingResult.entityStats,
        processingMetadata: processingResult.processingMetadata,
        allTasks: allTasks
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ PRD processing completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error processing PRD:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        message: 'Failed to process PRD',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
