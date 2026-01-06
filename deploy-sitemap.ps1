# Script để deploy Sitemap Function
# F3 SEO - Tuân thủ Master Plan v1.1

Write-Host "`n=== DEPLOY SITEMAP FUNCTION ===" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Hiển thị danh sách projects
Write-Host "Danh sách projects:" -ForegroundColor Yellow
supabase projects list

Write-Host "`nVui lòng chọn project ref từ danh sách trên." -ForegroundColor Yellow
$projectRef = Read-Host "Nhập project ref (hoặc Enter để bỏ qua)"

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    Write-Host "Bỏ qua deploy. Bạn có thể chạy lại script sau." -ForegroundColor Red
    exit
}

# Bước 2: Link project
Write-Host "`nĐang link project: $projectRef ..." -ForegroundColor Cyan
supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "Lỗi khi link project. Vui lòng kiểm tra lại project ref." -ForegroundColor Red
    exit
}

# Bước 3: Deploy function
Write-Host "`nĐang deploy function generate-sitemap ..." -ForegroundColor Cyan
supabase functions deploy generate-sitemap

if ($LASTEXITCODE -ne 0) {
    Write-Host "Lỗi khi deploy function." -ForegroundColor Red
    exit
}

# Bước 4: Set SITE_URL (optional)
Write-Host "`nBạn có muốn set SITE_URL? (mặc định: https://1beauty.asia)" -ForegroundColor Yellow
$setSiteUrl = Read-Host "Nhập y/n (mặc định: n)"

if ($setSiteUrl -eq "y" -or $setSiteUrl -eq "Y") {
    $siteUrl = Read-Host "Nhập SITE_URL (mặc định: https://1beauty.asia)"
    if ([string]::IsNullOrWhiteSpace($siteUrl)) {
        $siteUrl = "https://1beauty.asia"
    }
    Write-Host "Đang set SITE_URL=$siteUrl ..." -ForegroundColor Cyan
    supabase secrets set SITE_URL=$siteUrl
}

# Bước 5: Test URL
Write-Host "`n=== DEPLOY THÀNH CÔNG ===" -ForegroundColor Green
Write-Host "`nTest sitemap tại:" -ForegroundColor Cyan
Write-Host "https://$projectRef.supabase.co/functions/v1/generate-sitemap" -ForegroundColor White
Write-Host "`nHoặc chạy lệnh:" -ForegroundColor Cyan
Write-Host "curl https://$projectRef.supabase.co/functions/v1/generate-sitemap" -ForegroundColor White
Write-Host ""

