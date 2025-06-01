/**
 * Context Stack Manager Service
 * Mengelola ekstraksi, penyimpanan, dan pengambilan berbagai lapisan konteks
 * untuk meningkatkan kualitas prompt yang dihasilkan
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ProjectDocument, GlobalContext, ModuleContext, StepContext, TaskNode, ExtractedEntities } from '../types';

export class ContextStackManagerService {
  /**
   * Ekstraksi Global Context dari ProjectDocument
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

      return {
        projectId: project._id,
        summary,
        projectTypeHints,
        complexityLevel,
        techStackHints,
      };
    } catch (error) {
      console.error('Error extracting global context:', error);
      return null;
    }
  }

  /**
   * Ekstraksi Module Contexts dari task tree
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
          const moduleContext: ModuleContext = {
            moduleId: rootTaskNode.id,
            moduleTitle: rootTaskNode.taskName,
            summary: this.generateModuleSummary(rootTaskNode),
            relatedEntities: rootTaskNode.entities,
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
}
