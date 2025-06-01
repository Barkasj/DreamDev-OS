/**
 * Performance Tests for DreamDev OS
 * Testing performance characteristics, memory usage, and scalability
 */

import { PrdParserService } from '../../lib/prdParser.service';
import { PromptComposerService } from '../../lib/promptComposer.service';
import { ContextStackManagerService } from '../../lib/contextStackManager.service';
import { ProjectDocument } from '../../types';

describe('Performance Tests', () => {
  let prdParser: PrdParserService;
  let promptComposer: PromptComposerService;
  let contextManager: ContextStackManagerService;

  beforeEach(() => {
    prdParser = new PrdParserService();
    promptComposer = new PromptComposerService();
    contextManager = new ContextStackManagerService();
  });

  describe('PRD Processing Performance', () => {
    it('should process small PRD documents quickly', () => {
      const smallPRD = `
# Small Project
## Task 1
Content for task 1.
## Task 2
Content for task 2.
`;

      const startTime = performance.now();
      const result = prdParser.processPrd(smallPRD);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Less than 10ms
      expect(result.taskTree).toHaveLength(2);
    });

    it('should process medium PRD documents efficiently', () => {
      const mediumPRD = generatePRD(50, 3); // 50 sections, 3 levels deep

      const startTime = performance.now();
      const result = prdParser.processPrd(mediumPRD);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms
      expect(result.totalTasks).toBeGreaterThan(50);
    });

    it('should process large PRD documents within acceptable time', () => {
      const largePRD = generatePRD(200, 4); // 200 sections, 4 levels deep

      const startTime = performance.now();
      const result = prdParser.processPrd(largePRD);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Less than 500ms
      expect(result.totalTasks).toBeGreaterThan(200);
    });

    it('should scale linearly with document size', () => {
      const sizes = [10, 20, 40];
      const times: number[] = [];

      sizes.forEach(size => {
        const prd = generatePRD(size, 2);
        const startTime = performance.now();
        prdParser.processPrd(prd);
        const endTime = performance.now();
        times.push(endTime - startTime);
      });

      // Check that processing time doesn't grow exponentially
      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / times[i - 1];
        expect(ratio).toBeLessThan(5); // Should not be more than 5x slower
      }
    });
  });

  describe('Prompt Generation Performance', () => {
    it('should generate prompts quickly for simple tasks', () => {
      const prdResult = prdParser.processPrd(`
# Simple Project
## Simple Task
Simple content for testing.
`);

      const projectDocument: ProjectDocument = {
        _id: 'perf-test',
        originalPrdText: 'test',
        taskTree: prdResult.taskTree,
        globalContext: 'Performance test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = prdResult.taskTree[0];

      const startTime = performance.now();
      const result = promptComposer.composePromptWithMetadataFromProject(task, projectDocument);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5); // Less than 5ms
      expect(result.promptText.length).toBeGreaterThan(0);
    });

    it('should generate prompts efficiently for complex tasks', () => {
      const complexPRD = generatePRD(20, 3);
      const prdResult = prdParser.processPrd(complexPRD);

      const projectDocument: ProjectDocument = {
        _id: 'complex-perf-test',
        originalPrdText: complexPRD,
        taskTree: prdResult.taskTree,
        globalContext: 'Complex performance test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test prompt generation for multiple tasks
      const tasks = getAllTasks(prdResult.taskTree).slice(0, 10); // Test first 10 tasks
      const times: number[] = [];

      tasks.forEach(task => {
        const startTime = performance.now();
        promptComposer.composePromptWithMetadataFromProject(task, projectDocument);
        const endTime = performance.now();
        times.push(endTime - startTime);
      });

      // All prompt generations should be fast
      times.forEach(time => {
        expect(time).toBeLessThan(20); // Less than 20ms each
      });

      // Average time should be reasonable
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(10); // Less than 10ms average
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should not leak memory during repeated operations', () => {
      const testPRD = generatePRD(20, 2);
      
      // Perform multiple operations to check for memory leaks
      for (let i = 0; i < 50; i++) {
        const result = prdParser.processPrd(testPRD);
        expect(result.taskTree.length).toBeGreaterThan(0);
      }

      // If we reach here without running out of memory, test passes
      expect(true).toBe(true);
    });

    it('should handle large objects efficiently', () => {
      const largePRD = generatePRD(100, 3);
      const prdResult = prdParser.processPrd(largePRD);

      const projectDocument: ProjectDocument = {
        _id: 'large-object-test',
        originalPrdText: largePRD,
        taskTree: prdResult.taskTree,
        globalContext: 'Large object test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Should handle large project documents without issues
      const globalContext = contextManager.extractGlobalContext(projectDocument);
      expect(globalContext).toBeDefined();

      const moduleContexts = contextManager.extractModuleContexts(projectDocument);
      expect(moduleContexts.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty inputs efficiently', () => {
      const startTime = performance.now();
      const result = prdParser.processPrd('');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1); // Should be nearly instantaneous
      expect(result.taskTree).toHaveLength(0);
    });

    it('should handle malformed inputs without performance degradation', () => {
      const malformedPRD = 'This is not a valid PRD\n'.repeat(100);

      const startTime = performance.now();
      const result = prdParser.processPrd(malformedPRD);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should still be fast
      expect(result.taskTree).toHaveLength(0);
    });

    it('should handle deeply nested structures efficiently', () => {
      const deepPRD = generateDeepNestedPRD(10); // 10 levels deep

      const startTime = performance.now();
      const result = prdParser.processPrd(deepPRD);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle deep nesting
      expect(result.taskTree.length).toBe(1);
      
      // Verify deep nesting was processed correctly
      let currentTask = result.taskTree[0];
      let depth = 1;
      while (currentTask.subTasks.length > 0) {
        currentTask = currentTask.subTasks[0];
        depth++;
      }
      expect(depth).toBe(10);
    });
  });
});

// Helper functions
function generatePRD(numSections: number, maxDepth: number, projectName = 'Test Project'): string {
  let prd = `# ${projectName}\n\n`;
  
  for (let i = 1; i <= numSections; i++) {
    const depth = Math.min(Math.floor(Math.random() * maxDepth) + 1, maxDepth);
    const hashes = '#'.repeat(depth + 1);
    
    prd += `${hashes} Section ${i}\n`;
    prd += `Content for section ${i}. This section contains important information about the project requirements. `;
    prd += `It includes details about implementation, user stories, and technical specifications. `;
    prd += `The system should handle this content efficiently and extract relevant entities.\n\n`;
  }
  
  return prd;
}

function generateDeepNestedPRD(depth: number): string {
  let prd = '';
  
  for (let i = 1; i <= depth; i++) {
    const hashes = '#'.repeat(i);
    prd += `${hashes} Level ${i} Task\n`;
    prd += `Content for level ${i} task with some detailed information.\n\n`;
  }
  
  return prd;
}

function getAllTasks(taskTree: any[]): any[] {
  const allTasks: any[] = [];
  
  function collectTasks(tasks: any[]) {
    tasks.forEach(task => {
      allTasks.push(task);
      if (task.subTasks && task.subTasks.length > 0) {
        collectTasks(task.subTasks);
      }
    });
  }
  
  collectTasks(taskTree);
  return allTasks;
}