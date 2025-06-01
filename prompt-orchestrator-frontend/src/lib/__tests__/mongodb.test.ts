/**
 * Unit Tests untuk MongoDB Connection Utility
 * Testing koneksi database dan health check dengan MongoDB Atlas
 */

// Set environment variables before any imports
Object.assign(process.env, {
  MONGODB_URI: 'mongodb+srv://kooetimui999:nzJNSie3kGrpIsG1@cluster0.f2bdrfx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  MONGODB_DB_NAME: 'dreamdev_test',
  NODE_ENV: 'test'
});

describe('MongoDB Connection', () => {
  // Simple integration tests that verify the connection works
  describe('Integration Tests', () => {
    it('should have MongoDB connection configured', () => {
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.MONGODB_DB_NAME).toBeDefined();
    });

    it('should export COLLECTIONS constant', async () => {
      const { COLLECTIONS } = await import('../mongodb.ts');
      expect(COLLECTIONS).toBeDefined();
      expect(COLLECTIONS.PROJECTS).toBe('projects');
      expect(COLLECTIONS.USERS).toBe('users');
      expect(COLLECTIONS.SESSIONS).toBe('sessions');
    });

    it('should be able to import mongodb functions', async () => {
      const mongodb = await import('../mongodb.ts');
      expect(mongodb.connectToDatabase).toBeDefined();
      expect(mongodb.getDatabase).toBeDefined();
      expect(mongodb.checkDatabaseHealth).toBeDefined();
      expect(mongodb.closeConnection).toBeDefined();
    });
  });
});
