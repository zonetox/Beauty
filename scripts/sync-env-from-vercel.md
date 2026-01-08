# Hướng dẫn Export Environment Variables từ Vercel

## Bước 1: Export từ Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project: **beauty**
3. Settings → **Environment Variables**
4. Copy tất cả variables (hoặc screenshot)
5. Paste vào file `.env.vercel` (sẽ tạo)

## Bước 2: Format

Format mỗi dòng:
```
VARIABLE_NAME=value
```

Ví dụ:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...
```

## Bước 3: Chạy script sync

Sau khi có file `.env.vercel`, chạy:
```bash
node scripts/sync-env.js
```

Script sẽ:
- Đọc `.env.vercel`
- So sánh với requirements
- Tạo `.env.local` nếu cần
- Verify completeness
