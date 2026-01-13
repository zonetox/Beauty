# Environment Variables - Quick Start Guide

## TL;DR

**Ứng dụng dùng `.env.local` để build local.**

```bash
# Tạo file .env.local từ template
cp docs/env.example .env.local

# Điền giá trị thật vào .env.local
# Sau đó chạy:
npm run dev        # Development
npm run build      # Production build
```

## Chi Tiết

### 1. File Nào Được Dùng?

| File | Mục Đích | Gitignore? | Vite Load? |
|------|----------|------------|------------|
| `.env.local` | **Local development** | ✅ Yes | ✅ Yes (ưu tiên cao nhất) |
| `.env.vercel` | Backup từ Vercel | ✅ Yes | ❌ No |
| `docs/env.example` | Template | ❌ No | ❌ No |

**Kết luận:** Dùng `.env.local` cho local build!

### 2. Đồng Bộ với Vercel

#### Cách 1: Tự Động (Khuyến Nghị)

```bash
# Pull từ Vercel về local
npm run env:pull

# Kiểm tra status
npm run env:status
```

#### Cách 2: Manual

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Copy các giá trị
3. Paste vào `.env.local`

#### Cách 3: Qua File Trung Gian

1. Export từ Vercel → Save vào `.env.vercel`
2. Chạy: `npm run env:sync`

### 3. Biến Môi Trường Cần Thiết

#### Bắt Buộc (Required)
```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_..." # hoặc eyJ... (legacy)
```

#### Tùy Chọn (Optional)
```bash
GEMINI_API_KEY="AIza..."  # Cho chatbot
```

### 4. Kiểm Tra

```bash
# Verify env variables
npm run env:verify

# Check status
npm run env:status
```

### 5. Security Checklist

- ✅ `.env.local` đã được gitignore
- ✅ Không commit secrets lên GitHub
- ✅ Chỉ `VITE_*` variables được expose ra frontend
- ✅ Server-side secrets (như `SUPABASE_SERVICE_ROLE_KEY`) chỉ set trong Vercel Dashboard

## Troubleshooting

### Vite không load env variables?

1. Kiểm tra file có tên đúng: `.env.local` (không phải `.env.vercel`)
2. Kiểm tra biến có prefix `VITE_` không
3. Restart dev server: `npm run dev`

### Build fail vì thiếu env?

1. Đảm bảo `.env.local` tồn tại
2. Chạy `npm run env:verify` để kiểm tra
3. Xem `docs/env.example` để biết format đúng
