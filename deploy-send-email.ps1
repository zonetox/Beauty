# Script để deploy send-email Edge Function
# Fix CORS issues for Vercel deployment

Write-Host "`n=== DEPLOY SEND-EMAIL EDGE FUNCTION ===" -ForegroundColor Cyan
Write-Host ""

$projectRef = "fdklazlcbxaiapsnnbqq"
$functionName = "send-email"

Write-Host "Project: $projectRef" -ForegroundColor Yellow
Write-Host "Function: $functionName" -ForegroundColor Yellow
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Install: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if project is linked
Write-Host "`nChecking project link..." -ForegroundColor Cyan
$linked = supabase projects list 2>&1 | Select-String -Pattern $projectRef

if (-not $linked) {
    Write-Host "Linking project..." -ForegroundColor Yellow
    supabase link --project-ref $projectRef
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to link project. Please check your access token." -ForegroundColor Red
        Write-Host "Set access token: `$env:SUPABASE_ACCESS_TOKEN = 'your-token'" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Project already linked." -ForegroundColor Green
}

# Deploy function
Write-Host "`nDeploying function: $functionName ..." -ForegroundColor Cyan
supabase functions deploy $functionName

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy function." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== DEPLOY THÀNH CÔNG ===" -ForegroundColor Green
Write-Host "`nFunction URL:" -ForegroundColor Cyan
Write-Host "https://$projectRef.supabase.co/functions/v1/$functionName" -ForegroundColor White
Write-Host "`nCORS đã được fix:" -ForegroundColor Cyan
Write-Host "- OPTIONS request returns 200 OK" -ForegroundColor White
Write-Host "- Proper CORS headers included" -ForegroundColor White
Write-Host "- Supports: https://beauty-red.vercel.app" -ForegroundColor White
Write-Host ""
