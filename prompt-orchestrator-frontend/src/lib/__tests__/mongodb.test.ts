/**
 * Unit Tests untuk MongoDB Connection Utility
 * Testing koneksi database dan health check dengan MongoDB Atlas
 */

import { MongoClient, Db } from 'mongodb';

// Set environment variables before any imports
Object.assign(process.env, {
  MONGODB_URI: 'mongodb://localhost:27017',
  MONGODB_DB_NAME: 'dreamdev_test',
  NODE_ENV: 'test'
});

// Mock MongoDB untuk unit tests
jest.mock('mongodb');

const mockMongoClient = MongoClient as jest.MockedClass<typeof MongoClient>;
const mockDb = {
  admin: jest.fn().mockReturnValue({
    ping: jest.fn()
  })
} as unknown as jest.Mocked<Db>;

const mockClient = {
  db: jest.fn().mockReturnValue(mockDb),
  close: jest.fn()
} as unknown as jest.Mocked<MongoClient>;

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset global cache
    if (global.__mongo) {
      global.__mongo = { conn: null, promise: null };
    }
  });

  describe('Environment Configuration', () => {
    it('should have MongoDB connection configured', () => {
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.MONGODB_DB_NAME).toBeDefined();
    });

    it('should export COLLECTIONS constant', async () => {
      const { COLLECTIONS } = await import('../mongodb');
      expect(COLLECTIONS).toBeDefined();
      expect(COLLECTIONS.PROJECTS).toBe('projects');
      expect(COLLECTIONS.TASKS).toBe('tasks');
      expect(COLLECTIONS.PROMPTS).toBe('prompts');
      expect(COLLECTIONS.USERS).toBe('users');
      expect(COLLECTIONS.SESSIONS).toBe('sessions');
      expect(COLLECTIONS.ANALYTICS).toBe('analytics');
      expect(COLLECTIONS.TEMPLATES).toBe('templates');
      expect(COLLECTIONS.LOGS).toBe('logs');
      expect(COLLECTIONS.CONFIGS).toBe('configs');
    });

    it('should be able to import mongodb functions', async () => {
      const mongodb = await import('../mongodb');
      expect(mongodb.connectToDatabase).toBeDefined();
      expect(mongodb.getDatabase).toBeDefined();
      expect(mongodb.checkDatabaseHealth).toBeDefined();
      expect(mongodb.closeConnection).toBeDefined();
    });
  });

  describe('connectToDatabase', () => {
    it('should create new connection successfully', async () => {
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);
      
      const { connectToDatabase } = await import('../mongodb');
      const result = await connectToDatabase();

      expect(mockMongoClient.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017',
        expect.objectContaining({
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000,
          family: 4,
          retryWrites: true,
          retryReads: true,
          heartbeatFrequencyMS: 10000,
          maxIdleTimeMS: 30000,
          appName: 'DreamDevOS'
        })
      );

      expect(result).toEqual({
        client: mockClient,
        db: mockDb
      });
    });

    it('should return cached connection when available', async () => {
      // Set up cached connection
      global.__mongo = {
        conn: { client: mockClient, db: mockDb },
        promise: null
      };

      const { connectToDatabase } = await import('../mongodb');
      const result = await connectToDatabase();

      expect(mockMongoClient.connect).not.toHaveBeenCalled();
      expect(result).toEqual({
        client: mockClient,
        db: mockDb
      });
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockMongoClient.connect.mockRejectedValueOnce(connectionError);

      const { connectToDatabase } = await import('../mongodb');
      
      await expect(connectToDatabase()).rejects.toThrow('Connection failed');
    });

    it('should configure Atlas options for MongoDB Atlas URI', async () => {
      // Temporarily change environment for this test
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/db';
      
      // Clear module cache to reload with new env
      jest.resetModules();
      
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);

      const { connectToDatabase } = await import('../mongodb');
      await connectToDatabase();

      expect(mockMongoClient.connect).toHaveBeenCalledWith(
        'mongodb+srv://user:pass@cluster.mongodb.net/db',
        expect.objectContaining({
          tls: true,
          tlsAllowInvalidCertificates: false,
          tlsAllowInvalidHostnames: false,
          authSource: 'admin',
          authMechanism: 'SCRAM-SHA-1'
        })
      );

      // Restore original URI
      process.env.MONGODB_URI = originalUri;
    });
  });

  describe('getDatabase', () => {
    it('should return database instance', async () => {
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);

      const { getDatabase } = await import('../mongodb');
      const db = await getDatabase();

      expect(db).toBe(mockDb);
      expect(mockClient.db).toHaveBeenCalledWith('dreamdev_test');
    });
  });

  describe('closeConnection', () => {
    it('should close connection when cached connection exists', async () => {
      global.__mongo = {
        conn: { client: mockClient, db: mockDb },
        promise: null
      };

      const { closeConnection } = await import('../mongodb');
      await closeConnection();

      expect(mockClient.close).toHaveBeenCalled();
      expect(global.__mongo.conn).toBeNull();
      expect(global.__mongo.promise).toBeNull();
    });

    it('should handle case when no cached connection exists', async () => {
      global.__mongo = { conn: null, promise: null };

      const { closeConnection } = await import('../mongodb');
      await closeConnection();

      expect(mockClient.close).not.toHaveBeenCalled();
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when database ping succeeds', async () => {
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);
      mockDb.admin().ping.mockResolvedValueOnce({});

      const { checkDatabaseHealth } = await import('../mongodb');
      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(true);
      expect(mockDb.admin().ping).toHaveBeenCalled();
    });

    it('should return false when database ping fails', async () => {
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);
      mockDb.admin().ping.mockRejectedValueOnce(new Error('Ping failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { checkDatabaseHealth } = await import('../mongodb');
      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Database health check failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return false when connection fails', async () => {
      mockMongoClient.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { checkDatabaseHealth } = await import('../mongodb');
      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Connection Options', () => {
    it('should use environment variables for connection options', async () => {
      // Set custom environment variables
      const originalEnv = { ...process.env };
      Object.assign(process.env, {
        MONGODB_MAX_POOL_SIZE: '20',
        MONGODB_SERVER_SELECTION_TIMEOUT: '60000',
        MONGODB_SOCKET_TIMEOUT: '90000',
        MONGODB_CONNECT_TIMEOUT: '60000'
      });

      // Clear module cache to reload with new env
      jest.resetModules();
      
      mockMongoClient.connect.mockResolvedValueOnce(mockClient);

      const { connectToDatabase } = await import('../mongodb');
      await connectToDatabase();

      expect(mockMongoClient.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxPoolSize: 20,
          serverSelectionTimeoutMS: 60000,
          socketTimeoutMS: 90000,
          connectTimeoutMS: 60000
        })
      );

      // Restore original environment
      process.env = originalEnv;
    });

    it('should handle SSL/TLS errors with helpful messages', async () => {
      const sslError = new Error('SSL handshake failed');
      mockMongoClient.connect.mockRejectedValueOnce(sslError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { connectToDatabase } = await import('../mongodb');
      await expect(connectToDatabase()).rejects.toThrow('SSL handshake failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('💡 SSL/TLS Error - Possible solutions:');
      
      consoleSpy.mockRestore();
    });
  });
});
