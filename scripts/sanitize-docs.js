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

// Placeholder secrets for sanitization patterns
const secretsToReplace = {
  // Pattern to replace Supabase Secrets (generic)
  'sb_secret_[a-zA-Z0-9_-]+': 'sb_secret_YOUR_SECRET_KEY_HERE',
  'sb_publishable_[a-zA-Z0-9_-]+': 'sb_publishable_YOUR_PUBLISHABLE_KEY_HERE',
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

  Object.entries(secretsToReplace).forEach(([pattern, placeholder]) => {
    // Nếu là regex pattern, dùng regex
    if (pattern.includes('[') || pattern.includes('+')) {
      const regex = new RegExp(pattern, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, placeholder);
        modified = true;
        console.log(`  ✅ Replaced pattern: ${pattern} → ${placeholder}`);
      }
    } else {
      // Nếu là string literal
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
        modified = true;
        console.log(`  ✅ Replaced: ${pattern.substring(0, 30)}... → ${placeholder}`);
      }
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
