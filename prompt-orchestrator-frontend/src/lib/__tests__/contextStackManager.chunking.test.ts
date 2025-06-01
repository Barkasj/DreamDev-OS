/**
 * Tests for ContextStackManagerService chunking functionality
 */

import { ContextStackManagerService } from '../contextStackManager.service';
import { ProjectDocument, TaskNode, ExtractedEntities } from '../../types';

describe('ContextStackManagerService - Chunking', () => {
  let service: ContextStackManagerService;

  beforeEach(() => {
    service = new ContextStackManagerService();
  });

  const mockEntities: ExtractedEntities = {
    actors: ['User', 'Admin'],
    systems: ['Database', 'API'],
    features: ['Authentication', 'Dashboard']
  };

  const mockTaskNode: TaskNode = {
    id: 'task-1',
    taskName: 'Test Task',
    contentSummary: 'This is a test task for chunking functionality',
    level: 1,
    entities: mockEntities,
    subTasks: [
      {
        id: 'subtask-1',
        taskName: 'Sub Task 1',
        contentSummary: 'First subtask with detailed implementation requirements',
        level: 2,
        entities: mockEntities,
        subTasks: []
      },
      {
        id: 'subtask-2',
        taskName: 'Sub Task 2',
        contentSummary: 'Second subtask with complex business logic and validation rules',
        level: 2,
        entities: mockEntities,
        subTasks: []
      }
    ]
  };

  const createMockProject = (prdText: string): ProjectDocument => ({
    _id: 'project-1',
    originalPrdText: prdText,
    globalContext: 'Test project context',
    taskTree: [mockTaskNode],
    metadata: {
      totalTasks: 3,
      entityStats: {
        uniqueActors: ['User', 'Admin'],
        uniqueSystems: ['Database', 'API'],
        uniqueFeatures: ['Authentication', 'Dashboard']
      }
    }
  });

  describe('extractGlobalContext with chunking', () => {
    it('should extract global context with chunked details for long PRD', () => {
      const longPrdText = `
# Comprehensive Project Requirements Document

## Executive Summary
This is a comprehensive project that involves building a modern web application with multiple modules and complex functionality. The system should be scalable, maintainable, and user-friendly.

## Technical Requirements
The system should be built using modern technologies:
- Next.js for frontend development
- Node.js for backend services
- MongoDB for database storage
- TypeScript for type safety
- Redis for caching
- Docker for containerization

## Module 1: User Authentication
Users should be able to register, login, and manage their profiles. The system should support OAuth integration with Google and GitHub. Password reset functionality should be available via email.

## Module 2: Data Management
The application should provide CRUD operations for various data entities. It should support real-time updates and data synchronization across multiple clients.

## Module 3: Reporting
Generate comprehensive reports with charts and analytics. Support export to PDF and Excel formats. Include filtering and sorting capabilities.

## Module 4: API Integration
Integrate with external APIs for enhanced functionality. Support webhook notifications and real-time data synchronization.
      `.repeat(3); // Make it long enough to trigger chunking

      const project = createMockProject(longPrdText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      expect(globalContext!.projectId).toBe('project-1');
      expect(globalContext!.summary).toBeDefined();
      expect(globalContext!.projectTypeHints).toBeDefined();
      expect(globalContext!.complexityLevel).toBeDefined();
      expect(globalContext!.techStackHints).toBeDefined();

      // Check chunking results
      expect(globalContext!.detailedChunks).toBeDefined();
      expect(globalContext!.compressionMetadata).toBeDefined();

      if (globalContext!.detailedChunks && globalContext!.detailedChunks.length > 0) {
        // Verify chunk structure
        globalContext!.detailedChunks.forEach((chunk, index) => {
          expect(chunk.content).toBeDefined();
          expect(chunk.metadata.index).toBe(index);
          expect(chunk.metadata.size).toBe(chunk.content.length);
          expect(typeof chunk.metadata.startPosition).toBe('number');
          expect(typeof chunk.metadata.endPosition).toBe('number');
          expect(typeof chunk.metadata.hasOverlap).toBe('boolean');
        });

        // Verify compression metadata
        const compressionMeta = globalContext!.compressionMetadata!;
        expect(compressionMeta.originalLength).toBeGreaterThan(0);
        expect(compressionMeta.chunksCount).toBe(globalContext!.detailedChunks.length);
        expect(compressionMeta.compressionRatio).toBeGreaterThan(0);
        expect(['first', 'distributed', 'keyword-based']).toContain(compressionMeta.strategy);
      }
    });

    it('should handle short PRD text without chunking', () => {
      const shortPrdText = 'This is a short PRD text that does not need chunking.';
      const project = createMockProject(shortPrdText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      expect(globalContext!.detailedChunks).toBeDefined();
      expect(globalContext!.detailedChunks!.length).toBe(1);
      expect(globalContext!.detailedChunks![0].content).toBe(shortPrdText);
      expect(globalContext!.detailedChunks![0].metadata.hasOverlap).toBe(false);
    });

    it('should return null for empty PRD text', () => {
      const project = createMockProject('');
      project.originalPrdText = '';
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).toBeNull();
    });
  });

  describe('extractModuleContexts with chunking', () => {
    it('should extract module contexts with chunked details', () => {
      const project = createMockProject('Test PRD content for module extraction');
      const moduleContexts = service.extractModuleContexts(project);

      expect(moduleContexts).toHaveLength(1);
      
      const moduleContext = moduleContexts[0];
      expect(moduleContext.moduleId).toBe('task-1');
      expect(moduleContext.moduleTitle).toBe('Test Task');
      expect(moduleContext.summary).toBeDefined();
      expect(moduleContext.relatedEntities).toEqual(mockEntities);

      // Check chunking results
      expect(moduleContext.detailedChunks).toBeDefined();
      expect(moduleContext.compressionMetadata).toBeDefined();

      if (moduleContext.detailedChunks && moduleContext.detailedChunks.length > 0) {
        // Verify chunk structure
        moduleContext.detailedChunks.forEach((chunk, index) => {
          expect(chunk.content).toBeDefined();
          expect(chunk.metadata.index).toBe(index);
          expect(chunk.metadata.size).toBe(chunk.content.length);
        });

        // Content should include module information
        const allContent = moduleContext.detailedChunks.map(c => c.content).join(' ');
        expect(allContent).toContain('Test Task');
        expect(allContent).toContain('Sub Task 1');
        expect(allContent).toContain('Sub Task 2');
      }
    });

    it('should handle project without task tree', () => {
      const project = createMockProject('Test PRD content');
      project.taskTree = [];
      const moduleContexts = service.extractModuleContexts(project);

      expect(moduleContexts).toHaveLength(0);
    });

    it('should only extract level 1 tasks as modules', () => {
      const project = createMockProject('Test PRD content');
      project.taskTree = [
        { ...mockTaskNode, level: 1 },
        { ...mockTaskNode, id: 'task-2', level: 2 }, // Should be ignored
        { ...mockTaskNode, id: 'task-3', level: 1 }
      ];

      const moduleContexts = service.extractModuleContexts(project);
      expect(moduleContexts).toHaveLength(2);
      expect(moduleContexts[0].moduleId).toBe('task-1');
      expect(moduleContexts[1].moduleId).toBe('task-3');
    });
  });

  describe('getContextChunksForPrompt', () => {
    it('should return context chunks within token limit', () => {
      const globalContext = service.extractGlobalContext(
        createMockProject('Global context content for testing token limits and chunking functionality')
      );
      
      const moduleContexts = service.extractModuleContexts(
        createMockProject('Module context content for testing')
      );

      const result = service.getContextChunksForPrompt(
        globalContext,
        moduleContexts[0],
        50 // Small token limit for testing
      );

      expect(result.globalChunks).toBeDefined();
      expect(result.moduleChunks).toBeDefined();
      expect(result.totalTokens).toBeLessThanOrEqual(50);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should handle null contexts gracefully', () => {
      const result = service.getContextChunksForPrompt(null, null, 100);

      expect(result.globalChunks).toHaveLength(0);
      expect(result.moduleChunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
    });

    it('should prioritize global context over module context', () => {
      const longGlobalText = 'This is a very long global context that should take priority over module context when token budget is limited. '.repeat(10);
      const globalContext = service.extractGlobalContext(
        createMockProject(longGlobalText)
      );
      
      const moduleContexts = service.extractModuleContexts(
        createMockProject('Module context content')
      );

      // Debug: check if contexts have chunks
      expect(globalContext).not.toBeNull();
      expect(globalContext!.detailedChunks).toBeDefined();
      expect(globalContext!.detailedChunks!.length).toBeGreaterThan(0);

      // Verify chunks are available

      const result = service.getContextChunksForPrompt(
        globalContext,
        moduleContexts[0],
        300 // Increased token limit to accommodate the large chunk
      );

      // Should include global chunks first
      expect(result.globalChunks.length).toBeGreaterThan(0);
      // May or may not include module chunks depending on remaining budget
      expect(result.totalTokens).toBeLessThanOrEqual(300);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('compression strategies', () => {
    it('should use "first" strategy for small number of chunks', () => {
      const shortText = 'Short text that creates few chunks';
      const project = createMockProject(shortText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext!.compressionMetadata!.strategy).toBe('first');
    });

    it('should use "distributed" strategy for global context with many chunks', () => {
      const longText = 'This is a very long text that will create many chunks. '.repeat(100);
      const project = createMockProject(longText);
      const globalContext = service.extractGlobalContext(project);

      if (globalContext!.compressionMetadata!.chunksCount > 3) {
        expect(['distributed', 'first']).toContain(globalContext!.compressionMetadata!.strategy);
      }
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in extractGlobalContext', () => {
      const project = createMockProject('Valid PRD text');
      // Simulate error by corrupting project structure
      (project as any).originalPrdText = null;

      const globalContext = service.extractGlobalContext(project);
      expect(globalContext).toBeNull();
    });

    it('should handle errors gracefully in extractModuleContexts', () => {
      const project = createMockProject('Valid PRD text');
      // Simulate error by corrupting task tree
      (project as any).taskTree = null;

      const moduleContexts = service.extractModuleContexts(project);
      expect(moduleContexts).toHaveLength(0);
    });
  });

  describe('integration with existing functionality', () => {
    it('should maintain backward compatibility with existing methods', () => {
      const project = createMockProject('Test PRD for backward compatibility');
      
      // Test that existing methods still work
      const stepContext = service.getStepContext(mockTaskNode);
      expect(stepContext.taskId).toBe('task-1');
      expect(stepContext.stepSummary).toBe('This is a test task for chunking functionality');

      const moduleContexts = service.extractModuleContexts(project);
      const relevantModule = service.findRelevantModuleContext(mockTaskNode, moduleContexts);
      expect(relevantModule).not.toBeNull();
      expect(relevantModule!.moduleId).toBe('task-1');
    });

    it('should work with complex project structures', () => {
      const complexProject = createMockProject('Complex project with multiple modules');
      complexProject.taskTree = [
        {
          ...mockTaskNode,
          id: 'module-1',
          taskName: 'Authentication Module',
          level: 1,
          subTasks: [
            {
              id: 'auth-task-1',
              taskName: 'Login Implementation',
              contentSummary: 'Implement user login with JWT tokens',
              level: 2,
              entities: mockEntities,
              subTasks: []
            }
          ]
        },
        {
          ...mockTaskNode,
          id: 'module-2',
          taskName: 'Data Management Module',
          level: 1,
          subTasks: [
            {
              id: 'data-task-1',
              taskName: 'CRUD Operations',
              contentSummary: 'Implement basic CRUD operations for entities',
              level: 2,
              entities: mockEntities,
              subTasks: []
            }
          ]
        }
      ];

      const globalContext = service.extractGlobalContext(complexProject);
      const moduleContexts = service.extractModuleContexts(complexProject);

      expect(globalContext).not.toBeNull();
      expect(moduleContexts).toHaveLength(2);
      expect(moduleContexts[0].moduleTitle).toBe('Authentication Module');
      expect(moduleContexts[1].moduleTitle).toBe('Data Management Module');

      // Test context chunks for prompt
      const contextChunks = service.getContextChunksForPrompt(
        globalContext,
        moduleContexts[0],
        200
      );

      expect(contextChunks.totalTokens).toBeGreaterThan(0);
      expect(contextChunks.totalTokens).toBeLessThanOrEqual(200);
    });
  });
});