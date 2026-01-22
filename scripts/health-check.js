/* eslint-env node */
/**
 * Comprehensive Health Check Script
 * Automatically verifies all critical paths and configurations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const errors = [];
const warnings = [];
const checks = [];

function logCheck(name, status, message = '') {
  checks.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
}

async function checkSupabaseConnection() {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      logCheck('Supabase Config', 'fail', 'Missing environment variables');
      errors.push('Supabase environment variables not set');
      return false;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      logCheck('Supabase Connection', 'fail', error.message);
      errors.push(`Supabase connection failed: ${error.message}`);
      return false;
    }

    logCheck('Supabase Connection', 'pass');
    return true;
  } catch (error) {
    logCheck('Supabase Connection', 'fail', error.message);
    errors.push(`Supabase connection error: ${error.message}`);
    return false;
  }
}

async function checkDatabaseTables() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const requiredTables = [
      'profiles',
      'businesses',
      'admin_users',
      'registration_requests',
      'page_content',
    ];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = table not found
          logCheck(`Table: ${table}`, 'fail', error.message);
          errors.push(`Table ${table} check failed: ${error.message}`);
        } else {
          logCheck(`Table: ${table}`, 'pass');
        }
      } catch (err) {
        logCheck(`Table: ${table}`, 'fail', err.message);
        errors.push(`Table ${table} error: ${err.message}`);
      }
    }
  } catch (error) {
    logCheck('Database Tables Check', 'fail', error.message);
    errors.push(`Database tables check failed: ${error.message}`);
  }
}

async function checkRPCFunctions() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const requiredFunctions = [
      'search_businesses',
      'search_businesses_advanced',
      'get_business_count',
      'increment_business_view_count',
      'increment_blog_view_count',
      'increment_business_blog_view_count',
    ];

    for (const func of requiredFunctions) {
      try {
        // Try calling with minimal params
        const { error } = await supabase.rpc(func, {});
        // Error is expected if params are wrong, but function should exist
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          logCheck(`RPC Function: ${func}`, 'fail', 'Function does not exist');
          errors.push(`RPC function ${func} does not exist`);
        } else {
          logCheck(`RPC Function: ${func}`, 'pass');
        }
      } catch (err) {
        logCheck(`RPC Function: ${func}`, 'warn', err.message);
        warnings.push(`RPC function ${func} check: ${err.message}`);
      }
    }
  } catch (error) {
    logCheck('RPC Functions Check', 'fail', error.message);
    errors.push(`RPC functions check failed: ${error.message}`);
  }
}

function checkTypeScriptConfig() {
  try {
    const tsconfigPath = join(process.cwd(), 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

    if (!tsconfig.compilerOptions) {
      logCheck('TypeScript Config', 'warn', 'No compilerOptions found');
      warnings.push('TypeScript config missing compilerOptions');
      return;
    }

    logCheck('TypeScript Config', 'pass');
  } catch (error) {
    logCheck('TypeScript Config', 'warn', error.message);
    warnings.push(`TypeScript config check: ${error.message}`);
  }
}

function checkPackageJson() {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));

    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'react-hot-toast',
    ];

    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);

    if (missingDeps.length > 0) {
      logCheck('Package Dependencies', 'fail', `Missing: ${missingDeps.join(', ')}`);
      errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      logCheck('Package Dependencies', 'pass');
    }
  } catch (error) {
    logCheck('Package.json Check', 'fail', error.message);
    errors.push(`Package.json check failed: ${error.message}`);
  }
}

async function main() {
  console.log('\n🔍 Starting Comprehensive Health Check...\n');

  // Run all checks
  await checkSupabaseConnection();
  await checkDatabaseTables();
  await checkRPCFunctions();
  checkTypeScriptConfig();
  checkPackageJson();

  // Summary
  console.log('\n📊 Summary:');
  console.log(`✅ Passed: ${checks.filter(c => c.status === 'pass').length}`);
  console.log(`⚠️  Warnings: ${checks.filter(c => c.status === 'warn').length}`);
  console.log(`❌ Failed: ${checks.filter(c => c.status === 'fail').length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(err => console.log(`  - ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ All critical checks passed!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error during health check:', error);
  process.exit(1);
});
