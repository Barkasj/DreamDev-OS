/**
 * MongoDB Connection Utility
 * Singleton pattern untuk connection MongoDB di Next.js
 */

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!MONGODB_DB_NAME) {
  throw new Error('Please define the MONGODB_DB_NAME environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongo {
  conn: { client: MongoClient; db: Db } | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongo: GlobalMongo | undefined;
}

let cached = global.__mongo;

if (!cached) {
  cached = global.__mongo = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  console.log('🔗 Attempting MongoDB connection...');
  console.log('📍 MONGODB_URI configured:', MONGODB_URI ? 'YES' : 'NO');
  console.log('📍 MONGODB_DB_NAME:', MONGODB_DB_NAME);

  if (cached!.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached!.conn;
  }

  if (!cached!.promise) {
    console.log('🔄 Creating new MongoDB connection...');

    // Detect if using Atlas or local MongoDB
    const isAtlas = MONGODB_URI!.includes('mongodb+srv://');

    const opts = {
      // Connection options from environment variables
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000'), // Increased
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '30000'), // Increased
      family: 4, // Use IPv4, skip trying IPv6

      // SSL/TLS Configuration - only for Atlas
      ...(isAtlas && {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        // Additional SSL options for troubleshooting
        authSource: 'admin',
        authMechanism: 'SCRAM-SHA-1',
      }),

      // Retry configuration
      retryWrites: true,
      retryReads: true,

      // Additional stability options
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000,

      // App identification
      appName: 'DreamDevOS'
    };

    console.log('⚙️ Connection options:', opts);

    cached!.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
      console.log('✅ MongoDB client connected successfully');
      console.log('🎯 Connected to:', isAtlas ? 'MongoDB Atlas' : 'Local MongoDB');
      return {
        client,
        db: client.db(MONGODB_DB_NAME),
      };
    }).catch((error) => {
      console.error('❌ MongoDB connection failed:', error);
      console.error('🔍 Connection details:', {
        uri: MONGODB_URI!.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
        database: MONGODB_DB_NAME,
        isAtlas,
        errorMessage: error.message
      });

      // Provide helpful error messages
      if (error.message.includes('SSL') || error.message.includes('TLS')) {
        console.error('💡 SSL/TLS Error - Possible solutions:');
        console.error('   1. Check if IP address is whitelisted in MongoDB Atlas');
        console.error('   2. Verify MongoDB Atlas credentials');
        console.error('   3. Check network connectivity');
      }

      throw error;
    });
  }

  try {
    console.log('⏳ Waiting for MongoDB connection...');
    cached!.conn = await cached!.promise;
    console.log('🎉 MongoDB connection established successfully');
  } catch (e) {
    console.error('💥 MongoDB connection error:', e);
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

/**
 * Helper function untuk mendapatkan database instance
 */
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Helper function untuk close connection (usually not required di Next.js)
 */
export async function closeConnection(): Promise<void> {
  if (cached?.conn) {
    await cached.conn.client.close();
    cached.conn = null;
    cached.promise = null;
  }
}

/**
 * Collection names constants untuk DreamDev OS Production
 */
export const COLLECTIONS = {
  // Core Collections
  PROJECTS: 'projects',           // Project documents dengan PRD dan task tree
  TASKS: 'tasks',                 // Individual task details dan status
  PROMPTS: 'prompts',             // Generated prompts dan templates

  // User Management (Future Enhancement)
  USERS: 'users',                 // User profiles dan preferences
  SESSIONS: 'sessions',           // User sessions dan authentication

  // Analytics & Monitoring
  ANALYTICS: 'analytics',         // Usage analytics dan performance metrics
  TEMPLATES: 'templates',         // Reusable prompt templates

  // System Collections
  LOGS: 'logs',                   // Application logs
  CONFIGS: 'configs'              // System configurations
} as const;

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { client } = await connectToDatabase();
    await client.db().admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
