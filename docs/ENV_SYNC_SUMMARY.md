# Tóm Tắt: Environment Variables & Vercel Sync

## ✅ Trả Lời Câu Hỏi

### 1. Ứng dụng dùng file nào để build local?

**`.env.local`** ← File này!

- Vite tự động load `.env.local` khi chạy `npm run dev` hoặc `npm run build`
- File `.env.vercel` KHÔNG được Vite load, chỉ dùng để backup/reference

### 2. Có thể đồng bộ với Vercel không?

**Có!** Có 3 cách:

#### ✅ Cách 1: Qua AI Assistant (MCP Vercel) - **KHUYẾN NGHỊ**

Yêu cầu AI:
```
"Lấy environment variables từ Vercel project và tạo file .env.local"
```

AI sẽ tự động:
- Kết nối với Vercel qua MCP
- Lấy env variables
- Tạo/update file `.env.local`

#### ✅ Cách 2: Manual (Nhanh)

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Copy giá trị
3. Paste vào `.env.local`

#### ✅ Cách 3: Script Helper

```bash
npm run env:status    # Check status
npm run env:sync      # Sync từ .env.vercel (nếu có)
```

## 📁 Cấu Trúc Files

```
.env.local          ← Dùng file này cho local build (gitignored)
.env.vercel         ← Backup từ Vercel (gitignored, không được Vite load)
docs/env.example    ← Template (committed)
```

## 🔧 Scripts Mới

Đã thêm vào `package.json`:

```bash
npm run env:pull     # Pull từ Vercel (template, cần AI assistant)
npm run env:push     # Push lên Vercel (template, cần AI assistant)
npm run env:status  # Check status hiện tại
npm run env:sync    # Sync từ .env.vercel
npm run env:verify  # Verify env variables
```

## 📋 Biến Môi Trường

### Required (Bắt buộc)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/publishable key

### Optional (Tùy chọn)
- `GEMINI_API_KEY` - Cho chatbot feature

## 🔒 Security

✅ `.env.local` được gitignore  
✅ Không commit secrets  
✅ Chỉ `VITE_*` variables expose ra frontend  
⚠️ Server-side secrets (như `SUPABASE_SERVICE_ROLE_KEY`) chỉ set trong Vercel Dashboard

## 🚀 Quick Start

```bash
# 1. Check status hiện tại
npm run env:status

# 2. Nếu thiếu, yêu cầu AI sync từ Vercel
# Hoặc manual: Copy từ Vercel Dashboard → .env.local

# 3. Verify
npm run env:verify

# 4. Run
npm run dev
```

## 📚 Documentation

- `docs/ENV_QUICK_START.md` - Quick start guide
- `docs/HOW_TO_SYNC_ENV_WITH_MCP.md` - Chi tiết về sync với MCP
- `docs/ENV_SYNC_VERCEL_MCP.md` - Technical details
