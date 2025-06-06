import { TextProcessorService } from '../textProcessor.service';
import type { ProjectDocument, TaskNode } from '$lib/types';

// Mock a minimal ProjectDocument
const mockProjectDocument = (override: Partial<ProjectDocument> = {}): ProjectDocument => ({
  _id: 'project-123',
  originalPrdText: 'This is the original PRD text.',
  globalContext: 'Global context for the project.',
  taskTree: [],
  metadata: {
    totalTasks: 0,
    entityStats: {
      uniqueActors: [],
      uniqueSystems: [],
      uniqueFeatures: [],
    }
  },
  ...override,
});

// Mock a minimal TaskNode
const mockTaskNode = (override: Partial<TaskNode> = {}): TaskNode => ({
  id: 'task-1',
  taskName: 'Sample Task',
  contentSummary: 'This is a summary for the task.',
  level: 1,
  entities: { actors: [], systems: [], features: [] },
  subTasks: [],
  ...override,
});


describe('TextProcessorService', () => {
  let service: TextProcessorService;

  beforeEach(() => {
    service = new TextProcessorService();
  });

  describe('extractProjectSummary', () => {
    it('should extract summary from introduction section', () => {
      const prdText = `
        Some preamble.
        # Introduction
        This is the main summary of the project.
        It spans multiple lines.
        ## Next Section
        More content.
      `;
      expect(service.extractProjectSummary(prdText)).toBe('This is the main summary of the project. It spans multiple lines.');
    });

    it('should extract summary from "Ringkasan" section', () => {
        const prdText = `
          ### Ringkasan Proyek
          Ini adalah ringkasan inti.
        `;
        expect(service.extractProjectSummary(prdText)).toBe('Ini adalah ringkasan inti.');
    });

    it('should handle empty prdText', () => {
        expect(service.extractProjectSummary('')).toBe('');
    });

    it('should fallback to first 500 chars if no section found', () => {
      const longText = 'This is a very long text without any specific summary section, it just goes on and on. '.repeat(30);
      expect(service.extractProjectSummary(longText)).toBe(longText.substring(0, 500) + '...');
    });

     it('should return the full text if less than 500 chars and no section', () => {
      const shortText = 'This is a short text.';
      expect(service.extractProjectSummary(shortText)).toBe(shortText);
    });
  });

  describe('detectProjectType', () => {
    it('should detect System/Platform for "sistem"', () => {
      expect(service.detectProjectType('Ini adalah proyek sistem informasi.')).toBe('System/Platform');
    });

    it('should detect Mobile Application for "aplikasi mobile"', () => {
      expect(service.detectProjectType('Sebuah aplikasi mobile baru.')).toBe('Mobile Application');
    });

    it('should detect Web Application for "website"', () => {
      expect(service.detectProjectType('Proyek pengembangan website perusahaan.')).toBe('Web Application');
    });

    it('should detect API/Backend Service for "microservice"', () => {
      expect(service.detectProjectType('Pengembangan microservice untuk otentikasi.')).toBe('API/Backend Service');
    });

    it('should fallback to Software Application for generic terms', () => {
      expect(service.detectProjectType('Aplikasi perangkat lunak umum.')).toBe('Software Application');
    });

     it('should be case-insensitive', () => {
      expect(service.detectProjectType('Proyek API dengan NodeJS.')).toBe('API/Backend Service');
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze as simple for few tasks and entities', () => {
      const project = mockProjectDocument({ metadata: { totalTasks: 3, entityStats: { uniqueSystems: ['s1'], uniqueFeatures: ['f1']}} });
      expect(service.analyzeComplexity(project)).toBe('simple');
    });

    it('should analyze as medium for moderate tasks and entities', () => {
      const project = mockProjectDocument({ metadata: { totalTasks: 12, entityStats: {uniqueSystems: ['s1', 's2', 's3', 's4', 's5'], uniqueFeatures: ['f1','f2','f3','f4','f5','f6','f7'] }} });
      expect(service.analyzeComplexity(project)).toBe('medium');
    });

    it('should analyze as complex for many tasks and entities', () => {
      const project = mockProjectDocument({ metadata: { totalTasks: 25, entityStats: { uniqueSystems: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'], uniqueFeatures: Array(16).fill('f') } } });
      expect(service.analyzeComplexity(project)).toBe('complex');
    });

    it('should handle missing metadata gracefully', () => {
        const project = mockProjectDocument({ metadata: undefined });
        expect(service.analyzeComplexity(project)).toBe('simple');
    });
  });

  describe('extractTechStack', () => {
    it('should extract tech stack from various project document fields', () => {
      const project = mockProjectDocument({
        originalPrdText: 'This project uses react and node.js for development. Also, tailwind is used.',
        globalContext: 'We plan to integrate MongoDB and Express for the backend.',
        taskTree: [
          mockTaskNode({ id: 't1', entities: { systems: ['Kafka', 'Redis', 'PostgreSQL'], actors:[], features:[] } }),
          mockTaskNode({ id: 't2', entities: { systems: ['AWS Lambda'], actors:[], features:[] } })
        ]
      });

      // Spy on flattenTaskTree as it's a public method of the same class but tested separately
      // and we want to isolate the logic of extractTechStack.
      // In this version, flattenTaskTree is part of TextProcessorService.
      jest.spyOn(service, 'flattenTaskTree').mockReturnValue([
        mockTaskNode({ id: 't1', entities: { systems: ['Kafka', 'Redis', 'PostgreSQL'], actors:[], features:[] } }),
        mockTaskNode({ id: 't2', entities: { systems: ['AWS Lambda'], actors:[], features:[] } })
      ]);

      const techStack = service.extractTechStack(project);

      expect(techStack).toContain('react');
      expect(techStack).toContain('node.js');
      expect(techStack).toContain('tailwind');
      expect(techStack).toContain('mongodb');
      expect(techStack).toContain('express');
      expect(techStack).toContain('kafka'); // Standardized to lowercase
      expect(techStack).toContain('redis'); // Standardized to lowercase
      expect(techStack).toContain('postgresql'); // Standardized to lowercase
      // AWS Lambda might not be in commonTech, and systems are added if > 2 chars.
      // If 'AWS Lambda' is added from entities.systems, it will be 'aws lambda'
      // expect(techStack).toContain('aws lambda'); // This can be sliced off, making test fragile

      // Check for a few high-priority ones and length
      expect(techStack.length).toBe(8);
      expect(techStack).toContain('react');
      expect(techStack).toContain('mongodb');
      const manuallyAddedFromTasks = ['kafka', 'redis', 'postgresql', 'aws lambda'];
      let foundFromTasks = 0;
      manuallyAddedFromTasks.forEach(mt => {
        if (techStack.includes(mt)) foundFromTasks++;
      });
      // At least some items from tasks should be present, depending on slice
      expect(foundFromTasks).toBeGreaterThanOrEqual(3); // 5 from commonTech + 3 from tasks = 8
    });

    it('should limit tech stack to 8 items', () => {
        // Use actual common technologies to ensure they are picked up
        const commonTechSubset = [
          'next.js', 'react', 'typescript', 'node.js', 'mongodb', 'express',
          'tailwind', 'prisma', 'postgresql' // 9 items
        ];
        const project = mockProjectDocument({
            globalContext: commonTechSubset.join(' ')
        });
        const techStack = service.extractTechStack(project);
        expect(techStack.length).toBe(8); // Should be sliced to 8
        // Verify some of the included items
        expect(techStack).toContain('react');
        expect(techStack).toContain('mongodb');
    });

    it('should handle empty or missing fields gracefully', () => {
        const project = mockProjectDocument({ originalPrdText: undefined, globalContext: undefined, taskTree: undefined });
        const techStack = service.extractTechStack(project);
        expect(techStack).toEqual([]);
    });
  });

  describe('generateModuleSummary', () => {
    it('should generate module summary and include sub-task count', () => {
      const taskNode = mockTaskNode({
        contentSummary: 'This module handles user authentication and profile management.',
        subTasks: [mockTaskNode({ id: 'sub1'}), mockTaskNode({id: 'sub2'})]
      });
      expect(service.generateModuleSummary(taskNode)).toBe('This module handles user authentication and profile management. (Mencakup 2 sub-task)');
    });

    it('should truncate summary if longer than 300 chars', () => {
      const longSummary = 'a'.repeat(350);
      const taskNode = mockTaskNode({ contentSummary: longSummary, subTasks: [] });
      expect(service.generateModuleSummary(taskNode)).toBe('a'.repeat(300) + '...');
    });

    it('should not add sub-task count if no sub-tasks', () => {
        const taskNode = mockTaskNode({ contentSummary: 'Simple module.' });
        expect(service.generateModuleSummary(taskNode)).toBe('Simple module.');
    });
  });

  describe('flattenTaskTree', () => {
    it('should flatten a nested task tree', () => {
      const tasks: TaskNode[] = [
        mockTaskNode({ id: '1', subTasks: [ mockTaskNode({ id: '1.1', subTasks: [mockTaskNode({id: '1.1.1'})] }) ] }),
        mockTaskNode({ id: '2' }),
      ];
      const flatTasks = service.flattenTaskTree(tasks);
      expect(flatTasks.length).toBe(4);
      expect(flatTasks.map(t => t.id)).toEqual(['1', '1.1', '1.1.1', '2']);
    });

    it('should return empty array for null or empty input', () => {
        expect(service.flattenTaskTree([])).toEqual([]);
        expect(service.flattenTaskTree(null as any)).toEqual([]);
    });
  });

  describe('extractRelevantKeywords', () => {
    it('should extract technical and context-specific keywords', () => {
      const text = 'This project is about system architecture and API design. We need to implement security features for the new platform.';
      const keywords = service.extractRelevantKeywords(text, 'global');
      expect(keywords).toContain('system');
      expect(keywords).toContain('architecture');
      expect(keywords).toContain('api');
      expect(keywords).toContain('security');
      expect(keywords).toContain('features');
      expect(keywords).toContain('platform'); // Context: global
      // Check for domain keywords (capitalized)
      // With the updated extractDomainKeywords, "API" might be added if not already from techKeywords
    });

     it('should extract module-specific keywords', () => {
      const text = 'This task involves data processing and validation logic for the user workflow.';
      const keywords = service.extractRelevantKeywords(text, 'module');
      expect(keywords).toContain('task');
      expect(keywords).toContain('processing');
      expect(keywords).toContain('validation');
      expect(keywords).toContain('logic');
      expect(keywords).toContain('workflow');
    });

    it('should include domain keywords', () => {
        const text = 'The main component is the UserManagement module which uses OAuth2 for authentication.';
        // Mock extractDomainKeywords to control its output for this test
        jest.spyOn(service, 'extractDomainKeywords').mockReturnValue(['UserManagement', 'OAuth2']);
        const keywords = service.extractRelevantKeywords(text, 'module');
        expect(keywords).toContain('UserManagement');
        expect(keywords).toContain('OAuth2');
        expect(keywords).toContain('module');
        expect(keywords).toContain('authentication');
    });

    it('should ensure uniqueness and limit to 15 keywords', () => {
        const text = Array(20).fill(null).map((_, i) => `keyword${i} Keyword${i}`).join(' ') + ' system api';
        // Make extractDomainKeywords return some overlapping and some new
        jest.spyOn(service, 'extractDomainKeywords').mockReturnValue(['Keyword1', 'Keyword19', 'DomainSpecific']);
        const keywords = service.extractRelevantKeywords(text, 'global');
        expect(keywords.length).toBeLessThanOrEqual(15);
        expect(new Set(keywords).size).toBe(keywords.length); // Check uniqueness
        expect(keywords).toContain('system');
        expect(keywords).toContain('api');
        expect(keywords).toContain('Keyword1');
        expect(keywords).toContain('DomainSpecific');
    });
  });

  describe('extractDomainKeywords', () => {
    it('should extract capitalized and quoted terms', () => {
        const text = 'This module handles UserManagement and complex OrderProcessing. It also mentions "Product Catalog" and "PaymentGateway".';
        const keywords = service.extractDomainKeywords(text);
        expect(keywords).toContain('UserManagement');
        expect(keywords).toContain('OrderProcessing');
        expect(keywords).toContain('Product Catalog');
        expect(keywords).toContain('PaymentGateway');
    });

    it('should filter out common capitalized words like "The", "This"', () => {
        const text = 'The main goal is This Project about That System and also "Important Note".';
        const keywords = service.extractDomainKeywords(text);
        expect(keywords).not.toContain('The');
        expect(keywords).not.toContain('This');
        expect(keywords).not.toContain('That');
        expect(keywords).toContain('Project'); // Assuming "This Project" gets "Project"
        expect(keywords).toContain('System');  // Assuming "That System" gets "System"
        expect(keywords).toContain('Important Note');
    });

    it('should limit to 10 keywords', () => {
        const text = Array(15).fill(null).map((_, i) => `MyDomainTerm${i} "QuotedTerm${i}"`).join(' ');
        const keywords = service.extractDomainKeywords(text);
        expect(keywords.length).toBeLessThanOrEqual(10);
    });
  });

  describe('generateModuleDetailedContent', () => {
    it('should generate detailed content string for a module task node', () => {
      const taskNode = mockTaskNode({
        taskName: 'User Authentication Module',
        contentSummary: 'Handles all aspects of user login, registration, and session management.',
        entities: {
          actors: ['RegisteredUser', 'GuestUser'],
          systems: ['AuthService', 'Database'],
          features: ['EmailLogin', 'GoogleSSO', 'PasswordReset']
        },
        subTasks: [
          mockTaskNode({ id: 'sub1', taskName: 'Implement JWT Strategy', contentSummary: 'Use JSON Web Tokens for session handling.' }),
          mockTaskNode({ id: 'sub2', taskName: 'Design Password Reset Flow', contentSummary: 'Allow users to reset forgotten passwords securely.' })
        ]
      });
      const content = service.generateModuleDetailedContent(taskNode);
      expect(content).toContain('Module: User Authentication Module');
      expect(content).toContain('Summary: Handles all aspects of user login, registration, and session management.');
      expect(content).toContain('Actors: RegisteredUser, GuestUser');
      expect(content).toContain('Systems: AuthService, Database');
      expect(content).toContain('Features: EmailLogin, GoogleSSO, PasswordReset');
      expect(content).toContain('Sub-tasks (2):');
      expect(content).toContain('1. Implement JWT Strategy: Use JSON Web Tokens for session handling.');
      expect(content).toContain('2. Design Password Reset Flow: Allow users to reset forgotten passwords securely.');
    });

    it('should handle nodes with missing optional fields', () => {
        const taskNode = mockTaskNode({
            taskName: 'Basic Module',
            contentSummary: 'Only summary.',
            entities: undefined, // no entities
            subTasks: [] // no subtasks
        });
        const content = service.generateModuleDetailedContent(taskNode);
        expect(content).toBe('Module: Basic Module\nSummary: Only summary.');
    });
  });
});
