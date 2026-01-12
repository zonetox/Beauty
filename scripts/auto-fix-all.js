#!/usr/bin/env node
/* eslint-env node */
/**
 * Script tự động fix tất cả - KHÔNG PUSH CODE
 * 
 * Usage: node scripts/auto-fix-all.js
 * 
 * Script sẽ:
 * 1. Đọc .env.vercel (tìm ở nhiều vị trí)
 * 2. Sắp xếp và clean keys
 * 3. Tạo .env.local
 * 4. Hiển thị hướng dẫn set secrets trong Supabase/Vercel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Tìm file .env.vercel ở nhiều vị trí
const possiblePaths = [
  path.join(rootDir, '.env.vercel'),
  path.join(rootDir, 'docs', '.env.vercel'),
  path.join(process.cwd(), '.env.vercel'),
];

function findEnvVercelFile() {
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content && content.trim().length > 0) {
          return { path: filePath, content };
        }
      }
    } catch (error) {
      // Continue searching
    }
  }
  return null;
}

function parseEnvContent(content) {
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
  
  // Sắp xếp keys
  const keyOrder = [
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_PASSWORD',
    'RESEND_API_KEY',
    'SITE_URL',
  ];
  
  const addedKeys = new Set();
  keyOrder.forEach(key => {
    if (env[key]) {
      lines.push(`${key}="${env[key]}"`);
      addedKeys.add(key);
    }
  });
  
  Object.entries(env)
    .filter(([key]) => !addedKeys.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`${key}="${value}"`);
    });
  
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

function main() {
  console.log('🔧 AUTO FIX ALL - KHÔNG PUSH CODE\n');
  
  // 1. Tìm file .env.vercel
  const envFile = findEnvVercelFile();
  if (!envFile) {
    console.error('❌ Không tìm thấy file .env.vercel!');
    console.log('\n📝 Đã tìm ở các vị trí:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    console.log('\n💡 Tạo file .env.vercel ở project root và paste keys từ Vercel vào đó.');
    process.exit(1);
  }
  
  console.log(`✅ Tìm thấy file: ${envFile.path}\n`);
  
  // 2. Parse keys
  const env = parseEnvContent(envFile.content);
  console.log(`✅ Đọc được ${Object.keys(env).length} keys\n`);
  
  // 3. Sắp xếp và clean
  const cleanedEnv = {};
  Object.entries(env).forEach(([key, value]) => {
    // Loại bỏ duplicates (ưu tiên key không có NEXT_PUBLIC_)
    if (key.startsWith('NEXT_PUBLIC_')) {
      const baseKey = key.replace('NEXT_PUBLIC_', '');
      if (env[baseKey]) {
        return; // Skip, dùng base key
      }
    }
    cleanedEnv[key] = value;
  });
  
  // 4. Ghi lại file đã sắp xếp
  const header = `# ============================================
# Vercel Supabase Integration Keys
# ============================================
# Auto-sorted and cleaned
# DO NOT commit this file to version control
# ============================================

`;
  
  writeEnvFile(envFile.path, cleanedEnv, header);
  console.log('✅ Đã sắp xếp lại file .env.vercel\n');
  
  // 5. Tạo .env.local
  const envLocalPath = path.join(rootDir, '.env.local');
  const localEnv = {
    VITE_SUPABASE_URL: cleanedEnv.SUPABASE_URL || cleanedEnv.NEXT_PUBLIC_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: cleanedEnv.SUPABASE_PUBLISHABLE_KEY || 
                            cleanedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                            cleanedEnv.SUPABASE_ANON_KEY || 
                            cleanedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
  
  // Giữ lại keys khác từ .env.local cũ
  if (fs.existsSync(envLocalPath)) {
    const oldEnv = parseEnvContent(fs.readFileSync(envLocalPath, 'utf-8'));
    Object.entries(oldEnv).forEach(([key, value]) => {
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
  
  // 6. Hiển thị thông tin quan trọng
  console.log('📋 KEYS QUAN TRỌNG:\n');
  
  const publishableKey = cleanedEnv.SUPABASE_PUBLISHABLE_KEY || cleanedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = cleanedEnv.SUPABASE_SECRET_KEY;
  const postgresPassword = cleanedEnv.POSTGRES_PASSWORD;
  
  if (publishableKey) {
    console.log(`✅ Publishable Key: ${publishableKey.substring(0, 30)}...`);
  }
  
  if (secretKey) {
    console.log(`✅ Secret Key: ${secretKey.substring(0, 30)}...`);
  }
  
  if (postgresPassword) {
    console.log(`⚠️  POSTGRES_PASSWORD: ${postgresPassword} (CẦN ĐỔI)`);
  }
  
  console.log('\n📝 HƯỚNG DẪN SET SECRETS:\n');
  
  if (secretKey) {
    console.log('1. SUPABASE SECRETS (Edge Functions):');
    console.log('   - Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/functions/secrets');
    console.log('   - Click "Add Secret"');
    console.log('   - Name: SECRET_KEY (KHÔNG có prefix SUPABASE_)');
    console.log(`   - Value: ${secretKey}`);
    console.log('');
  }
  
  if (publishableKey) {
    console.log('2. VERCEL ENVIRONMENT VARIABLES:');
    console.log('   - Vào: Vercel Dashboard → Project → Settings → Environment Variables');
    console.log(`   - VITE_SUPABASE_ANON_KEY = ${publishableKey}`);
    console.log('');
  }
  
  if (postgresPassword) {
    console.log('3. ĐỔI POSTGRES_PASSWORD:');
    console.log('   - Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/database');
    console.log('   - Click "Reset Database Password"');
    console.log('   - Update trong Vercel Environment Variables');
    console.log('');
  }
  
  console.log('✅ Hoàn tất! File đã được sắp xếp.\n');
  console.log('⚠️  LƯU Ý: Script KHÔNG tự động set secrets trong Supabase/Vercel.');
  console.log('   Bạn cần set thủ công theo hướng dẫn trên.\n');
}

main();
