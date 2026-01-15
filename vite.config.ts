import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Sentry plugin for source maps upload (only in production)
        mode === 'production' && env.VITE_SENTRY_DSN
          ? sentryVitePlugin({
              org: env.VITE_SENTRY_ORG,
              project: env.VITE_SENTRY_PROJECT,
              authToken: env.VITE_SENTRY_AUTH_TOKEN,
              sourcemaps: {
                assets: './dist/**',
                ignore: ['node_modules'],
              },
            })
          : null,
      ].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        sourcemap: mode === 'production' && env.VITE_SENTRY_DSN ? true : false,
        // Code splitting optimization
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Only split vendor dependencies to avoid circular dependency issues
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@supabase')) {
                  return 'supabase-vendor';
                }
                if (id.includes('react-router-dom') || id.includes('react-hot-toast')) {
                  return 'ui-vendor';
                }
                return 'vendor';
              }
              // Split contexts into separate chunks to avoid circular dependencies
              if (id.includes('contexts/')) {
                // Keep contexts separate to prevent circular dependency issues
                if (id.includes('BusinessContext')) {
                  return 'context-business';
                }
                if (id.includes('BusinessDataContext')) {
                  return 'context-business-data';
                }
                if (id.includes('AdminContext')) {
                  return 'context-admin';
                }
                return 'contexts';
              }
              // Let Vite automatically handle code splitting for other application code
            },
          },
        },
        // Chunk size warning limit
        chunkSizeWarningLimit: 600,
        // Minify options (using esbuild - faster and built-in)
        minify: 'esbuild',
        // Note: To use terser, install: npm install -D terser
        // Then change minify to 'terser' and uncomment terserOptions
      },
    };
});
