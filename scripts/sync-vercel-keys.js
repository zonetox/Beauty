#!/usr/bin/env node
/**
 * Script tự động sync Supabase keys từ Vercel Integration
 * 
 * Usage:
 *   1. Copy keys từ Vercel Storage integration
 *   2. Paste vào file .env.vercel (sẽ được tạo tự động)
 *   3. Chạy: node scripts/sync-vercel-keys.js
 * 
 * Script sẽ:
 *   - Đọc keys từ .env.vercel
 *   - Update .env.local với keys mới
 *   - Tạo file .env.vercel.example với placeholders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// File paths
const envVercelPath = path.join(rootDir, '.env.vercel');
const envLocalPath = path.join(rootDir, '.env.local');
const envExamplePath = path.join(rootDir, 'docs', '.env.vercel.example');

// Mapping từ Vercel keys sang local keys
// Mapping từ Vercel keys sang local keys - Keep as reference but commented out if truly unused in current logic
/* const keyMapping = {
  // Supabase URL
  'SUPABASE_URL': 'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL': 'VITE_SUPABASE_URL',
  
  // Anon Key - ưu tiên Publishable Key mới
  'SUPABASE_PUBLISHABLE_KEY': 'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'VITE_SUPABASE_ANON_KEY', // Fallback
  
  // Service Role Key - ưu tiên Secret Key mới
  'SUPABASE_SECRET_KEY': 'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY': 'SUPABASE_SERVICE_ROLE_KEY', // Fallback
}; */

// Keys cần bỏ qua (không sync vào .env.local)
const skipKeys = [
  'POSTGRES_',
  'SUPABASE_JWT_SECRET',
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  });

  return env;
}

function writeEnvFile(filePath, env, header = '') {
  const lines = [header];

  Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`${key}="${value}"`);
    });

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

function main() {
  console.log('🔄 Syncing Supabase keys from Vercel...\n');

  // 1. Đọc keys từ .env.vercel (force read even if in .gitignore)
  let vercelEnv = {};
  try {
    vercelEnv = parseEnvFile(envVercelPath);
  } catch (error) {
    console.error('❌ Không thể đọc file .env.vercel!');
    console.log('\n📝 Tạo file .env.vercel và paste keys từ Vercel Storage integration vào đó.');
    console.log('   File path:', envVercelPath);
    console.log('   Error:', error.message);
    process.exit(1);
  }
  console.log(`✅ Đọc được ${Object.keys(vercelEnv).length} keys từ .env.vercel\n`);

  // 2. Đọc .env.local hiện tại (nếu có)
  const localEnv = parseEnvFile(envLocalPath);

  // 3. Map và merge keys
  const newLocalEnv = { ...localEnv };

  // Priority: Publishable Key > Anon Key
  if (vercelEnv.SUPABASE_PUBLISHABLE_KEY || vercelEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const publishableKey = vercelEnv.SUPABASE_PUBLISHABLE_KEY || vercelEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    newLocalEnv.VITE_SUPABASE_ANON_KEY = publishableKey;
    console.log('✅ Updated VITE_SUPABASE_ANON_KEY với Publishable Key mới');
  } else if (vercelEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    newLocalEnv.VITE_SUPABASE_ANON_KEY = vercelEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('✅ Updated VITE_SUPABASE_ANON_KEY với Anon Key');
  }

  // Priority: Secret Key > Service Role Key
  // NOTE: SUPABASE_SERVICE_ROLE_KEY trong Supabase Secrets là RESERVED - không thể sửa
  // Nếu có Secret Key mới, cần tạo secret mới tên SUPABASE_SECRET_KEY trong Supabase
  if (vercelEnv.SUPABASE_SECRET_KEY) {
    // Secret Key mới - dùng cho Edge Functions
    console.log('✅ Tìm thấy SUPABASE_SECRET_KEY mới');
    console.log('   ⚠️  Lưu ý: Tạo secret mới tên SUPABASE_SECRET_KEY trong Supabase Secrets');
    console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY là RESERVED - không thể sửa');
  } else if (vercelEnv.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Tìm thấy SUPABASE_SERVICE_ROLE_KEY (legacy)');
    console.log('   ⚠️  Key này là RESERVED trong Supabase - không thể sửa');
  }

  // Supabase URL
  if (vercelEnv.SUPABASE_URL || vercelEnv.NEXT_PUBLIC_SUPABASE_URL) {
    const url = vercelEnv.SUPABASE_URL || vercelEnv.NEXT_PUBLIC_SUPABASE_URL;
    newLocalEnv.VITE_SUPABASE_URL = url;
    console.log('✅ Updated VITE_SUPABASE_URL');
  }

  // Giữ lại các keys khác (không phải từ Vercel)
  Object.keys(localEnv).forEach(key => {
    if (!key.startsWith('VITE_SUPABASE_') && !key.startsWith('SUPABASE_SERVICE_ROLE_KEY')) {
      newLocalEnv[key] = localEnv[key];
    }
  });

  // 4. Ghi .env.local
  const header = `# ============================================
# Environment Variables - Auto-synced from Vercel
# ============================================
# Generated: ${new Date().toISOString()}
# DO NOT commit this file to version control
# ============================================

`;

  writeEnvFile(envLocalPath, newLocalEnv, header);
  console.log(`\n✅ Đã sync keys vào .env.local`);
  console.log(`   File path: ${envLocalPath}\n`);

  // 5. Tạo .env.vercel.example với placeholders
  const exampleEnv = {};
  Object.keys(vercelEnv).forEach(key => {
    if (skipKeys.some(skip => key.startsWith(skip))) {
      return; // Skip sensitive keys
    }

    if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
      exampleEnv[key] = 'your-' + key.toLowerCase().replace(/_/g, '-');
    } else if (key.includes('URL')) {
      exampleEnv[key] = 'https://your-project-url.supabase.co';
    } else {
      exampleEnv[key] = 'your-value-here';
    }
  });

  const exampleHeader = `# ============================================
# Vercel Supabase Integration Keys - EXAMPLE
# ============================================
# Copy keys từ Vercel Storage integration
# Paste vào file .env.vercel (project root)
# DO NOT commit real values
# ============================================

`;

  writeEnvFile(envExamplePath, exampleEnv, exampleHeader);
  console.log(`✅ Đã tạo .env.vercel.example`);
  console.log(`   File path: ${envExamplePath}\n`);

  console.log('🎉 Hoàn tất! Keys đã được sync.\n');
  console.log('📋 Next steps:');
  console.log('   1. Kiểm tra .env.local có đúng keys không');
  console.log('   2. Restart dev server nếu đang chạy');
  console.log('   3. Update Vercel environment variables nếu cần');
  console.log('   4. Update Supabase Secrets cho Edge Functions\n');
}

main();
