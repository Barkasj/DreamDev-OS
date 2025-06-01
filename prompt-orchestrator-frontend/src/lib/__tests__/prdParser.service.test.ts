/**
 * Unit tests for PrdParserService
 * Tests all public methods and edge cases
 */

import { PrdParserService } from '../prdParser.service';
import { ParsedSection } from '@/types';

describe('PrdParserService', () => {
  let prdParser: PrdParserService;

  beforeEach(() => {
    prdParser = new PrdParserService();
  });

  describe('detectSections', () => {
    it('should return empty array for empty input', () => {
      const result = prdParser.detectSections('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const result = prdParser.detectSections(null as unknown as string);
      expect(result).toEqual([]);
    });

    it('should parse single section with markdown heading', () => {
      const prdText = '# Project Overview\nThis is a test project description.';
      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: 'Project Overview',
        level: 1,
        content: 'This is a test project description.'
      });
      expect(result[0].id).toBeDefined();
      expect(result[0].entities).toBeDefined();
    });

    it('should parse multiple sections with different heading levels', () => {
      const prdText = `# Main Section
Main content here.

## Subsection
Subsection content.

### Deep Section
Deep content.`;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Main Section');
      expect(result[0].level).toBe(1);
      expect(result[1].title).toBe('Subsection');
      expect(result[1].level).toBe(2);
      expect(result[2].title).toBe('Deep Section');
      expect(result[2].level).toBe(3);
    });

    it('should handle literal \\n characters in text', () => {
      const prdText = '# Section\\nWith literal newlines\\n## Another Section\\nMore content';
      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Section');
      expect(result[0].content).toBe('With literal newlines');
      expect(result[1].title).toBe('Another Section');
      expect(result[1].content).toBe('More content');
    });

    it('should handle content without headings', () => {
      const prdText = 'Just some content without headings\nMore content here';
      const result = prdParser.detectSections(prdText);

      expect(result).toEqual([]);
    });

    it('should handle mixed content and headings', () => {
      const prdText = `Some initial content
# First Section
Section content
More content
## Subsection
Sub content`;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('First Section');
      expect(result[0].content).toBe('Section content\nMore content');
      expect(result[1].title).toBe('Subsection');
      expect(result[1].content).toBe('Sub content');
    });

    it('should trim whitespace from content', () => {
      const prdText = `# Section
   
   Content with whitespace   
   
## Another
   More content   `;

      const result = prdParser.detectSections(prdText);

      expect(result[0].content).toBe('Content with whitespace');
      expect(result[1].content).toBe('More content');
    });
  });

  describe('extractEntities', () => {
    it('should return empty entities for empty content', () => {
      const result = prdParser.extractEntities('');
      expect(result).toEqual({
        actors: [],
        systems: [],
        features: []
      });
    });

    it('should extract actors from content', () => {
      const content = 'The user will interact with the admin and developer';
      const result = prdParser.extractEntities(content);

      expect(result.actors).toContain('user');
      expect(result.actors).toContain('admin');
      expect(result.actors).toContain('developer');
    });

    it('should extract systems from content', () => {
      const content = 'The system will use a database and API service';
      const result = prdParser.extractEntities(content);

      expect(result.systems).toContain('system');
      expect(result.systems).toContain('database');
      expect(result.systems).toContain('api');
      expect(result.systems).toContain('service');
    });

    it('should extract features from content', () => {
      const content = 'This feature includes a module and function component';
      const result = prdParser.extractEntities(content);

      expect(result.features).toContain('feature');
      expect(result.features).toContain('module');
      expect(result.features).toContain('function');
    });

    it('should handle case insensitive matching', () => {
      const content = 'The USER will access the SYSTEM through a FEATURE';
      const result = prdParser.extractEntities(content);

      expect(result.actors).toContain('user');
      expect(result.systems).toContain('system');
      expect(result.features).toContain('feature');
    });

    it('should remove duplicate entities', () => {
      const content = 'user user user system system feature feature';
      const result = prdParser.extractEntities(content);

      expect(result.actors).toEqual(['user']);
      expect(result.systems).toEqual(['system']);
      expect(result.features).toEqual(['feature']);
    });

    it('should handle Indonesian keywords', () => {
      const content = 'Pengguna akan menggunakan sistem dengan fitur dan fungsi';
      const result = prdParser.extractEntities(content);

      expect(result.actors).toContain('pengguna');
      expect(result.systems).toContain('sistem');
      expect(result.features).toContain('fitur');
      expect(result.features).toContain('fungsi');
    });
  });

  describe('buildTaskTree', () => {
    it('should return empty array for empty sections', () => {
      const result = prdParser.buildTaskTree([]);
      expect(result).toEqual([]);
    });

    it('should build flat task tree for same level sections', () => {
      const sections: ParsedSection[] = [
        {
          id: '1',
          title: 'Task 1',
          level: 1,
          content: 'Content 1',
          entities: { actors: [], systems: [], features: [] }
        },
        {
          id: '2',
          title: 'Task 2',
          level: 1,
          content: 'Content 2',
          entities: { actors: [], systems: [], features: [] }
        }
      ];

      const result = prdParser.buildTaskTree(sections);

      expect(result).toHaveLength(2);
      expect(result[0].taskName).toBe('Task 1');
      expect(result[0].subTasks).toHaveLength(0);
      expect(result[1].taskName).toBe('Task 2');
      expect(result[1].subTasks).toHaveLength(0);
    });

    it('should build hierarchical task tree', () => {
      const sections: ParsedSection[] = [
        {
          id: '1',
          title: 'Main Task',
          level: 1,
          content: 'Main content',
          entities: { actors: ['user'], systems: [], features: [] }
        },
        {
          id: '2',
          title: 'Sub Task',
          level: 2,
          content: 'Sub content',
          entities: { actors: [], systems: ['system'], features: [] }
        },
        {
          id: '3',
          title: 'Deep Task',
          level: 3,
          content: 'Deep content',
          entities: { actors: [], systems: [], features: ['feature'] }
        }
      ];

      const result = prdParser.buildTaskTree(sections);

      expect(result).toHaveLength(1);
      expect(result[0].taskName).toBe('Main Task');
      expect(result[0].subTasks).toHaveLength(1);
      expect(result[0].subTasks[0].taskName).toBe('Sub Task');
      expect(result[0].subTasks[0].subTasks).toHaveLength(1);
      expect(result[0].subTasks[0].subTasks[0].taskName).toBe('Deep Task');
    });

    it('should handle complex hierarchical structure', () => {
      const sections: ParsedSection[] = [
        { id: '1', title: 'Root 1', level: 1, content: 'Content 1', entities: { actors: [], systems: [], features: [] } },
        { id: '2', title: 'Child 1.1', level: 2, content: 'Content 2', entities: { actors: [], systems: [], features: [] } },
        { id: '3', title: 'Child 1.2', level: 2, content: 'Content 3', entities: { actors: [], systems: [], features: [] } },
        { id: '4', title: 'Root 2', level: 1, content: 'Content 4', entities: { actors: [], systems: [], features: [] } },
        { id: '5', title: 'Child 2.1', level: 2, content: 'Content 5', entities: { actors: [], systems: [], features: [] } }
      ];

      const result = prdParser.buildTaskTree(sections);

      expect(result).toHaveLength(2);
      expect(result[0].taskName).toBe('Root 1');
      expect(result[0].subTasks).toHaveLength(2);
      expect(result[1].taskName).toBe('Root 2');
      expect(result[1].subTasks).toHaveLength(1);
    });

    it('should set correct task properties', () => {
      const sections: ParsedSection[] = [
        {
          id: 'test-id',
          title: 'Test Task',
          level: 1,
          content: 'Test content',
          entities: { actors: ['user'], systems: ['system'], features: ['feature'] }
        }
      ];

      const result = prdParser.buildTaskTree(sections);
      const task = result[0];

      expect(task.id).toBe('test-id');
      expect(task.taskName).toBe('Test Task');
      expect(task.level).toBe(1);
      expect(task.contentSummary).toBe('Test content');
      expect(task.entities).toEqual({ actors: ['user'], systems: ['system'], features: ['feature'] });
      expect(task.status).toBe('pending');
      expect(task.dependencies).toEqual([]);
      expect(task.metadata).toBeDefined();
      expect(task.metadata?.priority).toBe('medium');
      expect(task.metadata?.riskLevel).toBe('low');
      expect(task.metadata?.createdAt).toBeInstanceOf(Date);
      expect(task.metadata?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('processPrd', () => {
    it('should process complete PRD and return all results', () => {
      const prdText = `# Project Overview
This is a web application project for users.

## Authentication Module
Users will login using the system.

### Login Feature
The login feature will authenticate users.`;

      const result = prdParser.processPrd(prdText);

      expect(result.sections).toHaveLength(3);
      expect(result.taskTree).toHaveLength(1);
      expect(result.totalTasks).toBe(3);
      expect(result.levelDistribution).toEqual({ 1: 1, 2: 1, 3: 1 });
      expect(result.entityStats.totalActors).toBeGreaterThan(0);
      expect(result.processingMetadata.startTime).toBeInstanceOf(Date);
      expect(result.processingMetadata.endTime).toBeInstanceOf(Date);
      expect(result.processingMetadata.processingDuration).toBeGreaterThanOrEqual(0);
      expect(result.processingMetadata.inputSize).toBe(prdText.length);
    });

    it('should handle empty PRD text', () => {
      const result = prdParser.processPrd('');

      expect(result.sections).toEqual([]);
      expect(result.taskTree).toEqual([]);
      expect(result.totalTasks).toBe(0);
      expect(result.levelDistribution).toEqual({});
      expect(result.entityStats.totalActors).toBe(0);
      expect(result.entityStats.totalSystems).toBe(0);
      expect(result.entityStats.totalFeatures).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const prdText = `# Main Task
Content with user and system.

## Sub Task 1
Content with admin and database.

## Sub Task 2
Content with developer and api.`;

      const result = prdParser.processPrd(prdText);

      expect(result.totalTasks).toBe(3);
      expect(result.levelDistribution).toEqual({ 1: 1, 2: 2 });
      expect(result.entityStats.uniqueActors).toContain('user');
      expect(result.entityStats.uniqueActors).toContain('admin');
      expect(result.entityStats.uniqueActors).toContain('developer');
      expect(result.entityStats.uniqueSystems).toContain('system');
      expect(result.entityStats.uniqueSystems).toContain('database');
      expect(result.entityStats.uniqueSystems).toContain('api');
    });
  });

  describe('private methods integration', () => {
    it('should count total tasks correctly in nested structure', () => {
      const prdText = `# Root 1
Content

## Child 1.1
Content

### Grandchild 1.1.1
Content

## Child 1.2
Content

# Root 2
Content`;

      const result = prdParser.processPrd(prdText);

      expect(result.totalTasks).toBe(5);
      expect(result.levelDistribution).toEqual({ 1: 2, 2: 2, 3: 1 });
    });

    it('should calculate entity statistics across all tasks', () => {
      const prdText = `# Task 1
User will use the system.

## Task 1.1
Admin will manage the database.

# Task 2
Developer will create feature.`;

      const result = prdParser.processPrd(prdText);

      expect(result.entityStats.totalActors).toBe(3);
      expect(result.entityStats.totalSystems).toBe(2);
      expect(result.entityStats.totalFeatures).toBe(1);
      expect(result.entityStats.uniqueActors).toEqual(['user', 'admin', 'developer']);
      expect(result.entityStats.uniqueSystems).toEqual(['system', 'database']);
      expect(result.entityStats.uniqueFeatures).toEqual(['feature']);
    });

    it('should handle duplicate entities across tasks', () => {
      const prdText = `# Task 1
User will use the system.

# Task 2
User will access the system again.`;

      const result = prdParser.processPrd(prdText);

      expect(result.entityStats.totalActors).toBe(1);
      expect(result.entityStats.totalSystems).toBe(1);
      expect(result.entityStats.uniqueActors).toEqual(['user']);
      expect(result.entityStats.uniqueSystems).toEqual(['system']);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed markdown headings', () => {
      const prdText = `#No space after hash
# Proper heading
##No space here either
## Another proper heading`;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Proper heading');
      expect(result[1].title).toBe('Another proper heading');
    });

    it('should handle very deep nesting levels', () => {
      const prdText = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(6);
      expect(result[0].level).toBe(1);
      expect(result[5].level).toBe(6);
    });

    it('should handle empty sections', () => {
      const prdText = `# Section 1

# Section 2

# Section 3
Some content`;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('');
      expect(result[1].content).toBe('');
      expect(result[2].content).toBe('Some content');
    });

    it('should handle sections with only whitespace', () => {
      const prdText = `# Section 1
   
   
# Section 2
   Content   `;

      const result = prdParser.detectSections(prdText);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('');
      expect(result[1].content).toBe('Content');
    });
  });
});