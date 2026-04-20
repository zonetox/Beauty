#!/usr/bin/env node
/**
 * Script sanitize documentation files - thay thế real secrets bằng placeholders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Real secrets cần thay thế
const secretsToReplace = {
  // Supabase Secret Key
  'sb_secret_RYrbCXev57Nfym7QwQhxHA_4G6gsyll': 'sb_secret_YOUR_SECRET_KEY_HERE',

  // Supabase Publishable Key (có thể giữ lại vì publishable key có thể public, nhưng để an toàn vẫn thay)
  'sb_publishable_4pjxJvJw48bjVJ0WPScWHQ_j3dPX2Fb': 'sb_publishable_YOUR_PUBLISHABLE_KEY_HERE',

  // Old JWT tokens
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka2xhemxjYnhhaWFwc25uYnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NjYzMCwiZXhwIjoyMDc3MTUyNjMwfQ.OSzYvp44VbheYC1zuylRRrdDrrgmcYuC38TQsJcMhoU': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_JWT_HERE',

  // Old passwords (đã rotate)
  'q1b8nn0MS1YLsOnN': 'YOUR_POSTGRES_PASSWORD_HERE',
  're_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6': 're_YOUR_RESEND_API_KEY_HERE',
};

// Files cần sanitize
const filesToSanitize = [
  'docs/QUICK_FIX_SECRETS.md',
  'docs/FIX_SERVICE_ROLE_KEY.md',
  'docs/HUONG_DAN_NHANH.md',
  'docs/FIX_SECRET_NAME.md',
  'docs/SECRET_ROTATION_GUIDE.md',
  'docs/SECURITY_INCIDENT_RESPONSE.md',
];

function sanitizeFile(filePath) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File không tồn tại: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  Object.entries(secretsToReplace).forEach(([realSecret, placeholder]) => {
    if (content.includes(realSecret)) {
      content = content.replace(new RegExp(realSecret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
      modified = true;
      console.log(`  ✅ Replaced: ${realSecret.substring(0, 30)}... → ${placeholder}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Sanitized: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🧹 SANITIZING DOCUMENTATION FILES\n');
  console.log('='.repeat(60));
  console.log('Thay thế real secrets bằng placeholders...\n');

  let totalModified = 0;

  filesToSanitize.forEach(file => {
    if (sanitizeFile(file)) {
      totalModified++;
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`\n✅ Đã sanitize ${totalModified}/${filesToSanitize.length} files`);
  console.log('\n📋 Lưu ý:');
  console.log('   - Git history vẫn còn secrets cũ');
  console.log('   - Cần xóa secrets khỏi git history bằng BFG Repo-Cleaner hoặc git filter-branch');
  console.log('   - Xem docs/SECURITY_INCIDENT_RESPONSE.md để biết cách xử lý\n');
}

main();
