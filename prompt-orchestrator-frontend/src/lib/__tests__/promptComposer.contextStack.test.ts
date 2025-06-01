/**
 * Integration Tests untuk PromptComposerService dengan Context Stack Manager
 * Testing integrasi enhanced context stack dalam prompt generation
 */

import { PromptComposerService } from '../promptComposer.service';
import { ProjectDocument, TaskNode, ExtractedEntities, GlobalContext, ModuleContext } from '../../types';

describe('PromptComposerService - Context Stack Integration', () => {
  let promptComposer: PromptComposerService;
  let mockProjectDocument: ProjectDocument;
  let mockTaskNode: TaskNode;

  beforeEach(() => {
    promptComposer = new PromptComposerService();

    // Mock ExtractedEntities
    const mockEntities: ExtractedEntities = {
      actors: ['developer', 'admin', 'user'],
      systems: ['MongoDB', 'Next.js', 'TypeScript'],
      features: ['authentication', 'user management', 'data processing']
    };

    // Mock TaskNode
    mockTaskNode = {
      id: 'task-123-456',
      taskName: 'Implementasi Database Schema',
      level: 1,
      contentSummary: 'Merancang dan mengimplementasikan skema database untuk sistem user management dengan MongoDB. Termasuk collection users, roles, dan permissions.',
      entities: mockEntities,
      subTasks: [],
      status: 'pending',
      dependencies: []
    };

    // Mock GlobalContext
    const mockGlobalContext: GlobalContext = {
      projectId: 'project-789',
      summary: 'DreamDev OS adalah sistem orkestrasi AI yang menghasilkan prompt super lengkap dan terstruktur untuk development workflow.',
      projectTypeHints: 'System/Platform',
      complexityLevel: 'medium',
      techStackHints: ['Next.js', 'TypeScript', 'MongoDB', 'Node.js']
    };

    // Mock ModuleContext
    const mockModuleContexts: ModuleContext[] = [
      {
        moduleId: 'task-123-456',
        moduleTitle: 'Database Implementation',
        summary: 'Implementasi komponen database dengan MongoDB untuk user management dan data persistence.',
        relatedEntities: mockEntities
      },
      {
        moduleId: 'task-789-012',
        moduleTitle: 'API Development',
        summary: 'Pengembangan REST API endpoints untuk sistem.',
        relatedEntities: {
          actors: ['developer'],
          systems: ['Express.js', 'Node.js'],
          features: ['API endpoints', 'authentication']
        }
      }
    ];

    // Mock ProjectDocument dengan enhanced context
    mockProjectDocument = {
      _id: 'project-789',
      originalPrdText: `# Product Requirements Document - DreamDev OS

## 1. Pendahuluan

DreamDev OS adalah sistem orkestrasi AI yang menghasilkan prompt super lengkap dan terstruktur. 
Sistem ini memungkinkan pengguna untuk menganalisis kebutuhan dan menghasilkan prompt yang actionable.

## 2. Database Implementation

Implementasi database menggunakan MongoDB untuk menyimpan data user, project, dan task management.`,
      taskTree: [mockTaskNode],
      globalContext: 'Membangun "Prompt Orchestrator - DreamDev OS" sesuai PRD. Fokus pada Fase 1. Teknologi: Node.js/TypeScript backend, Next.js frontend.',
      globalContextData: mockGlobalContext,
      moduleContexts: mockModuleContexts,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      metadata: {
        totalTasks: 5,
        rootTasks: 2,
        levelDistribution: { 1: 2, 2: 3 },
        entityStats: {
          totalActors: 3,
          totalSystems: 5,
          totalFeatures: 8,
          uniqueActors: ['developer', 'admin', 'user'],
          uniqueSystems: ['MongoDB', 'Next.js', 'TypeScript', 'Express.js', 'Node.js'],
          uniqueFeatures: ['authentication', 'user management', 'data processing', 'API endpoints', 'frontend components']
        },
        processingDuration: 1500
      }
    };
  });

  describe('composePromptWithMetadataFromProject', () => {
    it('should generate prompt with enhanced context stack', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      expect(result).toBeDefined();
      expect(result.promptText).toContain('Context Stack');
      expect(result.promptText).toContain('Global Project Context');
      expect(result.promptText).toContain('Module Context');
      expect(result.promptText).toContain('Step Context');
    });

    it('should include global context data in prompt', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      expect(result.promptText).toContain('DreamDev OS adalah sistem orkestrasi AI');
      expect(result.promptText).toContain('System/Platform');
      expect(result.promptText).toContain('medium');
      expect(result.promptText).toContain('Next.js');
      expect(result.promptText).toContain('MongoDB');
    });

    it('should include relevant module context in prompt', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      expect(result.promptText).toContain('Database Implementation');
      expect(result.promptText).toContain('Implementasi komponen database dengan MongoDB');
      expect(result.promptText).toContain('Aktor: developer, admin, user');
    });

    it('should include step context in prompt', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      expect(result.promptText).toContain('task-123-456');
      expect(result.promptText).toContain('Merancang dan mengimplementasikan skema database');
      expect(result.promptText).toContain('Sistem: MongoDB, Next.js, TypeScript');
    });

    it('should fallback gracefully when no enhanced context available', () => {
      const projectWithoutEnhancedContext = {
        ...mockProjectDocument,
        globalContextData: undefined,
        moduleContexts: undefined
      };

      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode, 
        projectWithoutEnhancedContext
      );

      expect(result).toBeDefined();
      expect(result.promptText).toContain('Context Stack');
      expect(result.promptText).toContain('Global Project Context');
      // Should fallback to legacy globalContext
      expect(result.promptText).toContain('Prompt Orchestrator - DreamDev OS');
    });

    it('should handle task with dependencies correctly', () => {
      const taskWithDependencies = {
        ...mockTaskNode,
        dependencies: ['task-001', 'task-002']
      };

      const result = promptComposer.composePromptWithMetadataFromProject(
        taskWithDependencies,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Previous Steps Results');
      expect(result.promptText).toContain('Keberhasilan penyelesaian task');
      expect(result.promptText).toContain('task-001');
      expect(result.promptText).toContain('task-002');
    });

    it('should generate correct metadata', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      expect(result.metadata.taskId).toBe('task-123-456');
      expect(result.metadata.taskName).toBe('Implementasi Database Schema');
      expect(result.metadata.level).toBe(1);
      expect(result.metadata.characterCount).toBeGreaterThan(0);
      expect(result.metadata.lineCount).toBeGreaterThan(0);
      expect(result.metadata.detectedEntities).toEqual(mockTaskNode.entities);
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle level 2 task with parent module context', () => {
      const level2Task = {
        ...mockTaskNode,
        id: 'task-level2-789',
        taskName: 'Create User Collection Schema',
        level: 2,
        contentSummary: 'Membuat schema collection users dengan field yang diperlukan'
      };

      const result = promptComposer.composePromptWithMetadataFromProject(level2Task, mockProjectDocument);

      expect(result.promptText).toContain('Module Context');
      // Should fallback to first module context
      expect(result.promptText).toContain('Database Implementation');
    });

    it('should format entities inline correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      // Check inline entity formatting in context sections
      expect(result.promptText).toMatch(/Aktor: developer, admin, user/);
      expect(result.promptText).toMatch(/Sistem: MongoDB, Next\.js, TypeScript/);
      expect(result.promptText).toMatch(/Fitur: authentication, user management, data processing/);
    });

    it('should generate appropriate step identifier', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);

      // Step identifier format: Step {level}.{shortId}: {taskName}
      expect(result.promptText).toMatch(/## Step 1\.[a-zA-Z0-9-]+: Implementasi Database Schema/);
    });
  });

  describe('context stack sections', () => {
    it('should have all required sections in correct order', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(mockTaskNode, mockProjectDocument);
      const promptText = result.promptText;

      // Check section order
      const objectiveIndex = promptText.indexOf('🎯 Objective');
      const contextStackIndex = promptText.indexOf('🧠 Context Stack');
      const executionIndex = promptText.indexOf('🧩 Execution Prompt');
      const successIndex = promptText.indexOf('✅ Success Criteria');
      const debugIndex = promptText.indexOf('🛠️ Debug Assistance');
      const nextStepsIndex = promptText.indexOf('🔗 Next Steps');

      expect(objectiveIndex).toBeGreaterThan(-1);
      expect(contextStackIndex).toBeGreaterThan(objectiveIndex);
      expect(executionIndex).toBeGreaterThan(contextStackIndex);
      expect(successIndex).toBeGreaterThan(executionIndex);
      expect(debugIndex).toBeGreaterThan(successIndex);
      expect(nextStepsIndex).toBeGreaterThan(debugIndex);
    });
  });
});
