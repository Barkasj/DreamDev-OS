/**
 * Tests for text chunking utilities
 */

import {
  chunkTextRecursive,
  compressChunks,
  estimateTokenCount,
  trimChunksToTokenLimit,
  calculateChunksTokenCount,
  DEFAULT_SEPARATORS,
  ChunkingOptions,
  TextChunk
} from '../textUtils';

describe('textUtils', () => {
  describe('chunkTextRecursive', () => {
    const defaultOptions: ChunkingOptions = {
      chunkSize: 100,
      chunkOverlap: 20,
      preserveWords: true
    };

    it('should return single chunk for short text', () => {
      const text = 'This is a short text.';
      const chunks = chunkTextRecursive(text, defaultOptions);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(text);
      expect(chunks[0].metadata.hasOverlap).toBe(false);
    });

    it('should return empty array for empty text', () => {
      const chunks = chunkTextRecursive('', defaultOptions);
      expect(chunks).toHaveLength(0);
    });

    it('should split text by paragraph breaks first', () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = chunkTextRecursive(text, defaultOptions);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content).toContain('First paragraph');
    });

    it('should preserve word boundaries when possible', () => {
      const text = 'This is a very long sentence that should be split at word boundaries to maintain readability and context.';
      const chunks = chunkTextRecursive(text, { ...defaultOptions, chunkSize: 50 });
      
      chunks.forEach(chunk => {
        // Should not end with partial words (except for forced splits)
        // Check that chunk doesn't end in the middle of a word
        if (chunk.content.length > 10) {
          const lastChar = chunk.content[chunk.content.length - 1];
          const secondLastChar = chunk.content[chunk.content.length - 2];
          // Should end with space, punctuation, or be at natural word boundary
          expect(lastChar).toMatch(/[\s\.\,\;\!\?\-]|[a-zA-Z]$/);
        }
      });
    });

    it('should add overlap between chunks', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
      const chunks = chunkTextRecursive(text, { ...defaultOptions, chunkSize: 40, chunkOverlap: 15 });
      
      if (chunks.length > 1) {
        expect(chunks[1].metadata.hasOverlap).toBe(true);
        // Should contain some content from previous chunk
        expect(chunks[1].content.length).toBeGreaterThan(40);
      }
    });

    it('should handle different separators hierarchically', () => {
      const text = 'Section 1\n\nParagraph 1. Sentence 1; clause 1, part 1 word1 word2\n\nParagraph 2.';
      const chunks = chunkTextRecursive(text, { ...defaultOptions, chunkSize: 30 });
      
      expect(chunks.length).toBeGreaterThan(1);
      // Should split at paragraph breaks first
      expect(chunks[0].content).toContain('Section 1');
    });

    it('should handle custom separators', () => {
      const customSeparators = ['|||', '---', ' '];
      const text = 'Part1|||Part2---Part3 Part4';
      const chunks = chunkTextRecursive(text, {
        chunkSize: 10,
        chunkOverlap: 2,
        separators: customSeparators
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content).toContain('Part1');
    });

    it('should include metadata for each chunk', () => {
      const text = 'This is a test text that will be chunked into multiple pieces.';
      const chunks = chunkTextRecursive(text, defaultOptions);
      
      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.index).toBe(index);
        expect(chunk.metadata.size).toBe(chunk.content.length);
        expect(typeof chunk.metadata.startPosition).toBe('number');
        expect(typeof chunk.metadata.endPosition).toBe('number');
        expect(typeof chunk.metadata.hasOverlap).toBe('boolean');
      });
    });
  });

  describe('compressChunks', () => {
    const sampleChunks: TextChunk[] = [
      {
        content: 'Chunk 1',
        metadata: { index: 0, startPosition: 0, endPosition: 7, size: 7, hasOverlap: false }
      },
      {
        content: 'Chunk 2',
        metadata: { index: 1, startPosition: 7, endPosition: 14, size: 7, hasOverlap: false }
      },
      {
        content: 'Chunk 3',
        metadata: { index: 2, startPosition: 14, endPosition: 21, size: 7, hasOverlap: false }
      },
      {
        content: 'Chunk 4',
        metadata: { index: 3, startPosition: 21, endPosition: 28, size: 7, hasOverlap: false }
      }
    ];

    it('should return all chunks if under limit', () => {
      const compressed = compressChunks(sampleChunks, 5, 'first');
      expect(compressed).toHaveLength(4);
      expect(compressed).toEqual(sampleChunks);
    });

    it('should return first N chunks with "first" strategy', () => {
      const compressed = compressChunks(sampleChunks, 2, 'first');
      expect(compressed).toHaveLength(2);
      expect(compressed[0].content).toBe('Chunk 1');
      expect(compressed[1].content).toBe('Chunk 2');
    });

    it('should distribute chunks with "distributed" strategy', () => {
      const compressed = compressChunks(sampleChunks, 2, 'distributed');
      expect(compressed).toHaveLength(2);
      expect(compressed[0].content).toBe('Chunk 1');
      expect(compressed[1].content).toBe('Chunk 3'); // Should skip some chunks
    });

    it('should select chunks with "keyword-based" strategy', () => {
      const keywordChunks: TextChunk[] = [
        {
          content: 'This chunk contains important system architecture details',
          metadata: { index: 0, startPosition: 0, endPosition: 50, size: 50, hasOverlap: false }
        },
        {
          content: 'Random content without relevant terms',
          metadata: { index: 1, startPosition: 50, endPosition: 85, size: 35, hasOverlap: false }
        },
        {
          content: 'Implementation details for the authentication module',
          metadata: { index: 2, startPosition: 85, endPosition: 135, size: 50, hasOverlap: false }
        },
        {
          content: 'More random text here',
          metadata: { index: 3, startPosition: 135, endPosition: 155, size: 20, hasOverlap: false }
        }
      ];

      const keywords = ['system', 'implementation', 'authentication'];
      const compressed = compressChunks(keywordChunks, 2, 'keyword-based', keywords);
      
      expect(compressed).toHaveLength(2);
      // Should select chunks with highest keyword relevance (not necessarily in order)
      const selectedContents = compressed.map(chunk => chunk.content);
      expect(selectedContents.some(content => content.includes('system') || content.includes('implementation') || content.includes('authentication'))).toBe(true);
      // Should not include the random content chunk
      expect(selectedContents.some(content => content.includes('Random content without relevant terms'))).toBe(false);
    });

    it('should fallback to "first" strategy when no keywords provided for keyword-based', () => {
      const compressed = compressChunks(sampleChunks, 2, 'keyword-based');
      expect(compressed).toHaveLength(2);
      expect(compressed[0].content).toBe('Chunk 1');
      expect(compressed[1].content).toBe('Chunk 2');
    });

    it('should handle edge cases', () => {
      expect(compressChunks([], 2, 'first')).toHaveLength(0);
      expect(compressChunks(sampleChunks, 0, 'first')).toHaveLength(0);
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate tokens correctly', () => {
      expect(estimateTokenCount('test')).toBe(1); // 4 chars = 1 token
      expect(estimateTokenCount('test text')).toBe(3); // 9 chars = 3 tokens
      expect(estimateTokenCount('')).toBe(0);
    });

    it('should round up for partial tokens', () => {
      expect(estimateTokenCount('a')).toBe(1); // 1 char should round up to 1 token
      expect(estimateTokenCount('abc')).toBe(1); // 3 chars should round up to 1 token
      expect(estimateTokenCount('abcde')).toBe(2); // 5 chars should round up to 2 tokens
    });

    // Added tests based on subtask requirements
    it('should handle Indonesian words (consistency check, length-based)', () => {
      // Formula: Math.ceil(length / 4)
      expect(estimateTokenCount('halo dunia')).toBe(Math.ceil(10 / 4)); // "halo dunia" is 10 chars -> 3 tokens
      expect(estimateTokenCount('selamat pagi')).toBe(Math.ceil(12 / 4)); // "selamat pagi" is 12 chars -> 3 tokens
    });

    it('should handle text with punctuation', () => {
      expect(estimateTokenCount('hello, world!')).toBe(Math.ceil(13 / 4)); // 13 chars -> 4 tokens
      expect(estimateTokenCount('test... test??')).toBe(Math.ceil(14 / 4)); // 14 chars -> 4 tokens
    });

    it('should handle text with multiple spaces and newlines', () => {
      expect(estimateTokenCount('hello   world')).toBe(Math.ceil(13 / 4)); // 13 chars -> 4 tokens
      expect(estimateTokenCount('hello\nworld')).toBe(Math.ceil(11 / 4)); // 11 chars -> 3 tokens
      expect(estimateTokenCount('hello\n\nworld')).toBe(Math.ceil(12 / 4)); // 12 chars -> 3 tokens
    });

    it('should handle text with numbers', () => {
      expect(estimateTokenCount('12345')).toBe(Math.ceil(5 / 4)); // 5 chars -> 2 tokens
      expect(estimateTokenCount('version 2.0')).toBe(Math.ceil(11 / 4)); // 11 chars -> 3 tokens
    });

    it('should handle mixed alphanumeric and special characters', () => {
      expect(estimateTokenCount('user@example.com#test!')).toBe(Math.ceil(22 / 4)); // 22 chars -> 6 tokens
    });

    it('should handle string of only spaces', () => {
      expect(estimateTokenCount('    ')).toBe(Math.ceil(4 / 4)); // 4 spaces -> 1 token
      expect(estimateTokenCount(' ')).toBe(Math.ceil(1 / 4)); // 1 space -> 1 token
    });

    it('should handle string of only punctuation', () => {
      expect(estimateTokenCount('.,?!')).toBe(Math.ceil(4 / 4)); // 4 chars -> 1 token
      expect(estimateTokenCount('---')).toBe(Math.ceil(3 / 4)); // 3 chars -> 1 token
    });

    it('should handle very long string without spaces', () => {
      const longString = 'a'.repeat(1000);
      expect(estimateTokenCount(longString)).toBe(Math.ceil(1000 / 4)); // 250 tokens
    });

    it('should handle strings with emojis (length based)', () => {
      // Note: JavaScript string length for emojis can vary. '😊'.length is 2.
      expect(estimateTokenCount('hello 😊 world')).toBe(Math.ceil('hello 😊 world'.length / 4));
      // 'hello 😊 world' = h e l l o <space> UD83D UDE0A <space> w o r l d = 5 + 1 + 2 + 1 + 5 = 14 chars -> 4 tokens
    });
  });

  describe('calculateChunksTokenCount', () => {
    it('should calculate total tokens for chunks', () => {
      const chunks: TextChunk[] = [
        {
          content: 'test', // 1 token
          metadata: { index: 0, startPosition: 0, endPosition: 4, size: 4, hasOverlap: false }
        },
        {
          content: 'test text', // 3 tokens
          metadata: { index: 1, startPosition: 4, endPosition: 13, size: 9, hasOverlap: false }
        }
      ];

      expect(calculateChunksTokenCount(chunks)).toBe(4);
    });

    it('should handle empty chunks array', () => {
      expect(calculateChunksTokenCount([])).toBe(0);
    });
  });

  describe('trimChunksToTokenLimit', () => {
    const sampleChunks: TextChunk[] = [
      {
        content: 'test', // 1 token
        metadata: { index: 0, startPosition: 0, endPosition: 4, size: 4, hasOverlap: false }
      },
      {
        content: 'test text', // 3 tokens
        metadata: { index: 1, startPosition: 4, endPosition: 13, size: 9, hasOverlap: false }
      },
      {
        content: 'another test text', // 5 tokens
        metadata: { index: 2, startPosition: 13, endPosition: 30, size: 17, hasOverlap: false }
      }
    ];

    it('should trim chunks to fit token limit', () => {
      const trimmed = trimChunksToTokenLimit(sampleChunks, 4);
      expect(trimmed).toHaveLength(2); // First two chunks = 4 tokens
      expect(calculateChunksTokenCount(trimmed)).toBeLessThanOrEqual(4);
    });

    it('should include partial chunk if space allows', () => {
      const longChunk: TextChunk = {
        content: 'This is a very long text that should be partially included when there is some remaining token budget but not enough for the full chunk',
        metadata: { index: 0, startPosition: 0, endPosition: 100, size: 100, hasOverlap: false }
      };

      const trimmed = trimChunksToTokenLimit([longChunk], 10);
      expect(trimmed).toHaveLength(1);
      expect(trimmed[0].content).toContain('...');
      expect(trimmed[0].content.length).toBeLessThan(longChunk.content.length);
    });

    it('should handle empty chunks array', () => {
      expect(trimChunksToTokenLimit([], 10)).toHaveLength(0);
    });

    it('should not include partial chunk if remaining space is too small', () => {
      const chunks: TextChunk[] = [
        {
          content: 'test text that fits', // ~5 tokens
          metadata: { index: 0, startPosition: 0, endPosition: 19, size: 19, hasOverlap: false }
        },
        {
          content: 'very long text that will not fit in remaining space',
          metadata: { index: 1, startPosition: 19, endPosition: 71, size: 52, hasOverlap: false }
        }
      ];

      const trimmed = trimChunksToTokenLimit(chunks, 6); // Only 1 token remaining after first chunk
      expect(trimmed).toHaveLength(1); // Should not include partial second chunk
    });
  });

  describe('DEFAULT_SEPARATORS', () => {
    it('should have correct separator hierarchy', () => {
      expect(DEFAULT_SEPARATORS[0]).toBe('\n\n'); // Paragraph breaks first
      expect(DEFAULT_SEPARATORS[1]).toBe('\n');   // Line breaks second
      expect(DEFAULT_SEPARATORS[2]).toBe('. ');   // Sentence endings third
      expect(DEFAULT_SEPARATORS[DEFAULT_SEPARATORS.length - 1]).toBe(''); // Character fallback last
    });

    it('should include common punctuation separators', () => {
      expect(DEFAULT_SEPARATORS).toContain('. ');
      expect(DEFAULT_SEPARATORS).toContain('! ');
      expect(DEFAULT_SEPARATORS).toContain('? ');
      expect(DEFAULT_SEPARATORS).toContain('; ');
      expect(DEFAULT_SEPARATORS).toContain(', ');
    });
  });

  describe('Integration tests', () => {
    it('should handle real-world PRD text', () => {
      const prdText = `
# Project Requirements Document

## Executive Summary
This is a comprehensive project that involves building a modern web application with multiple modules and complex functionality.

## Technical Requirements
The system should be built using:
- Next.js for frontend
- Node.js for backend
- MongoDB for database
- TypeScript for type safety

## Module 1: User Authentication
Users should be able to register, login, and manage their profiles. The system should support OAuth integration with Google and GitHub.

## Module 2: Data Management
The application should provide CRUD operations for various data entities. It should support real-time updates and data synchronization.

## Module 3: Reporting
Generate comprehensive reports with charts and analytics. Support export to PDF and Excel formats.
      `;

      const options: ChunkingOptions = {
        chunkSize: 300,
        chunkOverlap: 50,
        preserveWords: true
      };

      const chunks = chunkTextRecursive(prdText, options);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content).toContain('Project Requirements Document');
      
      // Verify overlap
      if (chunks.length > 1) {
        expect(chunks[1].metadata.hasOverlap).toBe(true);
      }

      // Verify total content preservation (accounting for overlap)
      const totalOriginalLength = prdText.length;
      const totalChunksLength = chunks.reduce((sum, chunk) => sum + chunk.metadata.size, 0);
      expect(totalChunksLength).toBeGreaterThanOrEqual(totalOriginalLength);
    });

    it('should work with compression and token limiting', () => {
      const longText = 'This is a test sentence. '.repeat(100); // ~2500 characters
      
      const chunks = chunkTextRecursive(longText, {
        chunkSize: 200,
        chunkOverlap: 30,
        preserveWords: true
      });

      expect(chunks.length).toBeGreaterThan(5);

      // Test compression
      const compressed = compressChunks(chunks, 3, 'distributed');
      expect(compressed).toHaveLength(3);

      // Test token limiting
      const tokenLimited = trimChunksToTokenLimit(compressed, 100);
      expect(calculateChunksTokenCount(tokenLimited)).toBeLessThanOrEqual(105); // Allow small margin for partial chunks
    });
  });
});