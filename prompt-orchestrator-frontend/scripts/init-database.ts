/**
 * Database Initialization Script
 * Script untuk setup database MongoDB Atlas dengan collections dan indexes
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI || !MONGODB_DB_NAME) {
  console.error('❌ MONGODB_URI dan MONGODB_DB_NAME harus didefinisikan di .env.local');
  process.exit(1);
}

// Collections yang akan dibuat
const COLLECTIONS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  PROMPTS: 'prompts',
  USERS: 'users',
  SESSIONS: 'sessions',
  ANALYTICS: 'analytics',
  TEMPLATES: 'templates',
  LOGS: 'logs',
  CONFIGS: 'configs'
};

async function initializeDatabase() {
  console.log('🚀 Initializing DreamDev OS Database...');
  console.log('📍 Database:', MONGODB_DB_NAME);
  
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(MONGODB_DB_NAME);
    
    // Create collections with validation schemas
    console.log('\n📦 Creating collections...');
    
    // Projects Collection
    await createProjectsCollection(db);
    
    // Tasks Collection
    await createTasksCollection(db);
    
    // Prompts Collection
    await createPromptsCollection(db);
    
    // Users Collection (Future)
    await createUsersCollection(db);
    
    // Sessions Collection (Future)
    await createSessionsCollection(db);
    
    // Analytics Collection
    await createAnalyticsCollection(db);
    
    // Templates Collection
    await createTemplatesCollection(db);
    
    // Logs Collection
    await createLogsCollection(db);
    
    // Configs Collection
    await createConfigsCollection(db);
    
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function createProjectsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.PROJECTS, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "originalPrdText", "taskTree", "createdAt"],
          properties: {
            _id: { bsonType: "string" },
            originalPrdText: { bsonType: "string" },
            taskTree: { bsonType: "array" },
            globalContext: { bsonType: "string" },
            metadata: { bsonType: "object" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" }
          }
        }
      }
    });
    
    // Create indexes
    await db.collection(COLLECTIONS.PROJECTS).createIndexes([
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { "metadata.totalTasks": 1 } }
    ]);
    
    console.log('✅ Projects collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Projects collection already exists');
    } else {
      throw error;
    }
  }
}

async function createTasksCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.TASKS);
    await db.collection(COLLECTIONS.TASKS).createIndexes([
      { key: { projectId: 1 } },
      { key: { status: 1 } },
      { key: { level: 1 } }
    ]);
    console.log('✅ Tasks collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Tasks collection already exists');
    } else {
      throw error;
    }
  }
}

async function createPromptsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.PROMPTS);
    await db.collection(COLLECTIONS.PROMPTS).createIndexes([
      { key: { taskId: 1 } },
      { key: { projectId: 1 } },
      { key: { createdAt: -1 } }
    ]);
    console.log('✅ Prompts collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Prompts collection already exists');
    } else {
      throw error;
    }
  }
}

async function createUsersCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.USERS);
    await db.collection(COLLECTIONS.USERS).createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { createdAt: -1 } }
    ]);
    console.log('✅ Users collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Users collection already exists');
    } else {
      throw error;
    }
  }
}

async function createSessionsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.SESSIONS);
    await db.collection(COLLECTIONS.SESSIONS).createIndexes([
      { key: { userId: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
    ]);
    console.log('✅ Sessions collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Sessions collection already exists');
    } else {
      throw error;
    }
  }
}

async function createAnalyticsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.ANALYTICS);
    await db.collection(COLLECTIONS.ANALYTICS).createIndexes([
      { key: { timestamp: -1 } },
      { key: { eventType: 1 } },
      { key: { userId: 1 } }
    ]);
    console.log('✅ Analytics collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Analytics collection already exists');
    } else {
      throw error;
    }
  }
}

async function createTemplatesCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.TEMPLATES);
    await db.collection(COLLECTIONS.TEMPLATES).createIndexes([
      { key: { category: 1 } },
      { key: { isActive: 1 } },
      { key: { createdAt: -1 } }
    ]);
    console.log('✅ Templates collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Templates collection already exists');
    } else {
      throw error;
    }
  }
}

async function createLogsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.LOGS);
    await db.collection(COLLECTIONS.LOGS).createIndexes([
      { key: { timestamp: -1 } },
      { key: { level: 1 } },
      { key: { timestamp: 1 }, expireAfterSeconds: 2592000 } // 30 days TTL
    ]);
    console.log('✅ Logs collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Logs collection already exists');
    } else {
      throw error;
    }
  }
}

async function createConfigsCollection(db: any) {
  try {
    await db.createCollection(COLLECTIONS.CONFIGS);
    await db.collection(COLLECTIONS.CONFIGS).createIndexes([
      { key: { key: 1 }, unique: true },
      { key: { category: 1 } }
    ]);
    console.log('✅ Configs collection created');
  } catch (error: any) {
    if (error.code === 48) {
      console.log('ℹ️ Configs collection already exists');
    } else {
      throw error;
    }
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
