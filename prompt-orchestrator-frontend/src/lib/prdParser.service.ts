/**
 * PRD Parser Service untuk Next.js
 * Adapted dari backend service untuk parsing PRD documents
 */

import { v4 as uuidv4 } from 'uuid';
import { ExtractedEntities, TaskNode, ParsedSection, PrdProcessingResult } from '@/types';

export class PrdParserService {
  /**
   * Mendeteksi sections dalam teks PRD berdasarkan heading Markdown
   */
  detectSections(prdText: string): ParsedSection[] {
    // Handle null, undefined, or non-string inputs
    if (!prdText || typeof prdText !== 'string') {
      return [];
    }

    // Convert literal \n to actual newlines
    const normalizedText = prdText.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');
    const sections: ParsedSection[] = [];
    let currentSection: Partial<ParsedSection> | null = null;
    let contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Simpan section sebelumnya jika ada
        if (currentSection) {
          const content = contentLines.join('\n').trim();
          const entities = this.extractEntities(content);

          sections.push({
            id: currentSection.id!,
            title: currentSection.title!,
            level: currentSection.level!,
            content,
            entities
          });
        }

        // Buat section baru
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        currentSection = {
          id: uuidv4(),
          title,
          level
        };

        contentLines = [];
      } else {
        // Tambahkan line ke content section saat ini
        if (currentSection) {
          contentLines.push(line);
        }
      }
    }

    // Jangan lupa section terakhir
    if (currentSection) {
      const content = contentLines.join('\n').trim();
      const entities = this.extractEntities(content);
      
      sections.push({
        id: currentSection.id!,
        title: currentSection.title!,
        level: currentSection.level!,
        content,
        entities
      });
    }

    return sections;
  }

  /**
   * Extract entities dari content section
   */
  extractEntities(content: string): ExtractedEntities {
    const actors: string[] = [];
    const systems: string[] = [];
    const features: string[] = [];

    // Simple keyword-based extraction
    const actorKeywords = ['user', 'admin', 'developer', 'pengguna', 'administrator', 'stakeholder'];
    const systemKeywords = ['sistem', 'system', 'database', 'api', 'service', 'server', 'aplikasi'];
    const featureKeywords = ['fitur', 'feature', 'fungsi', 'function', 'modul', 'module', 'komponen'];

    const lowerContent = content.toLowerCase();

    // Extract actors
    actorKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        actors.push(keyword);
      }
    });

    // Extract systems
    systemKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        systems.push(keyword);
      }
    });

    // Extract features
    featureKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        features.push(keyword);
      }
    });

    return {
      actors: [...new Set(actors)], // Remove duplicates
      systems: [...new Set(systems)],
      features: [...new Set(features)]
    };
  }

  /**
   * Build task tree dari parsed sections
   */
  buildTaskTree(sections: ParsedSection[]): TaskNode[] {
    const tasks: TaskNode[] = [];
    const parentStack: TaskNode[] = [];

    for (const section of sections) {
      const task: TaskNode = {
        id: section.id,
        taskName: section.title, // Ini sudah benar - hanya title, bukan content
        level: section.level,
        contentSummary: section.content,
        entities: section.entities,
        subTasks: [],
        status: 'pending',
        dependencies: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: 'medium',
          riskLevel: 'low'
        }
      };

      // Manage parent-child relationships
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= task.level) {
        parentStack.pop();
      }

      if (parentStack.length > 0) {
        // Add as subtask to parent
        parentStack[parentStack.length - 1].subTasks.push(task);
      } else {
        // Add as root task
        tasks.push(task);
      }

      parentStack.push(task);
    }

    return tasks;
  }

  /**
   * Process PRD text dan return complete result
   */
  processPrd(prdText: string): PrdProcessingResult {
    const startTime = new Date();
    
    // Handle null, undefined, or non-string inputs
    if (!prdText || typeof prdText !== 'string') {
      const endTime = new Date();
      return {
        taskTree: [],
        totalTasks: 0,
        entityStats: {
          totalActors: 0,
          totalSystems: 0,
          totalFeatures: 0,
          uniqueActors: [],
          uniqueSystems: [],
          uniqueFeatures: []
        },
        processingMetadata: {
          startTime,
          endTime,
          processingDuration: endTime.getTime() - startTime.getTime(),
          inputSize: 0
        }
      };
    }
    
    const sections = this.detectSections(prdText);
    const taskTree = this.buildTaskTree(sections);
    
    const endTime = new Date();
    const processingDuration = endTime.getTime() - startTime.getTime();

    // Calculate statistics
    const totalTasks = this.countTotalTasks(taskTree);
    const levelDistribution = this.calculateLevelDistribution(taskTree);
    const entityStats = this.calculateEntityStats(taskTree);

    return {
      sections,
      taskTree,
      totalTasks,
      levelDistribution,
      entityStats,
      processingMetadata: {
        startTime,
        endTime,
        processingDuration,
        inputSize: prdText.length
      }
    };
  }

  /**
   * Count total tasks in tree (including subtasks)
   */
  private countTotalTasks(tasks: TaskNode[]): number {
    let count = 0;
    for (const task of tasks) {
      count += 1 + this.countTotalTasks(task.subTasks);
    }
    return count;
  }

  /**
   * Calculate level distribution
   */
  private calculateLevelDistribution(tasks: TaskNode[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    
    const countLevel = (tasks: TaskNode[]) => {
      for (const task of tasks) {
        distribution[task.level] = (distribution[task.level] || 0) + 1;
        countLevel(task.subTasks);
      }
    };
    
    countLevel(tasks);
    return distribution;
  }

  /**
   * Calculate entity statistics
   */
  private calculateEntityStats(tasks: TaskNode[]) {
    const allActors = new Set<string>();
    const allSystems = new Set<string>();
    const allFeatures = new Set<string>();

    const collectEntities = (tasks: TaskNode[]) => {
      for (const task of tasks) {
        task.entities.actors.forEach(actor => allActors.add(actor));
        task.entities.systems.forEach(system => allSystems.add(system));
        task.entities.features.forEach(feature => allFeatures.add(feature));
        collectEntities(task.subTasks);
      }
    };

    collectEntities(tasks);

    return {
      totalActors: allActors.size,
      totalSystems: allSystems.size,
      totalFeatures: allFeatures.size,
      uniqueActors: Array.from(allActors),
      uniqueSystems: Array.from(allSystems),
      uniqueFeatures: Array.from(allFeatures)
    };
  }
}
