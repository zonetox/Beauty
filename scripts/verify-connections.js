#!/usr/bin/env node
/**
 * Script kiểm tra kết nối Frontend - Database sau khi đổi password
 * 
 * Usage: node scripts/verify-connections.js
 * 
 * Script sẽ kiểm tra:
 * 1. Frontend có kết nối được với Supabase không
 * 2. Database queries có hoạt động không
 * 3. Authentication có hoạt động không
 * 4. Edge Functions có hoạt động không
 * 5. Environment variables có đúng không
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
function loadEnvFile(filePath) {
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

      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  });

  return env;
}

// Load .env.local
const envLocal = loadEnvFile(path.join(rootDir, '.env.local'));
const supabaseUrl = envLocal.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = envLocal.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logResult(testName, passed, message = '') {
  if (passed) {
    results.passed.push(testName);
    console.log(`✅ ${testName}${message ? ': ' + message : ''}`);
  } else {
    results.failed.push({ test: testName, message });
    console.log(`❌ ${testName}${message ? ': ' + message : ''}`);
  }
}

function logWarning(testName, message) {
  results.warnings.push({ test: testName, message });
  console.log(`⚠️  ${testName}: ${message}`);
}

async function testSupabaseConnection() {
  console.log('\n🔍 KIỂM TRA KẾT NỐI SUPABASE\n');
  console.log('='.repeat(60));

  // Test 1: Environment Variables
  console.log('\n1. Kiểm tra Environment Variables...');
  if (!supabaseUrl) {
    logResult('VITE_SUPABASE_URL', false, 'Không tìm thấy');
    return;
  }
  logResult('VITE_SUPABASE_URL', true, supabaseUrl);

  if (!supabaseAnonKey) {
    logResult('VITE_SUPABASE_ANON_KEY', false, 'Không tìm thấy');
    return;
  }

  const keyType = supabaseAnonKey.startsWith('sb_publishable_') ? 'Publishable Key (mới)' :
    supabaseAnonKey.startsWith('eyJ') ? 'Anon Key (legacy JWT)' :
      'Unknown format';
  logResult('VITE_SUPABASE_ANON_KEY', true, `${keyType} - ${supabaseAnonKey.substring(0, 30)}...`);

  // Test 2: Create Supabase Client
  console.log('\n2. Tạo Supabase Client...');
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    logResult('Create Client', true);
  } catch (error) {
    logResult('Create Client', false, error.message);
    return;
  }

  // Test 3: Test Database Connection
  console.log('\n3. Kiểm tra kết nối Database...');
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);

    if (error) {
      logResult('Database Query', false, error.message);
    } else {
      logResult('Database Query', true, `Connected - Found ${data?.length || 0} records`);
    }
  } catch (error) {
    logResult('Database Query', false, error.message);
  }

  // Test 4: Test RLS Policies
  console.log('\n4. Kiểm tra RLS Policies...');
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('is_active', true)
      .limit(5);

    if (error) {
      if (error.code === '42501') {
        logWarning('RLS Policies', 'Có thể có vấn đề với RLS policies');
      } else {
        logResult('RLS Test', false, error.message);
      }
    } else {
      logResult('RLS Test', true, `Có thể đọc ${data?.length || 0} businesses`);
    }
  } catch (error) {
    logResult('RLS Test', false, error.message);
  }

  // Test 5: Test Authentication
  console.log('\n5. Kiểm tra Authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      logResult('Auth Session', false, error.message);
    } else {
      if (session) {
        logResult('Auth Session', true, `User logged in: ${session.user.email}`);
      } else {
        logResult('Auth Session', true, 'No active session (expected for anonymous)');
      }
    }
  } catch (error) {
    logResult('Auth Session', false, error.message);
  }

  // Test 6: Test Storage
  console.log('\n6. Kiểm tra Storage...');
  try {
    const { error } = await supabase
      .storage
      .from('avatars')
      .list('', { limit: 1 });

    if (error) {
      if (error.message.includes('not found')) {
        logWarning('Storage', 'Bucket "avatars" không tồn tại hoặc không có quyền truy cập');
      } else {
        logResult('Storage Test', false, error.message);
      }
    } else {
      logResult('Storage Test', true, 'Có thể truy cập storage');
    }
  } catch (error) {
    logWarning('Storage Test', error.message);
  }

  // Test 7: Test Edge Functions (via HTTP)
  console.log('\n7. Kiểm tra Edge Functions...');
  try {
    const functionUrl = `${supabaseUrl}/functions/v1/generate-sitemap`;
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      }
    });

    if (response.ok || response.status === 200 || response.status === 404) {
      logResult('Edge Functions', true, `Functions accessible (status: ${response.status})`);
    } else {
      logWarning('Edge Functions', `Status: ${response.status} - Có thể cần authentication`);
    }
  } catch (error) {
    logWarning('Edge Functions', error.message);
  }

  // Test 8: Check Key Format
  console.log('\n8. Kiểm tra Key Format...');
  if (supabaseAnonKey.startsWith('sb_publishable_')) {
    logResult('Key Format', true, 'Đang dùng Publishable Key mới (khuyến nghị)');
  } else if (supabaseAnonKey.startsWith('eyJ')) {
    logWarning('Key Format', 'Đang dùng Legacy JWT Key - Nên chuyển sang Publishable Key');
  } else {
    logWarning('Key Format', 'Key format không nhận diện được');
  }
}

async function testEnvironmentSync() {
  console.log('\n\n🔍 KIỂM TRA ĐỒNG BỘ ENVIRONMENT VARIABLES\n');
  console.log('='.repeat(60));

  // Check .env.local
  console.log('\n1. Kiểm tra .env.local...');
  const envLocalPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envLocal = loadEnvFile(envLocalPath);
    logResult('.env.local exists', true, `${Object.keys(envLocal).length} keys`);

    if (envLocal.VITE_SUPABASE_URL && envLocal.VITE_SUPABASE_ANON_KEY) {
      logResult('.env.local keys', true, 'Có đủ keys cần thiết');
    } else {
      logResult('.env.local keys', false, 'Thiếu keys cần thiết');
    }
  } else {
    logResult('.env.local exists', false, 'File không tồn tại');
  }

  // Check .env.vercel
  console.log('\n2. Kiểm tra .env.vercel...');
  const possiblePaths = [
    path.join(rootDir, '.env.vercel'),
    path.join(rootDir, 'docs', '.env.vercel'),
  ];

  let foundVercel = false;
  for (const vercelPath of possiblePaths) {
    if (fs.existsSync(vercelPath)) {
      const envVercel = loadEnvFile(vercelPath);
      logResult('.env.vercel exists', true, `Found at: ${vercelPath}`);
      logResult('.env.vercel keys', true, `${Object.keys(envVercel).length} keys`);
      foundVercel = true;
      break;
    }
  }

  if (!foundVercel) {
    logWarning('.env.vercel', 'Không tìm thấy file');
  }
}

function printSummary() {
  console.log('\n\n📊 TÓM TẮT KẾT QUẢ\n');
  console.log('='.repeat(60));

  console.log(`\n✅ PASSED: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   ✅ ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED: ${results.failed.length}`);
    results.failed.forEach(({ test, message }) => {
      console.log(`   ❌ ${test}: ${message}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${results.warnings.length}`);
    results.warnings.forEach(({ test, message }) => {
      console.log(`   ⚠️  ${test}: ${message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed.length === 0) {
    console.log('\n🎉 TẤT CẢ KIỂM TRA ĐÃ PASS!');
    console.log('✅ Frontend và Database đã đồng bộ thành công.\n');
  } else {
    console.log('\n⚠️  CÓ MỘT SỐ VẤN ĐỀ CẦN XỬ LÝ:');
    console.log('   Xem chi tiết ở trên để fix.\n');
  }
}

async function main() {
  console.log('🔍 KIỂM TRA KẾT NỐI FRONTEND - DATABASE');
  console.log('='.repeat(60));
  console.log('Sau khi đổi password và cập nhật Vercel\n');

  await testEnvironmentSync();
  await testSupabaseConnection();
  printSummary();
}

main().catch(error => {
  console.error('\n❌ LỖI:', error.message);
  process.exit(1);
});
