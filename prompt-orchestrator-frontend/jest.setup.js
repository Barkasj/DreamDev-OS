// Jest setup file for comprehensive testing
import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.MONGODB_DB_NAME = 'testDB';
process.env.NODE_ENV = 'test';

// Polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init = {}) {
    this._url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body;
    this._bodyInit = init.body;
  }

  get url() {
    return this._url;
  }

  async json() {
    if (this._bodyInit) {
      return JSON.parse(this._bodyInit);
    }
    return {};
  }

  async text() {
    return this._bodyInit || '';
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value;
      });
    }
  }

  get(name) {
    return this._headers[name.toLowerCase()];
  }

  set(name, value) {
    this._headers[name.toLowerCase()] = value;
  }

  has(name) {
    return name.toLowerCase() in this._headers;
  }

  delete(name) {
    delete this._headers[name.toLowerCase()];
  }

  entries() {
    return Object.entries(this._headers);
  }
};

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Global test setup
beforeAll(() => {
  // Setup global test configuration
});

afterAll(() => {
  // Cleanup after all tests
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
