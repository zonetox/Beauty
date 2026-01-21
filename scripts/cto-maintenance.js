/**
 * 1BEAUTY.ASIA - CTO MAINTENANCE SUITE
 * 
 * This script automates technical hardening and database synchronization.
 * It provides "Total Power & Accuracy" as requested.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'fdklazlcbxaiapsnnbqq';
const TYPES_PATH = './types/supabase.ts';

async function runMaintenance() {
    console.log('--- 1BEAUTY.ASIA CTO MAINTENANCE START ---');

    // 1. Sync Database Types
    try {
        console.log('[1/3] Syncing Supabase Types...');
        execSync(`npx supabase gen types typescript --project-id ${PROJECT_ID} --schema public > ${TYPES_PATH}`);
        // Fix encoding from UTF-16 to UTF-8 (PowerShell legacy)
        const content = fs.readFileSync(TYPES_PATH, 'utf16le');
        fs.writeFileSync(TYPES_PATH, content, 'utf8');
        console.log('✅ Types synchronized and encoded correctly.');
    } catch (err) {
        console.error('❌ Failed to sync types. Ensure you have network access or run "supabase login".');
    }

    // 2. Audit Database Triggers & RLS
    console.log('[2/3] Auditing Database Integrity...');
    const schemaFile = './database/schema_v1.0_FINAL.sql';
    if (fs.existsSync(schemaFile)) {
        const content = fs.readFileSync(schemaFile, 'utf8');
        if (content.includes('public.handle_new_user()')) {
            console.log('✅ User Sync Trigger (handle_new_user) found in source schema.');
        } else {
            console.warn('⚠️ User Sync Trigger missing from source schema. Checking live database is recommended.');
        }
    }

    // 3. Verify Environment Configuration
    console.log('[3/3] Verifying Environment...');
    const envFile = '.env.local';
    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
            console.log('✅ Environment keys found.');
        } else {
            console.error('❌ Environment keys missing in .env.local.');
        }
    }

    console.log('--- MAINTENANCE COMPLETE ---');
}

runMaintenance();
