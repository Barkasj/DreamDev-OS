/**
 * Integration Tests - End-to-End Workflow Testing
 * Testing complete user workflows from PRD upload to prompt generation
 */

import { PrdParserService } from '../../lib/prdParser.service';
import { PromptComposerService } from '../../lib/promptComposer.service';
import { ContextStackManagerService } from '../../lib/contextStackManager.service';
import { ProjectDocument, TaskNode } from '../../types';

describe('Integration Tests - Complete Workflow', () => {
  let prdParser: PrdParserService;
  let promptComposer: PromptComposerService;
  let contextManager: ContextStackManagerService;

  beforeEach(() => {
    prdParser = new PrdParserService();
    promptComposer = new PromptComposerService();
    contextManager = new ContextStackManagerService();
  });

  describe('PRD to Task Tree to Prompt Generation', () => {
    const samplePRD = `
# E-Commerce Platform Development

## Overview
Build a modern e-commerce platform with user authentication, product catalog, and payment processing.

## User Management
### User Registration
Users can register with email and password. The system should validate email format and password strength.

### User Authentication
Implement secure login with JWT tokens. Support password reset functionality.

## Product Management
### Product Catalog
Display products with images, descriptions, and pricing. Support product categories and search functionality.

### Inventory Management
Track product stock levels and update availability in real-time.

## Payment Processing
### Shopping Cart
Users can add/remove products and view cart totals.

### Checkout Process
Secure payment processing with multiple payment methods.
`;

    it('should process complete workflow from PRD to prompt generation', async () => {
      // Step 1: Parse PRD
      const prdResult = prdParser.processPrd(samplePRD);
      
      expect(prdResult.sections.length).toBeGreaterThan(8); // Multiple sections based on headers
      expect(prdResult.taskTree.length).toBeGreaterThan(0); // Main sections
      expect(prdResult.totalTasks).toBeGreaterThan(0);

      // Verify task tree structure - find any task with subtasks
      const tasksWithSubtasks = prdResult.taskTree.filter(task => task.subTasks && task.subTasks.length > 0);
      expect(tasksWithSubtasks.length).toBeGreaterThan(0);

      // Step 2: Create mock project document
      const projectDocument: ProjectDocument = {
        _id: 'test-project-id',
        originalPrdText: samplePRD,
        taskTree: prdResult.taskTree,
        globalContext: 'Building an e-commerce platform with modern web technologies',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          totalTasks: prdResult.totalTasks,
          rootTasks: prdResult.taskTree.length,
          levelDistribution: prdResult.levelDistribution,
          entityStats: prdResult.entityStats,
          processingDuration: prdResult.processingMetadata.processingDuration
        }
      };

      // Step 3: Extract enhanced context
      const globalContext = contextManager.extractGlobalContext(projectDocument);
      expect(globalContext).toBeDefined();
      expect(globalContext?.projectId).toBe('test-project-id');

      const moduleContexts = contextManager.extractModuleContexts(projectDocument);
      expect(moduleContexts.length).toBeGreaterThan(0); // Main modules

      // Step 4: Generate prompt for a specific task
      const firstTaskWithSubtasks = tasksWithSubtasks[0];
      const firstSubtask = firstTaskWithSubtasks?.subTasks[0];
      expect(firstSubtask).toBeDefined();

      if (firstSubtask) {
        const promptResult = promptComposer.composePromptWithMetadataFromProject(
          firstSubtask,
          projectDocument
        );

        // Verify prompt structure
        expect(promptResult.promptText).toContain('## Step');
        expect(promptResult.promptText).toContain('### 🎯 Objective');
        expect(promptResult.promptText).toContain('### 🧠 Context Stack');
        expect(promptResult.promptText).toContain('### 🧩 Execution Prompt');
        expect(promptResult.promptText).toContain('### ✅ Success Criteria');
        expect(promptResult.promptText).toContain('### 🛠️ Debug Assistance');
        expect(promptResult.promptText).toContain('### 🔗 Next Steps');

        // Verify metadata
        expect(promptResult.metadata.taskId).toBe(firstSubtask.id);
        expect(promptResult.metadata.taskName).toBe(firstSubtask.taskName);
        expect(promptResult.metadata.level).toBeGreaterThan(0);
        expect(promptResult.metadata.characterCount).toBeGreaterThan(0);
        expect(promptResult.metadata.lineCount).toBeGreaterThan(0);

        // Verify context inclusion
        expect(promptResult.promptText).toContain('Building an e-commerce platform');
      }
    });

    it('should handle complex nested task structures', async () => {
      const complexPRD = `
# Complex Software Architecture

## Backend Services
### Authentication Service
#### JWT Implementation
##### Token Generation
##### Token Validation
#### OAuth Integration
##### Google OAuth
##### Facebook OAuth

## Frontend Applications
### Web Application
#### React Components
#### State Management
### Mobile Application
#### React Native
#### Native Modules
`;

      const prdResult = prdParser.processPrd(complexPRD);
      
      // Should handle deep nesting correctly
      expect(prdResult.taskTree.length).toBeGreaterThan(0); // Should have main tasks
      
      // Find any task with nested structure
      const tasksWithNestedStructure = prdResult.taskTree.filter(task => 
        task.subTasks && task.subTasks.length > 0 && 
        task.subTasks.some(subtask => subtask.subTasks && subtask.subTasks.length > 0)
      );
      expect(tasksWithNestedStructure.length).toBeGreaterThan(0);

      // Test prompt generation for deeply nested task
      const firstNestedTask = tasksWithNestedStructure[0];
      const deepSubtask = firstNestedTask?.subTasks.find(task => task.subTasks && task.subTasks.length > 0);
      const tokenGenTask = deepSubtask?.subTasks[0];
      if (tokenGenTask) {
        const projectDocument: ProjectDocument = {
          _id: 'complex-project-id',
          originalPrdText: complexPRD,
          taskTree: prdResult.taskTree,
          globalContext: 'Building complex software architecture',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const promptResult = promptComposer.composePromptWithMetadataFromProject(
          tokenGenTask,
          projectDocument
        );

        expect(promptResult.promptText).toContain('Building complex software architecture');
        expect(promptResult.metadata.level).toBeGreaterThan(0); // Deep nesting level
      }
    });

    it('should extract and utilize entities correctly throughout workflow', async () => {
      const entityRichPRD = `
# API Development Project

## User Management System
The user management system handles user registration, authentication, and profile management.
Users can register using email and password. The system integrates with MongoDB database
for data persistence and uses JWT for authentication tokens.

## Product Catalog API
The product catalog API provides endpoints for managing products, categories, and inventory.
The system uses Redis for caching and Elasticsearch for search functionality.
Administrators can manage product information through the admin interface.
`;

      const prdResult = prdParser.processPrd(entityRichPRD);
      
      // Basic verification that PRD was processed
      expect(prdResult.taskTree.length).toBeGreaterThan(0);
      expect(prdResult.sections.length).toBeGreaterThan(0);

      // Test prompt generation with entity-rich content
      const firstTask = prdResult.taskTree[0];
      if (firstTask) {
        const projectDocument: ProjectDocument = {
          _id: 'entity-test-project',
          originalPrdText: entityRichPRD,
          taskTree: prdResult.taskTree,
          globalContext: 'API development with multiple systems',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const promptResult = promptComposer.composePromptWithMetadataFromProject(
          firstTask,
          projectDocument
        );

        // Verify prompt contains relevant context
        expect(promptResult.promptText).toContain('API development');
        expect(promptResult.metadata.detectedEntities).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty PRD gracefully', () => {
      const emptyPRD = '';
      const result = prdParser.processPrd(emptyPRD);
      
      expect(result.sections || []).toHaveLength(0);
      expect(result.taskTree || []).toHaveLength(0);
      expect(result.totalTasks || 0).toBe(0);
      expect(result.entityStats?.totalActors || 0).toBe(0);
    });

    it('should handle PRD with no headers', () => {
      const noHeadersPRD = `
This is just plain text without any markdown headers.
It should still be processed but won't create any tasks.
The system should handle this gracefully.
`;
      
      const result = prdParser.processPrd(noHeadersPRD);
      
      expect(result.sections).toHaveLength(0);
      expect(result.taskTree).toHaveLength(0);
      expect(result.totalTasks).toBe(0);
    });

    it('should handle very large PRD documents', () => {
      // Generate a large PRD
      let largePRD = '# Large Document\n\n';
      for (let i = 1; i <= 50; i++) {
        largePRD += `## Section ${i}\n`;
        largePRD += `This is section ${i} with some content. `.repeat(10) + '\n\n';
      }
      
      const startTime = Date.now();
      const result = prdParser.processPrd(largePRD);
      const endTime = Date.now();
      
      // Should process within reasonable time (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      
      // Should create correct structure
      expect(result.sections.length).toBeGreaterThanOrEqual(50);
      expect(result.taskTree.length).toBeGreaterThan(0); // Should have main sections
    });
  });

  describe('Performance and Scalability', () => {
    it('should process PRD efficiently', () => {
      const mediumPRD = `
# E-Commerce Platform

## User Management
### Registration
### Authentication
### Profile Management

## Product Management
### Catalog
### Inventory
### Categories
### Search

## Order Management
### Shopping Cart
### Checkout
### Payment Processing
### Order Tracking

## Admin Panel
### User Administration
### Product Administration
### Order Administration
### Analytics
`;

      const startTime = Date.now();
      const result = prdParser.processPrd(mediumPRD);
      const endTime = Date.now();

      // Should process quickly (less than 100ms for medium document)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify correct processing
      expect(result.sections.length).toBeGreaterThanOrEqual(16); // All headers
      expect(result.taskTree.length).toBeGreaterThan(0); // Main sections
      expect(result.totalTasks).toBeGreaterThan(0); // All tasks including subtasks
    });

    it('should generate prompts efficiently', () => {
      const prdResult = prdParser.processPrd(`
# Test Project
## Main Task
### Sub Task
Content for testing prompt generation performance.
`);

      const projectDocument: ProjectDocument = {
        _id: 'perf-test-project',
        originalPrdText: 'test',
        taskTree: prdResult.taskTree,
        globalContext: 'Performance testing',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = prdResult.taskTree[0].subTasks[0];
      
      const startTime = Date.now();
      const promptResult = promptComposer.composePromptWithMetadataFromProject(task, projectDocument);
      const endTime = Date.now();

      // Should generate prompt quickly (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      
      // Verify prompt quality
      expect(promptResult.promptText.length).toBeGreaterThan(100);
      expect(promptResult.metadata.characterCount).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across processing steps', () => {
      const testPRD = `
# Consistency Test
## Task A
Content for task A with user and system entities.
## Task B
Content for task B with different entities.
`;

      const prdResult = prdParser.processPrd(testPRD);
      
      // Verify task IDs are unique
      const allTaskIds = new Set<string>();
      const collectTaskIds = (tasks: TaskNode[]) => {
        tasks.forEach(task => {
          expect(allTaskIds.has(task.id)).toBe(false); // No duplicates
          allTaskIds.add(task.id);
          collectTaskIds(task.subTasks);
        });
      };
      
      collectTaskIds(prdResult.taskTree);
      expect(allTaskIds.size).toBe(prdResult.totalTasks);

      // Verify level consistency
      const verifyLevels = (tasks: TaskNode[], expectedLevel: number) => {
        tasks.forEach(task => {
          expect(task.level).toBe(expectedLevel);
          verifyLevels(task.subTasks, expectedLevel + 1);
        });
      };
      
      verifyLevels(prdResult.taskTree, 1);
    });

    it('should validate prompt generation metadata', () => {
      const prdResult = prdParser.processPrd(`
# Validation Test
## Test Task
Test content for validation.
`);

      const projectDocument: ProjectDocument = {
        _id: 'validation-project',
        originalPrdText: 'test',
        taskTree: prdResult.taskTree,
        globalContext: 'Validation testing',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = prdResult.taskTree[0];
      const promptResult = promptComposer.composePromptWithMetadataFromProject(task, projectDocument);

      // Validate metadata consistency
      expect(promptResult.metadata.taskId).toBe(task.id);
      expect(promptResult.metadata.taskName).toBe(task.taskName);
      expect(promptResult.metadata.level).toBe(task.level);
      expect(promptResult.metadata.characterCount).toBe(promptResult.promptText.length);
      expect(promptResult.metadata.lineCount).toBe(promptResult.promptText.split('\n').length);
      expect(promptResult.metadata.generatedAt).toBeInstanceOf(Date);
      expect(promptResult.metadata.detectedEntities).toEqual(task.entities);
    });
  });
});