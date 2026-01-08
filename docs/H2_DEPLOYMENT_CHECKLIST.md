# H2 - Deployment Checklist

**Tuân thủ Master Plan v1.1**  
**Date:** 2025-01-08

---

## 📋 Pre-Deployment Checklist

### H2.1 Build ✅

- [x] **Frontend build succeeds**
  - ✅ Build command: `npm run build`
  - ✅ Build output: `dist/` directory
  - ✅ No build errors

- [x] **No build warnings (critical ones)**
  - ⚠️ Warning: Some chunks > 500KB (acceptable for now)
  - ⚠️ Warning: Dynamic import of `lib/storage.ts` (acceptable)

- [x] **Build size optimized**
  - Total bundle size: ~1.5MB (gzipped: ~300KB)
  - Largest chunk: `index-DpIZYhjv.js` (509KB → 149KB gzipped)
  - ✅ Acceptable for production

**Status:** ✅ PASSED

---

### H2.2 DB Migrate

- [ ] **Run migrations**
  - [ ] Verify all migrations in `database/migrations/` are applied
  - [ ] Check migration status in Supabase Dashboard

- [ ] **Verify schema**
  - [ ] Run: `database/verifications/schema_verification.sql`
  - [ ] Verify all tables exist
  - [ ] Verify all columns exist

- [ ] **Verify RLS policies**
  - [ ] Run: `database/verifications/a3.4_security_audit.sql`
  - [ ] Verify all tables have RLS enabled
  - [ ] Verify policies are correct

- [ ] **Verify data (if any)**
  - [ ] Check seed data (if applicable)
  - [ ] Verify critical data exists

**Action Required:**
1. Go to Supabase Dashboard → SQL Editor
2. Run verification scripts
3. Document results

---

### H2.3 Functions Deploy

- [ ] **Deploy Edge Functions**
  - [ ] `approve-registration`
  - [ ] `send-templated-email`
  - [ ] `create-admin-user`
  - [ ] `generate-sitemap`

- [ ] **Verify functions work**
  - [ ] Test `approve-registration` with test data
  - [ ] Test `send-templated-email` with test template
  - [ ] Test `generate-sitemap` endpoint

- [ ] **Test functions**
  - [ ] Check function logs for errors
  - [ ] Verify RESEND_API_KEY is set in Supabase secrets

**Action Required:**
1. Deploy functions via Supabase CLI or Dashboard
2. Test each function
3. Document test results

---

### H2.4 Storage Setup

- [ ] **Create storage buckets**
  - [ ] `business-images`
  - [ ] `business-logos`
  - [ ] `media-gallery`
  - [ ] `user-avatars`
  - [ ] `blog-images`

- [ ] **Setup storage policies**
  - [ ] Upload policies (who can upload)
  - [ ] Download policies (who can view)
  - [ ] Verify policies in `database/storage_policies_v1.sql`

- [ ] **Test upload/download**
  - [ ] Test image upload from business dashboard
  - [ ] Test image view from public site
  - [ ] Verify path restrictions work

**Action Required:**
1. Go to Supabase Dashboard → Storage
2. Create buckets (if not exist)
3. Apply storage policies
4. Test upload/download

---

### H2.5 Domain

- [ ] **Setup domain**
  - [ ] Configure custom domain in Vercel
  - [ ] Add domain to project settings

- [ ] **DNS configuration**
  - [ ] Add DNS records (A, CNAME, etc.)
  - [ ] Verify DNS propagation

- [ ] **Verify domain**
  - [ ] Test domain access
  - [ ] Verify HTTPS works

**Action Required:**
1. Configure domain in Vercel Dashboard
2. Update DNS records
3. Wait for propagation
4. Test domain

---

### H2.6 SSL

- [x] **SSL certificate (Vercel auto)**
  - ✅ Vercel automatically provisions SSL certificates
  - ✅ No manual configuration needed

- [ ] **Verify HTTPS**
  - [ ] Test HTTPS access
  - [ ] Verify certificate is valid
  - [ ] Check for mixed content warnings

**Status:** ✅ Auto-configured by Vercel

---

### H2.7 Final Checks

- [ ] **Test production site**
  - [ ] Homepage loads
  - [ ] Navigation works
  - [ ] All pages accessible

- [ ] **Test all critical paths**
  - [ ] User registration
  - [ ] User login
  - [ ] Business registration
  - [ ] Business dashboard
  - [ ] Admin panel
  - [ ] Public directory
  - [ ] Business detail pages
  - [ ] Blog pages

- [ ] **Test on different devices**
  - [ ] Desktop (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Tablet

- [ ] **Performance check**
  - [ ] Lighthouse score > 80
  - [ ] Page load time < 3s
  - [ ] Time to Interactive < 5s

- [ ] **SEO check**
  - [ ] Meta tags present
  - [ ] Open Graph tags present
  - [ ] Schema.org markup present
  - [ ] Sitemap accessible
  - [ ] Robots.txt accessible

---

## 🚀 Deployment Steps

### Step 1: Environment Setup

1. **Vercel Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `GEMINI_API_KEY` (optional)

2. **Supabase Secrets:**
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add: `RESEND_API_KEY`

### Step 2: Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run all migrations in order:
   - `database/migrations/20250106000001_*.sql`
   - `database/migrations/20250106000002_*.sql`
   - `database/migrations/20250106000003_*.sql`
   - `database/migrations/20250108000001_fix_security_warnings.sql`
3. Verify schema with verification scripts

### Step 3: Deploy Edge Functions

```bash
# Using Supabase CLI
supabase functions deploy approve-registration
supabase functions deploy send-templated-email
supabase functions deploy create-admin-user
supabase functions deploy generate-sitemap
```

Or via Supabase Dashboard → Edge Functions → Deploy

### Step 4: Setup Storage

1. Go to Supabase Dashboard → Storage
2. Create buckets (if not exist)
3. Apply storage policies from `database/storage_policies_v1.sql`

### Step 5: Deploy to Vercel

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Deploy

### Step 6: Post-Deployment

1. Test all critical paths
2. Monitor logs for errors
3. Verify email sending works
4. Check performance metrics

---

## ✅ Completion Criteria

- [ ] All checklist items completed
- [ ] Production site accessible
- [ ] All critical paths tested
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] SEO verified

---

**Last Updated:** 2025-01-08
