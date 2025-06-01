/**
 * Report Generator Service
 * Generates various types of reports from ProjectDocument data
 */

import { ProjectDocument, TaskNode, ModuleContext, ExtractedEntities } from '../types';

export class ReportGeneratorService {
  /**
   * Format date to Indonesian locale
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Generate Executive Summary report
   */
  public generateExecutiveSummary(project: ProjectDocument): string {
    let md = `# Executive Summary: Proyek "${project._id}"\n`;
    md += `**Tanggal Dibuat:** ${this.formatDate(new Date())}\n\n`;

    // 1. Ringkasan Umum Proyek
    md += `## 1. Ringkasan Umum Proyek\n`;
    const globalSummary = project.globalContextData?.summary || 
                         (typeof project.globalContext === 'string' ? project.globalContext : null) ||
                         'Informasi ringkasan umum tidak tersedia.';
    md += `${globalSummary}\n\n`;

    // 2. Tujuan Utama Proyek
    md += `## 2. Tujuan Utama Proyek\n`;
    md += `[Placeholder: Deskripsikan tujuan utama proyek berdasarkan analisis PRD lebih lanjut atau input pengguna.]\n\n`;

    // 3. Lingkup Utama Proyek
    md += `## 3. Lingkup Utama Proyek\n`;
    if (project.moduleContexts && project.moduleContexts.length > 0) {
      md += `Proyek ini mencakup modul-modul utama berikut:\n`;
      project.moduleContexts.forEach(mc => {
        const summary = mc.summary?.substring(0, 100) || 'Detail modul';
        md += `- **${mc.moduleTitle}**: ${summary}${mc.summary && mc.summary.length > 100 ? '...' : ''}\n`;
      });
    } else {
      md += `Lingkup modul utama belum terdefinisi secara spesifik.\n`;
    }
    md += `\n`;

    // 4. Estimasi Task dan Teknologi
    md += `## 4. Estimasi Task dan Teknologi\n`;
    const rootTaskCount = project.taskTree?.filter(t => t.level === 1).length || 0;
    md += `- Jumlah task/bagian utama teridentifikasi: ${rootTaskCount}\n`;
    
    const techStackHints = project.globalContextData?.techStackHints || ['Belum teridentifikasi'];
    md += `- Estimasi teknologi utama yang akan digunakan: ${techStackHints.join(', ')}\n\n`;
    
    // 5. Kesimpulan Singkat
    md += `## 5. Kesimpulan Singkat\n`;
    md += `[Placeholder: Berikan kesimpulan singkat mengenai potensi dan langkah selanjutnya.]\n\n`;
    
    return md;
  }

  /**
   * Render task node for technical specification with proper indentation
   */
  private renderTaskNodeForTechSpec(task: TaskNode, currentLevelIndent: number = 0): string {
    const indent = '  '.repeat(currentLevelIndent);
    const subTaskIndent = '  '.repeat(currentLevelIndent + 1);
    
    let taskMd = `${indent}- **${task.taskName}** (ID: ${task.id}, Level: ${task.level})\n`;
    
    // Add content summary (truncated)
    const summary = task.contentSummary.length > 200 
      ? task.contentSummary.substring(0, 200) + '...'
      : task.contentSummary;
    taskMd += `${subTaskIndent}*Ringkasan:* ${summary}\n`;
    
    // Add entities if available
    if (task.entities) {
      const actors = task.entities.actors.length > 0 ? task.entities.actors.join(', ') : 'N/A';
      const systems = task.entities.systems.length > 0 ? task.entities.systems.join(', ') : 'N/A';
      const features = task.entities.features.length > 0 ? task.entities.features.join(', ') : 'N/A';
      
      taskMd += `${subTaskIndent}*Entitas Terkait:* Aktor (${actors}), Sistem (${systems}), Fitur (${features})\n`;
    }
    
    // Add sub-tasks recursively
    if (task.subTasks && task.subTasks.length > 0) {
      taskMd += `${subTaskIndent}*Sub-Tasks:*\n`;
      task.subTasks.forEach(subTask => {
        taskMd += this.renderTaskNodeForTechSpec(subTask, currentLevelIndent + 2);
      });
    }
    
    return taskMd;
  }

  /**
   * Generate Technical Specification report
   */
  public generateTechnicalSpecification(project: ProjectDocument): string {
    let md = `# Spesifikasi Teknis: Proyek "${project._id}"\n`;
    md += `**Tanggal Dibuat:** ${this.formatDate(new Date())}\n\n`;

    // Bagian 1: Pendahuluan
    md += `## Bagian 1: Pendahuluan\n`;
    md += `Dokumen ini berisi spesifikasi teknis awal untuk proyek "${project._id}", yang dihasilkan secara otomatis berdasarkan analisis Product Requirements Document (PRD).\n`;
    md += `- **Tujuan Dokumen:** Memberikan gambaran teknis mengenai arsitektur, modul, komponen, dan rencana implementasi awal.\n`;
    md += `- **Referensi:** Dokumen PRD Asli (ID Proyek: ${project._id})\n\n`;

    // Bagian 2: Deskripsi Sistem Umum
    md += `## Bagian 2: Deskripsi Sistem Umum\n`;
    md += `### 2.1. Ringkasan Arsitektur\n`;
    
    const projectTypeHints = project.globalContextData?.projectTypeHints || 'N/A';
    const complexityLevel = project.globalContextData?.complexityLevel || 'N/A';
    const techStackHints = project.globalContextData?.techStackHints || ['N/A'];
    
    md += `[Placeholder: Deskripsi arsitektur umum sistem. Pertimbangkan: Tipe Proyek (${projectTypeHints}), Kompleksitas (${complexityLevel}), Teknologi Utama (${techStackHints.join(', ')}).]\n\n`;

    // Bagian 3: Detail Modul dan Komponen
    md += `## Bagian 3: Detail Modul dan Komponen (Berdasarkan Task Tree)\n`;
    if (project.taskTree && project.taskTree.length > 0) {
      const rootTasks = project.taskTree.filter(task => task.level === 1);
      
      rootTasks.forEach((rootTaskNode, index) => {
        md += `### 3.${index + 1}. Modul: ${rootTaskNode.taskName}\n`;
        md += `#### Detail Task Utama:\n`;
        md += this.renderTaskNodeForTechSpec(rootTaskNode, 0);
        md += `\n`;
      });
    } else {
      md += `Struktur modul dan komponen belum dapat dihasilkan dari PRD.\n\n`;
    }

    // Bagian 4: Model Data Awal
    md += `## Bagian 4: Model Data Awal (Placeholder)\n`;
    md += `[Placeholder: Deskripsikan entitas data utama, atribut, dan relasinya. Ini dapat diekstrak lebih lanjut dari PRD atau memerlukan analisis tambahan.]\n\n`;

    // Bagian 5: Rencana Implementasi Awal
    md += `## Bagian 5: Rencana Implementasi Awal\n`;
    md += `Berikut adalah urutan task utama yang diidentifikasi untuk implementasi awal:\n`;
    if (project.taskTree && project.taskTree.length > 0) {
      const rootTasks = project.taskTree.filter(t => t.level === 1);
      rootTasks.forEach((task, index) => {
        md += `${index + 1}. ${task.taskName}\n`;
      });
    } else {
      md += `Rencana implementasi belum dapat dibuat.\n`;
    }
    md += `\n`;

    // Lampiran
    md += `## Lampiran\n`;
    md += `[Placeholder untuk lampiran, seperti diagram arsitektur (jika bisa digenerate), daftar API, dll.]\n\n`;

    return md;
  }

  /**
   * Get available report types
   */
  public getAvailableReportTypes(): string[] {
    return ['executive-summary', 'technical-specification'];
  }

  /**
   * Validate report type
   */
  public isValidReportType(reportType: string): boolean {
    return this.getAvailableReportTypes().includes(reportType);
  }

  /**
   * Get report type display name
   */
  public getReportTypeDisplayName(reportType: string): string {
    const displayNames: Record<string, string> = {
      'executive-summary': 'Executive Summary',
      'technical-specification': 'Technical Specification'
    };
    return displayNames[reportType] || reportType;
  }
}