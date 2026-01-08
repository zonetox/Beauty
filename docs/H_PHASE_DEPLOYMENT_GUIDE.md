# PHASE H - DEPLOYMENT & PRODUCTION READINESS GUIDE
**Tuân thủ Master Plan v1.1**  
**Date:** 2025-01-08  
**Status:** 🟡 IN_PROGRESS

---

## 📋 TỔNG QUAN

Phase H bao gồm 3 phần chính:
- **H1:** Environment Management
- **H2:** Deployment Checklist
- **H3:** Backup & Recovery

---

## ✅ H1. ENVIRONMENT MANAGEMENT

### H1.1 .env.example ✅ DONE
- ✅ File created: `docs/env.example`
- ✅ All variables documented
- ✅ No secrets included

### H1.2 Vercel Environment Variables ⚠️ MANUAL

**Action Required:**
1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project: `1beauty-asia` (hoặc project name của bạn)
3. Settings → Environment Variables
4. Add các variables sau:

**Production:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key (optional)
```

**Preview (nếu có):**
- Same as Production hoặc separate values

**Verification:**
- [ ] All variables added
- [ ] Values are correct (not placeholders)
- [ ] Redeploy after adding variables

### H1.3 Supabase Secrets ⚠️ MANUAL

**Action Required:**
1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Project Settings → Edge Functions → Secrets
4. Add secret:

```
RESEND_API_KEY=your-resend-api-key
```

**Verification:**
- [ ] Secret added
- [ ] Test Edge Function `send-templated-email` works
- [ ] Check function logs for errors

### H1.4 Documentation ✅ DONE
- ✅ `docs/H1_ENVIRONMENT_SETUP.md` created
- ✅ Complete setup guide
- ✅ Troubleshooting included

---

## ✅ H2. DEPLOYMENT CHECKLIST

### H2.1 Build ✅ DONE
- ✅ Build succeeds: `npm run build`
- ✅ Output: `dist/` directory created
- ✅ No build errors
- ⚠️ Warning: Some chunks > 500KB (acceptable)
- ✅ Build size: ~1.5MB total, ~300KB gzipped

**Status:** ✅ PASSED

### H2.2 DB Migrate ✅ VERIFIED

**Migrations Applied:**
- ✅ `20250108000001_fix_security_warnings.sql`
- ✅ `20250108000002_add_missing_rls_policies.sql`
- ✅ `20250108000003_fix_performance_issues.sql`
- ✅ `20250108000004_merge_duplicate_policies.sql`

**Schema Verified:**
- ✅ 23 tables exist in `public` schema
- ✅ All tables have RLS enabled
- ✅ All RLS policies applied

**Verification Script:**
```sql
-- Run in Supabase SQL Editor
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Status:** ✅ VERIFIED

### H2.3 Functions Deploy ⚠️ PARTIAL

**Current Status:**
- ✅ `approve-registration` - ACTIVE (version 2)
- ✅ `generate-sitemap` - ACTIVE (version 4)
- ✅ `resend-email` - ACTIVE (version 4)
- ⚠️ `create-admin-user` - Need to verify
- ⚠️ `send-templated-email` - Need to verify

**Action Required:**
1. Verify all functions are deployed:
   ```bash
   # Check via Supabase Dashboard → Edge Functions
   # Or via Supabase CLI:
   supabase functions list
   ```

2. Test each function:
   - `approve-registration`: Test with registration request ID
   - `send-templated-email`: Test with email template
   - `generate-sitemap`: Test endpoint `/generate-sitemap`
   - `create-admin-user`: Test admin user creation

3. Check function logs for errors

**Verification Checklist:**
- [ ] All 5 functions deployed
- [ ] All functions return 200 OK
- [ ] No errors in function logs
- [ ] RESEND_API_KEY secret accessible

### H2.4 Storage Setup ✅ DONE

**Buckets Created:**
- ✅ `avatars` - Public, 5MB, image/*
- ✅ `business-logos` - Public, 5MB, image/*
- ✅ `business-gallery` - Public, 10MB, image/*, video/*
- ✅ `blog-images` - Public, 5MB, image/*

**Policies Applied:**
- ✅ 16 policies total (4 per bucket)
- ✅ All policies use optimized `(select auth.uid())` pattern
- ✅ Admin functions properly referenced

**Status:** ✅ COMPLETE

**Verification:**
- [ ] Test upload to `avatars` bucket
- [ ] Test upload to `business-logos` bucket
- [ ] Test public access to uploaded files

### H2.5 Domain ⚠️ MANUAL

**Action Required:**
1. Vào Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `1beauty.asia` (hoặc domain của bạn)
3. Configure DNS records:
   - A record: Point to Vercel IP
   - CNAME record: Point to Vercel domain
4. Wait for DNS propagation (up to 48 hours)
5. Verify domain works

**Verification:**
- [ ] Domain added in Vercel
- [ ] DNS records configured
- [ ] Domain accessible via HTTPS
- [ ] SSL certificate auto-provisioned

### H2.6 SSL ✅ DONE
- ✅ Vercel automatically provisions SSL certificates
- ✅ HTTPS enabled by default
- ✅ No manual configuration needed

**Status:** ✅ AUTO-CONFIGURED

### H2.7 Final Checks ⚠️ PENDING DEPLOYMENT

**After deployment, test:**
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] User registration works
- [ ] User login works
- [ ] Business registration works
- [ ] Business dashboard accessible
- [ ] Admin panel accessible
- [ ] Public directory works
- [ ] Business detail pages load
- [ ] Blog pages load
- [ ] Image upload works
- [ ] Email sending works

**Performance:**
- [ ] Lighthouse score > 80
- [ ] Page load time < 3s
- [ ] Time to Interactive < 5s

**SEO:**
- [ ] Meta tags present
- [ ] Open Graph tags present
- [ ] Schema.org markup present
- [ ] Sitemap accessible: `/sitemap.xml`
- [ ] Robots.txt accessible: `/robots.txt`

---

## ⬜ H3. BACKUP & RECOVERY

### H3.1 DB Backup ⚠️ MANUAL

**Action Required:**
1. Vào Supabase Dashboard → Database → Backups
2. Enable automated backups:
   - Frequency: Daily (recommended)
   - Retention: 7 days (minimum), 30 days (recommended)
3. Test restore:
   - Create test backup
   - Restore to test database
   - Verify data integrity

**Backup Strategy:**
- **Daily backups:** Automatic via Supabase
- **Manual backups:** Before major migrations
- **Retention:** 30 days (adjust based on needs)

**Verification:**
- [ ] Automated backups enabled
- [ ] Backup frequency configured
- [ ] Retention period set
- [ ] Test restore successful

### H3.2 Storage Backup ⚠️ MANUAL

**Action Required:**
1. Supabase Storage backups are handled automatically
2. For additional safety, consider:
   - Export storage bucket contents periodically
   - Store in external storage (S3, etc.) if needed

**Backup Strategy:**
- **Automatic:** Supabase handles storage redundancy
- **Manual:** Export critical files periodically
- **External:** Consider external backup for critical assets

**Verification:**
- [ ] Storage redundancy verified
- [ ] Critical files backed up externally (if needed)

### H3.3 Rollback Plan ⚠️ TODO

**Code Rollback:**
1. Vercel: Use deployment history to rollback
2. Git: Revert to previous commit
3. Redeploy previous version

**Database Rollback:**
1. Restore from backup
2. Run reverse migrations (if available)
3. Verify data integrity

**Documentation:**
- [ ] Rollback procedure documented
- [ ] Test rollback process
- [ ] Document rollback steps

---

## 🚀 DEPLOYMENT STEPS SUMMARY

### Step 1: Environment Setup
1. ✅ `.env.example` created
2. ⚠️ Setup Vercel env variables (manual)
3. ⚠️ Setup Supabase secrets (manual)

### Step 2: Database
1. ✅ Migrations applied
2. ✅ Schema verified
3. ✅ RLS policies verified

### Step 3: Edge Functions
1. ⚠️ Verify all functions deployed
2. ⚠️ Test all functions
3. ⚠️ Check function logs

### Step 4: Storage
1. ✅ Buckets created
2. ✅ Policies applied
3. ⚠️ Test upload/download

### Step 5: Deploy to Vercel
1. Connect GitHub repository
2. Configure build settings
3. Deploy

### Step 6: Domain & SSL
1. ⚠️ Configure domain (manual)
2. ✅ SSL auto-configured

### Step 7: Post-Deployment
1. ⚠️ Test all critical paths
2. ⚠️ Monitor logs
3. ⚠️ Verify performance
4. ⚠️ Verify SEO

### Step 8: Backup & Recovery
1. ⚠️ Setup automated backups
2. ⚠️ Document rollback procedure
3. ⚠️ Test backup/restore

---

## ✅ COMPLETION STATUS

| Task | Status | Notes |
|------|--------|-------|
| H1.1 .env.example | ✅ DONE | File created |
| H1.2 Vercel env | ⚠️ MANUAL | Need to setup in Dashboard |
| H1.3 Supabase secrets | ⚠️ MANUAL | Need to setup in Dashboard |
| H1.4 Documentation | ✅ DONE | Complete guide created |
| H2.1 Build | ✅ DONE | Build succeeds |
| H2.2 DB migrate | ✅ DONE | Migrations applied |
| H2.3 Functions deploy | ⚠️ PARTIAL | Need to verify all functions |
| H2.4 Storage setup | ✅ DONE | Buckets and policies complete |
| H2.5 Domain | ⚠️ MANUAL | Need to configure |
| H2.6 SSL | ✅ DONE | Auto-configured |
| H2.7 Final checks | ⚠️ PENDING | After deployment |
| H3.1 DB backup | ⚠️ MANUAL | Need to enable |
| H3.2 Storage backup | ⚠️ MANUAL | Need to verify |
| H3.3 Rollback plan | ⚠️ TODO | Need to document |

---

## 📝 NEXT STEPS

1. **Immediate (Manual):**
   - Setup Vercel environment variables
   - Setup Supabase secrets
   - Verify all Edge Functions deployed
   - Configure domain

2. **After Deployment:**
   - Test all critical paths
   - Monitor logs
   - Verify performance
   - Setup backups

3. **Ongoing:**
   - Monitor application
   - Review logs regularly
   - Update backups as needed

---

**Last Updated:** 2025-01-08  
**Progress:** 50% Complete (7/14 tasks done, 7 manual/pending)
