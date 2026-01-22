/**
 * GitHub Secrets Auditor
 * 
 * This script scans your .env.local and ci.yml to tell you EXACTLY 
 * what secrets you need to add to your GitHub Repository Settings.
 */

import fs from 'fs';
import path from 'path';

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const requiredSecrets = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID'
];

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.bold}GitHub Secrets Configuration Check${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}\n`);

// 1. Read .env.local
let envContent = '';
try {
    envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
} catch {
    console.log(`${colors.yellow}⚠️  No .env.local found. Checking .env...${colors.reset}`);
    try {
        envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    } catch {
        console.log(`${colors.red}❌ No .env files found. Cannot audit values.${colors.reset}`);
        process.exit(1);
    }
}

// Parse .env
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        envVars[key] = value;
    }
});

console.log('You need to add these to GitHub (Settings -> Secrets -> Actions):\n');

requiredSecrets.forEach(secret => {
    const value = envVars[secret];

    if (value) {
        console.log(`${colors.green}✅ ${secret}${colors.reset}`);
        console.log(`   Value: ${colors.cyan}${value}${colors.reset}\n`);
    } else {
        console.log(`${colors.red}❌ ${secret}${colors.reset}`);
        console.log(`   Value: ${colors.yellow}[MISSING IN .ENV] - Please find this value!${colors.reset}\n`);
    }
});

console.log(`${colors.bold}Instructions:${colors.reset}`);
console.log('1. Go to your GitHub Repo -> Settings -> Secrets and variables -> Actions');
console.log('2. Click "New repository secret"');
console.log('3. Copy-paste the Name and Value for each item above.');
console.log('4. Once done, the "Context access might be invalid" warnings are safe to ignore.');
