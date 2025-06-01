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
  ChunkingOptions,
  TextChunk 
} from '../utils/textUtils';

export class ContextStackManagerService {
  // Configuration for chunking
  private readonly DEFAULT_CHUNK_SIZE = 1500; // Characters per chunk
  private readonly DEFAULT_CHUNK_OVERLAP = 200; // Overlap between chunks
  private readonly MAX_CHUNKS_PER_CONTEXT = 3; // Maximum chunks to store per context
  private readonly MAX_CONTEXT_TOKENS = 2000; // Maximum tokens for context injection

  /**
   * Ekstraksi Global Context dari ProjectDocument dengan Smart Chunking
   */
  public extractGlobalContext(project: ProjectDocument): GlobalContext | null {
    if (!project.originalPrdText) return null;

    try {
      // Ekstraksi summary dari bagian awal PRD
      const summary = this.extractProjectSummary(project.originalPrdText);
      
      // Deteksi tipe proyek
      const projectTypeHints = this.detectProjectType(project.originalPrdText);
      
      // Analisis kompleksitas berdasarkan jumlah task dan konten
      const complexityLevel = this.analyzeComplexity(project);
      
      // Ekstraksi tech stack dari konten PRD dan task entities
      const techStackHints = this.extractTechStack(project);

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
          const moduleDetailedContent = this.generateModuleDetailedContent(rootTaskNode);
          
          // Smart Chunking untuk module content
          const { detailedChunks, compressionMetadata } = this.processTextWithChunking(
            moduleDetailedContent,
            'module'
          );

          const moduleContext: ModuleContext = {
            moduleId: rootTaskNode.id,
            moduleTitle: rootTaskNode.taskName,
            summary: this.generateModuleSummary(rootTaskNode),
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

  /**
   * Ekstraksi ringkasan proyek dari PRD text
   */
  private extractProjectSummary(prdText: string): string {
    // Cari bagian pendahuluan atau executive summary
    const lines = prdText.split('\n');
    const summaryLines: string[] = [];
    let inSummarySection = false;
    let lineCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Deteksi section pendahuluan/summary
      if (trimmedLine.match(/^#{1,3}\s*(pendahuluan|introduction|executive summary|overview|ringkasan)/i)) {
        inSummarySection = true;
        continue;
      }
      
      // Stop jika menemukan section lain
      if (inSummarySection && trimmedLine.match(/^#{1,3}\s+/)) {
        break;
      }
      
      // Kumpulkan konten summary
      if (inSummarySection && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
        summaryLines.push(trimmedLine);
        lineCount++;
        
        // Batasi panjang summary
        if (lineCount >= 5) break;
      }
    }

    // Fallback jika tidak ada section khusus
    if (summaryLines.length === 0) {
      const firstParagraph = prdText.substring(0, 500);
      return firstParagraph + (prdText.length > 500 ? "..." : "");
    }

    return summaryLines.join(' ').substring(0, 500) + 
           (summaryLines.join(' ').length > 500 ? "..." : "");
  }

  /**
   * Deteksi tipe proyek dari konten PRD
   */
  private detectProjectType(prdText: string): string {
    const content = prdText.toLowerCase();

    // Prioritas deteksi: sistem/platform dulu karena lebih spesifik
    if (content.includes('sistem') || content.includes('platform') || content.includes('orchestrator')) {
      return 'System/Platform';
    }
    if (content.includes('mobile app') || content.includes('aplikasi mobile')) {
      return 'Mobile Application';
    }
    if (content.includes('web app') || content.includes('aplikasi web') || content.includes('website')) {
      return 'Web Application';
    }
    if (content.includes('desktop') || content.includes('aplikasi desktop')) {
      return 'Desktop Application';
    }
    if (content.includes('api') || content.includes('backend') || content.includes('microservice')) {
      return 'API/Backend Service';
    }

    return 'Software Application';
  }

  /**
   * Analisis kompleksitas proyek
   */
  private analyzeComplexity(project: ProjectDocument): 'simple' | 'medium' | 'complex' {
    const totalTasks = project.metadata?.totalTasks || 0;
    const uniqueSystems = project.metadata?.entityStats?.uniqueSystems?.length || 0;
    const uniqueFeatures = project.metadata?.entityStats?.uniqueFeatures?.length || 0;

    // Hitung skor kompleksitas
    let complexityScore = 0;

    // Berdasarkan jumlah task (skor lebih rendah untuk medium)
    if (totalTasks > 20) complexityScore += 3;
    else if (totalTasks > 10) complexityScore += 2;
    else if (totalTasks >= 5) complexityScore += 1; // Ubah dari > 5 ke >= 5

    // Berdasarkan jumlah sistem (skor lebih rendah untuk medium)
    if (uniqueSystems > 8) complexityScore += 3;
    else if (uniqueSystems >= 5) complexityScore += 2; // Ubah dari > 4 ke >= 5
    else if (uniqueSystems > 2) complexityScore += 1;

    // Berdasarkan jumlah fitur (skor lebih rendah untuk medium)
    if (uniqueFeatures > 15) complexityScore += 2;
    else if (uniqueFeatures >= 5) complexityScore += 1; // Ubah dari > 8 ke >= 5

    // Tentukan level kompleksitas (threshold lebih rendah)
    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 2) return 'medium'; // Ubah dari >= 3 ke >= 2
    return 'simple';
  }

  /**
   * Ekstraksi tech stack dari proyek
   */
  private extractTechStack(project: ProjectDocument): string[] {
    const techStack = new Set<string>();
    
    // Ekstraksi dari global context
    const globalContext = project.globalContext?.toLowerCase() || '';
    const commonTech = [
      'next.js', 'react', 'typescript', 'node.js', 'mongodb', 'express', 
      'tailwind', 'prisma', 'postgresql', 'mysql', 'redis', 'docker',
      'kubernetes', 'aws', 'azure', 'gcp', 'firebase', 'vercel'
    ];

    for (const tech of commonTech) {
      if (globalContext.includes(tech.toLowerCase())) {
        techStack.add(tech);
      }
    }

    // Ekstraksi dari originalPrdText
    const prdText = project.originalPrdText.toLowerCase();
    for (const tech of commonTech) {
      if (prdText.includes(tech.toLowerCase())) {
        techStack.add(tech);
      }
    }

    // Ekstraksi dari task entities
    if (project.taskTree) {
      const flatTasks = this.flattenTaskTree(project.taskTree);
      for (const task of flatTasks) {
        for (const system of task.entities.systems) {
          if (system.length > 2) { // Filter sistem dengan nama pendek
            techStack.add(system);
          }
        }
      }
    }

    return Array.from(techStack).slice(0, 8); // Batasi maksimal 8 teknologi
  }

  /**
   * Generate ringkasan untuk module
   */
  private generateModuleSummary(taskNode: TaskNode): string {
    let summary = taskNode.contentSummary;
    
    // Batasi panjang summary
    if (summary.length > 300) {
      summary = summary.substring(0, 300) + "...";
    }
    
    // Tambahkan informasi sub-tasks jika ada
    if (taskNode.subTasks && taskNode.subTasks.length > 0) {
      summary += ` (Mencakup ${taskNode.subTasks.length} sub-task)`;
    }
    
    return summary;
  }

  /**
   * Flatten task tree menjadi array linear
   */
  private flattenTaskTree(tasks: TaskNode[]): TaskNode[] {
    const result: TaskNode[] = [];

    for (const task of tasks) {
      result.push(task);
      if (task.subTasks && task.subTasks.length > 0) {
        result.push(...this.flattenTaskTree(task.subTasks));
      }
    }

    return result;
  }

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
    const compressedChunks = compressChunks(chunks, this.MAX_CHUNKS_PER_CONTEXT, compressionStrategy);

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

    // For global context, prefer distributed sampling
    if (contextType === 'global' && totalChunks > 5) {
      return 'distributed';
    }

    // For module context, prefer first chunks (usually contain key info)
    return 'first';
  }

  /**
   * Generate detailed content for module chunking
   */
  private generateModuleDetailedContent(rootTaskNode: TaskNode): string {
    const parts: string[] = [];

    // Add main task content
    parts.push(`Module: ${rootTaskNode.taskName}`);
    parts.push(`Summary: ${rootTaskNode.contentSummary}`);

    // Add entities information
    if (rootTaskNode.entities) {
      if (rootTaskNode.entities.actors.length > 0) {
        parts.push(`Actors: ${rootTaskNode.entities.actors.join(', ')}`);
      }
      if (rootTaskNode.entities.systems.length > 0) {
        parts.push(`Systems: ${rootTaskNode.entities.systems.join(', ')}`);
      }
      if (rootTaskNode.entities.features.length > 0) {
        parts.push(`Features: ${rootTaskNode.entities.features.join(', ')}`);
      }
    }

    // Add sub-tasks information
    if (rootTaskNode.subTasks && rootTaskNode.subTasks.length > 0) {
      parts.push(`\nSub-tasks (${rootTaskNode.subTasks.length}):`);
      rootTaskNode.subTasks.forEach((subTask, index) => {
        parts.push(`${index + 1}. ${subTask.taskName}: ${subTask.contentSummary}`);
        
        // Add nested sub-tasks if any
        if (subTask.subTasks && subTask.subTasks.length > 0) {
          subTask.subTasks.forEach((nestedTask, nestedIndex) => {
            parts.push(`   ${index + 1}.${nestedIndex + 1}. ${nestedTask.taskName}: ${nestedTask.contentSummary}`);
          });
        }
      });
    }

    return parts.join('\n');
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
