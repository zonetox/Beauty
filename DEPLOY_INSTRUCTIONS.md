# Hướng dẫn Deploy Sitemap Function - Project: fdklazlcbxaiapsnnbqq

## Bước 1: Lấy Access Token

1. Vào https://supabase.com/dashboard/account/tokens
2. Tạo Personal Access Token mới (hoặc dùng token có sẵn)
3. Copy token

## Bước 2: Set Access Token

**Windows PowerShell:**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "your-access-token-here"
```

**Hoặc dùng flag:**
```powershell
supabase link --project-ref fdklazlcbxaiapsnnbqq --token your-access-token
```

## Bước 3: Link Project

```powershell
supabase link --project-ref fdklazlcbxaiapsnnbqq
```

## Bước 4: Deploy Function

```powershell
supabase functions deploy generate-sitemap
```

## Bước 5: Set SITE_URL (Optional)

```powershell
supabase secrets set SITE_URL=https://1beauty.asia
```

## Bước 6: Test Sitemap

```powershell
curl https://fdklazlcbxaiapsnnbqq.supabase.co/functions/v1/generate-sitemap
```

**Hoặc mở trong browser:**
```
https://fdklazlcbxaiapsnnbqq.supabase.co/functions/v1/generate-sitemap
```

## Lưu ý

- Access Token cần có quyền truy cập project `fdklazlcbxaiapsnnbqq`
- Function sẽ tự động lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` từ environment
- Sitemap được generate từ database (businesses, blog_posts, business_blog_posts)

