/* eslint-env node */
/**
 * Run All Checks Script
 * Runs all validation checks in sequence
 */

import { execSync } from 'child_process';

const checks = [
  { name: 'TypeScript Check', command: 'npm run type-check', critical: true },
  { name: 'ESLint', command: 'npm run lint', critical: false },
  { name: 'Unit Tests', command: 'npm run test', critical: true },
  { name: 'Health Check', command: 'npm run health:check', critical: true },
];

const results = [];

console.log('🔍 Running All Checks...\n');

for (const check of checks) {
  console.log(`\n📋 Running: ${check.name}`);
  console.log('─'.repeat(50));

  try {
    execSync(check.command, { stdio: 'inherit' });
    results.push({ name: check.name, status: 'pass', critical: check.critical });
    console.log(`\n✅ ${check.name} passed`);
  } catch {
    results.push({ name: check.name, status: 'fail', critical: check.critical });
    console.log(`\n❌ ${check.name} failed`);

    if (check.critical) {
      console.log(`\n⚠️  Critical check failed. Stopping.`);
      process.exit(1);
    }
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log('='.repeat(50));

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const criticalFailed = results.filter(r => r.status === 'fail' && r.critical).length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🚨 Critical Failed: ${criticalFailed}`);

if (criticalFailed > 0) {
  console.log('\n❌ Critical checks failed. Please fix before proceeding.');
  process.exit(1);
}

if (failed > 0) {
  console.log('\n⚠️  Some non-critical checks failed. Review and fix when possible.');
}

console.log('\n✅ All critical checks passed!');
