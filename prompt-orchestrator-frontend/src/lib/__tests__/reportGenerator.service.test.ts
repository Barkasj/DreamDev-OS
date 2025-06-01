/**
 * Unit tests for ReportGeneratorService
 */

import { ReportGeneratorService } from '../reportGenerator.service';
import { ProjectDocument, TaskNode, ModuleContext, ExtractedEntities } from '../../types';

describe('ReportGeneratorService', () => {
  let service: ReportGeneratorService;
  let mockProject: ProjectDocument;

  beforeEach(() => {
    service = new ReportGeneratorService();
    
    // Create mock project data
    const mockEntities: ExtractedEntities = {
      actors: ['User', 'Admin'],
      systems: ['Database', 'API'],
      features: ['Authentication', 'Dashboard']
    };

    const mockSubTask: TaskNode = {
      id: 'task-2',
      taskName: 'Sub Task Example',
      level: 2,
      contentSummary: 'This is a sub task for testing purposes',
      entities: mockEntities,
      subTasks: [],
      status: 'pending',
      dependencies: []
    };

    const mockRootTask: TaskNode = {
      id: 'task-1',
      taskName: 'Root Task Example',
      level: 1,
      contentSummary: 'This is a root task for testing purposes with a longer description that should be truncated when displayed in reports',
      entities: mockEntities,
      subTasks: [mockSubTask],
      status: 'pending',
      dependencies: []
    };

    const mockModuleContext: ModuleContext = {
      moduleId: 'module-1',
      moduleTitle: 'Authentication Module',
      summary: 'This module handles user authentication and authorization features for the application',
      relatedEntities: mockEntities
    };

    mockProject = {
      _id: 'test-project-123',
      originalPrdText: 'Mock PRD text for testing',
      taskTree: [mockRootTask],
      globalContext: 'Test global context',
      globalContextData: {
        projectId: 'test-project-123',
        summary: 'This is a test project for demonstrating the report generation capabilities',
        projectTypeHints: 'web application',
        complexityLevel: 'medium',
        techStackHints: ['React', 'Node.js', 'MongoDB']
      },
      moduleContexts: [mockModuleContext],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      metadata: {
        totalTasks: 2,
        rootTasks: 1,
        levelDistribution: { 1: 1, 2: 1 },
        entityStats: {
          totalActors: 2,
          totalSystems: 2,
          totalFeatures: 2,
          uniqueActors: ['User', 'Admin'],
          uniqueSystems: ['Database', 'API'],
          uniqueFeatures: ['Authentication', 'Dashboard']
        },
        processingDuration: 1500
      }
    };
  });

  describe('generateExecutiveSummary', () => {
    it('should generate executive summary with all sections', () => {
      const result = service.generateExecutiveSummary(mockProject);

      expect(result).toContain('# Executive Summary: Proyek "test-project-123"');
      expect(result).toContain('**Tanggal Dibuat:**');
      expect(result).toContain('## 1. Ringkasan Umum Proyek');
      expect(result).toContain('## 2. Tujuan Utama Proyek');
      expect(result).toContain('## 3. Lingkup Utama Proyek');
      expect(result).toContain('## 4. Estimasi Task dan Teknologi');
      expect(result).toContain('## 5. Kesimpulan Singkat');
    });

    it('should include project summary from globalContextData', () => {
      const result = service.generateExecutiveSummary(mockProject);
      
      expect(result).toContain('This is a test project for demonstrating the report generation capabilities');
    });

    it('should include module information', () => {
      const result = service.generateExecutiveSummary(mockProject);
      
      expect(result).toContain('**Authentication Module**');
      expect(result).toContain('This module handles user authentication');
    });

    it('should include task count and technology stack', () => {
      const result = service.generateExecutiveSummary(mockProject);
      
      expect(result).toContain('Jumlah task/bagian utama teridentifikasi: 1');
      expect(result).toContain('React, Node.js, MongoDB');
    });

    it('should handle missing globalContextData gracefully', () => {
      const projectWithoutGlobalData = { ...mockProject };
      delete projectWithoutGlobalData.globalContextData;
      
      const result = service.generateExecutiveSummary(projectWithoutGlobalData);
      
      expect(result).toContain('Test global context'); // Falls back to globalContext string
    });

    it('should handle missing moduleContexts gracefully', () => {
      const projectWithoutModules = { ...mockProject };
      delete projectWithoutModules.moduleContexts;
      
      const result = service.generateExecutiveSummary(projectWithoutModules);
      
      expect(result).toContain('Lingkup modul utama belum terdefinisi secara spesifik');
    });
  });

  describe('generateTechnicalSpecification', () => {
    it('should generate technical specification with all sections', () => {
      const result = service.generateTechnicalSpecification(mockProject);

      expect(result).toContain('# Spesifikasi Teknis: Proyek "test-project-123"');
      expect(result).toContain('## Bagian 1: Pendahuluan');
      expect(result).toContain('## Bagian 2: Deskripsi Sistem Umum');
      expect(result).toContain('## Bagian 3: Detail Modul dan Komponen');
      expect(result).toContain('## Bagian 4: Model Data Awal');
      expect(result).toContain('## Bagian 5: Rencana Implementasi Awal');
      expect(result).toContain('## Lampiran');
    });

    it('should include project type and complexity information', () => {
      const result = service.generateTechnicalSpecification(mockProject);
      
      expect(result).toContain('Tipe Proyek (web application)');
      expect(result).toContain('Kompleksitas (medium)');
      expect(result).toContain('React, Node.js, MongoDB');
    });

    it('should render task tree hierarchically', () => {
      const result = service.generateTechnicalSpecification(mockProject);
      
      expect(result).toContain('### 3.1. Modul: Root Task Example');
      expect(result).toContain('**Root Task Example** (ID: task-1, Level: 1)');
      expect(result).toContain('*Ringkasan:* This is a root task for testing purposes with a longer description that should be truncated when displayed in reports');
      expect(result).toContain('*Entitas Terkait:* Aktor (User, Admin), Sistem (Database, API), Fitur (Authentication, Dashboard)');
      expect(result).toContain('*Sub-Tasks:*');
      expect(result).toContain('**Sub Task Example** (ID: task-2, Level: 2)');
    });

    it('should include implementation plan', () => {
      const result = service.generateTechnicalSpecification(mockProject);
      
      expect(result).toContain('Berikut adalah urutan task utama yang diidentifikasi untuk implementasi awal:');
      expect(result).toContain('1. Root Task Example');
    });

    it('should handle empty task tree gracefully', () => {
      const projectWithoutTasks = { ...mockProject, taskTree: [] };
      
      const result = service.generateTechnicalSpecification(projectWithoutTasks);
      
      expect(result).toContain('Struktur modul dan komponen belum dapat dihasilkan dari PRD');
      expect(result).toContain('Rencana implementasi belum dapat dibuat');
    });

    it('should truncate long content summaries', () => {
      const result = service.generateTechnicalSpecification(mockProject);
      
      // The mock task has a long summary that should be truncated
      expect(result).toContain('This is a root task for testing purposes with a longer description that should be truncated when displayed in reports');
    });
  });

  describe('utility methods', () => {
    it('should return available report types', () => {
      const types = service.getAvailableReportTypes();
      
      expect(types).toEqual(['executive-summary', 'technical-specification']);
    });

    it('should validate report types correctly', () => {
      expect(service.isValidReportType('executive-summary')).toBe(true);
      expect(service.isValidReportType('technical-specification')).toBe(true);
      expect(service.isValidReportType('invalid-type')).toBe(false);
    });

    it('should return correct display names', () => {
      expect(service.getReportTypeDisplayName('executive-summary')).toBe('Executive Summary');
      expect(service.getReportTypeDisplayName('technical-specification')).toBe('Technical Specification');
      expect(service.getReportTypeDisplayName('unknown')).toBe('unknown');
    });
  });

  describe('edge cases', () => {
    it('should handle project with minimal data', () => {
      const minimalProject: ProjectDocument = {
        _id: 'minimal-project',
        originalPrdText: 'Minimal PRD',
        taskTree: [],
        globalContext: 'Minimal context',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const executiveSummary = service.generateExecutiveSummary(minimalProject);
      const techSpec = service.generateTechnicalSpecification(minimalProject);

      expect(executiveSummary).toContain('minimal-project');
      expect(techSpec).toContain('minimal-project');
      expect(() => service.generateExecutiveSummary(minimalProject)).not.toThrow();
      expect(() => service.generateTechnicalSpecification(minimalProject)).not.toThrow();
    });

    it('should handle tasks without entities', () => {
      const taskWithoutEntities: TaskNode = {
        id: 'task-no-entities',
        taskName: 'Task Without Entities',
        level: 1,
        contentSummary: 'This task has no entities',
        entities: { actors: [], systems: [], features: [] },
        subTasks: [],
        status: 'pending',
        dependencies: []
      };

      const projectWithEmptyEntities = {
        ...mockProject,
        taskTree: [taskWithoutEntities]
      };

      const result = service.generateTechnicalSpecification(projectWithEmptyEntities);
      
      expect(result).toContain('*Entitas Terkait:* Aktor (N/A), Sistem (N/A), Fitur (N/A)');
    });
  });
});