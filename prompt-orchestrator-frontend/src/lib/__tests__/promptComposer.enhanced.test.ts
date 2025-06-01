/**
 * Enhanced Unit Tests untuk PromptComposerService
 * Testing penyempurnaan konten dan struktur prompt yang dihasilkan
 */

import { PromptComposerService } from '../promptComposer.service';
import { TaskNode, ProjectDocument, ExtractedEntities } from '../../types';

describe('PromptComposerService - Enhanced Features', () => {
  let promptComposer: PromptComposerService;

  // Mock data untuk testing
  const mockEntities: ExtractedEntities = {
    actors: ['developer', 'admin', 'user'],
    systems: ['MongoDB', 'Next.js', 'TypeScript'],
    features: ['authentication', 'data processing', 'user interface']
  };

  const mockTaskNode: TaskNode = {
    id: 'test-uuid-1234-5678-9012',
    taskName: 'Implementasi Authentication Module',
    level: 2,
    contentSummary: 'Membuat sistem autentikasi yang aman dengan JWT token dan password hashing menggunakan MongoDB dan Next.js.',
    entities: mockEntities,
    subTasks: [],
    status: 'pending',
    dependencies: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'high',
      riskLevel: 'medium'
    }
  };

  const mockTaskWithDependencies: TaskNode = {
    id: 'dependent-uuid-1234-5678-9012',
    taskName: 'User Profile Management',
    level: 2,
    contentSummary: 'Membuat fitur manajemen profil user setelah authentication selesai.',
    entities: mockEntities,
    subTasks: [],
    status: 'pending',
    dependencies: ['test-uuid-1234-5678-9012'],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'medium',
      riskLevel: 'low'
    }
  };

  const mockTaskWithSubTasks: TaskNode = {
    id: 'parent-uuid-1234-5678-9012',
    taskName: 'Setup Database Infrastructure',
    level: 1,
    contentSummary: 'Menyiapkan infrastruktur database MongoDB untuk aplikasi.',
    entities: { actors: ['developer'], systems: ['MongoDB'], features: ['database'] },
    subTasks: [
      {
        id: 'sub1-uuid-1234-5678-9012',
        taskName: 'Create Database Schema',
        level: 2,
        contentSummary: 'Membuat skema database',
        entities: { actors: [], systems: ['MongoDB'], features: [] },
        subTasks: [],
        status: 'pending',
        dependencies: []
      },
      {
        id: 'sub2-uuid-1234-5678-9012',
        taskName: 'Setup Indexes',
        level: 2,
        contentSummary: 'Membuat indexes untuk performa',
        entities: { actors: [], systems: ['MongoDB'], features: [] },
        subTasks: [],
        status: 'pending',
        dependencies: []
      }
    ],
    status: 'pending',
    dependencies: []
  };

  const mockProjectDocument: ProjectDocument = {
    _id: 'project-uuid-1234-5678-9012',
    originalPrdText: `# Product Requirements Document - DreamDev OS

## 1. Pendahuluan
DreamDev OS adalah sistem orkestrasi AI yang menghasilkan prompt super lengkap dan terstruktur. 
Sistem ini memungkinkan pengguna untuk menganalisis kebutuhan dan menghasilkan prompt yang actionable.

## 2. Fitur Utama
- Authentication system dengan JWT
- User management dan profil
- Task orchestration engine
- Prompt generation dengan AI

## 3. Teknologi
- Backend: Node.js dengan TypeScript
- Database: MongoDB
- Frontend: Next.js dengan React
- Authentication: JWT dengan bcrypt`,
    taskTree: [mockTaskNode, mockTaskWithDependencies, mockTaskWithSubTasks],
    globalContext: 'Membangun "Prompt Orchestrator - DreamDev OS" sesuai PRD. Fokus pada Fase 1. Teknologi: Node.js/TypeScript backend, Next.js frontend, MongoDB database.',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      totalTasks: 3,
      rootTasks: 3,
      levelDistribution: { 1: 1, 2: 2 },
      entityStats: {
        totalActors: 3,
        totalSystems: 3,
        totalFeatures: 3,
        uniqueActors: ['developer', 'admin', 'user'],
        uniqueSystems: ['MongoDB', 'Next.js', 'TypeScript'],
        uniqueFeatures: ['authentication', 'data processing', 'user interface']
      },
      processingDuration: 1500
    }
  };

  beforeEach(() => {
    promptComposer = new PromptComposerService();
  });

  describe('composePromptWithMetadataFromProject', () => {
    test('should generate enhanced prompt with ProjectDocument context', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      // Check that prompt contains enhanced content
      expect(result.promptText).toContain(mockTaskNode.taskName);
      expect(result.promptText).toContain('🎯 Objective');
      expect(result.promptText).toContain('🧠 Context Stack');
      expect(result.promptText).toContain('🧩 Execution Prompt');
      expect(result.promptText).toContain('✅ Success Criteria');
      expect(result.promptText).toContain('🛠️ Debug Assistance');
      expect(result.promptText).toContain('🔗 Next Steps');
    });

    test('should use global context from ProjectDocument', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain(mockProjectDocument.globalContext);
    });

    test('should generate enhanced objective based on task type', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      // Should detect authentication task type and generate appropriate objective
      expect(result.promptText).toContain('autentikasi');
      expect(result.promptText).toContain('MongoDB');
    });

    test('should handle task with dependencies correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskWithDependencies,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Previous Steps Results');
      expect(result.promptText).toContain('Implementasi Authentication Module');
    });

    test('should handle task with sub-tasks correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskWithSubTasks,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Next Steps');
      expect(result.promptText).toContain('Create Database Schema');
      expect(result.promptText).toContain('Setup Indexes');
    });

    test('should generate technology-specific debug assistance', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain('MongoDB');
      expect(result.promptText).toContain('Next.js');
      expect(result.promptText).toContain('TypeScript');
    });

    test('should generate appropriate success criteria', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain('✅');
      expect(result.promptText).toContain('Unit tests coverage minimal 80%');
      expect(result.promptText).toContain('Code review checklist');
    });

    test('should format entities correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Entitas Terkait:');
      expect(result.promptText).toContain('developer, admin, user');
      expect(result.promptText).toContain('MongoDB, Next.js, TypeScript');
      expect(result.promptText).toContain('authentication, data processing, user interface');
    });

    test('should generate step identifier correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain('## Step 2.test:');
    });

    test('should calculate metadata correctly', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.metadata.taskId).toBe(mockTaskNode.id);
      expect(result.metadata.taskName).toBe(mockTaskNode.taskName);
      expect(result.metadata.level).toBe(mockTaskNode.level);
      expect(result.metadata.characterCount).toBeGreaterThan(0);
      expect(result.metadata.lineCount).toBeGreaterThan(0);
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata.detectedEntities).toEqual(mockTaskNode.entities);
    });
  });

  describe('fallback scenarios', () => {
    test('should handle ProjectDocument without globalContext', () => {
      const projectWithoutContext = {
        ...mockProjectDocument,
        globalContext: ''
      };

      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        projectWithoutContext
      );

      expect(result.promptText).toContain('Mengerjakan proyek');
      expect(result.promptText).toContain('Ringkasan PRD:');
    });

    test('should handle task without dependencies', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Tidak ada dependensi task sebelumnya');
    });

    test('should handle task without sub-tasks', () => {
      const result = promptComposer.composePromptWithMetadataFromProject(
        mockTaskNode,
        mockProjectDocument
      );

      // Task ini memiliki sibling task berikutnya, jadi tidak akan menampilkan "task terakhir"
      expect(result.promptText).toContain('Next Steps');
      expect(result.promptText).toContain('User Profile Management');
    });

    test('should handle empty entities', () => {
      const taskWithEmptyEntities = {
        ...mockTaskNode,
        entities: { actors: [], systems: [], features: [] }
      };

      const result = promptComposer.composePromptWithMetadataFromProject(
        taskWithEmptyEntities,
        mockProjectDocument
      );

      expect(result.promptText).toContain('Tidak ada entitas khusus yang teridentifikasi');
    });

    test('should handle truly last task in workflow', () => {
      // Buat task yang benar-benar terakhir (tidak ada sibling berikutnya)
      const lastTask: TaskNode = {
        id: 'last-task-uuid-1234-5678-9012',
        taskName: 'Final Testing and Deployment',
        level: 1,
        contentSummary: 'Testing final dan deployment aplikasi',
        entities: { actors: ['developer'], systems: ['deployment'], features: ['testing'] },
        subTasks: [],
        status: 'pending',
        dependencies: []
      };

      const projectWithLastTask = {
        ...mockProjectDocument,
        taskTree: [lastTask] // Hanya satu task, jadi ini adalah task terakhir
      };

      const result = promptComposer.composePromptWithMetadataFromProject(
        lastTask,
        projectWithLastTask
      );

      expect(result.promptText).toContain('task terakhir dalam alur');
    });
  });
});
