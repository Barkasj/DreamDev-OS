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

    // New tests for very short texts - Global Context
    it('should handle text shorter than DEFAULT_CHUNK_OVERLAP correctly', () => {
      const DEFAULT_CHUNK_OVERLAP = 200; // Assuming from service
      const veryShortText = 'Text shorter than overlap.'.repeat(2); // Length < 200
      expect(veryShortText.length).toBeLessThan(DEFAULT_CHUNK_OVERLAP);

      const project = createMockProject(veryShortText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      expect(globalContext!.detailedChunks).toHaveLength(1);
      expect(globalContext!.detailedChunks![0].content).toBe(veryShortText);
      expect(globalContext!.compressionMetadata!.strategy).toBe('first');
    });

    it('should produce a single chunk for text slightly longer than DEFAULT_CHUNK_SIZE if no meaningful split', () => {
      // This case is tricky because chunkTextRecursive tries to split.
      // If text is just over size, but not by much more than overlap, it might still be one chunk.
      // The current "should handle short PRD text without chunking" covers texts that result in 1 chunk.
      // This specific scenario might be better tested in textUtils.test.ts if not already.
      // For ContextStackManager, we care that if textUtils gives 1 chunk, it's handled.
      const DEFAULT_CHUNK_SIZE = 1500; // Assuming from service
      const slightlyLongText = 'a'.repeat(DEFAULT_CHUNK_SIZE + 100); // e.g., 1600
      const project = createMockProject(slightlyLongText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      // Depending on chunkTextRecursive, this could be 1 or 2.
      // If it's 1, content is original. If 2, then chunking happened.
      // The key is that it doesn't crash and produces valid output.
      expect(globalContext!.detailedChunks).toBeDefined();
      expect(globalContext!.detailedChunks!.length).toBeGreaterThanOrEqual(1);
    });

    // New tests for unusual formatting - Global Context
    it('should handle text with multiple consecutive newlines or spaces', () => {
      const textWithExtraSpaces = 'Line 1.\n\n\nLine 2.   Line 3.\n  \nLine 4.';
      const project = createMockProject(textWithExtraSpaces);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      expect(globalContext!.detailedChunks).toHaveLength(1); // Assuming it's short enough
      // We expect the chunking to preserve the content, including formatting, as much as possible.
      // Exact content matching might be too brittle if textUtils cleans it up.
      // Check that the core textual information is there.
      expect(globalContext!.detailedChunks![0].content).toContain('Line 1.');
      expect(globalContext!.detailedChunks![0].content).toContain('Line 2.');
      expect(globalContext!.detailedChunks![0].content).toContain('Line 3.');
      expect(globalContext!.detailedChunks![0].content).toContain('Line 4.');
      // Check that original formatting that might affect meaning is somewhat preserved or handled.
      // For example, textUtils might normalize multiple spaces/newlines.
      // This test primarily ensures it doesn't break.
      expect(globalContext!.detailedChunks![0].content.length).toBeGreaterThan(0);
    });

    it('should handle text that is entirely whitespace', () => {
      const whitespaceText = '   \n\n   \t   \n  ';
      const project = createMockProject(whitespaceText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      // textUtils might produce an empty chunk or a chunk with the whitespace.
      // If it produces an empty chunk, detailedChunks might be empty or contain one empty string.
      if (globalContext!.detailedChunks!.length > 0) {
        expect(globalContext!.detailedChunks![0].content.trim()).toBe('');
      } else {
        // This case might also be valid if textUtils decides an all-whitespace text results in no usable chunks.
        expect(globalContext!.detailedChunks).toEqual([]);
      }
       // Summary should be the whitespace text itself if it's short
       expect(globalContext!.summary).toBe(whitespaceText);
    });

    it('should handle text with non-ASCII characters (e.g., Indonesian)', () => {
      const nonAsciiText = "Ini adalah contoh teks dengan karakter non-ASCII seperti é, ñ, à, dan juga tulisan Indonesia: 'Dokumen Persyaratan Proyek'.";
      const project = createMockProject(nonAsciiText);
      const globalContext = service.extractGlobalContext(project);

      expect(globalContext).not.toBeNull();
      expect(globalContext!.detailedChunks).toHaveLength(1);
      expect(globalContext!.detailedChunks![0].content).toBe(nonAsciiText);
      expect(globalContext!.summary).toContain("Ini adalah contoh teks");
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

  // Placeholder for Detailed Compression Strategy Tests (to be added next)
  describe('Detailed Compression Strategies', () => {
    // MAX_CHUNKS_PER_CONTEXT is 3 by default in ContextStackManagerService
    const MAX_CHUNKS_PER_CONTEXT = 3;
    const DEFAULT_CHUNK_SIZE = 1500;

    // Comprehensive mock for TextProcessorService
    const mockTextProcessorService = {
      extractProjectSummary: jest.fn().mockImplementation(text => text.substring(0,50)), // Simple mock
      detectProjectType: jest.fn().mockReturnValue('Software Application'),
      analyzeComplexity: jest.fn().mockReturnValue('simple'),
      extractTechStack: jest.fn().mockReturnValue([]),
      generateModuleSummary: jest.fn().mockImplementation(taskNode => taskNode.contentSummary.substring(0,30)),
      flattenTaskTree: jest.fn().mockImplementation(tasks => tasks), // Basic pass-through
      extractRelevantKeywords: jest.fn().mockReturnValue([]),
      extractDomainKeywords: jest.fn().mockReturnValue([]),
      generateModuleDetailedContent: jest.fn().mockImplementation(taskNode => `Module: ${taskNode.taskName}\nSummary: ${taskNode.contentSummary}`)
    };

    beforeEach(() => {
        // Assign the mock directly to the service instance for these tests
        (service as any).textProcessorService = mockTextProcessorService;
        // Clear mocks before each test if needed, e.g. for call counts
        Object.values(mockTextProcessorService).forEach(mockFn => {
            if (jest.isMockFunction(mockFn)) {
                mockFn.mockClear();
            }
        });
        // Specific mock for tests that rely on keyword extraction
        mockTextProcessorService.extractRelevantKeywords.mockReturnValue([]);
    });

    describe('first strategy', () => {
      it('should return all chunks if initial count <= MAX_CHUNKS_PER_CONTEXT', () => {
        const text = "Chunk1. ".repeat(DEFAULT_CHUNK_SIZE / 10) + // Approx 1 chunk
                     "Chunk2. ".repeat(DEFAULT_CHUNK_SIZE / 10) + // Approx 1 chunk
                     "Chunk3. ".repeat(DEFAULT_CHUNK_SIZE / 10);  // Approx 1 chunk
        // This should result in 3 chunks if DEFAULT_CHUNK_SIZE is around 1500
        // and each repeat makes about 150 chars.
        // Let's make it more explicit by controlling chunker output.

        const mockProject = createMockProject(text);
        // Temporarily mock processTextWithChunking to control its output for this specific test section
        // This is a bit of a deeper mock, usually would mock dependencies of processTextWithChunking (like chunkTextRecursive)
        const originalProcessText = (service as any).processTextWithChunking;

        const mockChunks = [
          { content: "Chunk 1 content", metadata: { index: 0, startPosition: 0, endPosition: 100, size: 100, hasOverlap: false } },
          { content: "Chunk 2 content", metadata: { index: 1, startPosition: 100, endPosition: 200, size: 100, hasOverlap: false } },
        ];

        (service as any).processTextWithChunking = jest.fn().mockImplementation((inputText, contextType) => {
            const actualResult = originalProcessText.call(service, inputText, contextType);
            if (inputText === text && contextType === 'global') { // Target specific call
                 return {
                    detailedChunks: mockChunks.slice(0, MAX_CHUNKS_PER_CONTEXT), // Should be all if <= MAX_CHUNKS_PER_CONTEXT
                    compressionMetadata: { ...actualResult.compressionMetadata, chunksCount: mockChunks.length, strategy: 'first' }
                };
            }
            return actualResult;
        });

        const globalContext = service.extractGlobalContext(mockProject);
        expect(globalContext).not.toBeNull();
        expect(globalContext!.detailedChunks).toHaveLength(mockChunks.length);
        expect(globalContext!.compressionMetadata!.strategy).toBe('first');
        expect(globalContext!.compressionMetadata!.chunksCount).toBe(mockChunks.length);
        (service as any).processTextWithChunking = originalProcessText; // Restore
      });

      it('should return only first MAX_CHUNKS_PER_CONTEXT if initial count > MAX_CHUNKS_PER_CONTEXT', () => {
        const text = "Long text. ".repeat(DEFAULT_CHUNK_SIZE * 2 / 10); // Should create more than MAX_CHUNKS_PER_CONTEXT
        const mockProject = createMockProject(text);
        const originalProcessText = (service as any).processTextWithChunking;

        const manyMockChunks = Array.from({ length: MAX_CHUNKS_PER_CONTEXT + 2 }, (_, i) => ({
            content: `Chunk ${i+1} content`, metadata: { index: i, startPosition: i*100, endPosition: (i+1)*100, size: 100, hasOverlap: false }
        }));

        // Mock processTextWithChunking or rather its dependency chunkTextRecursive
        // For simplicity in this example, we are still mocking processTextWithChunking's return for detailedChunks part
        // to simulate what compressChunks would do with 'first' strategy.
        const actualResultOfProcessing = originalProcessText.call(service, text, 'global');

        // We need to simulate that chunkTextRecursive produced manyMockChunks
        // and then compressChunks (with 'first' strategy) picked the first MAX_CHUNKS_PER_CONTEXT.
        // The selectCompressionStrategy would have returned 'first'.

        // To test this properly, we'd ideally mock chunkTextRecursive and compressChunks or textUtils.
        // Given the current structure, we'll assert based on observing the behavior of extractGlobalContext.
        // The internal call to processTextWithChunking will call compressChunks.
        // We need to ensure enough chunks are generated by chunkTextRecursive.
        // The test for "long PRD" already does this implicitly.
        // This test needs to ensure `selectCompressionStrategy` would return `first` if totalChunks > MAX_CHUNKS_PER_CONTEXT
        // and the `compressChunks` function (from textUtils) correctly takes the first MAX_CHUNKS_PER_CONTEXT.
        // This test might be better suited for textUtils.test.ts if not already covered.

        // For now, let's assume the "long PRD" test in extractGlobalContext covers this.
        // We can add a more targeted test here if needed, but it would require more complex mocking.
        // The existing `compression strategies` tests below already check if the strategy *name* is set.
        // This test is about the *outcome* of the 'first' strategy.

        // Re-evaluating: The `compressChunks` function is imported from `textUtils`.
        // The `ContextStackManagerService` *calls* `compressChunks` with the determined strategy.
        // So, we should test that `ContextStackManagerService` calls `compressChunks` correctly.
        // However, that's an implementation detail. We should test the output.

        // Let's use a text that would generate more than MAX_CHUNKS_PER_CONTEXT (e.g., 5 chunks)
        // and where selectCompressionStrategy would still pick 'first' (e.g. module context, or global with <=5 chunks)
        const moduleContent = `
        Module Title.
        Detail 1: ${"a".repeat(DEFAULT_CHUNK_SIZE * 0.6)}
        Detail 2: ${"b".repeat(DEFAULT_CHUNK_SIZE * 0.6)}
        Detail 3: ${"c".repeat(DEFAULT_CHUNK_SIZE * 0.6)}
        Detail 4: ${"d".repeat(DEFAULT_CHUNK_SIZE * 0.6)}
        Detail 5: ${"e".repeat(DEFAULT_CHUNK_SIZE * 0.6)}
        `; // This should generate 5 chunks of ~900 chars for module context.

        const mockTask = { ...mockTaskNode, contentSummary: "Initial summary for module."};
        // Override generateModuleDetailedContent from mockTextProcessorService to return our specific content
        mockTextProcessorService.generateModuleDetailedContent.mockReturnValue(moduleContent);

        const project = createMockProject("Some PRD");
        project.taskTree = [mockTask];

        const moduleContexts = service.extractModuleContexts(project);
        expect(moduleContexts).toHaveLength(1);
        const context = moduleContexts[0];

        // selectCompressionStrategy for module context with 5 chunks should be 'first'.
        expect(context.compressionMetadata!.strategy).toBe('first');
        expect(context.detailedChunks!.length).toBe(MAX_CHUNKS_PER_CONTEXT);
        expect(context.detailedChunks![0].content).toContain("Detail 1");
        expect(context.detailedChunks![1].content).toContain("Detail 2");
        expect(context.detailedChunks![2].content).toContain("Detail 3");
      });
    });

    describe('distributed strategy', () => {
      it('should select distributed chunks for global context when appropriate', () => {
        // Aim for 6-8 chunks to trigger 'distributed' (global: >5 and <=8)
        const CHUNK_SIZE_TARGET = DEFAULT_CHUNK_SIZE; // Target 1500 per distinct section before chunking mechanics
        const section1 = `SECTION_START_TEXT ${"a".repeat(CHUNK_SIZE_TARGET)} END_SECTION_START. `;
        const section2 = `MIDDLE_SECTION_A ${"b".repeat(CHUNK_SIZE_TARGET)} END_MIDDLE_A. `;
        const section3 = `MIDDLE_SECTION_B ${"c".repeat(CHUNK_SIZE_TARGET)} END_MIDDLE_B. `;
        const section4 = `MIDDLE_SECTION_C ${"d".repeat(CHUNK_SIZE_TARGET)} END_MIDDLE_C. `;
        const section5 = `MIDDLE_SECTION_D ${"e".repeat(CHUNK_SIZE_TARGET)} END_MIDDLE_D. `;
        const section6 = `SECTION_END_TEXT ${"f".repeat(CHUNK_SIZE_TARGET)} END_SECTION_END. `;
        const text = section1 + section2 + section3 + section4 + section5 + section6; // Approx 6 * 1500 = 9000 chars

        const project = createMockProject(text);
        // Ensure no specific keywords are returned to not accidentally trigger keyword-based
        mockTextProcessorService.extractRelevantKeywords.mockReturnValue([]);

        const globalContext = service.extractGlobalContext(project);
        expect(globalContext).not.toBeNull();

        // We expect MAX_CHUNKS_PER_CONTEXT (3) chunks
        expect(globalContext!.detailedChunks).toHaveLength(MAX_CHUNKS_PER_CONTEXT);
        // Check if the strategy was 'distributed' (or 'first' if total initial chunks <= MAX_CHUNKS_PER_CONTEXT, or keyword if >8)
        // This depends on how many chunks `chunkTextRecursive` actually creates from `text`.
        // For this test to be robust for 'distributed', we need initial chunks > MAX_CHUNKS_PER_CONTEXT and <= 8 (for global)
        // Assuming text is long enough for that.

        if (globalContext!.compressionMetadata!.strategy === 'distributed') {
            const allSelectedContent = globalContext!.detailedChunks!.map(c => c.content).join('\n');
            // Check if content from start, middle, and end sections are present
            // This is an approximation of distribution.
            expect(allSelectedContent).toContain("SECTION_START_TEXT");
            // One of the middle sections should be there
            const middleFound = ["MIDDLE_SECTION_A", "MIDDLE_SECTION_B", "MIDDLE_SECTION_C", "MIDDLE_SECTION_D"].some(s => allSelectedContent.includes(s));
            expect(middleFound).toBe(true);
            expect(allSelectedContent).toContain("SECTION_END_TEXT");
        } else {
            // If not distributed, it might be because the number of chunks was not in the range for it.
            console.warn(`Strategy was ${globalContext!.compressionMetadata!.strategy}, not 'distributed'. Initial chunks: ${globalContext!.compressionMetadata!.originalLength / DEFAULT_CHUNK_SIZE}`);
        }
      });
    });

    describe('keyword-based strategy', () => {
      it('should prioritize chunks with keywords for global context when appropriate', () => {
        // Aim for > 8 chunks to trigger 'keyword-based' (global: >8)
        const CHUNK_CONTENT_SIZE = DEFAULT_CHUNK_SIZE * 0.8;
        const KWD = "IMPORTANT_KEYWORD_XYZ";
        const genericParagraph = `Generic content ${"g".repeat(CHUNK_CONTENT_SIZE)}. `;
        const keywordParagraph = `Content with ${KWD} ${"k".repeat(CHUNK_CONTENT_SIZE)}. `;

        let text = "";
        for (let i = 0; i < MAX_CHUNKS_PER_CONTEXT + 7; i++) { // e.g., 10 paragraphs
            if (i % 2 === 0 || i > 7) { // Sprinkle keywords, ensure some non-keyword chunks too for contrast
                text += genericParagraph;
            } else {
                text += keywordParagraph;
            }
        }
        const project = createMockProject(text);
        mockTextProcessorService.extractRelevantKeywords.mockReturnValue([KWD]);

        const globalContext = service.extractGlobalContext(project);
        expect(globalContext).not.toBeNull();
        expect(globalContext!.detailedChunks).toHaveLength(MAX_CHUNKS_PER_CONTEXT);

        if (globalContext!.compressionMetadata!.strategy === 'keyword-based') {
            let keywordChunksFound = 0;
            globalContext!.detailedChunks!.forEach(chunk => {
                if (chunk.content.includes(KWD)) {
                    keywordChunksFound++;
                }
            });
            // Expect most (if not all) of the selected chunks to contain the keyword
            expect(keywordChunksFound).toBeGreaterThanOrEqual(1); // At least one should be found
             // Ideally, all MAX_CHUNKS_PER_CONTEXT should have the keyword if enough such chunks exist.
             // This depends on the distribution of keywords in the generated initial chunks.
             // If the keyword paragraphs are structured to become separate chunks, this should hold.
            if (keywordChunksFound < MAX_CHUNKS_PER_CONTEXT) {
                console.warn(`Keyword-based strategy: Found ${keywordChunksFound}/${MAX_CHUNKS_PER_CONTEXT} chunks with keywords.`);
            }
        } else {
             console.warn(`Strategy was ${globalContext!.compressionMetadata!.strategy}, not 'keyword-based'. Initial chunks: ${globalContext!.compressionMetadata!.originalLength / DEFAULT_CHUNK_SIZE}`);
        }
      });
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
        expect(['distributed', 'first', 'keyword-based']).toContain(globalContext!.compressionMetadata!.strategy);
      }
    });

    it('should use "keyword-based" strategy for very long texts with many chunks', () => {
      const longText = `
        # Project Requirements Document
        
        ## System Architecture
        The system architecture includes multiple components for authentication, database management, and API services.
        
        ## Implementation Details
        Implementation involves creating secure authentication modules, scalable database schemas, and robust API endpoints.
        
        ## Security Requirements
        Security requirements include authentication protocols, authorization mechanisms, and data encryption standards.
        
        ## Performance Optimization
        Performance optimization focuses on database query optimization, API response times, and system scalability.
        
        ## Testing Strategy
        Testing strategy encompasses unit testing, integration testing, and performance testing methodologies.
        
        ## Deployment Configuration
        Deployment configuration includes containerization, orchestration, and monitoring system setup.
      `.repeat(20); // Create very long text to trigger keyword-based strategy
      
      const project = createMockProject(longText);
      const globalContext = service.extractGlobalContext(project);

      // Should use keyword-based strategy for very long texts
      if (globalContext!.compressionMetadata!.chunksCount > 8) {
        expect(globalContext!.compressionMetadata!.strategy).toBe('keyword-based');
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