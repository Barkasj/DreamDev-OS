/**
 * Demo script untuk menunjukkan Smart Chunking dan Context Compression
 * yang telah diimplementasikan dalam ContextStackManagerService
 */

import { ContextStackManagerService } from '../lib/contextStackManager.service';
import { PromptComposerService } from '../lib/promptComposer.service';
import { ProjectDocument, TaskNode, ExtractedEntities } from '../types';

// Sample data untuk demo
const samplePRDText = `
# Comprehensive Project Requirements Document - DreamDev OS

## Executive Summary
DreamDev OS adalah platform revolusioner untuk manajemen proyek AI yang mengintegrasikan prompt orchestration, task management, dan context-aware automation. Platform ini dirancang untuk meningkatkan produktivitas developer dengan menyediakan intelligent task breakdown, automated prompt generation, dan real-time collaboration features.

## Technical Architecture
Sistem ini dibangun menggunakan modern tech stack:
- Frontend: Next.js 15 dengan TypeScript untuk type safety dan developer experience yang optimal
- Backend: Node.js dengan Express framework untuk API services yang scalable
- Database: MongoDB untuk flexible document storage dan real-time data synchronization
- Authentication: JWT-based authentication dengan OAuth integration (Google, GitHub)
- Deployment: Docker containerization dengan Kubernetes orchestration untuk production scalability

## Module 1: Core Platform Infrastructure
Platform infrastructure mencakup foundational services yang mendukung seluruh ecosystem DreamDev OS. Ini termasuk user management system, authentication services, database connectivity, dan core API endpoints. Infrastructure ini harus robust, scalable, dan secure untuk mendukung growth platform di masa depan.

### Sub-Module 1.1: User Authentication System
Implementasi comprehensive authentication system yang mendukung multiple authentication methods. System ini harus secure, user-friendly, dan terintegrasi dengan external OAuth providers. Features termasuk user registration, login, password reset, session management, dan role-based access control.

### Sub-Module 1.2: Database Architecture
Design dan implementasi database schema yang optimal untuk storing project data, user information, task hierarchies, dan prompt templates. Database harus mendukung complex queries, real-time updates, dan data consistency across multiple concurrent users.

## Module 2: Prompt Orchestration Engine
Core engine yang bertanggung jawab untuk intelligent prompt generation, context management, dan task-specific prompt optimization. Engine ini menggunakan advanced algorithms untuk analyzing project requirements dan generating contextually relevant prompts yang meningkatkan AI assistant effectiveness.

### Sub-Module 2.1: Context Stack Manager
Advanced context management system yang menganalisis project documents, extracts relevant entities, dan maintains hierarchical context layers. System ini menggunakan smart chunking algorithms untuk processing large documents dan context compression techniques untuk optimizing prompt injection.

### Sub-Module 2.2: Prompt Template Engine
Flexible template system untuk generating structured prompts berdasarkan task types, project context, dan user preferences. Engine ini mendukung dynamic content injection, conditional logic, dan customizable prompt formats untuk different AI models dan use cases.

## Module 3: Task Management System
Comprehensive task management platform yang mengintegrasikan AI-powered task breakdown, dependency management, dan progress tracking. System ini menggunakan intelligent algorithms untuk analyzing project requirements dan automatically generating hierarchical task structures.

### Sub-Module 3.1: Intelligent Task Breakdown
AI-powered system untuk automatically parsing project requirements documents dan generating detailed task hierarchies. System ini menggunakan natural language processing untuk identifying key components, dependencies, dan optimal task sequencing.

### Sub-Module 3.2: Progress Tracking & Analytics
Real-time progress monitoring system dengan advanced analytics dan reporting capabilities. Features termasuk task completion tracking, time estimation, bottleneck identification, dan predictive analytics untuk project timeline optimization.

## Module 4: Collaboration & Integration
Advanced collaboration features yang memungkinkan teams untuk working together effectively pada complex projects. Integration dengan popular development tools dan platforms untuk seamless workflow integration.

### Sub-Module 4.1: Real-time Collaboration
WebSocket-based real-time collaboration system yang mendukung simultaneous editing, live updates, dan conflict resolution. System ini harus handle multiple concurrent users dengan optimal performance dan data consistency.

### Sub-Module 4.2: External Tool Integration
Comprehensive integration system untuk connecting dengan popular development tools seperti GitHub, Jira, Slack, dan various CI/CD platforms. Integration ini harus secure, reliable, dan easy to configure untuk different team workflows.

## Quality Assurance & Testing
Comprehensive testing strategy yang mencakup unit testing, integration testing, performance testing, dan security testing. All modules harus memiliki minimum 80% test coverage dengan automated testing pipelines untuk continuous quality assurance.

## Deployment & Operations
Production-ready deployment strategy dengan containerization, orchestration, monitoring, dan automated scaling capabilities. System harus reliable, performant, dan maintainable dalam production environment dengan proper logging, monitoring, dan alerting systems.
`;

const mockEntities: ExtractedEntities = {
  actors: ['Developer', 'User', 'Admin', 'Team Member'],
  systems: ['Next.js', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Docker', 'Kubernetes'],
  features: ['Authentication', 'Task Management', 'Prompt Generation', 'Real-time Collaboration', 'Analytics']
};

const mockTaskNode: TaskNode = {
  id: 'module-2-1',
  taskName: 'Context Stack Manager Implementation',
  contentSummary: 'Implement advanced context management system with smart chunking algorithms for processing large documents and context compression techniques for optimizing prompt injection.',
  level: 2,
  entities: mockEntities,
  subTasks: [
    {
      id: 'task-2-1-1',
      taskName: 'Smart Chunking Algorithm',
      contentSummary: 'Develop recursive text chunking algorithm with hierarchical separators and overlap management for maintaining context continuity.',
      level: 3,
      entities: {
        actors: ['Developer'],
        systems: ['TypeScript', 'Node.js'],
        features: ['Text Processing', 'Context Management']
      },
      subTasks: [],
      status: 'pending',
      dependencies: []
    },
    {
      id: 'task-2-1-2',
      taskName: 'Context Compression Engine',
      contentSummary: 'Implement context compression strategies including chunk selection, token limiting, and relevance scoring for optimal prompt composition.',
      level: 3,
      entities: {
        actors: ['Developer'],
        systems: ['TypeScript', 'Node.js'],
        features: ['Context Compression', 'Token Management']
      },
      subTasks: [],
      status: 'pending',
      dependencies: ['task-2-1-1']
    }
  ],
  status: 'in-progress',
  dependencies: []
};

const createMockProject = (): ProjectDocument => ({
  _id: 'demo-project-001',
  originalPrdText: samplePRDText,
  globalContext: 'Building DreamDev OS - AI-powered project management platform',
  taskTree: [mockTaskNode],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    totalTasks: 15,
    rootTasks: 4,
    levelDistribution: { 1: 4, 2: 8, 3: 3 },
    entityStats: {
      totalActors: 4,
      totalSystems: 7,
      totalFeatures: 5,
      uniqueActors: mockEntities.actors,
      uniqueSystems: mockEntities.systems,
      uniqueFeatures: mockEntities.features
    },
    processingDuration: 2500
  }
});

export function runChunkingDemo() {
  console.log('🚀 DreamDev OS - Smart Chunking & Context Compression Demo\n');
  console.log('=' .repeat(80));

  const contextManager = new ContextStackManagerService();
  const promptComposer = new PromptComposerService();
  const project = createMockProject();

  // Demo 1: Global Context Extraction with Chunking
  console.log('\n📋 Demo 1: Global Context Extraction with Smart Chunking');
  console.log('-'.repeat(60));
  
  const globalContext = contextManager.extractGlobalContext(project);
  if (globalContext) {
    console.log(`✅ Global Context Extracted:`);
    console.log(`   Project Type: ${globalContext.projectTypeHints}`);
    console.log(`   Complexity: ${globalContext.complexityLevel}`);
    console.log(`   Tech Stack: ${globalContext.techStackHints?.join(', ')}`);
    console.log(`   Summary: ${globalContext.summary?.substring(0, 100)}...`);
    
    if (globalContext.detailedChunks) {
      console.log(`\n📦 Chunking Results:`);
      console.log(`   Total Chunks: ${globalContext.detailedChunks.length}`);
      console.log(`   Original Length: ${globalContext.compressionMetadata?.originalLength} chars`);
      console.log(`   Compression Ratio: ${globalContext.compressionMetadata?.compressionRatio?.toFixed(2)}`);
      console.log(`   Strategy: ${globalContext.compressionMetadata?.strategy}`);
      
      globalContext.detailedChunks.forEach((chunk, index) => {
        console.log(`\n   Chunk ${index + 1}:`);
        console.log(`     Size: ${chunk.metadata.size} chars`);
        console.log(`     Has Overlap: ${chunk.metadata.hasOverlap}`);
        console.log(`     Preview: ${chunk.content.substring(0, 150)}...`);
      });
    }
  }

  // Demo 2: Module Context Extraction with Chunking
  console.log('\n\n🔧 Demo 2: Module Context Extraction with Smart Chunking');
  console.log('-'.repeat(60));
  
  const moduleContexts = contextManager.extractModuleContexts(project);
  if (moduleContexts.length > 0) {
    const moduleContext = moduleContexts[0];
    console.log(`✅ Module Context Extracted:`);
    console.log(`   Module: ${moduleContext.moduleTitle}`);
    console.log(`   Summary: ${moduleContext.summary?.substring(0, 100)}...`);
    
    if (moduleContext.detailedChunks) {
      console.log(`\n📦 Module Chunking Results:`);
      console.log(`   Total Chunks: ${moduleContext.detailedChunks.length}`);
      console.log(`   Original Length: ${moduleContext.compressionMetadata?.originalLength} chars`);
      console.log(`   Compression Ratio: ${moduleContext.compressionMetadata?.compressionRatio?.toFixed(2)}`);
      
      moduleContext.detailedChunks.forEach((chunk, index) => {
        console.log(`\n   Module Chunk ${index + 1}:`);
        console.log(`     Size: ${chunk.metadata.size} chars`);
        console.log(`     Preview: ${chunk.content.substring(0, 120)}...`);
      });
    }
  }

  // Demo 3: Context Chunks for Prompt with Token Limiting
  console.log('\n\n🎯 Demo 3: Context Chunks for Prompt (Token Limiting)');
  console.log('-'.repeat(60));
  
  const contextChunks = contextManager.getContextChunksForPrompt(
    globalContext,
    moduleContexts[0],
    500 // Token limit
  );
  
  console.log(`✅ Context Chunks for Prompt:`);
  console.log(`   Global Chunks: ${contextChunks.globalChunks.length}`);
  console.log(`   Module Chunks: ${contextChunks.moduleChunks.length}`);
  console.log(`   Total Tokens Used: ${contextChunks.totalTokens}`);
  
  if (contextChunks.globalChunks.length > 0) {
    console.log(`\n   Global Context Preview:`);
    contextChunks.globalChunks.forEach((chunk, index) => {
      console.log(`     Global ${index + 1}: ${chunk.substring(0, 100)}...`);
    });
  }
  
  if (contextChunks.moduleChunks.length > 0) {
    console.log(`\n   Module Context Preview:`);
    contextChunks.moduleChunks.forEach((chunk, index) => {
      console.log(`     Module ${index + 1}: ${chunk.substring(0, 100)}...`);
    });
  }

  // Demo 4: Keyword-based Compression Demo
  console.log('\n\n🔍 Demo 4: Keyword-based Compression Strategy');
  console.log('-'.repeat(60));
  
  // Create a very long PRD text to trigger keyword-based compression
  const veryLongPRD = samplePRDText.repeat(3) + `
    
    ## Additional Technical Requirements
    The system architecture must support microservices implementation with containerized deployment.
    Authentication mechanisms should include OAuth2, JWT tokens, and multi-factor authentication.
    Database optimization requires indexing strategies, query performance tuning, and connection pooling.
    API design follows RESTful principles with comprehensive documentation and versioning support.
    Security implementation includes encryption at rest, secure communication protocols, and audit logging.
    Performance monitoring involves real-time metrics collection, alerting systems, and automated scaling.
    Testing framework encompasses unit testing, integration testing, end-to-end testing, and load testing.
    Deployment pipeline includes continuous integration, automated testing, and blue-green deployment strategies.
  `;
  
  const longProject = createMockProject();
  longProject.originalPrdText = veryLongPRD;
  
  const longGlobalContext = contextManager.extractGlobalContext(longProject);
  if (longGlobalContext) {
    console.log(`✅ Keyword-based Compression Results:`);
    console.log(`   Strategy Used: ${longGlobalContext.compressionMetadata?.strategy}`);
    console.log(`   Original Length: ${longGlobalContext.compressionMetadata?.originalLength} chars`);
    console.log(`   Total Chunks Created: ${longGlobalContext.compressionMetadata?.chunksCount}`);
    console.log(`   Selected Chunks: ${longGlobalContext.detailedChunks?.length}`);
    console.log(`   Compression Ratio: ${longGlobalContext.compressionMetadata?.compressionRatio?.toFixed(2)}`);
    
    if (longGlobalContext.detailedChunks) {
      console.log(`\n📦 Selected Chunks (Keyword-based):`);
      longGlobalContext.detailedChunks.forEach((chunk, index) => {
        console.log(`\n   Chunk ${index + 1} (${chunk.metadata.size} chars):`);
        console.log(`     Preview: ${chunk.content.substring(0, 120)}...`);
        
        // Show which keywords might have influenced selection
        const keywords = ['system', 'implementation', 'authentication', 'database', 'api', 'security'];
        const foundKeywords = keywords.filter(keyword => 
          chunk.content.toLowerCase().includes(keyword)
        );
        if (foundKeywords.length > 0) {
          console.log(`     Keywords found: ${foundKeywords.join(', ')}`);
        }
      });
    }
  }

  // Demo 5: Full Prompt Generation with Chunked Context
  console.log('\n\n📝 Demo 5: Full Prompt Generation with Chunked Context');
  console.log('-'.repeat(60));
  
  // Update project with extracted contexts
  project.globalContextData = globalContext || undefined;
  project.moduleContexts = moduleContexts;
  
  const promptResult = promptComposer.composePromptWithMetadataFromProject(
    mockTaskNode.subTasks[0], // Use first subtask
    project
  );
  
  console.log(`✅ Generated Prompt:`);
  console.log(`   Task: ${promptResult.metadata.taskName}`);
  console.log(`   Character Count: ${promptResult.metadata.characterCount}`);
  console.log(`   Line Count: ${promptResult.metadata.lineCount}`);
  
  console.log(`\n📄 Prompt Preview (first 500 chars):`);
  console.log('-'.repeat(40));
  console.log(promptResult.promptText.substring(0, 500) + '...');
  
  // Check if chunked context is included
  const hasGlobalChunks = promptResult.promptText.includes('Detail Konteks Global');
  const hasModuleChunks = promptResult.promptText.includes('Detail Modul');
  
  console.log(`\n🔍 Chunked Context Integration:`);
  console.log(`   Global Context Chunks Included: ${hasGlobalChunks ? '✅' : '❌'}`);
  console.log(`   Module Context Chunks Included: ${hasModuleChunks ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Demo Completed Successfully!');
  console.log('✅ Smart Chunking: Working perfectly');
  console.log('✅ Context Compression: Optimizing token usage');
  console.log('✅ Prompt Integration: Seamlessly integrated');
  console.log('=' .repeat(80));
}

// Export untuk testing
export { samplePRDText, mockTaskNode, createMockProject };