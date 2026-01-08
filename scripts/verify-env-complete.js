#!/usr/bin/env node

/**
 * Verify Environment Variables Completeness
 * 
 * Checks if all required environment variables are set and valid
 * 
 * Usage: node scripts/verify-env-complete.js
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_VARS = {
  'VITE_SUPABASE_URL': {
    description: 'Supabase project URL',
    validate: (value) => {
      if (!value) return { valid: false, error: 'Missing' };
      if (!value.startsWith('https://')) return { valid: false, error: 'Must start with https://' };
      if (value.includes('your-project-url')) return { valid: false, error: 'Contains placeholder' };
      return { valid: true };
    }
  },
  'VITE_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous/public key',
    validate: (value) => {
      if (!value) return { valid: false, error: 'Missing' };
      if (!value.startsWith('eyJ')) return { valid: false, error: 'Invalid format (should start with eyJ)' };
      if (value.includes('your-public-anon-key')) return { valid: false, error: 'Contains placeholder' };
      if (value.length < 100) return { valid: false, error: 'Too short (likely invalid)' };
      return { valid: true };
    }
  }
};

// Optional environment variables
const OPTIONAL_VARS = {
  'GEMINI_API_KEY': {
    description: 'Google Gemini API key (for AI features)',
    validate: (value) => {
      if (!value) return { valid: true, warning: 'Not set (AI features will not work)' };
      if (!value.startsWith('AIza')) return { valid: false, error: 'Invalid format (should start with AIza)' };
      if (value.includes('your-gemini-api-key')) return { valid: false, error: 'Contains placeholder' };
      return { valid: true };
    }
  }
};

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

function checkEnvironment() {
  console.log('🔍 Verifying Environment Variables Completeness...\n');

  // Check .env.local
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envLocal = readEnvFile(envLocalPath);

  // Check .env.vercel (if exists)
  const envVercelPath = path.join(__dirname, '..', '.env.vercel');
  const envVercel = readEnvFile(envVercelPath);

  // Merge (local takes precedence)
  const allVars = { ...envVercel, ...envLocal };

  console.log('📋 Checking Required Variables:\n');

  let allValid = true;
  const results = {
    required: [],
    optional: [],
    missing: [],
    invalid: []
  };

  // Check required variables
  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = allVars[key];
    const validation = config.validate(value);

    if (!value) {
      results.missing.push({ key, description: config.description });
      allValid = false;
      console.log(`❌ ${key}: MISSING - ${config.description}`);
    } else if (!validation.valid) {
      results.invalid.push({ key, error: validation.error, description: config.description });
      allValid = false;
      console.log(`❌ ${key}: INVALID - ${validation.error}`);
    } else {
      results.required.push({ key, description: config.description });
      const displayValue = value.length > 50 
        ? `${value.substring(0, 47)}...` 
        : value;
      console.log(`✅ ${key}: OK - ${displayValue}`);
    }
  });

  console.log('\n📋 Checking Optional Variables:\n');

  // Check optional variables
  Object.entries(OPTIONAL_VARS).forEach(([key, config]) => {
    const value = allVars[key];
    const validation = config.validate(value);

    if (!value) {
      results.optional.push({ key, status: 'not set', description: config.description });
      console.log(`⚠️  ${key}: NOT SET - ${config.description} (optional)`);
    } else if (!validation.valid) {
      results.invalid.push({ key, error: validation.error, description: config.description });
      allValid = false;
      console.log(`❌ ${key}: INVALID - ${validation.error}`);
    } else if (validation.warning) {
      results.optional.push({ key, status: 'warning', description: config.description, warning: validation.warning });
      console.log(`⚠️  ${key}: ${validation.warning}`);
    } else {
      results.optional.push({ key, status: 'set', description: config.description });
      const displayValue = value.length > 50 
        ? `${value.substring(0, 47)}...` 
        : value;
      console.log(`✅ ${key}: OK - ${displayValue}`);
    }
  });

  // Summary
  console.log('\n📊 Summary:\n');
  console.log(`   Required: ${results.required.length}/${Object.keys(REQUIRED_VARS).length} ✅`);
  console.log(`   Optional: ${results.optional.filter(o => o.status === 'set').length}/${Object.keys(OPTIONAL_VARS).length} set`);
  console.log(`   Missing: ${results.missing.length}`);
  console.log(`   Invalid: ${results.invalid.length}`);

  if (results.missing.length > 0) {
    console.log('\n❌ Missing Variables:');
    results.missing.forEach(({ key, description }) => {
      console.log(`   - ${key}: ${description}`);
    });
  }

  if (results.invalid.length > 0) {
    console.log('\n❌ Invalid Variables:');
    results.invalid.forEach(({ key, error, description }) => {
      console.log(`   - ${key}: ${error} (${description})`);
    });
  }

  // Final verdict
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ VERIFICATION PASSED');
    console.log('   All required environment variables are set and valid.');
    console.log('   Application is ready to run.');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('   Please fix the issues above before running the application.');
    process.exit(1);
  }
  console.log('='.repeat(50) + '\n');

  return allValid;
}

// Run verification
checkEnvironment();
