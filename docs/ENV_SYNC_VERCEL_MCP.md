# Đồng Bộ Biến Môi Trường với Vercel (MCP)

## Tổng Quan

Ứng dụng này sử dụng **`.env.local`** cho local development. Vite tự động load file này khi chạy `npm run dev` hoặc `npm run build`.

## Cách Vite Load Environment Variables

Vite load env variables theo thứ tự ưu tiên:
1. `.env.local` - **Ưu tiên cao nhất** (cho local development)
2. `.env.[mode].local` - Ví dụ: `.env.development.local`
3. `.env.[mode]` - Ví dụ: `.env.development`
4. `.env` - Base file

**Lưu ý:** 
- File `.env.local` được gitignore và không commit lên GitHub
- Chỉ các biến bắt đầu bằng `VITE_` mới được expose ra frontend
- File `.env.vercel` chỉ dùng để backup/reference, không được Vite load tự động

## Đồng Bộ với Vercel

### Option 1: Sử dụng MCP Vercel (Tự Động) - **KHUYẾN NGHỊ**

Script mới `scripts/sync-env-vercel-mcp.js` sử dụng MCP Vercel để:
- Pull env variables từ Vercel về `.env.local`
- Push env variables từ `.env.local` lên Vercel (nếu cần)

**Cách sử dụng:**

```bash
# Pull từ Vercel về local
npm run env:pull

# Push từ local lên Vercel (cẩn thận!)
npm run env:push
```

### Option 2: Manual Sync (Cũ)

1. Export từ Vercel Dashboard → Save vào `.env.vercel`
2. Chạy: `npm run env:sync`

## Cấu Trúc Files

```
.env.local          # File chính cho local (gitignored)
.env.vercel         # Backup từ Vercel (gitignored)
docs/env.example    # Template (committed)
```

## Biến Môi Trường Cần Thiết

### Required (Bắt buộc)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/publishable key

### Optional (Tùy chọn)
- `GEMINI_API_KEY` - Cho chatbot feature

## Security Notes

- ✅ `.env.local` và `.env.vercel` đều được gitignore
- ✅ Không commit secrets lên GitHub
- ✅ Chỉ expose `VITE_*` variables ra frontend
- ✅ Server-side secrets (như `SUPABASE_SERVICE_ROLE_KEY`) chỉ set trong Vercel Dashboard, không trong `.env.local`
