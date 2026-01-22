// G1.1 - Jest Configuration
// Tuân thủ Master Plan v1.1

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

// Get absolute path to Beauty-main directory
const projectRoot = path.resolve(__dirname);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Use absolute path to ensure Jest only scans this directory
  rootDir: projectRoot,
  roots: [projectRoot],
  // Use a custom testMatch that only matches files in Beauty-main
  testMatch: [
    '<rootDir>/tests/**/*.{ts,tsx}',
    '<rootDir>/lib/__tests__/**/*.{ts,tsx}',
    '<rootDir>/components/__tests__/**/*.{ts,tsx}',
    '<rootDir>/contexts/__tests__/**/*.{ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.cursor/',
    '/\\.antigravity/',
    '/\\.vscode/',
    '/dist/',
    '/build/',
    // Ignore E2E tests (they should be run with Playwright, not Jest)
    '/tests/e2e/',
    '/tests/e2e/.*\\.spec\\.ts$',
    // Explicitly ignore common external directories
    '.*Nho-AI-Memory.*',
    '.*themissionoflife.*',
    '.*code-deploy-dreamscape.*',
    '.*Chrome.*',
    '.*Edge.*',
    '.*cursor.*',
    '.*Extensions.*',
    '.*genlogin.*',
    '.*antigravity.*',
    '.*Trợ lý AI.*',
    '.*Partner Relationship.*',
    '<rootDir>/tests/setup.ts', // Exclude setup file from being treated as a test
    '<rootDir>/tests/mocks/import-meta.ts' // Exclude mock file from being treated as a test
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock import.meta - this won't work for syntax, but we handle it in setup
    '^import\\.meta$': '<rootDir>/tests/mocks/import-meta.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['<rootDir>/scripts/jest-transformer.cjs', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        types: ['jest', '@testing-library/jest-dom', 'node'],
        moduleResolution: 'node'
      },
      useESM: false
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom|react-router|@supabase|@google/genai)/)'
  ],
  extensionsToTreatAsEsm: [],
};
