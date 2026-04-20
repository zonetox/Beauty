#!/usr/bin/env node
/**
 * Security Audit Script - Kiểm tra bảo mật trước khi push
 * 
 * Usage: node scripts/security-audit.js
 * 
 * Script sẽ kiểm tra:
 * 1. Secrets có trong git history không
 * 2. Secrets có trong files hiện tại không
 * 3. .gitignore đã đúng chưa
 * 4. Environment files có bị commit không
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Patterns để tìm secrets
const secretPatterns = [
  // API Keys
  { pattern: /re_[A-Za-z0-9_-]{40,}/g, name: 'Resend API Key', severity: 'HIGH' },
  { pattern: /sb_publishable_[A-Za-z0-9_-]{30,}/g, name: 'Supabase Publishable Key', severity: 'MEDIUM' },
  { pattern: /sb_secret_[A-Za-z0-9_-]{30,}/g, name: 'Supabase Secret Key', severity: 'HIGH' },
  // JWT Tokens
  { pattern: /eyJ[A-Za-z0-9_-]{100,}/g, name: 'JWT Token', severity: 'HIGH' },
  // PostgreSQL URLs
  { pattern: /postgres:\/\/[^:]+:[^@]+@[^\s"']+/g, name: 'PostgreSQL Connection String', severity: 'CRITICAL' },
  // Passwords
  { pattern: new RegExp('password["\\s:=]+([A-Za-z0-9!@#$%^&*()_+\\-=[]{};\':"\\\\|,.<>/ ?]{8,})', 'gi'), name: 'Password', severity: 'HIGH' },
  // Generic high entropy (có thể là keys)
  { pattern: /[A-Za-z0-9]{32,}/g, name: 'High Entropy String', severity: 'LOW' },
];

// Files được phép có secrets (documentation với placeholders)
const allowedFiles = [
  'docs/env.example',
  'docs/.env.vercel.example',
  'docs/SECRET_ROTATION_GUIDE.md',
  'docs/FIX_SERVICE_ROLE_KEY.md',
  'docs/QUICK_FIX_SECRETS.md',
];

const results = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  passed: []
};

function logIssue(severity, file, line, pattern, match) {
  const issue = {
    file,
    line,
    pattern,
    match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
    fullMatch: match
  };

  results[severity.toLowerCase()].push(issue);

  const icon = severity === 'CRITICAL' ? '🔴' :
    severity === 'HIGH' ? '🟠' :
      severity === 'MEDIUM' ? '🟡' : '⚪';

  console.log(`${icon} [${severity}] ${file}:${line}`);
  console.log(`   Pattern: ${pattern.name}`);
  console.log(`   Match: ${issue.match}`);
}

function checkFile(filePath, relativePath) {
  // Skip allowed files
  if (allowedFiles.some(allowed => relativePath.includes(allowed))) {
    return;
  }

  // Skip node_modules và dist
  if (relativePath.includes('node_modules') || relativePath.includes('dist')) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      secretPatterns.forEach(({ pattern, name, severity }) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Skip nếu là placeholder
            if (match.includes('your-') ||
              match.includes('YOUR_') ||
              match.includes('example') ||
              match.includes('placeholder')) {
              return;
            }

            logIssue(severity, relativePath, index + 1, { name }, match);
          });
        }
      });
    });
  } catch {
    // File không đọc được hoặc binary
  }
}

function checkGitHistory() {
  console.log('\n🔍 Kiểm tra Git History...\n');

  const knownLeakedSecrets = [
    'q1b8nn0MS1YLsOnN', // Old POSTGRES_PASSWORD
    're_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6', // Old RESEND_API_KEY
  ];

  knownLeakedSecrets.forEach(secret => {
    try {
      const result = execSync(
        `git log --all --full-history -S "${secret}" --oneline`,
        { encoding: 'utf-8', cwd: rootDir, stdio: 'pipe' }
      );

      if (result.trim()) {
        results.high.push({
          type: 'git_history',
          secret: secret.substring(0, 20) + '...',
          commits: result.trim().split('\n').slice(0, 5)
        });
        console.log(`⚠️  Secret cũ còn trong git history: ${secret.substring(0, 20)}...`);
        console.log(`   Commits: ${result.trim().split('\n').length} commits`);
      }
    } catch {
      // Secret không tìm thấy trong history (tốt)
    }
  });
}

function checkGitIgnore() {
  console.log('\n🔍 Kiểm tra .gitignore...\n');

  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    results.critical.push({ type: 'gitignore', issue: '.gitignore không tồn tại' });
    console.log('❌ .gitignore không tồn tại!');
    return;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  const requiredPatterns = [
    '.env',
    '.env.local',
    '.env.vercel',
    '*.key',
    '*.pem',
  ];

  requiredPatterns.forEach(pattern => {
    if (gitignoreContent.includes(pattern)) {
      results.passed.push(`.gitignore có pattern: ${pattern}`);
      console.log(`✅ .gitignore có pattern: ${pattern}`);
    } else {
      results.medium.push({ type: 'gitignore', missing: pattern });
      console.log(`⚠️  .gitignore thiếu pattern: ${pattern}`);
    }
  });
}

function checkTrackedFiles() {
  console.log('\n🔍 Kiểm tra files đang được track...\n');

  try {
    const trackedFiles = execSync(
      'git ls-files',
      { encoding: 'utf-8', cwd: rootDir, stdio: 'pipe' }
    ).trim().split('\n');

    const sensitiveFiles = trackedFiles.filter(file => {
      return file.includes('.env') &&
        !file.includes('.example') &&
        !file.includes('env.example');
    });

    if (sensitiveFiles.length > 0) {
      sensitiveFiles.forEach(file => {
        results.critical.push({ type: 'tracked_file', file });
        console.log(`🔴 File nhạy cảm đang được track: ${file}`);
      });
    } else {
      results.passed.push('Không có .env files được track');
      console.log('✅ Không có .env files được track');
    }
  } catch {
    console.log('⚠️  Không thể kiểm tra tracked files');
  }
}

function scanDirectory(dir, relativeDir = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(relativeDir, entry.name);

    // Skip node_modules, dist, .git
    if (entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.git' ||
      entry.name.startsWith('.')) {
      return;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, relativePath);
    } else if (entry.isFile()) {
      // Chỉ check text files
      const ext = path.extname(entry.name);
      const textExtensions = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.env', '.sql'];

      if (textExtensions.includes(ext) || entry.name.startsWith('.env')) {
        checkFile(fullPath, relativePath);
      }
    }
  });
}

function printSummary() {
  console.log('\n\n📊 TÓM TẮT KIỂM TRA BẢO MẬT\n');
  console.log('='.repeat(60));

  if (results.critical.length > 0) {
    console.log(`\n🔴 CRITICAL: ${results.critical.length}`);
    results.critical.forEach(issue => {
      if (issue.file) {
        console.log(`   🔴 ${issue.file}:${issue.line} - ${issue.pattern.name}`);
      } else {
        console.log(`   🔴 ${JSON.stringify(issue)}`);
      }
    });
  }

  if (results.high.length > 0) {
    console.log(`\n🟠 HIGH: ${results.high.length}`);
    results.high.forEach(issue => {
      if (issue.file) {
        console.log(`   🟠 ${issue.file}:${issue.line} - ${issue.pattern.name}`);
      } else {
        console.log(`   🟠 ${JSON.stringify(issue)}`);
      }
    });
  }

  if (results.medium.length > 0) {
    console.log(`\n🟡 MEDIUM: ${results.medium.length}`);
    results.medium.forEach(issue => {
      console.log(`   🟡 ${JSON.stringify(issue)}`);
    });
  }

  if (results.low.length > 0) {
    console.log(`\n⚪ LOW: ${results.low.length}`);
    console.log(`   (Có ${results.low.length} potential issues - cần review thủ công)`);
  }

  console.log(`\n✅ PASSED: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   ✅ ${test}`));

  console.log('\n' + '='.repeat(60));

  if (results.critical.length === 0 && results.high.length === 0) {
    console.log('\n🎉 KHÔNG CÓ VẤN ĐỀ BẢO MẬT NGHIÊM TRỌNG!');
    console.log('✅ Có thể push code an toàn.\n');
    return true;
  } else {
    console.log('\n⚠️  CÓ VẤN ĐỀ BẢO MẬT CẦN XỬ LÝ TRƯỚC KHI PUSH!');
    console.log('   Xem chi tiết ở trên để fix.\n');
    return false;
  }
}

async function main() {
  console.log('🔒 SECURITY AUDIT - KIỂM TRA BẢO MẬT TRƯỚC KHI PUSH');
  console.log('='.repeat(60));
  console.log('Kiểm tra secrets, .gitignore, và git history\n');

  // 1. Check .gitignore
  checkGitIgnore();

  // 2. Check tracked files
  checkTrackedFiles();

  // 3. Check git history
  checkGitHistory();

  // 4. Scan current files
  console.log('\n🔍 Quét files hiện tại...\n');
  console.log('(Có thể mất vài giây...)\n');

  scanDirectory(rootDir);

  // 5. Summary
  const safe = printSummary();

  if (!safe) {
    console.log('\n📋 HÀNH ĐỘNG CẦN THỰC HIỆN:');
    console.log('   1. Xóa hoặc thay thế secrets trong files');
    console.log('   2. Đảm bảo .gitignore đã đúng');
    console.log('   3. Xóa files nhạy cảm khỏi git tracking (nếu có)');
    console.log('   4. Chạy lại script này để verify\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ LỖI:', error.message);
  process.exit(1);
});
