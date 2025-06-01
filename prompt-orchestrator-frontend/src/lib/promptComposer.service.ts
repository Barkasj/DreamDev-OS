/**
 * Prompt Composer Service untuk Next.js
 * Menghandle komposisi prompt terstruktur dari TaskNode dengan dukungan ProjectDocument
 */

import { TaskNode, PromptCompositionResult, ProjectDocument, ExtractedEntities, StepContext } from '../types';
import { ContextStackManagerService } from './contextStackManager.service';

export class PromptComposerService {
  private contextStackManager: ContextStackManagerService;

  constructor() {
    this.contextStackManager = new ContextStackManagerService();
  }

  /**
   * Compose prompt dengan metadata dari ProjectDocument (method utama untuk API)
   */
  composePromptWithMetadataFromProject(
    task: TaskNode,
    project: ProjectDocument
  ): PromptCompositionResult {
    // Generate step identifier
    const stepIdentifier = this.generateStepIdentifier(task);

    // Generate enhanced context stack
    const contextStackSection = this.generateEnhancedContextStack(task, project);

    // Generate dynamic content sections
    const previousStepsInfo = this.determinePreviousStepsInfo(task, project);
    const nextStepsInfo = this.determineNextStepsInfo(task, project);
    const entitiesInfo = this.formatEntities(task.entities);
    const objective = this.generateEnhancedObjective(task, project);
    const executionPrompt = this.generateEnhancedExecutionPrompt(task, project);
    const successCriteria = this.generateEnhancedSuccessCriteria(task, project);
    const debugAssistance = this.generateEnhancedDebugAssistance(task, project);

    // Current Step Requirements
    const currentStepRequirements = `${task.contentSummary}\n\n${entitiesInfo}`;

    // Compose full prompt
    const promptText = `
## ${stepIdentifier}: ${task.taskName}

### 🎯 Objective
${objective}

### 🧠 Context Stack
${contextStackSection}
- Previous Steps Results: ${previousStepsInfo}
- Current Step Requirements:
  ${currentStepRequirements.split('\n').map(line => `  ${line}`).join('\n')}

### 🧩 Execution Prompt
${executionPrompt}

### ✅ Success Criteria
${successCriteria}

### 🛠️ Debug Assistance
${debugAssistance}

### 🔗 Next Steps
${nextStepsInfo}
`.trim();

    // Calculate metadata
    const lineCount = promptText.split('\n').length;
    const characterCount = promptText.length;

    return {
      promptText,
      metadata: {
        taskId: task.id,
        taskName: task.taskName,
        level: task.level,
        characterCount,
        lineCount,
        generatedAt: new Date(),
        detectedEntities: task.entities
      }
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Generate enhanced context stack dengan lapisan konteks yang berlapis dan chunked content
   */
  private generateEnhancedContextStack(task: TaskNode, project: ProjectDocument): string {
    const contextSections: string[] = [];

    // Global Project Context dengan chunked details
    const globalContextInfo = this.generateGlobalContextInfoWithChunks(project);
    contextSections.push(`- **Global Project Context**: ${globalContextInfo}`);

    // Module Context dengan chunked details
    const moduleContextInfo = this.generateModuleContextInfoWithChunks(task, project);
    if (moduleContextInfo) {
      contextSections.push(`- **Module Context**: ${moduleContextInfo}`);
    }

    // Step Context
    const stepContext = this.contextStackManager.getStepContext(task);
    const stepContextInfo = this.generateStepContextInfo(stepContext);
    contextSections.push(`- **Step Context**: ${stepContextInfo}`);

    return contextSections.join('\n');
  }

  /**
   * Generate global context information
   */
  private generateGlobalContextInfo(project: ProjectDocument): string {
    // Prioritas: gunakan globalContextData jika ada, fallback ke globalContext
    if (project.globalContextData) {
      const gcd = project.globalContextData;
      const techStack = gcd.techStackHints?.join(', ') || 'N/A';
      return `${gcd.summary || 'N/A'} (Tipe: ${gcd.projectTypeHints || 'N/A'}, Kompleksitas: ${gcd.complexityLevel || 'N/A'}, Tech Stack: ${techStack})`;
    }

    // Fallback ke method lama
    return this.generateGlobalContextSummary(project);
  }

  /**
   * Generate module context information
   */
  private generateModuleContextInfo(task: TaskNode, project: ProjectDocument): string | null {
    if (!project.moduleContexts || project.moduleContexts.length === 0) {
      return null;
    }

    // Cari module context yang relevan
    const relevantModule = this.contextStackManager.findRelevantModuleContext(
      task,
      project.moduleContexts
    );

    if (!relevantModule) {
      return null;
    }

    const entitiesInfo = relevantModule.relatedEntities
      ? `Entitas: ${this.formatEntitiesInline(relevantModule.relatedEntities)}`
      : '';

    return `Modul '${relevantModule.moduleTitle}' - ${relevantModule.summary || 'N/A'}. ${entitiesInfo}`;
  }

  /**
   * Generate global context information with chunked details
   */
  private generateGlobalContextInfoWithChunks(project: ProjectDocument): string {
    // Get basic context info
    const basicInfo = this.generateGlobalContextInfo(project);
    
    // Add chunked details if available
    if (project.globalContextData?.detailedChunks && project.globalContextData.detailedChunks.length > 0) {
      const chunks = project.globalContextData.detailedChunks;
      const chunkDetails = chunks.slice(0, 2).map((chunk, index) => {
        const preview = chunk.content.length > 200 
          ? chunk.content.substring(0, 200) + '...' 
          : chunk.content;
        return `\n  - Detail Konteks Global (Bagian ${index + 1}/${chunks.length}): ${preview}`;
      }).join('');
      
      return basicInfo + chunkDetails;
    }
    
    return basicInfo;
  }

  /**
   * Generate module context information with chunked details
   */
  private generateModuleContextInfoWithChunks(task: TaskNode, project: ProjectDocument): string | null {
    if (!project.moduleContexts || project.moduleContexts.length === 0) {
      return null;
    }

    // Cari module context yang relevan
    const relevantModule = this.contextStackManager.findRelevantModuleContext(
      task,
      project.moduleContexts
    );

    if (!relevantModule) {
      return null;
    }

    // Get basic module info
    const entitiesInfo = relevantModule.relatedEntities
      ? `Entitas: ${this.formatEntitiesInline(relevantModule.relatedEntities)}`
      : '';

    let moduleInfo = `Modul '${relevantModule.moduleTitle}' - ${relevantModule.summary || 'N/A'}. ${entitiesInfo}`;

    // Add chunked details if available
    if (relevantModule.detailedChunks && relevantModule.detailedChunks.length > 0) {
      const chunks = relevantModule.detailedChunks;
      const chunkDetails = chunks.slice(0, 1).map((chunk, index) => {
        const preview = chunk.content.length > 150 
          ? chunk.content.substring(0, 150) + '...' 
          : chunk.content;
        return `\n  - Detail Modul (Bagian ${index + 1}/${chunks.length}): ${preview}`;
      }).join('');
      
      moduleInfo += chunkDetails;
    }

    return moduleInfo;
  }

  /**
   * Generate step context information
   */
  private generateStepContextInfo(stepContext: StepContext): string {
    const entitiesInfo = this.formatEntitiesInline(stepContext.relevantEntities);
    return `Task '${stepContext.taskId}' - ${stepContext.stepSummary.substring(0, 150)}... Entitas: ${entitiesInfo}`;
  }

  /**
   * Format entities dalam satu baris
   */
  private formatEntitiesInline(entities: ExtractedEntities): string {
    const parts: string[] = [];

    if (entities.actors && entities.actors.length > 0) {
      parts.push(`Aktor: ${entities.actors.slice(0, 3).join(', ')}`);
    }
    if (entities.systems && entities.systems.length > 0) {
      parts.push(`Sistem: ${entities.systems.slice(0, 3).join(', ')}`);
    }
    if (entities.features && entities.features.length > 0) {
      parts.push(`Fitur: ${entities.features.slice(0, 3).join(', ')}`);
    }

    return parts.length > 0 ? parts.join('; ') : 'Tidak ada entitas teridentifikasi';
  }

  /**
   * Generate step identifier untuk task
   */
  private generateStepIdentifier(task: TaskNode): string {
    const shortId = task.id.split('-')[0];
    return `Step ${task.level}.${shortId}`;
  }

  /**
   * Extract common project context information
   */
  private extractProjectContext(project: ProjectDocument): {
    projectContext: string;
    totalTasks: number;
    projectTechStack: string[];
  } {
    return {
      projectContext: project.globalContext || 'proyek ini',
      totalTasks: project.metadata?.totalTasks || 0,
      projectTechStack: this.extractTechStackFromProject(project)
    };
  }

  /**
   * Generate common debugging sections
   */
  private generateCommonDebuggingSections(): string[] {
    return [
      "1. 🔍 **Analisis Error**: Periksa error messages dan stack traces dengan teliti",
      "2. 📋 **Dependency Check**: Pastikan semua dependencies telah diinstall dan dikonfigurasi dengan benar",
      "3. 🧪 **Incremental Testing**: Test implementasi secara bertahap, mulai dari unit terkecil"
    ];
  }

  /**
   * Generate task-type specific guidance
   */
  private generateTaskTypeGuidance(taskType: string): string[] {
    const guidance: string[] = [];

    if (taskType === 'database') {
      guidance.push("1. Desain skema database dengan mempertimbangkan normalisasi dan performa");
      guidance.push("2. Buat migration scripts atau DDL statements");
      guidance.push("3. Implementasikan indexes yang diperlukan");
      guidance.push("4. Setup connection dan configuration");
    } else if (taskType === 'api') {
      guidance.push("1. Definisikan API endpoints dan HTTP methods");
      guidance.push("2. Implementasikan request/response validation");
      guidance.push("3. Tambahkan error handling dan status codes");
      guidance.push("4. Dokumentasikan API dengan OpenAPI/Swagger");
    } else if (taskType === 'frontend') {
      guidance.push("1. Buat component structure dan props interface");
      guidance.push("2. Implementasikan UI/UX sesuai design requirements");
      guidance.push("3. Integrasikan dengan backend APIs");
      guidance.push("4. Tambahkan state management dan event handling");
    } else {
      guidance.push("1. Analisis requirements dan dependencies");
      guidance.push("2. Buat implementasi sesuai best practices");
      guidance.push("3. Tambahkan error handling yang robust");
      guidance.push("4. Dokumentasikan code dan API");
    }

    return guidance;
  }

  /**
   * Generate task-type specific success criteria
   */
  private generateTaskTypeSuccessCriteria(taskType: string): string[] {
    const criteria: string[] = [];

    if (taskType === 'database') {
      criteria.push("✅ Database schema berfungsi dengan benar dan dapat menyimpan/mengambil data");
      criteria.push("✅ Migration scripts berhasil dijalankan tanpa error");
      criteria.push("✅ Performance query memenuhi standar yang ditetapkan");
    } else if (taskType === 'api') {
      criteria.push("✅ API endpoints merespons dengan status codes yang benar");
      criteria.push("✅ Request/response validation berfungsi dengan baik");
      criteria.push("✅ API documentation (Swagger/OpenAPI) telah diperbarui");
    } else if (taskType === 'frontend') {
      criteria.push("✅ Component render dengan benar di berbagai screen sizes");
      criteria.push("✅ User interactions berfungsi sesuai expected behavior");
      criteria.push("✅ Integration dengan backend APIs berhasil");
    }

    return criteria;
  }

  /**
   * Generate task-type specific debugging guidance
   */
  private generateTaskTypeDebugging(taskType: string): string[] {
    const debugging: string[] = [];

    if (taskType === 'database') {
      debugging.push("- Verifikasi database connection dan credentials");
      debugging.push("- Periksa schema migrations dan data integrity");
      debugging.push("- Monitor query performance dan indexing");
    } else if (taskType === 'api') {
      debugging.push("- Test endpoints dengan tools seperti Postman atau curl");
      debugging.push("- Verifikasi request/response headers dan content-type");
      debugging.push("- Periksa authentication dan authorization logic");
    } else if (taskType === 'frontend') {
      debugging.push("- Gunakan browser developer tools untuk debugging");
      debugging.push("- Periksa network requests dan API responses");
      debugging.push("- Verifikasi component props dan state changes");
    }

    return debugging;
  }

  /**
   * Generate global context summary dari ProjectDocument
   */
  private generateGlobalContextSummary(project: ProjectDocument): string {
    // Gunakan globalContext yang sudah ada, atau buat ringkasan dari originalPrdText
    if (project.globalContext && project.globalContext.trim().length > 0) {
      return project.globalContext;
    }

    // Fallback: buat ringkasan dari originalPrdText
    const prdSummary = project.originalPrdText.substring(0, 500) +
                      (project.originalPrdText.length > 500 ? "..." : "");

    return `Mengerjakan proyek '${project._id}'. Ringkasan PRD: ${prdSummary} (Lihat dokumen PRD lengkap untuk detail menyeluruh).`;
  }

  /**
   * Generate enhanced objective berdasarkan task dan project context
   */
  private generateEnhancedObjective(task: TaskNode, project: ProjectDocument): string {
    const taskType = this.detectTaskType(task);
    const mainSystems = task.entities.systems.slice(0, 2).join(', ');
    const mainFeatures = task.entities.features.slice(0, 2).join(', ');
    const { projectContext, totalTasks } = this.extractProjectContext(project);

    let objective = `Menyelesaikan dan mengimplementasikan: ${task.taskName} sebagai bagian dari ${projectContext}.`;

    // Enhance based on task type and entities
    if (taskType === 'database' && mainSystems) {
      objective = `Merancang dan mengimplementasikan komponen database untuk ${task.taskName} menggunakan ${mainSystems} sesuai dengan kebutuhan ${projectContext}.`;
    } else if (taskType === 'api' && mainFeatures) {
      objective = `Mengembangkan API endpoint untuk ${task.taskName} yang mendukung fitur ${mainFeatures} dengan fokus pada performa dan keamanan dalam konteks ${projectContext}.`;
    } else if (taskType === 'frontend' && mainFeatures) {
      objective = `Membangun komponen frontend untuk ${task.taskName} yang mengimplementasikan ${mainFeatures} dengan user experience yang optimal untuk ${projectContext}.`;
    } else if (mainSystems || mainFeatures) {
      const context = mainSystems ? `sistem ${mainSystems}` : `fitur ${mainFeatures}`;
      objective = `Mengimplementasikan ${task.taskName} dengan fokus pada ${context} sesuai spesifikasi ${projectContext}.`;
    }

    // Add task progress context if available
    if (totalTasks > 0) {
      objective += ` (Task ini adalah bagian dari ${totalTasks} total tasks dalam proyek)`;
    }

    return objective;
  }

  /**
   * Detect task type berdasarkan entities dan content
   */
  private detectTaskType(task: TaskNode): string {
    const content = task.contentSummary.toLowerCase();
    const systems = task.entities.systems.join(' ').toLowerCase();
    const taskName = task.taskName.toLowerCase();

    if (content.includes('database') || content.includes('schema') || systems.includes('mongodb') || systems.includes('mysql')) {
      return 'database';
    }
    if (content.includes('api') || content.includes('endpoint') || taskName.includes('api')) {
      return 'api';
    }
    if (content.includes('frontend') || content.includes('ui') || content.includes('component') || systems.includes('react') || systems.includes('next')) {
      return 'frontend';
    }
    if (content.includes('auth') || content.includes('login') || content.includes('security')) {
      return 'authentication';
    }

    return 'general';
  }

  /**
   * Determine previous steps info berdasarkan dependencies
   */
  private determinePreviousStepsInfo(task: TaskNode, project: ProjectDocument): string {
    if (!task.dependencies || task.dependencies.length === 0) {
      return "Tidak ada dependensi task sebelumnya yang diperlukan.";
    }

    const dependentTaskNames: string[] = [];

    // Cari nama task dari dependencies
    for (const depId of task.dependencies) {
      const depTask = this.findTaskByIdRecursive(project.taskTree, depId);
      if (depTask) {
        dependentTaskNames.push(`'${depTask.taskName}' (ID: ${depId})`);
      } else {
        dependentTaskNames.push(`Task dengan ID: ${depId} (tidak ditemukan)`);
      }
    }

    if (dependentTaskNames.length === 0) {
      return "Dependencies ditemukan tetapi task tidak dapat diidentifikasi.";
    }

    return `Keberhasilan penyelesaian task: ${dependentTaskNames.join(', ')}. Output dari task-task ini harus dipertimbangkan dalam implementasi.`;
  }

  /**
   * Determine next steps info berdasarkan subTasks dan sibling tasks
   */
  private determineNextStepsInfo(task: TaskNode, project: ProjectDocument): string {
    const nextSteps: string[] = [];

    // Check sub-tasks
    if (task.subTasks && task.subTasks.length > 0) {
      const firstSubTasks = task.subTasks.slice(0, 3).map(st => `'${st.taskName}'`);
      nextSteps.push(`Sub-tasks berikutnya: ${firstSubTasks.join(', ')}`);

      if (task.subTasks.length > 3) {
        nextSteps.push(`dan ${task.subTasks.length - 3} sub-task lainnya`);
      }
    }

    // Find sibling or parent next task
    const siblingNext = this.findSiblingOrParentNextTask(task, project.taskTree);
    if (siblingNext) {
      nextSteps.push(`Task selanjutnya pada level yang sama: '${siblingNext}'`);
    }

    if (nextSteps.length === 0) {
      return "Ini adalah task terakhir dalam alur atau cabang ini. Lanjutkan ke review dan testing keseluruhan.";
    }

    return nextSteps.join('. ');
  }

  /**
   * Find task by ID recursively dalam task tree
   */
  private findTaskByIdRecursive(tasks: TaskNode[], taskId: string): TaskNode | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }

      // Cari di subTasks secara rekursif
      if (task.subTasks && task.subTasks.length > 0) {
        const found = this.findTaskByIdRecursive(task.subTasks, taskId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Find sibling or parent next task
   */
  private findSiblingOrParentNextTask(task: TaskNode, allTasks: TaskNode[]): string | null {
    // Implementasi sederhana: cari task dengan level yang sama dan ID yang lebih besar
    const flatTasks = this.flattenTaskTree(allTasks);
    const currentIndex = flatTasks.findIndex(t => t.id === task.id);

    if (currentIndex >= 0 && currentIndex < flatTasks.length - 1) {
      // Cari task berikutnya yang levelnya sama atau lebih tinggi (angka level lebih kecil atau sama)
      for (let i = currentIndex + 1; i < flatTasks.length; i++) {
        const nextTask = flatTasks[i];
        if (nextTask.level <= task.level) {
          return nextTask.taskName;
        }
      }
    }

    return null;
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

  /**
   * Format entities menjadi string yang readable
   */
  private formatEntities(entities: ExtractedEntities): string {
    const parts: string[] = [];

    if (entities.actors && entities.actors.length > 0) {
      parts.push(`- Aktor Teridentifikasi: ${entities.actors.join(', ')}`);
    }

    if (entities.systems && entities.systems.length > 0) {
      parts.push(`- Sistem/Modul Terkait: ${entities.systems.join(', ')}`);
    }

    if (entities.features && entities.features.length > 0) {
      parts.push(`- Fitur Terkait: ${entities.features.join(', ')}`);
    }

    if (parts.length === 0) {
      return "Tidak ada entitas khusus yang teridentifikasi.";
    }

    return `Entitas Terkait:\n${parts.join('\n')}`;
  }

  /**
   * Generate enhanced execution prompt
   */
  private generateEnhancedExecutionPrompt(task: TaskNode, project: ProjectDocument): string {
    const taskType = this.detectTaskType(task);
    const mainSystems = task.entities.systems.slice(0, 3);
    const mainFeatures = task.entities.features.slice(0, 3);
    const { projectContext, projectTechStack } = this.extractProjectContext(project);

    const basePrompt = `Uraikan langkah-langkah teknis yang diperlukan untuk mencapai objective task '${task.taskName}' dalam konteks ${projectContext}.`;

    // Get task type specific guidance
    const specificGuidance = this.generateTaskTypeGuidance(taskType);

    // Add technology-specific considerations
    if (mainSystems.length > 0) {
      specificGuidance.push(`\nPertimbangkan teknologi: ${mainSystems.join(', ')}.`);
    }

    if (mainFeatures.length > 0) {
      specificGuidance.push(`Fitur yang harus diimplementasikan: ${mainFeatures.join(', ')}.`);
    }

    // Add project-specific tech stack considerations
    if (projectTechStack.length > 0) {
      specificGuidance.push(`\nTech stack proyek: ${projectTechStack.join(', ')} - pastikan implementasi konsisten dengan arsitektur proyek.`);
    }

    specificGuidance.push("\nOutput yang diharapkan: Working code dengan dokumentasi, unit tests, dan integration tests.");

    return `${basePrompt}\n\n${specificGuidance.join('\n')}`;
  }

  /**
   * Generate enhanced success criteria
   */
  private generateEnhancedSuccessCriteria(task: TaskNode, project: ProjectDocument): string {
    const taskType = this.detectTaskType(task);
    const { projectContext, totalTasks } = this.extractProjectContext(project);
    const criteria: string[] = [];

    // Base criteria with project context
    criteria.push(`✅ Task '${task.taskName}' berhasil diimplementasikan sesuai spesifikasi ${projectContext}`);

    // Add task type specific criteria
    criteria.push(...this.generateTaskTypeSuccessCriteria(taskType));

    // Universal criteria
    criteria.push("✅ Unit tests coverage minimal 80% dan semua tests pass");
    criteria.push("✅ Code review checklist terpenuhi (clean code, documentation, error handling)");
    criteria.push("✅ Integration tests (jika applicable) berhasil dijalankan");

    // Dependencies criteria
    if (task.dependencies && task.dependencies.length > 0) {
      criteria.push("✅ Integrasi dengan dependent tasks berfungsi dengan baik");
    }

    // Project-specific criteria
    if (totalTasks > 1) {
      criteria.push(`✅ Implementasi konsisten dengan ${totalTasks - 1} tasks lainnya dalam proyek`);
    }

    // Add project completion criteria if this is near the end
    const taskProgress = this.calculateTaskProgress(task, project);
    if (taskProgress > 0.8) {
      criteria.push("✅ Persiapan untuk deployment dan production readiness check");
    }

    return criteria.join('\n');
  }

  /**
   * Generate enhanced debug assistance
   */
  private generateEnhancedDebugAssistance(task: TaskNode, project: ProjectDocument): string {
    const taskType = this.detectTaskType(task);
    const mainSystems = task.entities.systems;
    const { projectContext, projectTechStack } = this.extractProjectContext(project);
    const debugSections: string[] = [];

    // General debugging guidance with project context
    debugSections.push(`Jika mengalami kesulitan dalam implementasi '${task.taskName}' untuk ${projectContext}, pertimbangkan:`);
    debugSections.push(...this.generateCommonDebuggingSections());

    // Technology-specific debugging
    if (mainSystems.length > 0) {
      debugSections.push("\n**Technology-Specific Debugging:**");

      for (const system of mainSystems.slice(0, 3)) {
        const systemLower = system.toLowerCase();

        if (systemLower.includes('mongodb')) {
          debugSections.push("- **MongoDB**: Periksa connection string, database permissions, dan collection schemas");
        } else if (systemLower.includes('next') || systemLower.includes('react')) {
          debugSections.push("- **Next.js/React**: Periksa component lifecycle, state management, dan browser console errors");
        } else if (systemLower.includes('api') || systemLower.includes('express')) {
          debugSections.push("- **API/Express**: Periksa route definitions, middleware order, dan request/response formats");
        } else if (systemLower.includes('typescript')) {
          debugSections.push("- **TypeScript**: Periksa type definitions, interface compatibility, dan compilation errors");
        }
      }
    }

    // Task-type specific debugging
    debugSections.push("\n**Task-Type Specific Issues:**");
    debugSections.push(...this.generateTaskTypeDebugging(taskType));

    // Project-specific debugging guidance
    if (projectTechStack.length > 0) {
      debugSections.push("\n**Project Tech Stack Debugging:**");
      debugSections.push(`- Pastikan konsistensi dengan tech stack proyek: ${projectTechStack.join(', ')}`);
      debugSections.push("- Periksa konfigurasi environment variables dan dependencies");
      debugSections.push("- Verifikasi integrasi antar komponen dalam tech stack");
    }

    // Common resources
    debugSections.push("\n**Helpful Resources:**");
    debugSections.push("- 📚 Official documentation untuk teknologi yang digunakan");
    debugSections.push("- 🔧 Developer tools dan debugging utilities");
    debugSections.push("- 💬 Community forums (Stack Overflow, GitHub Issues)");
    debugSections.push("- 🧪 Unit testing untuk isolasi masalah");

    return debugSections.join('\n');
  }

  /**
   * Extract tech stack from project context and task tree
   */
  private extractTechStackFromProject(project: ProjectDocument): string[] {
    const techStack = new Set<string>();

    // Extract from global context
    const globalContext = project.globalContext?.toLowerCase() || '';
    const commonTech = ['next.js', 'react', 'typescript', 'node.js', 'mongodb', 'express', 'tailwind', 'prisma', 'postgresql', 'mysql'];

    for (const tech of commonTech) {
      if (globalContext.includes(tech.toLowerCase())) {
        techStack.add(tech);
      }
    }

    // Extract from task entities
    const flatTasks = this.flattenTaskTree(project.taskTree);
    for (const task of flatTasks) {
      for (const system of task.entities.systems) {
        if (system.length > 2) { // Filter out very short system names
          techStack.add(system);
        }
      }
    }

    return Array.from(techStack).slice(0, 5); // Limit to top 5 technologies
  }

  /**
   * Calculate task progress within the project
   */
  private calculateTaskProgress(task: TaskNode, project: ProjectDocument): number {
    const flatTasks = this.flattenTaskTree(project.taskTree);
    const currentIndex = flatTasks.findIndex(t => t.id === task.id);

    if (currentIndex === -1 || flatTasks.length === 0) {
      return 0;
    }

    return (currentIndex + 1) / flatTasks.length;
  }
}
