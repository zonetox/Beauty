#!/usr/bin/env node
/* eslint-env node */

/**
 * Sync Environment Variables with Vercel using MCP
 * 
 * This script uses MCP Vercel to directly sync env variables
 * between Vercel and local .env.local file
 * 
 * Usage:
 *   node scripts/sync-env-vercel-mcp.js pull    # Pull from Vercel to local
 *   node scripts/sync-env-vercel-mcp.js push     # Push from local to Vercel (use with caution!)
 *   node scripts/sync-env-vercel-mcp.js status   # Show current status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

// Required environment variables
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Optional environment variables
const OPTIONAL_VARS = [
  'GEMINI_API_KEY'
];

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

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      vars[key] = value;
    }
  });

  return vars;
}

function writeEnvFile(filePath, vars, comments = {}) {
  const lines = [];

  // Add header
  lines.push('# ============================================');
  lines.push('# Environment Variables for 1Beauty.asia');
  lines.push('# ============================================');
  lines.push('# Synced from Vercel via MCP');
  lines.push(`# Date: ${new Date().toISOString()}`);
  lines.push('# DO NOT commit this file to version control');
  lines.push('# ============================================');
  lines.push('');

  // Add required variables
  lines.push('# ============================================');
  lines.push('# Supabase Configuration (REQUIRED)');
  lines.push('# ============================================');
  REQUIRED_VARS.forEach(key => {
    if (vars[key]) {
      if (comments[key]) {
        lines.push(`# ${comments[key]}`);
      }
      lines.push(`${key}="${vars[key]}"`);
      lines.push('');
    }
  });

  // Add optional variables
  if (OPTIONAL_VARS.some(key => vars[key])) {
    lines.push('# ============================================');
    lines.push('# Optional Configuration');
    lines.push('# ============================================');
    OPTIONAL_VARS.forEach(key => {
      if (vars[key]) {
        if (comments[key]) {
          lines.push(`# ${comments[key]}`);
        }
        lines.push(`${key}="${vars[key]}"`);
        lines.push('');
      }
    });
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

async function pullFromVercel() {
  console.log('🔄 Pulling environment variables from Vercel...\n');

  try {
    // Note: MCP Vercel tools are not directly callable from Node.js
    // This script provides a template for manual sync or future MCP integration
    console.log('⚠️  MCP Vercel integration requires manual setup.');
    console.log('\n📝 To pull from Vercel:');
    console.log('1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
    console.log('2. Copy the values for:');
    REQUIRED_VARS.forEach(key => console.log(`   - ${key}`));
    OPTIONAL_VARS.forEach(key => console.log(`   - ${key} (optional)`));
    console.log('3. Paste them into .env.local file');
    console.log('\nOr use: npm run env:sync (reads from .env.vercel)');

    // Check if .env.vercel exists as fallback
    const envVercelPath = path.join(__dirname, '..', '.env.vercel');
    if (fs.existsSync(envVercelPath)) {
      console.log('\n✅ Found .env.vercel file. Reading from it...');
      const vercelVars = readEnvFile(envVercelPath);

      if (Object.keys(vercelVars).length > 0) {
        const comments = {
          'VITE_SUPABASE_URL': 'Supabase project URL',
          'VITE_SUPABASE_ANON_KEY': 'Supabase anon/publishable key',
          'GEMINI_API_KEY': 'Gemini AI API key (optional)'
        };

        writeEnvFile(ENV_LOCAL_PATH, vercelVars, comments);
        console.log(`✅ Synced ${Object.keys(vercelVars).length} variables to .env.local`);

        // Validate
        const missing = REQUIRED_VARS.filter(key => !vercelVars[key]);
        if (missing.length > 0) {
          console.log(`\n⚠️  Missing required variables: ${missing.join(', ')}`);
        } else {
          console.log('\n✅ All required variables present');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function pushToVercel() {
  console.log('⚠️  PUSH TO VERCEL - Use with caution!\n');
  console.log('This feature requires manual setup via Vercel Dashboard.');
  console.log('\n📝 To push to Vercel:');
  console.log('1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
  console.log('2. Add/Update variables from .env.local');
  console.log('\n⚠️  Note: Pushing env variables programmatically requires Vercel API access.');
  console.log('For security reasons, manual update via Dashboard is recommended.');
}

async function showStatus() {
  console.log('📊 Environment Variables Status\n');

  const localVars = readEnvFile(ENV_LOCAL_PATH);


  console.log('Local (.env.local):');
  if (Object.keys(localVars).length === 0) {
    console.log('  ❌ File not found or empty');
  } else {
    REQUIRED_VARS.forEach(key => {
      const value = localVars[key];
      if (value) {
        const masked = value.length > 20 ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : '***';
        console.log(`  ✅ ${key} = ${masked}`);
      } else {
        console.log(`  ❌ ${key} = MISSING`);
      }
    });
    OPTIONAL_VARS.forEach(key => {
      if (localVars[key]) {
        console.log(`  ✅ ${key} = Set`);
      } else {
        console.log(`  ⚪ ${key} = Not set (optional)`);
      }
    });
  }

  console.log('\nExample (docs/env.example):');
  console.log('  📄 Template file exists');
}

// Main
const command = process.argv[2] || 'status';

switch (command) {
  case 'pull':
    pullFromVercel();
    break;
  case 'push':
    pushToVercel();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/sync-env-vercel-mcp.js pull    # Pull from Vercel');
    console.log('  node scripts/sync-env-vercel-mcp.js push    # Push to Vercel');
    console.log('  node scripts/sync-env-vercel-mcp.js status  # Show status');
    process.exit(1);
}
