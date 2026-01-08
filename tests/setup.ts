// G1.1 - Test Setup
// Tuân thủ Master Plan v1.1
// Setup file for Jest tests
// 100% hoàn thiện - không placeholder

import '@testing-library/jest-dom';

// Mock supabaseClient globally to avoid import.meta issues
// Create a chainable mock builder that properly chains methods
const createMockQueryBuilder = () => {
  const builder: any = {};
  
  // Chainable methods that return the builder itself
  const chainableMethods = [
    'select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'upsert'
  ];
  
  chainableMethods.forEach(method => {
    builder[method] = jest.fn().mockReturnValue(builder);
  });
  
  // Methods that return promises
  builder.single = jest.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  
  // Default resolved value for the builder itself (when used as a promise)
  builder.then = jest.fn((resolve) => {
    return Promise.resolve({ data: [], error: null }).then(resolve);
  });
  
  return builder;
};

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ 
        data: { subscription: { unsubscribe: jest.fn() } } 
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => createMockQueryBuilder()),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
  isSupabaseConfigured: true,
  supabaseUrlFromEnv: 'https://test.supabase.co',
  supabaseAnonKeyFromEnv: 'test-key',
}));

// Mock TextEncoder/TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock import.meta for Jest
// This is needed because AdminContext.tsx uses import.meta.env
if (typeof globalThis.import === 'undefined') {
  (globalThis as any).import = {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        MODE: 'test',
        DEV: false,
      },
    },
  };
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };

