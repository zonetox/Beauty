#!/usr/bin/env node
/* eslint-env node */

/**
 * Reset Users - Display SQL for Manual Execution
 * 
 * This script displays the SQL commands needed to reset users.
 * Since Supabase JS client doesn't support raw SQL execution,
 * you need to run the SQL manually in Supabase Dashboard.
 * 
 * Usage:
 *   node scripts/reset-users-execute.js
 * 
 * Then copy the SQL and run it in:
 *   https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql/new
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = path.join(__dirname, '..', 'database', 'reset_users_complete.sql');

console.log('📋 User Reset SQL Script\n');
console.log('='.repeat(60));
console.log('⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL');
console.log('   You need to run this SQL manually in Supabase Dashboard\n');
console.log('📝 Steps:');
console.log('   1. Copy the SQL below');
console.log('   2. Go to: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/sql/new');
console.log('   3. Paste the SQL and click "Run"\n');
console.log('='.repeat(60));
console.log('\n📄 SQL Script:\n');

if (fs.existsSync(sqlFile)) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log(sql);
  console.log('\n' + '='.repeat(60));
  console.log('✅ SQL script ready to copy!');
} else {
  console.error(`❌ Error: SQL file not found: ${sqlFile}`);
  process.exit(1);
}
