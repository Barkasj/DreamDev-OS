// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ProjectDocument, TaskNode } from '$lib/types';

export class TextProcessorService {
  /**
   * Ekstraksi ringkasan proyek dari PRD text
   */
  public extractProjectSummary(prdText: string): string {
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
  public detectProjectType(prdText: string): string {
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
  public analyzeComplexity(project: ProjectDocument): 'simple' | 'medium' | 'complex' {
    const totalTasks = project.metadata?.totalTasks || 0;
    const uniqueSystems = project.metadata?.entityStats?.uniqueSystems?.length || 0;
    const uniqueFeatures = project.metadata?.entityStats?.uniqueFeatures?.length || 0;

    // Hitung skor kompleksitas
    let complexityScore = 0;

    // Berdasarkan jumlah task (skor lebih rendah untuk medium)
    if (totalTasks > 20) complexityScore += 3;
    else if (totalTasks > 10) complexityScore += 2;
    else if (totalTasks >= 5) complexityScore += 1;

    // Berdasarkan jumlah sistem (skor lebih rendah untuk medium)
    if (uniqueSystems > 8) complexityScore += 3;
    else if (uniqueSystems >= 5) complexityScore += 2;
    else if (uniqueSystems > 2) complexityScore += 1;

    // Berdasarkan jumlah fitur (skor lebih rendah untuk medium)
    if (uniqueFeatures > 15) complexityScore += 2;
    else if (uniqueFeatures >= 5) complexityScore += 1;

    // Tentukan level kompleksitas (threshold lebih rendah)
    // Adjusted thresholds: simple < 3, medium < 6, complex >= 6
    if (complexityScore >= 6) return 'complex'; // Adjusted from 5
    if (complexityScore >= 3) return 'medium';  // Adjusted from 2
    return 'simple';
  }

  /**
   * Ekstraksi tech stack dari proyek
   */
  public extractTechStack(project: ProjectDocument): string[] {
    const techStack = new Set<string>();

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

    const prdText = project.originalPrdText?.toLowerCase() || ''; // Add null check for originalPrdText
    for (const tech of commonTech) {
      if (prdText.includes(tech.toLowerCase())) {
        techStack.add(tech);
      }
    }

    if (project.taskTree) {
      const flatTasks = this.flattenTaskTree(project.taskTree);
      for (const task of flatTasks) {
        if (task.entities && task.entities.systems) {
          for (const system of task.entities.systems) {
            if (system && system.length > 2) { // Add null check for system
              techStack.add(system.toLowerCase()); // Standardize to lowercase
            }
          }
        }
      }
    }

    return Array.from(techStack).slice(0, 8);
  }

  /**
   * Generate ringkasan untuk module
   */
  public generateModuleSummary(taskNode: TaskNode): string {
    let summary = taskNode.contentSummary || ''; // Add null check

    if (summary.length > 300) {
      summary = summary.substring(0, 300) + "...";
    }

    if (taskNode.subTasks && taskNode.subTasks.length > 0) {
      summary += ` (Mencakup ${taskNode.subTasks.length} sub-task)`;
    }

    return summary;
  }

  /**
   * Flatten task tree menjadi array linear
   */
  public flattenTaskTree(tasks: TaskNode[]): TaskNode[] {
    const result: TaskNode[] = [];
    if (!tasks) return result; // Add null check

    for (const task of tasks) {
      if (!task) continue; // Add null check
      result.push(task);
      if (task.subTasks && task.subTasks.length > 0) {
        result.push(...this.flattenTaskTree(task.subTasks));
      }
    }

    return result;
  }

  /**
   * Extract relevant keywords for chunk selection
   */
  public extractRelevantKeywords(text: string, contextType: 'global' | 'module'): string[] {
    const keywordsSet = new Set<string>(); // Use a Set to avoid duplicates from the start

    const techKeywords = [
      'implementation', 'system', 'module', 'component', 'service', 'api', 'database',
      'authentication', 'authorization', 'security', 'performance', 'scalability',
      'architecture', 'design', 'requirements', 'features', 'functionality',
      'integration', 'testing', 'deployment', 'configuration', 'optimization'
    ];

    let contextSpecificKeywords: string[] = [];
    if (contextType === 'global') {
      contextSpecificKeywords = [
        'project', 'overview', 'summary', 'objectives', 'goals', 'scope',
        'technology', 'stack', 'platform', 'infrastructure', 'framework'
      ];
    } else {
      contextSpecificKeywords = [
        'task', 'step', 'process', 'workflow', 'procedure', 'method',
        'algorithm', 'logic', 'business', 'rules', 'validation', 'processing'
      ];
    }

    const lowerText = text?.toLowerCase() || ''; // Add null check

    [...techKeywords, ...contextSpecificKeywords].forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywordsSet.add(keyword);
      }
    });

    const domainKeywords = this.extractDomainKeywords(text);
    domainKeywords.forEach(keyword => keywordsSet.add(keyword));

    return Array.from(keywordsSet).slice(0, 15);
  }

  /**
   * Extract domain-specific keywords from text
   */
  public extractDomainKeywords(text: string): string[] {
    const potentialKeywords = new Set<string>();
    if (!text) return [];

    let textWithoutQuoted = text;

    // 1. Extract and add quoted terms first
    const quotedTerms = text.match(/"([^"]+)"/g) || [];
    quotedTerms.forEach(quotedTermWithQuotes => {
      const term = quotedTermWithQuotes.replace(/"/g, '').trim();
      if (term.length > 2 && term.length < 50) {
        potentialKeywords.add(term);
      }
      // Replace the processed quoted term in the original text to avoid re-processing its content
      textWithoutQuoted = textWithoutQuoted.replace(quotedTermWithQuotes, '');
    });

    // 2. Process capitalized words from text where quoted terms have been removed
    // Regex: Prioritize multi-word/hyphenated Title Case, then PascalCase
    const capitalizedWords = textWithoutQuoted.match(/\b(?:[A-Z][a-z]+(?:[\s-][A-Z][a-z]+)+|[A-Z][a-zA-Z_]+)\b/g) || [];
    const commonStartingWords = ['The', 'This', 'That', 'An', 'A', 'With', 'From', 'When', 'Where', 'And', 'For', 'Into', 'Is', 'Are', 'Was', 'Were', 'It'];

    capitalizedWords
      .map(word => word.trim())
      .forEach(originalWord => {
        let termToProcess = originalWord;
        const parts = originalWord.split(' ');

        // If it's a multi-word term and starts with a common word, take the rest
        if (parts.length > 1 && commonStartingWords.includes(parts[0])) {
          termToProcess = parts.slice(1).join(' ');
        }

        // If, after removing common starting word, the term is empty (e.g., original was just "The"), skip.
        if (!termToProcess) {
          return;
        }

        // Now, check the termToProcess.
        // It must meet length criteria.
        // If it's a single word now (e.g. "UserManagement", or "Project" from "This Project"), it must not be a commonStartingWord itself.
        if (termToProcess.length > 3 && termToProcess.length < 30) {
          const termParts = termToProcess.split(' ');
          if (termParts.length === 1 && commonStartingWords.includes(termToProcess)) {
            // e.g. if originalWord was "The" and it was the only word, termToProcess is "The", commonStartingWords includes it, so skip.
            return;
          }
          potentialKeywords.add(termToProcess);
        }
      });
    // The following block for quotedTerms is redundant because it's handled at the beginning of the function now.
    // const quotedTerms = text.match(/"([^"]+)"/g) || [];
    // quotedTerms
    //   .map(term => term.replace(/"/g, '').trim())
    //   .filter(term => term.length > 2 && term.length < 50)
    //   .forEach(term => potentialKeywords.add(term));

    // Convert to array, unique (already handled by Set), then slice.
    // The previous slice was inside forEach, which is not what we want.
    // Slice should be at the very end.
    return Array.from(potentialKeywords).slice(0, 10);
  }

  /**
   * Generate detailed content for module chunking
   */
  public generateModuleDetailedContent(rootTaskNode: TaskNode): string {
    const parts: string[] = [];
    if (!rootTaskNode) return ''; // Add null check

    parts.push(`Module: ${rootTaskNode.taskName || 'Untitled Module'}`); // Add null check
    parts.push(`Summary: ${rootTaskNode.contentSummary || 'No summary available.'}`); // Add null check

    if (rootTaskNode.entities) {
      if (rootTaskNode.entities.actors && rootTaskNode.entities.actors.length > 0) {
        parts.push(`Actors: ${rootTaskNode.entities.actors.join(', ')}`);
      }
      if (rootTaskNode.entities.systems && rootTaskNode.entities.systems.length > 0) {
        parts.push(`Systems: ${rootTaskNode.entities.systems.join(', ')}`);
      }
      if (rootTaskNode.entities.features && rootTaskNode.entities.features.length > 0) {
        parts.push(`Features: ${rootTaskNode.entities.features.join(', ')}`);
      }
    }

    if (rootTaskNode.subTasks && rootTaskNode.subTasks.length > 0) {
      parts.push(`\nSub-tasks (${rootTaskNode.subTasks.length}):`);
      rootTaskNode.subTasks.forEach((subTask, index) => {
        if (!subTask) return; // Add null check
        parts.push(`${index + 1}. ${subTask.taskName || 'Untitled Subtask'}: ${subTask.contentSummary || 'No summary.'}`); // Add null check

        if (subTask.subTasks && subTask.subTasks.length > 0) {
          subTask.subTasks.forEach((nestedTask, nestedIndex) => {
            if (!nestedTask) return; // Add null check
            parts.push(`   ${index + 1}.${nestedIndex + 1}. ${nestedTask.taskName || 'Untitled Nested Subtask'}: ${nestedTask.contentSummary || 'No summary.'}`); // Add null check
          });
        }
      });
    }

    return parts.join('\n');
  }
}
