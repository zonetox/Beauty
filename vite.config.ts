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
            manualChunks: {
              // Vendor chunks
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'supabase-vendor': ['@supabase/supabase-js'],
              'ui-vendor': ['react-hot-toast'],
              // Large components
              'admin-chunk': [
                './pages/AdminPage.tsx',
                './components/AdminAnalyticsDashboard.tsx',
                './components/AdminLandingPageModeration.tsx',
              ],
              'dashboard-chunk': [
                './pages/UserBusinessDashboardPage.tsx',
                './components/BusinessProfileEditor.tsx',
              ],
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
