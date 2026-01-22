#!/usr/bin/env node
/* eslint-env node */
/**
 * Script tự động sắp xếp và fix file .env.vercel
 * 
 * Usage: node scripts/fix-env-vercel.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envVercelPath = path.join(rootDir, '.env.vercel');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
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

  // Sắp xếp keys theo thứ tự logic
  const keyOrder = [
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_JWT_SECRET',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_HOST',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'RESEND_API_KEY',
    'SITE_URL',
  ];

  // Add ordered keys first
  const addedKeys = new Set();
  keyOrder.forEach(key => {
    if (env[key]) {
      lines.push(`${key}="${env[key]}"`);
      addedKeys.add(key);
    }
  });

  // Add remaining keys
  Object.entries(env)
    .filter(([key]) => !addedKeys.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`${key}="${value}"`);
    });

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

function main() {
  console.log('🔧 Đang sắp xếp lại file .env.vercel...\n');

  // Force read file even if in .gitignore
  let envContent = '';
  try {
    envContent = fs.readFileSync(envVercelPath, 'utf-8');
  } catch (error) {
    console.error('❌ Không thể đọc file .env.vercel!');
    console.log('\n📝 Tạo file .env.vercel và paste keys từ Vercel vào đó.');
    console.log('   File path:', envVercelPath);
    console.log('   Error:', error.message);
    process.exit(1);
  }

  if (!envContent || envContent.trim().length === 0) {
    console.error('❌ File .env.vercel rỗng!');
    console.log('\n📝 Paste keys từ Vercel vào file .env.vercel');
    process.exit(1);
  }

  // Parse content trực tiếp
  const env = {};
  envContent.split('\n').forEach((line) => {
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
  console.log(`✅ Đọc được ${Object.keys(env).length} keys\n`);

  // Kiểm tra keys quan trọng
  const requiredKeys = {
    'SUPABASE_URL': env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_PUBLISHABLE_KEY': env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    'SUPABASE_SECRET_KEY': env.SUPABASE_SECRET_KEY,
  };

  console.log('📋 Keys quan trọng:');
  Object.entries(requiredKeys).forEach(([key, value]) => {
    if (value) {
      const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`   ✅ ${key}: ${preview}`);
    } else {
      console.log(`   ⚠️  ${key}: THIẾU`);
    }
  });
  console.log();

  // Loại bỏ duplicates (ưu tiên key không có NEXT_PUBLIC_)
  const cleanedEnv = {};
  Object.entries(env).forEach(([key, value]) => {
    // Nếu có cả SUPABASE_URL và NEXT_PUBLIC_SUPABASE_URL, chỉ giữ SUPABASE_URL
    if (key === 'NEXT_PUBLIC_SUPABASE_URL' && env.SUPABASE_URL) {
      return; // Skip
    }

    // Nếu có cả SUPABASE_PUBLISHABLE_KEY và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, chỉ giữ SUPABASE_PUBLISHABLE_KEY
    if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' && env.SUPABASE_PUBLISHABLE_KEY) {
      return; // Skip
    }

    // Nếu có cả SUPABASE_ANON_KEY và NEXT_PUBLIC_SUPABASE_ANON_KEY, chỉ giữ SUPABASE_ANON_KEY
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && env.SUPABASE_ANON_KEY) {
      return; // Skip
    }

    cleanedEnv[key] = value;
  });

  // Ghi lại file đã sắp xếp
  const header = `# ============================================
# Vercel Supabase Integration Keys
# ============================================
# Auto-sorted and cleaned
# DO NOT commit this file to version control
# ============================================

`;

  writeEnvFile(envVercelPath, cleanedEnv, header);
  console.log('✅ Đã sắp xếp lại file .env.vercel\n');

  // Tạo .env.local từ keys đã sắp xếp
  const envLocalPath = path.join(rootDir, '.env.local');
  const localEnv = {
    VITE_SUPABASE_URL: cleanedEnv.SUPABASE_URL || cleanedEnv.NEXT_PUBLIC_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: cleanedEnv.SUPABASE_PUBLISHABLE_KEY ||
      cleanedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      cleanedEnv.SUPABASE_ANON_KEY ||
      cleanedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };

  // Giữ lại các keys khác từ .env.local cũ (nếu có)
  if (fs.existsSync(envLocalPath)) {
    const oldLocalEnv = parseEnvFile(envLocalPath);
    Object.entries(oldLocalEnv).forEach(([key, value]) => {
      if (!key.startsWith('VITE_SUPABASE_')) {
        localEnv[key] = value;
      }
    });
  }

  const localHeader = `# ============================================
# Environment Variables for Local Development
# ============================================
# Auto-generated from .env.vercel
# DO NOT commit this file to version control
# ============================================

`;

  writeEnvFile(envLocalPath, localEnv, localHeader);
  console.log('✅ Đã tạo/cập nhật .env.local\n');

  console.log('📋 Tóm tắt:');
  console.log(`   - File .env.vercel: ${Object.keys(cleanedEnv).length} keys (đã sắp xếp)`);
  console.log(`   - File .env.local: ${Object.keys(localEnv).length} keys (đã sync)`);
  console.log();

  console.log('⚠️  LƯU Ý QUAN TRỌNG:');
  console.log('   1. SUPABASE_SERVICE_ROLE_KEY trong Supabase Secrets là RESERVED - không thể sửa');
  console.log('   2. Để dùng Secret Key mới, tạo secret mới tên: SUPABASE_SECRET_KEY');
  console.log('   3. POSTGRES_PASSWORD cần đổi trong Supabase Dashboard → Database → Reset Password');
  console.log('   4. Sau khi đổi POSTGRES_PASSWORD, update lại trong Vercel\n');
}

main();
