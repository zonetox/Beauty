# Hướng dẫn Deploy Sitemap Function

## Bước 1: Link Supabase Project

Bạn cần link project Supabase trước khi deploy function:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Lấy Project Ref:**
- Vào https://supabase.com/dashboard
- Chọn project của bạn
- Vào Settings > General
- Copy "Reference ID"

**Hoặc từ danh sách projects:**
```bash
supabase projects list
```

## Bước 2: Deploy Function

Sau khi link project, deploy function:

```bash
supabase functions deploy generate-sitemap
```

## Bước 3: Set Environment Variables (nếu cần)

Nếu cần thay đổi SITE_URL:

```bash
supabase secrets set SITE_URL=https://1beauty.asia
```

## Bước 4: Test Sitemap

Sau khi deploy, test sitemap:

```bash
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-sitemap
```

**Hoặc trong browser:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-sitemap
```

## Lưu ý

- Function sẽ tự động lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` từ environment
- Sitemap sẽ được generate từ database (businesses, blog_posts, business_blog_posts)
- Cache: 1 hour (có thể thay đổi trong code)

