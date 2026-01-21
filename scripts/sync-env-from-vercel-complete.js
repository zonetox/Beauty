#!/usr/bin/env node
/* eslint-env node */

/**
 * Complete Environment Sync from Vercel
 * 
 * This script:
 * 1. Reads env from .env.vercel (if exists)
 * 2. Validates all variables
 * 3. Updates .env.local with verified values
 * 4. Tests Supabase connection
 * 5. Generates sync report
 * 
 * Usage: node scripts/sync-env-from-vercel-complete.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const ENV_VERCEL_PATH = path.join(__dirname, '..', '.env.vercel');

const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const OPTIONAL_VARS = ['GEMINI_API_KEY'];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      return;
    }

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      vars[key] = value;
    }
  });

  return vars;
}

function writeEnvFile(filePath, vars) {
  const lines = [];

  lines.push('# ============================================');
  lines.push('# Environment Variables for 1Beauty.asia');
  lines.push('# ============================================');
  lines.push('# Synced from Vercel');
  lines.push(`# Date: ${new Date().toISOString()}`);
  lines.push('# DO NOT commit this file to version control');
  lines.push('# ============================================');
  lines.push('');
  lines.push('# ============================================');
  lines.push('# Supabase Configuration (REQUIRED)');
  lines.push('# ============================================');
  lines.push('# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api');
  lines.push('');

  REQUIRED_VARS.forEach(key => {
    if (vars[key]) {
      lines.push(`${key}="${vars[key]}"`);
      lines.push('');
    }
  });

  if (OPTIONAL_VARS.some(key => vars[key])) {
    lines.push('# ============================================');
    lines.push('# Optional Configuration');
    lines.push('# ============================================');
    OPTIONAL_VARS.forEach(key => {
      if (vars[key]) {
        lines.push(`${key}="${vars[key]}"`);
        lines.push('');
      }
    });
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

function validateVar(key, value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Empty value' };
  }

  const placeholders = [
    'your-project-url',
    'your-public-anon-key',
    'your-gemini-api-key',
    'YOUR_KEY_HERE'
  ];

  for (const placeholder of placeholders) {
    if (value.toLowerCase().includes(placeholder)) {
      return { valid: false, error: `Contains placeholder: ${placeholder}` };
    }
  }

  if (key === 'VITE_SUPABASE_URL') {
    if (!value.startsWith('https://')) {
      return { valid: false, error: 'Must start with https://' };
    }
    if (!value.includes('.supabase.co')) {
      return { valid: false, error: 'Must be a Supabase URL' };
    }
  }

  if (key === 'VITE_SUPABASE_ANON_KEY') {
    const isPublishable = value.startsWith('sb_publishable_');
    const isLegacy = value.startsWith('eyJ');
    if (!isPublishable && !isLegacy) {
      return { valid: false, error: 'Invalid format (should start with sb_publishable_ or eyJ)' };
    }
    if (isPublishable && value.length < 30) {
      return { valid: false, error: 'Publishable key too short' };
    }
    if (isLegacy && value.length < 100) {
      return { valid: false, error: 'Legacy JWT key too short' };
    }
  }

  if (key === 'GEMINI_API_KEY' && !value.startsWith('AIza')) {
    return { valid: false, error: 'Invalid format (should start with AIza)' };
  }

  return { valid: true };
}

async function testConnection(url, key) {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔄 Complete Environment Sync from Vercel\n');

  // Read Vercel env
  if (!fs.existsSync(ENV_VERCEL_PATH)) {
    console.error('❌ Error: .env.vercel file not found!');
    console.log('\n📝 To sync from Vercel:');
    console.log('1. Go to Vercel Dashboard > Project > Settings > Environment Variables');
    console.log('2. Export or copy all variables');
    console.log('3. Save to .env.vercel file in project root');
    console.log('4. Format: VARIABLE_NAME="value" (one per line)');
    console.log('\nOr ask AI assistant to sync directly from Vercel.');
    process.exit(1);
  }

  const vercelVars = readEnvFile(ENV_VERCEL_PATH);
  console.log(`✅ Read ${Object.keys(vercelVars).length} variables from .env.vercel\n`);

  // Validate
  console.log('🔍 Validating variables...\n');
  const validationResults = {};
  let allValid = true;

  REQUIRED_VARS.forEach(key => {
    const value = vercelVars[key];
    if (!value) {
      console.error(`❌ ${key}: MISSING`);
      validationResults[key] = { valid: false, error: 'Missing' };
      allValid = false;
    } else {
      const result = validateVar(key, value);
      validationResults[key] = result;
      if (result.valid) {
        console.log(`✅ ${key}: Valid`);
      } else {
        console.error(`❌ ${key}: ${result.error}`);
        allValid = false;
      }
    }
  });

  OPTIONAL_VARS.forEach(key => {
    if (vercelVars[key]) {
      const result = validateVar(key, vercelVars[key]);
      if (result.valid) {
        console.log(`✅ ${key}: Valid (optional)`);
      } else {
        console.log(`⚠️  ${key}: ${result.error} (optional)`);
      }
    }
  });

  if (!allValid) {
    console.error('\n❌ Validation failed. Please fix errors before syncing.');
    process.exit(1);
  }

  // Test connection
  console.log('\n🔌 Testing Supabase connection...');
  const connectionTest = await testConnection(
    vercelVars.VITE_SUPABASE_URL,
    vercelVars.VITE_SUPABASE_ANON_KEY
  );

  if (connectionTest.success) {
    console.log('✅ Connection successful!');
  } else {
    console.log(`⚠️  Connection test failed: ${connectionTest.error || connectionTest.status}`);
    console.log('   (This might be OK if RLS is strict)');
  }

  // Write to .env.local
  console.log('\n📝 Writing to .env.local...');
  writeEnvFile(ENV_LOCAL_PATH, vercelVars);
  console.log('✅ Updated .env.local\n');

  // Summary
  console.log('📊 Sync Summary');
  console.log('─'.repeat(50));
  console.log(`✅ Required variables: ${REQUIRED_VARS.length}/${REQUIRED_VARS.length}`);
  console.log(`🔌 Connection test: ${connectionTest.success ? '✅ Success' : '⚠️  Failed (might be OK)'}`);
  console.log(`📄 Updated: .env.local`);
  console.log('\n✅ Sync completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm run env:verify');
  console.log('   2. Run: npm run dev (to test)');
  console.log('   3. Run: npm run build (to verify build)');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
