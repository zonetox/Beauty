# Cách Đồng Bộ Env Variables với Vercel qua MCP

## Trả Lời Câu Hỏi

### 1. Ứng dụng dùng file nào để build local?

**Trả lời: `.env.local`**

Vite tự động load `.env.local` khi chạy:
- `npm run dev` - Development mode
- `npm run build` - Production build

**Thứ tự ưu tiên của Vite:**
1. `.env.local` ← **Dùng file này!**
2. `.env.[mode].local` (ví dụ: `.env.development.local`)
3. `.env.[mode]` (ví dụ: `.env.development`)
4. `.env` (base file)

**Lưu ý:**
- `.env.vercel` KHÔNG được Vite load tự động
- `.env.vercel` chỉ dùng để backup/reference
- File `.env.local` được gitignore, an toàn

### 2. Có thể đồng bộ với Vercel không?

**Có!** Có 3 cách:

## Cách 1: Sử dụng MCP Vercel (Qua AI Assistant) - **KHUYẾN NGHỊ**

Vì MCP tools chỉ có thể gọi từ AI assistant context, bạn có thể yêu cầu AI:

```
"Lấy environment variables từ Vercel project và tạo file .env.local"
```

AI sẽ:
1. Sử dụng `mcp_Vercel_list_projects` để tìm project
2. Lấy env variables từ Vercel
3. Tạo file `.env.local` với các giá trị đó

## Cách 2: Manual Sync

1. Vào Vercel Dashboard:
   - Project → Settings → Environment Variables
2. Copy các giá trị:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (nếu có)
3. Tạo file `.env.local`:
   ```bash
   cp docs/env.example .env.local
   ```
4. Paste giá trị vào `.env.local`

## Cách 3: Qua Script (Fallback)

```bash
# Nếu đã export từ Vercel → .env.vercel
npm run env:sync

# Hoặc check status
npm run env:status
```

## Scripts Mới

Đã thêm các scripts mới vào `package.json`:

```json
{
  "env:pull": "node scripts/sync-env-vercel-mcp.js pull",
  "env:push": "node scripts/sync-env-vercel-mcp.js push",
  "env:status": "node scripts/sync-env-vercel-mcp.js status"
}
```

**Lưu ý:** Scripts này hiện tại chỉ là helper, vì MCP tools cần được gọi từ AI assistant context.

## Workflow Khuyến Nghị

### Lần Đầu Setup

1. Yêu cầu AI: *"Lấy env variables từ Vercel và tạo .env.local"*
2. Hoặc manual: Copy từ Vercel Dashboard → `.env.local`

### Khi Vercel Thay Đổi

1. Yêu cầu AI sync lại
2. Hoặc manual update `.env.local`

### Khi Local Thay Đổi (Cẩn Thận!)

1. Update trong Vercel Dashboard
2. Hoặc yêu cầu AI push lên Vercel (nếu cần)

## Security Notes

✅ **An Toàn:**
- `.env.local` được gitignore
- Không commit secrets lên GitHub
- Chỉ `VITE_*` variables được expose ra frontend

⚠️ **Cẩn Thận:**
- Server-side secrets (như `SUPABASE_SERVICE_ROLE_KEY`) chỉ set trong Vercel Dashboard
- Không đặt service role key trong `.env.local` (nó sẽ expose ra frontend!)

## Quick Commands

```bash
# Check env status
npm run env:status

# Verify env variables
npm run env:verify

# Sync từ .env.vercel (nếu có)
npm run env:sync
```

## Tóm Tắt

| Câu Hỏi | Trả Lời |
|---------|---------|
| File nào để build local? | **`.env.local`** |
| Có thể sync với Vercel? | **Có** - Qua AI assistant (MCP) hoặc manual |
| Cách sync? | Yêu cầu AI hoặc copy từ Vercel Dashboard |
