# 🔒 Security - Key Management Guide

**Tuân thủ Master Plan v1.1**  
**Date:** 2025-01-08  
**⚠️ CRITICAL: Đọc kỹ file này trước khi commit code**

---

## 🚨 QUAN TRỌNG: Tránh Lộ Keys

### ❌ KHÔNG BAO GIỜ:

1. **Commit real API keys vào Git**
   - ❌ Không commit `.env.local`
   - ❌ Không commit `.env`
   - ❌ Không hardcode keys trong source code
   - ❌ Không commit files chứa real credentials

2. **Expose keys trong:**
   - ❌ Code comments
   - ❌ Error messages
   - ❌ Console logs
   - ❌ Public repositories
   - ❌ Screenshots/documentation với real keys

3. **Share keys qua:**
   - ❌ Email (unencrypted)
   - ❌ Chat messages
   - ❌ Public forums
   - ❌ Version control history

---

## ✅ ĐÚNG CÁCH:

### 1. Environment Variables

**✅ Sử dụng:**
- `.env.local` cho local development (đã trong `.gitignore`)
- Vercel Environment Variables cho production
- Supabase Secrets cho Edge Functions

**✅ Template files:**
- `.env.example` hoặc `docs/env.example` - Chỉ chứa placeholders
- Không bao giờ commit real values

### 2. Key Storage

| Key Type | Storage Location | Exposed to Frontend? |
|----------|-----------------|---------------------|
| `VITE_SUPABASE_URL` | `.env.local`, Vercel | ✅ Yes (public) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel | ✅ Yes (public, but RLS protects) |
| `GEMINI_API_KEY` | `.env.local`, Vercel | ❌ No (server-side only) |
| `RESEND_API_KEY` | Supabase Secrets | ❌ No (Edge Functions only) |

### 3. Code Practices

**✅ Safe:**
```typescript
// ✅ GOOD: Read from environment
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ GOOD: Check if configured
if (!isSupabaseConfigured) {
  // Show error page
}

// ✅ GOOD: Use placeholder in template
const template = `VITE_SUPABASE_URL="https://your-project-url.supabase.co"`;
```

**❌ Unsafe:**
```typescript
// ❌ BAD: Hardcoded key
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// ❌ BAD: Log key
console.log("API Key:", apiKey);

// ❌ BAD: Include in error message
throw new Error(`Failed with key: ${apiKey}`);
```

---

## 🔍 Pre-Commit Checklist

Trước khi commit code, kiểm tra:

- [ ] Không có real keys trong code
- [ ] Không có `.env.local` trong git status
- [ ] Không có keys trong comments
- [ ] Không có keys trong console.log
- [ ] Template files chỉ có placeholders
- [ ] Documentation không chứa real keys

---

## 🛡️ .gitignore Protection

File `.gitignore` đã được cấu hình để bảo vệ:

```
# Environment files
*.local          # .env.local, .env.production.local, etc.
.env             # .env files
.env.*           # .env.development, .env.production, etc.

# Build outputs
dist/
node_modules/

# Logs (có thể chứa sensitive info)
*.log
logs/
```

**⚠️ Lưu ý:**
- Nếu bạn thấy `.env.local` trong `git status` → ĐÃ BỊ LỘ
- Nếu bạn thấy keys trong code → CẦN XÓA NGAY
- Nếu keys đã được commit → CẦN ROTATE (đổi key mới)

---

## 🚨 Nếu Key Đã Bị Lộ

### Immediate Actions:

1. **Rotate keys ngay lập tức:**
   - Supabase: Tạo new anon key → Update trong Supabase Dashboard
   - Resend: Tạo new API key → Update trong Supabase Secrets
   - Gemini: Tạo new API key → Update trong Vercel/Vercel

2. **Remove từ Git history:**
   ```bash
   # Xóa file khỏi history (cẩn thận!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (nếu cần):**
   ```bash
   git push origin --force --all
   ```

4. **Notify team:**
   - Thông báo team về key leak
   - Yêu cầu mọi người update keys mới

---

## 📋 Key Rotation Schedule

**Best Practice:**
- **Supabase keys:** Rotate mỗi 3-6 tháng
- **Resend API key:** Rotate mỗi 6 tháng
- **Gemini API key:** Rotate mỗi 6 tháng
- **Nếu có leak:** Rotate ngay lập tức

---

## ✅ Verification Commands

### Check for exposed keys:

```bash
# Check git status (không nên thấy .env files)
git status

# Search for potential keys in code
grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=dist
grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=dist
grep -r "AIza" . --exclude-dir=node_modules --exclude-dir=dist

# Check for hardcoded URLs with real project IDs
grep -r "supabase.co" . --exclude-dir=node_modules --exclude-dir=dist | grep -v "your-project-url"
```

---

## 📝 Template Files

### ✅ Safe Template (`.env.example`):

```bash
# ✅ GOOD: Placeholder values only
VITE_SUPABASE_URL="https://your-project-url.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### ❌ Unsafe Template:

```bash
# ❌ BAD: Real values
VITE_SUPABASE_URL="https://fdklazlcbxaiapsnnbqq.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔐 Supabase Secrets Best Practices

### Edge Functions Secrets:

1. **Set secrets trong Supabase Dashboard:**
   - Project Settings → Edge Functions → Secrets
   - Không set trong code hoặc `.env.local`

2. **Access trong Edge Functions:**
   ```typescript
   // ✅ GOOD: Read from Deno.env
   const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
   ```

3. **Never log secrets:**
   ```typescript
   // ❌ BAD: Log secret
   console.log("Resend key:", RESEND_API_KEY);
   
   // ✅ GOOD: Log status only
   console.log("Resend configured:", !!RESEND_API_KEY);
   ```

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

## ✅ Final Checklist

Trước khi deploy production:

- [ ] Tất cả keys đều từ environment variables
- [ ] Không có hardcoded keys trong code
- [ ] `.env.local` không được commit
- [ ] Template files chỉ có placeholders
- [ ] Supabase secrets được set đúng
- [ ] Vercel env variables được set đúng
- [ ] Documentation không chứa real keys
- [ ] Team đã được training về key security

---

**⚠️ REMEMBER:**
> **"Once a key is committed to Git, consider it compromised. Rotate immediately."**

---

**Last Updated:** 2025-01-08
