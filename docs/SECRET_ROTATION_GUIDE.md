# 🔐 HƯỚNG DẪN ROTATE KEYS SAU KHI BỊ LỘ

**Date:** 2025-01-09  
**Priority:** 🔴 CRITICAL - Rotate immediately

---

## ⚠️ CẢNH BÁO

Các keys sau đã bị lộ trong git history và **PHẢI được rotate ngay lập tức**:

1. **Resend API Key** - `re_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6`
2. **Supabase Service Role Key** - (JWT token)
3. **PostgreSQL Connection String** - (contains password)
4. **Supabase Anon Key** - (public but should rotate)

---

## 🔄 BƯỚC 1: ROTATE RESEND API KEY

### 1.1 Xóa key cũ
1. Vào: https://resend.com/api-keys
2. Tìm key: `re_dHNJuyTq_ydiGFqf2RGmtpAR2kBuaURw6`
3. Click **Delete** hoặc **Revoke**

### 1.2 Tạo key mới
1. Click **Create API Key**
2. Đặt tên: `1Beauty Production` (hoặc tên khác)
3. Copy key mới

### 1.3 Update trong Supabase
```bash
# Option 1: Dùng Supabase CLI
supabase secrets set RESEND_API_KEY=re_YOUR_NEW_KEY_HERE

# Option 2: Dùng Dashboard
# Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/functions/secrets
# Click "Add Secret" hoặc edit existing RESEND_API_KEY
# Paste key mới
```

### 1.4 Verify
- Test Edge Function `send-templated-email`
- Kiểm tra logs trong Supabase Dashboard

---

## 🔄 BƯỚC 2: ROTATE SUPABASE SERVICE ROLE KEY

### 2.1 Reset Service Role Key
1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/api
2. Tìm section **"Service Role"**
3. Click **"Reset"** hoặc **"Reveal"** → **"Reset"**
4. ⚠️ **CẢNH BÁO:** Reset sẽ invalidate key cũ ngay lập tức
5. Copy key mới

### 2.2 Update trong Supabase Secrets (nếu dùng)
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

### 2.3 Update trong Vercel (nếu dùng)
1. Vào: https://vercel.com/dashboard
2. Project → Settings → Environment Variables
3. Tìm `SUPABASE_SERVICE_ROLE_KEY`
4. Update với key mới

### 2.4 Verify
- Test Edge Functions sử dụng Service Role Key
- Kiểm tra logs

---

## 🔄 BƯỚC 3: ROTATE POSTGRESQL PASSWORD

### 3.1 Reset Database Password
1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/database
2. Tìm section **"Database Password"**
3. Click **"Reset Database Password"**
4. ⚠️ **CẢNH BÁO:** Reset sẽ invalidate connection string cũ
5. Copy password mới

### 3.2 Generate New Connection String
1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/database
2. Tìm **"Connection String"**
3. Copy connection string mới

### 3.3 Update trong Supabase Secrets (nếu dùng)
```bash
supabase secrets set SUPABASE_DB_URL=postgres://postgres.your-project:NEW_PASSWORD@...
```

### 3.4 Verify
- Test database connection
- Kiểm tra Edge Functions sử dụng database

---

## 🔄 BƯỚC 4: ROTATE SUPABASE ANON KEY

### 4.1 Reset Anon Key
1. Vào: https://supabase.com/dashboard/project/fdklazlcbxaiapsnnbqq/settings/api
2. Tìm section **"Project API keys"** → **"anon public"**
3. Click **"Reset"**
4. Copy key mới

### 4.2 Update trong Vercel
1. Vào: https://vercel.com/dashboard
2. Project → Settings → Environment Variables
3. Tìm `VITE_SUPABASE_ANON_KEY`
4. Update với key mới
5. Redeploy application

### 4.3 Update trong Local Development
1. Mở `.env.local`
2. Update `VITE_SUPABASE_ANON_KEY=new_key_here`
3. Restart dev server

### 4.4 Verify
- Test application locally
- Test production deployment
- Kiểm tra Supabase client hoạt động

---

## ✅ VERIFICATION CHECKLIST

Sau khi rotate tất cả keys, verify:

- [ ] Resend API Key mới hoạt động (test send email)
- [ ] Supabase Service Role Key mới hoạt động (test Edge Functions)
- [ ] PostgreSQL connection mới hoạt động (test database queries)
- [ ] Supabase Anon Key mới hoạt động (test frontend)
- [ ] Application production hoạt động bình thường
- [ ] Application local hoạt động bình thường
- [ ] Edge Functions hoạt động bình thường
- [ ] Email sending hoạt động bình thường

---

## 📝 NOTES

1. **Thứ tự rotate:** Nên rotate theo thứ tự: Resend → Service Role → Database → Anon
2. **Downtime:** Có thể có downtime ngắn khi rotate keys
3. **Backup:** Lưu keys mới ở nơi an toàn (password manager)
4. **Documentation:** Update documentation nếu có thay đổi

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Invalid API key"
- **Nguyên nhân:** Key cũ chưa được update
- **Giải pháp:** Kiểm tra lại tất cả nơi sử dụng key

### Lỗi: "Database connection failed"
- **Nguyên nhân:** Connection string cũ
- **Giải pháp:** Update connection string mới

### Lỗi: "Edge Function failed"
- **Nguyên nhân:** Service Role Key cũ
- **Giải pháp:** Update Service Role Key trong Supabase Secrets

---

**Last Updated:** 2025-01-09  
**Status:** ⚠️ **REQUIRES IMMEDIATE ACTION**
