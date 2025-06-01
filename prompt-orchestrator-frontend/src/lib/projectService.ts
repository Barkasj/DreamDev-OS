/**
 * Project Service
 * Service layer for CRUD operations on Project documents in MongoDB
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, COLLECTIONS } from './mongodb';
import { ProjectDocument, TaskNode, GlobalContext, ModuleContext } from '../types';

export class ProjectService {
  /**
   * Save new project to database (legacy method)
   */
  async createProject(
    originalPrdText: string,
    taskTree: TaskNode[],
    globalContext: string,
    metadata?: ProjectDocument['metadata']
  ): Promise<string> {
    return this.createProjectWithContext(
      originalPrdText,
      taskTree,
      globalContext,
      metadata,
      null,
      []
    );
  }

  /**
   * Save new project to database with enhanced context
   */
  async createProjectWithContext(
    originalPrdText: string,
    taskTree: TaskNode[],
    globalContext: string,
    metadata?: ProjectDocument['metadata'],
    globalContextData?: GlobalContext | null,
    moduleContexts?: ModuleContext[]
  ): Promise<string> {
    try {
      console.log('🚀 Creating new project with enhanced context...');
      console.log('📝 PRD Text length:', originalPrdText.length);
      console.log('🌳 Task tree nodes:', taskTree.length);
      console.log('🌍 Global context:', globalContext.substring(0, 100) + '...');
      console.log('🧠 Enhanced context data:', {
        hasGlobalContextData: !!globalContextData,
        moduleContextsCount: moduleContexts?.length || 0
      });

      const db = await getDatabase();
      const projectId = uuidv4();

      const projectDocument: ProjectDocument = {
        _id: projectId,
        originalPrdText,
        taskTree,
        globalContext,
        globalContextData: globalContextData || undefined,
        moduleContexts: moduleContexts || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata,
      };

      console.log('📄 Project document structure:');
      console.log('- Project ID:', projectId);
      console.log('- Task tree structure:', JSON.stringify(taskTree.map(t => ({ id: t.id, name: t.taskName, level: t.level })), null, 2));
      console.log('💾 Attempting to insert into collection:', COLLECTIONS.PROJECTS);

      const result = await db.collection<ProjectDocument>(COLLECTIONS.PROJECTS).insertOne(projectDocument);

      console.log('📊 Insert result:', {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId
      });

      if (result.acknowledged) {
        console.log('✅ Project created successfully:', projectId);
        return projectId;
      }

      // Handle case where insert was not acknowledged
      const errorMessage = 'Failed to insert project document - not acknowledged';
      console.error('❌', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('❌ Error creating project:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<ProjectDocument | null> {
    try {
      const db = await getDatabase();
      const project = await db.collection<ProjectDocument>(COLLECTIONS.PROJECTS).findOne({ _id: projectId });
      
      if (project) {
        console.log('✅ Project found:', projectId);
      } else {
        console.log('⚠️ Project not found:', projectId);
      }
      
      return project;
    } catch (error) {
      console.error('❌ Error getting project:', error);
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing project
   */
  async updateProject(
    projectId: string,
    updates: Partial<Omit<ProjectDocument, '_id' | 'createdAt'>>
  ): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await db.collection<ProjectDocument>(COLLECTIONS.PROJECTS).updateOne(
        { _id: projectId },
        { $set: updateData }
      );

      const success = result.modifiedCount > 0;
      
      if (success) {
        console.log('✅ Project updated successfully:', projectId);
      } else {
        console.log('⚠️ No project updated (may not exist):', projectId);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete project by ID
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.collection<ProjectDocument>(COLLECTIONS.PROJECTS).deleteOne({ _id: projectId });
      
      const success = result.deletedCount > 0;
      
      if (success) {
        console.log('✅ Project deleted successfully:', projectId);
      } else {
        console.log('⚠️ No project deleted (may not exist):', projectId);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find task by ID within project recursively
   */
  findTaskByIdRecursive(tasks: TaskNode[], taskId: string): TaskNode | undefined {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subTasks && task.subTasks.length > 0) {
        const foundInSub = this.findTaskByIdRecursive(task.subTasks, taskId);
        if (foundInSub) return foundInSub;
      }
    }
    return undefined;
  }

  // Removed unused method getTaskFromProject - use findTaskByIdRecursive directly

  // Removed unused methods getAllProjects and getProjectCount - not currently used in application
}

// Export singleton instance
export const projectService = new ProjectService();
