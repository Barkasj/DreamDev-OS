/**
 * Type definitions for DreamDev OS Frontend
 */

// Interface for ExtractedEntities
export interface ExtractedEntities {
  actors: string[];
  systems: string[];
  features: string[];
}

// Interface for TaskNode
export interface TaskNode {
  id: string;
  taskName: string;
  level: number;
  contentSummary: string;
  entities: ExtractedEntities;
  subTasks: TaskNode[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dependencies: string[];
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    priority: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Removed commented-out interfaces that are not used in frontend

// Interface for Prompt Composition Config
export interface PromptCompositionConfig {
  globalProjectContext: string;
  includeMetadata?: boolean;
  stepIdentifierFormat?: string;
  customTemplates?: {
    objective?: string;
    executionPrompt?: string;
    successCriteria?: string;
    debugAssistance?: string;
  };
}

// Interface for Prompt Composition Result
export interface PromptCompositionResult {
  promptText: string;
  metadata: {
    taskId: string;
    taskName: string;
    level: number;
    characterCount: number;
    lineCount: number;
    generatedAt: Date;
    detectedEntities: ExtractedEntities;
  };
}

// Removed unused API response interfaces - using generic responses instead

// Interface for available tasks for selection
export interface AvailableTask {
  id: string;
  name: string;
  level: number;
  hasSubTasks: boolean;
  hasDependencies: boolean;
}

// Interface untuk UI State
export interface AppState {
  // Project State
  projectId: string | null;

  // PRD Input State
  prdText: string;
  isProcessing: boolean;

  // Task Tree State
  taskTree: TaskNode[];
  availableTasks: AvailableTask[];

  // Selected Task State
  selectedTask: TaskNode | null;
  selectedTaskId: string | null;

  // Prompt State
  currentPrompt: string;
  promptMetadata: PromptCompositionResult['metadata'] | null;

  // UI State
  activeTab: 'upload' | 'tree' | 'prompt';
  isLoading: boolean;
  error: string | null;

  // Configuration
  globalProjectContext: string;
  customConfig: PromptCompositionConfig | null;
}

// Interface untuk Component Props
export interface PrdUploadProps {
  onPrdTextUploaded: (text: string) => void;
  isProcessing: boolean;
  error?: string | null;
}

export interface TaskTreeDisplayProps {
  tasks: TaskNode[];
  availableTasks: AvailableTask[];
  onTaskSelect: (taskId: string) => void;
  selectedTaskId: string | null;
  isLoading: boolean;
}

export interface PromptDisplayProps {
  prompt: string;
  metadata: PromptCompositionResult['metadata'] | null;
  isLoading: boolean;
}

// Removed commented-out ConfigurationPanelProps - not implemented

// Interface untuk API Service
export interface ApiService {
  processPrd: (prdText: string, globalProjectContext?: string) => Promise<ProjectDocument>;
  getProjectTaskPrompt: (projectId: string, taskId: string) => Promise<PromptCompositionResult>;
  healthCheck: () => Promise<{ status: string; message: string }>;
}

// Removed unused utility types - using literal types directly

// Removed unused DreamDev OS Thinking Modules interfaces - not implemented in current version

// Removed all unused thinking modules related interfaces

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'sequential' | 'hierarchical' | 'conditional';
  description: string;
}

// Interface untuk ParsedSection (dari PRD Parser)
export interface ParsedSection {
  id: string;
  title: string;
  level: number;
  content: string;
  entities: ExtractedEntities;
}

// Interface untuk PrdProcessingResult
export interface PrdProcessingResult {
  sections: ParsedSection[];
  taskTree: TaskNode[];
  totalTasks: number;
  levelDistribution: Record<number, number>;
  entityStats: {
    totalActors: number;
    totalSystems: number;
    totalFeatures: number;
    uniqueActors: string[];
    uniqueSystems: string[];
    uniqueFeatures: string[];
  };
  processingMetadata: {
    startTime: Date;
    endTime: Date;
    processingDuration: number;
    inputSize: number;
  };
}

// ===== CONTEXT STACK INTERFACES =====

// Interface untuk Global Context
export interface GlobalContext {
  projectId: string;
  summary?: string; // Ringkasan umum proyek dari PRD
  projectTypeHints?: string; // Misal: web app, mobile, API
  complexityLevel?: 'simple' | 'medium' | 'complex';
  techStackHints?: string[]; // Teknologi utama yang disebut di PRD
  detailedChunks?: Array<{
    content: string;
    metadata: {
      index: number;
      startPosition: number;
      endPosition: number;
      size: number;
      hasOverlap: boolean;
    };
  }>; // Smart chunked content for detailed context
  compressionMetadata?: {
    originalLength: number;
    chunksCount: number;
    compressionRatio: number;
    strategy: 'first' | 'distributed' | 'keyword-based';
  };
}

// Interface untuk Module Context
export interface ModuleContext {
  moduleId: string; // ID dari root TaskNode atau ID unik lain
  moduleTitle: string; // Judul section/modul utama dari PRD
  summary?: string; // Ringkasan dari section/modul tersebut
  relatedEntities?: ExtractedEntities; // Entitas yang relevan untuk modul ini
  detailedChunks?: Array<{
    content: string;
    metadata: {
      index: number;
      startPosition: number;
      endPosition: number;
      size: number;
      hasOverlap: boolean;
    };
  }>; // Smart chunked content for detailed context
  compressionMetadata?: {
    originalLength: number;
    chunksCount: number;
    compressionRatio: number;
    strategy: 'first' | 'distributed' | 'keyword-based';
  };
}

// Interface untuk Step Context
export interface StepContext {
  taskId: string; // ID dari TaskNode saat ini
  stepSummary: string; // Dari TaskNode.contentSummary
  relevantEntities: ExtractedEntities; // Dari TaskNode.entities
}

// Interface untuk ProjectDocument (MongoDB Document)
export interface ProjectDocument {
  _id: string;                    // UUID project ID
  originalPrdText: string;        // Original PRD text
  taskTree: TaskNode[];          // Hierarchical task structure
  globalContext: string;         // Project context (legacy field)
  globalContextData?: GlobalContext; // Enhanced global context
  moduleContexts?: ModuleContext[]; // Array konteks modul yang terdeteksi
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
  metadata?: {                  // Processing metadata
    totalTasks: number;
    rootTasks: number;
    levelDistribution: Record<number, number>;
    entityStats: {
      totalActors: number;
      totalSystems: number;
      totalFeatures: number;
      uniqueActors: string[];
      uniqueSystems: string[];
      uniqueFeatures: string[];
    };
    processingDuration: number;
  };
}


