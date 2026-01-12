# Script để push code lên GitHub với tài khoản zonetox
# Usage: .\scripts\push-to-github.ps1 [GITHUB_TOKEN]

param(
    [string]$Token = ""
)

Write-Host "=== PUSH CODE LÊN GITHUB (zonetox) ===" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra xem có token không
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "⚠️  CHƯA CÓ PERSONAL ACCESS TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Để push code, bạn cần:" -ForegroundColor Yellow
    Write-Host "1. Tạo Personal Access Token tại: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Chọn scope: repo (Full control of private repositories)" -ForegroundColor White
    Write-Host "3. Copy token và chạy lại script với token:" -ForegroundColor White
    Write-Host "   .\scripts\push-to-github.ps1 -Token YOUR_TOKEN" -ForegroundColor Green
    Write-Host ""
    
    $useToken = Read-Host "Bạn có muốn nhập token ngay bây giờ? (y/n)"
    if ($useToken -eq "y" -or $useToken -eq "Y") {
        $Token = Read-Host "Nhập Personal Access Token (token sẽ bị ẩn khi nhập)" -AsSecureString
        $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token))
    } else {
        Write-Host "❌ Hủy push. Vui lòng tạo token và chạy lại script." -ForegroundColor Red
        exit 1
    }
}

# Kiểm tra git status
Write-Host "📋 Kiểm tra git status..." -ForegroundColor Cyan
$status = git status --short
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi: Không thể chạy git status" -ForegroundColor Red
    exit 1
}

# Hiển thị các file đã thay đổi (nếu có)
if ($status) {
    Write-Host "📝 Các file đã thay đổi:" -ForegroundColor Yellow
    Write-Host $status -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ℹ️  Không có thay đổi nào để push." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Update remote URL với token
Write-Host "🔐 Cấu hình remote URL với token..." -ForegroundColor Cyan
$remoteUrl = "https://zonetox:$Token@github.com/zonetox/Beauty.git"
git remote set-url origin $remoteUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi: Không thể update remote URL" -ForegroundColor Red
    exit 1
}

# Push code
Write-Host "🚀 Đang push code lên GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host ""
    
    # Reset remote URL về không có token (bảo mật)
    Write-Host "🔒 Reset remote URL (xóa token khỏi URL)..." -ForegroundColor Cyan
    git remote set-url origin https://github.com/zonetox/Beauty.git
    
    Write-Host ""
    Write-Host "✅ Hoàn tất! Code đã được push lên GitHub." -ForegroundColor Green
    Write-Host "📝 Lưu ý: Token đã được xóa khỏi URL để bảo mật." -ForegroundColor Yellow
    Write-Host "   Lần push tiếp theo sẽ cần đăng nhập lại hoặc dùng token." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ PUSH THẤT BẠI!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "1. Token không đúng hoặc đã hết hạn" -ForegroundColor White
    Write-Host "2. Token không có quyền 'repo'" -ForegroundColor White
    Write-Host "3. Tài khoản zonetox không có quyền push vào repository" -ForegroundColor White
    Write-Host ""
    Write-Host "Giải pháp:" -ForegroundColor Yellow
    Write-Host "1. Tạo token mới tại: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Đảm bảo token có quyền 'repo'" -ForegroundColor White
    Write-Host "3. Kiểm tra bạn có quyền push vào repository" -ForegroundColor White
    
    # Reset remote URL
    git remote set-url origin https://github.com/zonetox/Beauty.git
    exit 1
}
