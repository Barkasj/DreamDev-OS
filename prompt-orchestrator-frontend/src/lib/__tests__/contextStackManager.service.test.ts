/**
 * Unit Tests untuk ContextStackManagerService
 * Testing ekstraksi dan manajemen berbagai lapisan konteks
 */

import { ContextStackManagerService } from '../contextStackManager.service';
import { ProjectDocument, TaskNode, ExtractedEntities, ModuleContext } from '../../types';

describe('ContextStackManagerService', () => {
  let contextStackManager: ContextStackManagerService;
  let mockProjectDocument: ProjectDocument;
  let mockTaskNode: TaskNode;

  beforeEach(() => {
    contextStackManager = new ContextStackManagerService();

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

    // Mock ProjectDocument
    mockProjectDocument = {
      _id: 'project-789',
      originalPrdText: `# Product Requirements Document - DreamDev OS

## 1. Pendahuluan

DreamDev OS adalah sistem orkestrasi AI yang menghasilkan prompt super lengkap dan terstruktur. 
Sistem ini memungkinkan pengguna untuk menganalisis kebutuhan dan menghasilkan prompt yang actionable.
Admin dapat mengelola konfigurasi sistem dan developer akan menggunakan sistem untuk development.

## 2. Fitur Utama

### 2.1 User Management
Sistem harus mendukung manajemen user dengan role-based access control.

### 2.2 API Development
Pengembangan REST API menggunakan Node.js dan Express.js.

### 2.3 Frontend Development
Implementasi frontend menggunakan Next.js dan TypeScript.`,
      taskTree: [mockTaskNode],
      globalContext: 'Membangun "Prompt Orchestrator - DreamDev OS" sesuai PRD. Fokus pada Fase 1. Teknologi: Node.js/TypeScript backend, Next.js frontend.',
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

  describe('extractGlobalContext', () => {
    it('should extract global context successfully', () => {
      const result = contextStackManager.extractGlobalContext(mockProjectDocument);

      expect(result).not.toBeNull();
      expect(result?.projectId).toBe('project-789');
      expect(result?.summary).toContain('DreamDev OS');
      expect(result?.projectTypeHints).toBe('System/Platform');
      expect(result?.complexityLevel).toBe('medium');
      expect(result?.techStackHints).toContain('next.js');
      expect(result?.techStackHints).toContain('node.js');
    });

    it('should return null for empty PRD text', () => {
      const emptyProject = { ...mockProjectDocument, originalPrdText: '' };
      const result = contextStackManager.extractGlobalContext(emptyProject);

      expect(result).toBeNull();
    });

    it('should detect correct project type for web application', () => {
      const webAppProject = {
        ...mockProjectDocument,
        originalPrdText: 'Ini adalah aplikasi web untuk e-commerce menggunakan React dan Node.js'
      };
      
      const result = contextStackManager.extractGlobalContext(webAppProject);
      
      expect(result?.projectTypeHints).toBe('Web Application');
    });

    it('should analyze complexity correctly for simple project', () => {
      const simpleProject = {
        ...mockProjectDocument,
        metadata: {
          ...mockProjectDocument.metadata!,
          totalTasks: 3,
          entityStats: {
            ...mockProjectDocument.metadata!.entityStats,
            uniqueSystems: ['React'],
            uniqueFeatures: ['login', 'dashboard']
          }
        }
      };

      const result = contextStackManager.extractGlobalContext(simpleProject);
      
      expect(result?.complexityLevel).toBe('simple');
    });

    it('should analyze complexity correctly for complex project', () => {
      const complexProject = {
        ...mockProjectDocument,
        metadata: {
          ...mockProjectDocument.metadata!,
          totalTasks: 25,
          entityStats: {
            ...mockProjectDocument.metadata!.entityStats,
            uniqueSystems: ['React', 'Node.js', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Nginx', 'PostgreSQL'],
            uniqueFeatures: Array.from({ length: 20 }, (_, i) => `feature-${i}`)
          }
        }
      };

      const result = contextStackManager.extractGlobalContext(complexProject);
      
      expect(result?.complexityLevel).toBe('complex');
    });
  });

  describe('extractModuleContexts', () => {
    it('should extract module contexts from level 1 tasks', () => {
      const taskLevel2: TaskNode = {
        id: 'task-456-789',
        taskName: 'API Development',
        level: 1,
        contentSummary: 'Pengembangan REST API untuk sistem user management',
        entities: {
          actors: ['developer'],
          systems: ['Express.js', 'Node.js'],
          features: ['API endpoints', 'authentication']
        },
        subTasks: [],
        status: 'pending',
        dependencies: []
      };

      const projectWithMultipleTasks = {
        ...mockProjectDocument,
        taskTree: [mockTaskNode, taskLevel2]
      };

      const result = contextStackManager.extractModuleContexts(projectWithMultipleTasks);

      expect(result).toHaveLength(2);
      expect(result[0].moduleId).toBe('task-123-456');
      expect(result[0].moduleTitle).toBe('Implementasi Database Schema');
      expect(result[1].moduleId).toBe('task-456-789');
      expect(result[1].moduleTitle).toBe('API Development');
    });

    it('should return empty array for empty task tree', () => {
      const emptyProject = { ...mockProjectDocument, taskTree: [] };
      const result = contextStackManager.extractModuleContexts(emptyProject);

      expect(result).toHaveLength(0);
    });

    it('should only include level 1 tasks as modules', () => {
      const taskLevel2: TaskNode = {
        ...mockTaskNode,
        id: 'task-level-2',
        level: 2,
        taskName: 'Sub Task Level 2'
      };

      const projectWithMixedLevels = {
        ...mockProjectDocument,
        taskTree: [mockTaskNode, taskLevel2]
      };

      const result = contextStackManager.extractModuleContexts(projectWithMixedLevels);

      expect(result).toHaveLength(1);
      expect(result[0].moduleId).toBe('task-123-456');
    });
  });

  describe('getStepContext', () => {
    it('should generate step context from task node', () => {
      const result = contextStackManager.getStepContext(mockTaskNode);

      expect(result.taskId).toBe('task-123-456');
      expect(result.stepSummary).toBe(mockTaskNode.contentSummary);
      expect(result.relevantEntities).toEqual(mockTaskNode.entities);
    });
  });

  describe('findRelevantModuleContext', () => {
    let moduleContexts: ModuleContext[];

    beforeEach(() => {
      moduleContexts = [
        {
          moduleId: 'task-123-456',
          moduleTitle: 'Database Module',
          summary: 'Database implementation module',
          relatedEntities: mockTaskNode.entities
        },
        {
          moduleId: 'task-789-012',
          moduleTitle: 'API Module',
          summary: 'API development module',
          relatedEntities: {
            actors: ['developer'],
            systems: ['Express.js'],
            features: ['API endpoints']
          }
        }
      ];
    });

    it('should find relevant module for level 1 task', () => {
      const result = contextStackManager.findRelevantModuleContext(mockTaskNode, moduleContexts);

      expect(result).not.toBeNull();
      expect(result?.moduleId).toBe('task-123-456');
      expect(result?.moduleTitle).toBe('Database Module');
    });

    it('should return first module for level > 1 task', () => {
      const level2Task = { ...mockTaskNode, level: 2, id: 'different-id' };
      const result = contextStackManager.findRelevantModuleContext(level2Task, moduleContexts);

      expect(result).not.toBeNull();
      expect(result?.moduleId).toBe('task-123-456');
    });

    it('should return null for empty module contexts', () => {
      const result = contextStackManager.findRelevantModuleContext(mockTaskNode, []);

      expect(result).toBeNull();
    });

    it('should fallback to first module when no exact match found for level 1 task', () => {
      const unmatchedTask = { ...mockTaskNode, id: 'unmatched-id', level: 1 };
      const result = contextStackManager.findRelevantModuleContext(unmatchedTask, moduleContexts);

      expect(result).not.toBeNull(); // Should fallback to first module
      expect(result?.moduleId).toBe('task-123-456');
    });
  });
});
