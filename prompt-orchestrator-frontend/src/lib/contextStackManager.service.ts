/**
 * Context Stack Manager Service
 * Mengelola ekstraksi, penyimpanan, dan pengambilan berbagai lapisan konteks
 * untuk meningkatkan kualitas prompt yang dihasilkan
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ProjectDocument, GlobalContext, ModuleContext, StepContext, TaskNode, ExtractedEntities } from '../types';
import { 
  chunkTextRecursive, 
  compressChunks, 
  estimateTokenCount, 
  trimChunksToTokenLimit,
  ChunkingOptions 
} from '../utils/textUtils';
import { TextProcessorService } from './textProcessor.service';

export class ContextStackManagerService {
  // Configuration for chunking
  private readonly DEFAULT_CHUNK_SIZE = 1500; // Characters per chunk
  private readonly DEFAULT_CHUNK_OVERLAP = 200; // Overlap between chunks
  private readonly MAX_CHUNKS_PER_CONTEXT = 3; // Maximum chunks to store per context
  private readonly MAX_CONTEXT_TOKENS = 2000; // Maximum tokens for context injection
  private readonly textProcessorService: TextProcessorService;

  constructor() {
    this.textProcessorService = new TextProcessorService();
  }

  /**
   * Ekstraksi Global Context dari ProjectDocument dengan Smart Chunking
   */
  public extractGlobalContext(project: ProjectDocument): GlobalContext | null {
    if (!project.originalPrdText) return null;

    try {
      // Ekstraksi summary dari bagian awal PRD
      const summary = this.textProcessorService.extractProjectSummary(project.originalPrdText);
      
      // Deteksi tipe proyek
      const projectTypeHints = this.textProcessorService.detectProjectType(project.originalPrdText);
      
      // Analisis kompleksitas berdasarkan jumlah task dan konten
      const complexityLevel = this.textProcessorService.analyzeComplexity(project);
      
      // Ekstraksi tech stack dari konten PRD dan task entities
      const techStackHints = this.textProcessorService.extractTechStack(project);

      // Smart Chunking untuk detailed context
      const { detailedChunks, compressionMetadata } = this.processTextWithChunking(
        project.originalPrdText,
        'global'
      );

      return {
        projectId: project._id,
        summary,
        projectTypeHints,
        complexityLevel,
        techStackHints,
        detailedChunks,
        compressionMetadata,
      };
    } catch (error) {
      console.error('Error extracting global context:', error);
      return null;
    }
  }

  /**
   * Ekstraksi Module Contexts dari task tree dengan Smart Chunking
   */
  public extractModuleContexts(project: ProjectDocument): ModuleContext[] {
    const moduleContexts: ModuleContext[] = [];
    
    if (!project.taskTree || project.taskTree.length === 0) {
      return moduleContexts;
    }

    try {
      // Asumsikan TaskNode level 1 adalah modul utama
      project.taskTree.forEach(rootTaskNode => {
        if (rootTaskNode.level === 1) {
          // Generate detailed content for chunking
          const moduleDetailedContent = this.textProcessorService.generateModuleDetailedContent(rootTaskNode);
          
          // Smart Chunking untuk module content
          const { detailedChunks, compressionMetadata } = this.processTextWithChunking(
            moduleDetailedContent,
            'module'
          );

          const moduleContext: ModuleContext = {
            moduleId: rootTaskNode.id,
            moduleTitle: rootTaskNode.taskName,
            summary: this.textProcessorService.generateModuleSummary(rootTaskNode),
            relatedEntities: rootTaskNode.entities,
            detailedChunks,
            compressionMetadata,
          };
          moduleContexts.push(moduleContext);
        }
      });

      return moduleContexts;
    } catch (error) {
      console.error('Error extracting module contexts:', error);
      return [];
    }
  }

  /**
   * Generate Step Context dari TaskNode
   */
  public getStepContext(task: TaskNode): StepContext {
    return {
      taskId: task.id,
      stepSummary: task.contentSummary,
      relevantEntities: task.entities,
    };
  }

  /**
   * Cari ModuleContext yang relevan untuk task tertentu
   */
  public findRelevantModuleContext(
    task: TaskNode,
    moduleContexts: ModuleContext[]
  ): ModuleContext | null {
    if (!moduleContexts || moduleContexts.length === 0) {
      return null;
    }

    // Jika task adalah level 1, cari module context dengan ID yang sama
    if (task.level === 1) {
      const exactMatch = moduleContexts.find(mc => mc.moduleId === task.id);
      if (exactMatch) {
        return exactMatch;
      }
    }

    // Untuk task level > 1, atau jika tidak ada exact match, fallback ke module pertama
    return moduleContexts.length > 0 ? moduleContexts[0] : null;
  }

  // ===== PRIVATE HELPER METHODS =====
  // Text processing methods previously here have been moved to TextProcessorService

  // ===== SMART CHUNKING METHODS =====

  /**
   * Process text with smart chunking and compression
   */
  private processTextWithChunking(
    text: string,
    contextType: 'global' | 'module'
  ): {
    detailedChunks: Array<{
      content: string;
      metadata: {
        index: number;
        startPosition: number;
        endPosition: number;
        size: number;
        hasOverlap: boolean;
      };
    }>;
    compressionMetadata: {
      originalLength: number;
      chunksCount: number;
      compressionRatio: number;
      strategy: 'first' | 'distributed' | 'keyword-based';
    };
  } {
    const originalLength = text.length;

    // Skip chunking for short texts
    if (originalLength <= this.DEFAULT_CHUNK_SIZE) {
      return {
        detailedChunks: [{
          content: text,
          metadata: {
            index: 0,
            startPosition: 0,
            endPosition: originalLength,
            size: originalLength,
            hasOverlap: false
          }
        }],
        compressionMetadata: {
          originalLength,
          chunksCount: 1,
          compressionRatio: 1.0,
          strategy: 'first'
        }
      };
    }

    // Configure chunking options based on context type
    const chunkingOptions: ChunkingOptions = {
      chunkSize: contextType === 'global' ? this.DEFAULT_CHUNK_SIZE : this.DEFAULT_CHUNK_SIZE * 0.8,
      chunkOverlap: this.DEFAULT_CHUNK_OVERLAP,
      preserveWords: true
    };

    // Perform chunking
    const chunks = chunkTextRecursive(text, chunkingOptions);

    // Apply compression strategy
    const compressionStrategy = this.selectCompressionStrategy(chunks.length, contextType);
    const keywords = this.textProcessorService.extractRelevantKeywords(text, contextType); // Changed
    const compressedChunks = compressChunks(chunks, this.MAX_CHUNKS_PER_CONTEXT, compressionStrategy, keywords);

    // Trim to token limit
    const finalChunks = trimChunksToTokenLimit(compressedChunks, this.MAX_CONTEXT_TOKENS);

    // Convert to interface format
    const detailedChunks = finalChunks.map(chunk => ({
      content: chunk.content,
      metadata: {
        index: chunk.metadata.index,
        startPosition: chunk.metadata.startPosition,
        endPosition: chunk.metadata.endPosition,
        size: chunk.metadata.size,
        hasOverlap: chunk.metadata.hasOverlap
      }
    }));

    const compressionRatio = finalChunks.length / chunks.length;

    return {
      detailedChunks,
      compressionMetadata: {
        originalLength,
        chunksCount: finalChunks.length,
        compressionRatio,
        strategy: compressionStrategy
      }
    };
  }

  /**
   * Select compression strategy based on context
   */
  private selectCompressionStrategy(
    totalChunks: number,
    contextType: 'global' | 'module'
  ): 'first' | 'distributed' | 'keyword-based' {
    if (totalChunks <= this.MAX_CHUNKS_PER_CONTEXT) {
      return 'first';
    }

    // For global context with many chunks, use keyword-based selection
    if (contextType === 'global' && totalChunks > 8) {
      return 'keyword-based';
    }

    // For global context, prefer distributed sampling
    if (contextType === 'global' && totalChunks > 5) {
      return 'distributed';
    }

    // For module context with many chunks, use keyword-based selection
    if (contextType === 'module' && totalChunks > 6) {
      return 'keyword-based';
    }

    // For module context, prefer first chunks (usually contain key info)
    return 'first';
  }

  /**
   * Get context chunks for prompt injection with token limit
   */
  public getContextChunksForPrompt(
    globalContext: GlobalContext | null,
    moduleContext: ModuleContext | null,
    maxTokens: number = 1500
  ): {
    globalChunks: string[];
    moduleChunks: string[];
    totalTokens: number;
  } {
    const globalChunks: string[] = [];
    const moduleChunks: string[] = [];
    let totalTokens = 0;

    // Add global context chunks
    if (globalContext?.detailedChunks) {
      for (const chunk of globalContext.detailedChunks) {
        const chunkTokens = estimateTokenCount(chunk.content);
        if (totalTokens + chunkTokens <= maxTokens) {
          globalChunks.push(chunk.content);
          totalTokens += chunkTokens;
        } else {
          break;
        }
      }
    }

    // Add module context chunks if there's remaining token budget
    if (moduleContext?.detailedChunks && totalTokens < maxTokens) {
      for (const chunk of moduleContext.detailedChunks) {
        const chunkTokens = estimateTokenCount(chunk.content);
        if (totalTokens + chunkTokens <= maxTokens) {
          moduleChunks.push(chunk.content);
          totalTokens += chunkTokens;
        } else {
          break;
        }
      }
    }

    return {
      globalChunks,
      moduleChunks,
      totalTokens
    };
  }
}
