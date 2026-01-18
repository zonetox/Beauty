// Mock import.meta.env for Jest
// This file is used to replace import.meta.env in test environment
export const mockImportMeta = {
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    MODE: 'test',
    DEV: false,
    PROD: false,
  }
};
