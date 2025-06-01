/**
 * Tests for PromptComposerService chunked context functionality
 */

import { PromptComposerService } from '../promptComposer.service';
import { ProjectDocument, TaskNode, ExtractedEntities, GlobalContext, ModuleContext } from '../../types';

describe('PromptComposerService - Chunked Context', () => {
  let service: PromptComposerService;

  beforeEach(() => {
    service = new PromptComposerService();
  });

  const mockEntities: ExtractedEntities = {
    actors: ['User', 'Admin'],
    systems: ['Database', 'API'],
    features: ['Authentication', 'Dashboard']
  };

  const mockTaskNode: TaskNode = {
    id: 'task-1',
    taskName: 'Test Task',
    contentSummary: 'This is a test task for chunked context functionality',
    level: 1,
    entities: mockEntities,
    subTasks: []
  };

  const createMockGlobalContext = (): GlobalContext => ({
    projectId: 'project-1',
    summary: 'Test project summary',
    projectTypeHints: 'Web Application',
    complexityLevel: 'medium',
    techStackHints: ['Next.js', 'TypeScript', 'MongoDB'],
    detailedChunks: [
      {
        content: 'This is the first chunk of global context containing project overview and initial requirements.',
        metadata: {
          index: 0,
          startPosition: 0,
          endPosition: 95,
          size: 95,
          hasOverlap: false
        }
      },
      {
        content: 'This is the second chunk with technical specifications and architecture details for the project.',
        metadata: {
          index: 1,
          startPosition: 95,
          endPosition: 190,
          size: 95,
          hasOverlap: true
        }
      }
    ],
    compressionMetadata: {
      originalLength: 500,
      chunksCount: 2,
      compressionRatio: 0.8,
      strategy: 'first'
    }
  });

  const createMockModuleContext = (): ModuleContext => ({
    moduleId: 'module-1',
    moduleTitle: 'Authentication Module',
    summary: 'Module for handling user authentication and authorization',
    relatedEntities: mockEntities,
    detailedChunks: [
      {
        content: 'Authentication module handles user login, registration, and session management with JWT tokens.',
        metadata: {
          index: 0,
          startPosition: 0,
          endPosition: 95,
          size: 95,
          hasOverlap: false
        }
      }
    ],
    compressionMetadata: {
      originalLength: 200,
      chunksCount: 1,
      compressionRatio: 1.0,
      strategy: 'first'
    }
  });

  const createMockProject = (withChunkedContext: boolean = true): ProjectDocument => {
    const project: ProjectDocument = {
      _id: 'project-1',
      originalPrdText: 'Test PRD content',
      globalContext: 'Test project context',
      taskTree: [mockTaskNode],
      metadata: {
        totalTasks: 1,
        entityStats: {
          uniqueActors: ['User', 'Admin'],
          uniqueSystems: ['Database', 'API'],
          uniqueFeatures: ['Authentication', 'Dashboard']
        }
      }
    };

    if (withChunkedContext) {
      project.globalContextData = createMockGlobalContext();
      project.moduleContexts = [createMockModuleContext()];
    }

    return project;
  };

  describe('composePromptWithMetadataFromProject with chunked context', () => {
    it('should include chunked global context in prompt', () => {
      const project = createMockProject(true);
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Global Project Context');
      expect(result.promptText).toContain('Detail Konteks Global (Bagian 1/2)');
      expect(result.promptText).toContain('first chunk of global context');
      expect(result.promptText).toContain('Detail Konteks Global (Bagian 2/2)');
      expect(result.promptText).toContain('second chunk with technical specifications');
    });

    it('should include chunked module context in prompt', () => {
      const project = createMockProject(true);
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Module Context');
      expect(result.promptText).toContain('Authentication Module');
      expect(result.promptText).toContain('Detail Modul (Bagian 1/1)');
      expect(result.promptText).toContain('Authentication module handles user login');
    });

    it('should fallback to basic context when no chunked context available', () => {
      const project = createMockProject(false);
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Global Project Context');
      expect(result.promptText).not.toContain('Detail Konteks Global');
      expect(result.promptText).not.toContain('Detail Modul');
    });

    it('should handle empty chunked context gracefully', () => {
      const project = createMockProject(true);
      project.globalContextData!.detailedChunks = [];
      project.moduleContexts![0].detailedChunks = [];

      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Global Project Context');
      expect(result.promptText).toContain('Module Context');
      expect(result.promptText).not.toContain('Detail Konteks Global');
      expect(result.promptText).not.toContain('Detail Modul');
    });

    it('should limit chunk previews to reasonable length', () => {
      const project = createMockProject(true);
      // Create a very long chunk
      const longContent = 'This is a very long chunk content that should be truncated in the preview. '.repeat(20);
      project.globalContextData!.detailedChunks![0].content = longContent;

      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Detail Konteks Global');
      
      // Check that the long content is truncated (should contain ellipsis)
      const chunkPreviewMatch = result.promptText.match(/Detail Konteks Global \(Bagian 1\/2\):\s*([^]*?)(?=\n\n|$)/);
      if (chunkPreviewMatch) {
        const chunkPreview = chunkPreviewMatch[1];
        expect(chunkPreview.length).toBeLessThan(longContent.length);
        expect(chunkPreview).toContain('...');
      }
    });

    it('should maintain proper prompt structure with chunked context', () => {
      const project = createMockProject(true);
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      // Check that all required sections are present
      expect(result.promptText).toContain('🎯 Objective');
      expect(result.promptText).toContain('🧠 Context Stack');
      expect(result.promptText).toContain('🧩 Execution Prompt');
      expect(result.promptText).toContain('✅ Success Criteria');
      expect(result.promptText).toContain('🛠️ Debug Assistance');
      expect(result.promptText).toContain('🔗 Next Steps');

      // Check metadata
      expect(result.metadata.taskId).toBe('task-1');
      expect(result.metadata.taskName).toBe('Test Task');
      expect(result.metadata.characterCount).toBeGreaterThan(0);
      expect(result.metadata.lineCount).toBeGreaterThan(0);
    });
  });

  describe('generateGlobalContextInfoWithChunks', () => {
    it('should generate basic info when no chunks available', () => {
      const project = createMockProject(false);
      // Access private method through any cast for testing
      const contextInfo = (service as any).generateGlobalContextInfoWithChunks(project);

      expect(contextInfo).toBeDefined();
      expect(contextInfo).not.toContain('Detail Konteks Global');
    });

    it('should include chunk details when available', () => {
      const project = createMockProject(true);
      const contextInfo = (service as any).generateGlobalContextInfoWithChunks(project);

      expect(contextInfo).toContain('Detail Konteks Global (Bagian 1/2)');
      expect(contextInfo).toContain('Detail Konteks Global (Bagian 2/2)');
      expect(contextInfo).toContain('first chunk of global context');
    });

    it('should limit to first 2 chunks for preview', () => {
      const project = createMockProject(true);
      // Add more chunks
      project.globalContextData!.detailedChunks!.push({
        content: 'Third chunk that should not appear in preview',
        metadata: {
          index: 2,
          startPosition: 190,
          endPosition: 285,
          size: 95,
          hasOverlap: true
        }
      });

      const contextInfo = (service as any).generateGlobalContextInfoWithChunks(project);

      expect(contextInfo).toContain('Detail Konteks Global (Bagian 1/3)');
      expect(contextInfo).toContain('Detail Konteks Global (Bagian 2/3)');
      expect(contextInfo).not.toContain('Third chunk that should not appear');
    });
  });

  describe('generateModuleContextInfoWithChunks', () => {
    it('should return null when no module contexts available', () => {
      const project = createMockProject(false);
      project.moduleContexts = [];
      
      const moduleInfo = (service as any).generateModuleContextInfoWithChunks(mockTaskNode, project);
      expect(moduleInfo).toBeNull();
    });

    it('should include chunk details when available', () => {
      const project = createMockProject(true);
      const moduleInfo = (service as any).generateModuleContextInfoWithChunks(mockTaskNode, project);

      expect(moduleInfo).toContain('Authentication Module');
      expect(moduleInfo).toContain('Detail Modul (Bagian 1/1)');
      expect(moduleInfo).toContain('Authentication module handles user login');
    });

    it('should limit chunk preview length', () => {
      const project = createMockProject(true);
      const longContent = 'Very long module content that should be truncated in preview. '.repeat(10);
      project.moduleContexts![0].detailedChunks![0].content = longContent;

      const moduleInfo = (service as any).generateModuleContextInfoWithChunks(mockTaskNode, project);

      expect(moduleInfo).toContain('Detail Modul');
      expect(moduleInfo).toContain('...');
      expect(moduleInfo.length).toBeLessThan(longContent.length + 200);
    });

    it('should find relevant module context for task', () => {
      const project = createMockProject(true);
      // Add another module context
      project.moduleContexts!.push({
        moduleId: 'module-2',
        moduleTitle: 'Data Module',
        summary: 'Data management module',
        relatedEntities: mockEntities,
        detailedChunks: [{
          content: 'Data module content',
          metadata: {
            index: 0,
            startPosition: 0,
            endPosition: 19,
            size: 19,
            hasOverlap: false
          }
        }],
        compressionMetadata: {
          originalLength: 50,
          chunksCount: 1,
          compressionRatio: 1.0,
          strategy: 'first'
        }
      });

      // Test with task that matches first module
      const taskForModule1 = { ...mockTaskNode, id: 'module-1' };
      const moduleInfo1 = (service as any).generateModuleContextInfoWithChunks(taskForModule1, project);
      expect(moduleInfo1).toContain('Authentication Module');

      // Test with task that doesn't match any module (should get first one)
      const taskForUnknown = { ...mockTaskNode, id: 'unknown-module' };
      const moduleInfoUnknown = (service as any).generateModuleContextInfoWithChunks(taskForUnknown, project);
      expect(moduleInfoUnknown).toContain('Authentication Module'); // Should get first module as fallback
    });
  });

  describe('integration with context stack', () => {
    it('should properly integrate chunked context with existing context stack', () => {
      const project = createMockProject(true);
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      // Should contain all context layers
      expect(result.promptText).toContain('Global Project Context');
      expect(result.promptText).toContain('Module Context');
      expect(result.promptText).toContain('Step Context');

      // Should contain chunked details
      expect(result.promptText).toContain('Detail Konteks Global');
      expect(result.promptText).toContain('Detail Modul');

      // Should contain entities information
      expect(result.promptText).toContain('User');
      expect(result.promptText).toContain('Database');
      expect(result.promptText).toContain('Authentication');
    });

    it('should handle mixed context availability', () => {
      const project = createMockProject(true);
      // Remove module context chunks but keep global
      project.moduleContexts![0].detailedChunks = [];

      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);

      expect(result.promptText).toContain('Detail Konteks Global');
      expect(result.promptText).not.toContain('Detail Modul');
      expect(result.promptText).toContain('Authentication Module'); // Basic module info should still be there
    });
  });

  describe('performance and optimization', () => {
    it('should handle large number of chunks efficiently', () => {
      const project = createMockProject(true);
      
      // Add many chunks to test performance
      const manyChunks = Array.from({ length: 50 }, (_, i) => ({
        content: `Chunk ${i + 1} content for performance testing`,
        metadata: {
          index: i,
          startPosition: i * 50,
          endPosition: (i + 1) * 50,
          size: 50,
          hasOverlap: i > 0
        }
      }));

      project.globalContextData!.detailedChunks = manyChunks;

      const startTime = Date.now();
      const result = service.composePromptWithMetadataFromProject(mockTaskNode, project);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should still only show first 2 chunks in preview
      expect(result.promptText).toContain('Detail Konteks Global (Bagian 1/50)');
      expect(result.promptText).toContain('Detail Konteks Global (Bagian 2/50)');
      expect(result.promptText).not.toContain('Chunk 3 content');
    });
  });
});