# Hướng Dẫn Login Supabase CLI

## Vấn đề
CLI không thể chạy interactive login trong non-TTY environment. Cần dùng access token.

## Cách 1: Lấy Access Token từ Dashboard (KHUYẾN NGHỊ)

1. **Mở Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard/account/tokens

2. **Tạo Personal Access Token:**
   - Click "Generate new token"
   - Đặt tên (ví dụ: "Cursor CLI")
   - Copy token (chỉ hiển thị 1 lần!)

3. **Set environment variable:**
   ```powershell
   # Windows PowerShell
   $env:SUPABASE_ACCESS_TOKEN = "your_token_here"
   
   # Hoặc set permanently trong User Environment Variables
   ```

4. **Hoặc dùng --token flag:**
   ```powershell
   supabase login --token "your_token_here"
   ```

## Cách 2: Login qua Browser (Nếu có TTY)

Nếu mở terminal thông thường (không phải qua Cursor), có thể chạy:
```powershell
supabase login
```
CLI sẽ mở browser để authorize.

## Sau khi login

Kiểm tra login:
```powershell
supabase projects list
```

Link project:
```powershell
supabase link --project-ref fdklazlcbxaiapsnnbqq
```

Chạy SQL:
```powershell
# Chạy file SQL
Get-Content database/reset_users_quick.sql | supabase db remote --linked

# Hoặc pipe SQL command
"SELECT COUNT(*) FROM businesses;" | supabase db remote --linked
```
