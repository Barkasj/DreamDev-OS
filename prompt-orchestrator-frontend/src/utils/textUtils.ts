/**
 * Text processing utilities for smart chunking and context compression
 */

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  preserveWords?: boolean;
}

export interface ChunkMetadata {
  index: number;
  startPosition: number;
  endPosition: number;
  size: number;
  hasOverlap: boolean;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

/**
 * Default separators for recursive text splitting, ordered by priority
 */
export const DEFAULT_SEPARATORS = [
  '\n\n',    // Paragraph breaks
  '\n',      // Line breaks
  '. ',      // Sentence endings
  '! ',      // Exclamation sentences
  '? ',      // Question sentences
  '; ',      // Semicolon breaks
  ', ',      // Comma breaks
  ' ',       // Word breaks
  ''         // Character breaks (fallback)
];

/**
 * Recursively chunks text using hierarchical separators
 * Maintains context continuity with configurable overlap
 */
export function chunkTextRecursive(
  text: string,
  options: ChunkingOptions
): TextChunk[] {
  const {
    chunkSize,
    chunkOverlap,
    separators = DEFAULT_SEPARATORS,
    preserveWords = true
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  if (text.length <= chunkSize) {
    // Check if there are natural paragraph breaks that we should respect
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      // Split by paragraphs even if total length is under chunk size
      return paragraphs.map((content, index) => ({
        content: content.trim(),
        metadata: {
          index,
          startPosition: 0, // Simplified for short texts
          endPosition: content.length,
          size: content.length,
          hasOverlap: false
        }
      }));
    }
    
    return [{
      content: text,
      metadata: {
        index: 0,
        startPosition: 0,
        endPosition: text.length,
        size: text.length,
        hasOverlap: false
      }
    }];
  }

  const chunks = splitTextRecursively(text, chunkSize, separators, preserveWords);
  return addOverlapToChunks(chunks, chunkOverlap);
}

/**
 * Internal function to recursively split text using different separators
 */
function splitTextRecursively(
  text: string,
  chunkSize: number,
  separators: string[],
  preserveWords: boolean
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  for (let i = 0; i < separators.length; i++) {
    const separator = separators[i];
    const parts = text.split(separator);
    
    if (parts.length > 1) {
      const chunks: string[] = [];
      let currentChunk = '';
      
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        const partWithSeparator = j < parts.length - 1 && separator !== '' 
          ? part + separator 
          : part;
        
        if (currentChunk.length + partWithSeparator.length <= chunkSize) {
          currentChunk += partWithSeparator;
        } else {
          // Push current chunk if it has content
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
          
          // Handle oversized parts
          if (partWithSeparator.length > chunkSize) {
            // Recursively split with next separators
            const subChunks = splitTextRecursively(
              partWithSeparator, 
              chunkSize, 
              separators.slice(i + 1),
              preserveWords
            );
            chunks.push(...subChunks);
            currentChunk = '';
          } else {
            currentChunk = partWithSeparator;
          }
        }
      }
      
      // Add remaining chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      return chunks.filter(chunk => chunk.length > 0);
    }
  }
  
  // Fallback: force split at character level if no separators work
  return forceCharacterSplit(text, chunkSize, preserveWords);
}

/**
 * Force split text at character level when no separators work
 */
function forceCharacterSplit(text: string, chunkSize: number, preserveWords: boolean): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    
    // Try to preserve word boundaries
    if (preserveWords && end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + chunkSize * 0.7) { // Only if we don't lose too much content
        end = lastSpace + 1; // Include the space
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end;
    
    // Skip whitespace at the beginning of next chunk
    while (start < text.length && text[start] === ' ') {
      start++;
    }
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Add overlap between chunks to maintain context continuity
 */
function addOverlapToChunks(chunks: string[], overlapSize: number): TextChunk[] {
  if (chunks.length === 0 || overlapSize <= 0) {
    return chunks.map((content, index) => ({
      content,
      metadata: {
        index,
        startPosition: 0,
        endPosition: content.length,
        size: content.length,
        hasOverlap: false
      }
    }));
  }

  const overlappedChunks: TextChunk[] = [];
  let currentPosition = 0;

  for (let i = 0; i < chunks.length; i++) {
    let chunkContent = chunks[i];
    let hasOverlap = false;

    // Add overlap from previous chunk
    if (i > 0 && overlapSize > 0) {
      const prevChunk = chunks[i - 1];
      const overlapText = getOverlapText(prevChunk, overlapSize);
      if (overlapText) {
        chunkContent = overlapText + ' ' + chunkContent;
        hasOverlap = true;
      }
    }

    overlappedChunks.push({
      content: chunkContent,
      metadata: {
        index: i,
        startPosition: currentPosition,
        endPosition: currentPosition + chunks[i].length,
        size: chunkContent.length,
        hasOverlap
      }
    });

    currentPosition += chunks[i].length;
  }

  return overlappedChunks;
}

/**
 * Extract overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text;
  }

  // Try to find a good breaking point for overlap
  const overlapStart = text.length - overlapSize;
  const spaceIndex = text.indexOf(' ', overlapStart);
  
  if (spaceIndex !== -1 && spaceIndex < text.length - 10) {
    return text.slice(spaceIndex + 1);
  }
  
  return text.slice(overlapStart);
}

/**
 * Compress chunks by selecting the most relevant ones
 * This is a basic implementation - can be enhanced with more sophisticated algorithms
 */
export function compressChunks(
  chunks: TextChunk[],
  maxChunks: number,
  strategy: 'first' | 'distributed' | 'keyword-based' = 'first'
): TextChunk[] {
  if (chunks.length <= maxChunks) {
    return chunks;
  }

  switch (strategy) {
    case 'first':
      return chunks.slice(0, maxChunks);
    
    case 'distributed':
      return distributeChunks(chunks, maxChunks);
    
    case 'keyword-based':
      // TODO: Implement keyword-based selection
      return chunks.slice(0, maxChunks);
    
    default:
      return chunks.slice(0, maxChunks);
  }
}

/**
 * Distribute chunks evenly across the text
 */
function distributeChunks(chunks: TextChunk[], maxChunks: number): TextChunk[] {
  if (chunks.length <= maxChunks) {
    return chunks;
  }

  const step = Math.floor(chunks.length / maxChunks);
  const selected: TextChunk[] = [];

  for (let i = 0; i < maxChunks; i++) {
    const index = i * step;
    if (index < chunks.length) {
      selected.push(chunks[index]);
    }
  }

  return selected;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total token count for chunks
 */
export function calculateChunksTokenCount(chunks: TextChunk[]): number {
  return chunks.reduce((total, chunk) => total + estimateTokenCount(chunk.content), 0);
}

/**
 * Trim chunks to fit within token limit
 */
export function trimChunksToTokenLimit(
  chunks: TextChunk[],
  maxTokens: number
): TextChunk[] {
  const result: TextChunk[] = [];
  let currentTokens = 0;

  for (const chunk of chunks) {
    const chunkTokens = estimateTokenCount(chunk.content);
    
    if (currentTokens + chunkTokens <= maxTokens) {
      result.push(chunk);
      currentTokens += chunkTokens;
    } else {
      // Try to fit a partial chunk
      const remainingTokens = maxTokens - currentTokens;
      if (remainingTokens >= 3) { // Minimum 3 tokens for meaningful content
        const maxChars = remainingTokens * 4;
        let partialContent = chunk.content.slice(0, maxChars);
        
        // Try to break at word boundary
        const lastSpace = partialContent.lastIndexOf(' ');
        if (lastSpace > maxChars * 0.5) { // Only if we don't lose too much content
          partialContent = partialContent.slice(0, lastSpace);
        }
        
        if (partialContent.length >= 10) { // Only if meaningful content remains
          result.push({
            ...chunk,
            content: partialContent + '...',
            metadata: {
              ...chunk.metadata,
              size: partialContent.length + 3
            }
          });
        }
      }
      break;
    }
  }

  return result;
}