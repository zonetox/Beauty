# H3 - BACKUP & RECOVERY PLAN
**Tuân thủ Master Plan v1.1**  
**Date:** 2025-01-08

---

## 📋 TỔNG QUAN

Backup & Recovery plan đảm bảo data và code có thể được restore trong trường hợp sự cố.

---

## 🗄️ H3.1 DATABASE BACKUP

### Automated Backups (Supabase)

**Setup:**
1. Vào Supabase Dashboard → Database → Backups
2. Enable **Point-in-Time Recovery (PITR)**:
   - ✅ Recommended for production
   - Allows restore to any point in time
   - Retention: 7 days (free tier), up to 30 days (paid)

**Backup Frequency:**
- **Automatic:** Daily backups (handled by Supabase)
- **Manual:** Before major migrations or deployments
- **Retention:** 30 days (recommended)

### Manual Backup Procedure

**Via Supabase Dashboard:**
1. Database → Backups → Create Backup
2. Wait for backup to complete
3. Download backup file (if needed)

**Via Supabase CLI:**
```bash
# Create backup
supabase db dump -f backup_$(date +%Y%m%d).sql

# Restore from backup
supabase db reset --db-url postgresql://... < backup_20250108.sql
```

### Backup Verification

**Checklist:**
- [ ] Automated backups enabled
- [ ] Backup frequency configured
- [ ] Retention period set
- [ ] Test restore successful
- [ ] Backup files stored securely

### Restore Procedure

**Via Supabase Dashboard:**
1. Database → Backups
2. Select backup to restore
3. Click "Restore"
4. Confirm restore
5. Wait for restore to complete
6. Verify data integrity

**Via Supabase CLI:**
```bash
# Restore from backup file
supabase db reset --db-url postgresql://... < backup_file.sql
```

**Verification After Restore:**
- [ ] All tables exist
- [ ] Data integrity verified
- [ ] RLS policies intact
- [ ] Functions intact
- [ ] Test critical queries

---

## 📦 H3.2 STORAGE BACKUP

### Supabase Storage Redundancy

**Automatic:**
- Supabase Storage has built-in redundancy
- Files are stored across multiple servers
- No manual backup needed for basic redundancy

### Manual Storage Backup

**For Critical Files:**
1. Export bucket contents:
   ```bash
   # Via Supabase CLI (if available)
   # Or manually download via Dashboard
   ```

2. Store in external storage:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage

**Backup Frequency:**
- **Critical files:** Weekly
- **All files:** Monthly (if needed)
- **Before major changes:** Always

### Storage Restore Procedure

**Via Supabase Dashboard:**
1. Storage → Bucket
2. Upload files manually
3. Verify file paths match original

**Via External Backup:**
1. Download from external storage
2. Upload to Supabase Storage
3. Verify file integrity

---

## 🔄 H3.3 ROLLBACK PLAN

### Code Rollback

**Vercel Rollback:**
1. Vào Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback
5. Verify site works

**Git Rollback:**
```bash
# Revert to previous commit
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin main

# Or reset to previous commit (if needed)
git reset --hard <commit-hash>
git push origin main --force  # ⚠️ Use with caution
```

**Verification:**
- [ ] Site loads correctly
- [ ] No errors in console
- [ ] Critical features work
- [ ] Performance acceptable

### Database Rollback

**Option 1: Restore from Backup**
1. Follow H3.1 restore procedure
2. Restore to point before problematic migration
3. Verify data integrity

**Option 2: Reverse Migration**
1. Create reverse migration SQL
2. Run reverse migration
3. Verify schema matches previous state

**Example Reverse Migration:**
```sql
-- Example: Reverse adding a column
ALTER TABLE public.businesses DROP COLUMN IF EXISTS new_column;

-- Example: Reverse adding a policy
DROP POLICY IF EXISTS "new_policy" ON public.businesses;
```

### Rollback Decision Matrix

| Scenario | Rollback Method | Time Estimate |
|----------|----------------|---------------|
| Code bug | Vercel rollback | 2-5 minutes |
| Database migration issue | Restore backup | 10-30 minutes |
| Data corruption | Restore backup | 10-30 minutes |
| Storage issue | Manual restore | 5-15 minutes |
| Complete system failure | Full restore | 30-60 minutes |

---

## 📋 BACKUP CHECKLIST

### Daily
- [ ] Check automated backups running
- [ ] Review backup logs for errors

### Weekly
- [ ] Verify backup integrity
- [ ] Test restore procedure (optional)
- [ ] Review backup retention

### Monthly
- [ ] Full backup verification
- [ ] Test complete restore
- [ ] Review and update backup strategy

### Before Major Changes
- [ ] Create manual backup
- [ ] Document current state
- [ ] Prepare rollback plan

---

## 🚨 DISASTER RECOVERY PROCEDURE

### Step 1: Assess Situation
1. Identify affected systems
2. Determine scope of issue
3. Check backup availability

### Step 2: Execute Recovery
1. **Code Issues:**
   - Rollback via Vercel
   - Or revert Git commit

2. **Database Issues:**
   - Restore from backup
   - Or run reverse migrations

3. **Storage Issues:**
   - Restore from external backup
   - Or re-upload files

### Step 3: Verify Recovery
1. Test all critical paths
2. Verify data integrity
3. Check performance
4. Monitor logs

### Step 4: Post-Recovery
1. Document incident
2. Identify root cause
3. Implement fixes
4. Update backup strategy if needed

---

## 📊 BACKUP STATUS

### Current Status

**Database:**
- ⚠️ Automated backups: Need to enable in Supabase Dashboard
- ⚠️ Manual backups: Need to create procedure
- ⚠️ Restore tested: Pending

**Storage:**
- ✅ Built-in redundancy: Enabled (Supabase default)
- ⚠️ External backup: Optional (not configured)
- ⚠️ Restore tested: Pending

**Code:**
- ✅ Git version control: Active
- ✅ Vercel deployment history: Available
- ✅ Rollback procedure: Documented

---

## ✅ COMPLETION CHECKLIST

### H3.1 DB Backup
- [ ] Automated backups enabled
- [ ] Backup frequency configured
- [ ] Retention period set
- [ ] Manual backup procedure documented
- [ ] Restore procedure tested

### H3.2 Storage Backup
- [ ] Storage redundancy verified
- [ ] External backup configured (if needed)
- [ ] Restore procedure documented
- [ ] Restore procedure tested

### H3.3 Rollback Plan
- [ ] Code rollback procedure documented
- [ ] Database rollback procedure documented
- [ ] Storage rollback procedure documented
- [ ] Rollback tested
- [ ] Decision matrix created

---

## 📝 NEXT STEPS

1. **Immediate:**
   - Enable automated backups in Supabase Dashboard
   - Test restore procedure
   - Document rollback steps

2. **Short-term:**
   - Configure external storage backup (if needed)
   - Test complete disaster recovery
   - Update documentation

3. **Ongoing:**
   - Monitor backup status
   - Review backup strategy quarterly
   - Update procedures as needed

---

**Last Updated:** 2025-01-08  
**Status:** ⚠️ PENDING - Manual setup required
