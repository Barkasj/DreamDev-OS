// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DB_NAME = 'testDB';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(() => {
  // Setup global test configuration
});

afterAll(() => {
  // Cleanup after all tests
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
