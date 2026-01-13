# Script để push code lên GitHub
# Hướng dẫn sử dụng: .\scripts\push-to-github.ps1

Write-Host "`n=== PUSH CODE LÊN GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra git đã được cài đặt chưa
try {
    $gitVersion = git --version
    Write-Host "✅ Git đã được cài đặt: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git chưa được cài đặt. Vui lòng cài đặt Git trước." -ForegroundColor Red
    exit 1
}

# Kiểm tra có phải git repository chưa
if (-not (Test-Path ".git")) {
    Write-Host "⚠️  Đây chưa phải là git repository." -ForegroundColor Yellow
    $init = Read-Host "Bạn có muốn khởi tạo git repository? (y/n)"
    if ($init -eq "y" -or $init -eq "Y") {
        git init
        Write-Host "✅ Đã khởi tạo git repository" -ForegroundColor Green
    } else {
        Write-Host "❌ Không thể tiếp tục mà không có git repository." -ForegroundColor Red
        exit 1
    }
}

# Kiểm tra remote
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Chưa có remote 'origin'." -ForegroundColor Yellow
    $setupRemote = Read-Host "Bạn có muốn setup remote? (y/n)"
    if ($setupRemote -eq "y" -or $setupRemote -eq "Y") {
        $repoUrl = Read-Host "Nhập GitHub repository URL (ví dụ: https://github.com/username/repo.git)"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Host "✅ Đã thêm remote origin: $repoUrl" -ForegroundColor Green
        } else {
            Write-Host "❌ Không thể tiếp tục mà không có remote." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Không thể push mà không có remote." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Remote origin: $remoteUrl" -ForegroundColor Green
}

# Kiểm tra trạng thái
Write-Host "`n📊 Kiểm tra trạng thái git..." -ForegroundColor Cyan
git status --short

# Hỏi commit message
Write-Host "`n📝 Commit message:" -ForegroundColor Cyan
$defaultMessage = "Update: Optimize app performance and mobile experience"
$commitMessage = Read-Host "Nhập commit message (Enter để dùng mặc định: '$defaultMessage')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = $defaultMessage
}

# Hỏi branch
Write-Host "`n🌿 Branch:" -ForegroundColor Cyan
$currentBranch = git branch --show-current
Write-Host "Branch hiện tại: $currentBranch" -ForegroundColor Yellow
$targetBranch = Read-Host "Nhập branch để push (Enter để dùng: $currentBranch)"
if ([string]::IsNullOrWhiteSpace($targetBranch)) {
    $targetBranch = $currentBranch
}

# Xác nhận
Write-Host "`n⚠️  XÁC NHẬN:" -ForegroundColor Yellow
Write-Host "  - Commit message: $commitMessage" -ForegroundColor White
Write-Host "  - Branch: $targetBranch" -ForegroundColor White
Write-Host "  - Remote: $remoteUrl" -ForegroundColor White
$confirm = Read-Host "`nBạn có chắc chắn muốn push? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Đã hủy." -ForegroundColor Red
    exit 0
}

# Add files
Write-Host "`n📦 Đang add files..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "💾 Đang commit..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi commit. Có thể không có thay đổi nào." -ForegroundColor Red
    exit 1
}

# Push
Write-Host "🚀 Đang push lên GitHub..." -ForegroundColor Cyan
git push origin $targetBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PUSH THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "`n🔗 Xem code tại: $remoteUrl" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Lỗi khi push. Vui lòng kiểm tra lại." -ForegroundColor Red
    Write-Host "`n💡 Gợi ý:" -ForegroundColor Yellow
    Write-Host "  - Kiểm tra kết nối internet" -ForegroundColor White
    Write-Host "  - Kiểm tra quyền truy cập repository" -ForegroundColor White
    Write-Host "  - Thử pull trước: git pull origin $targetBranch" -ForegroundColor White
    exit 1
}

Write-Host "`n=== HOÀN THÀNH ===" -ForegroundColor Green
