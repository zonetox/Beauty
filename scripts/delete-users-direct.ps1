# Delete users directly via Supabase Management API
# Note: auth.users deletion may require service role or admin dashboard

param(
    [string]$ProjectRef = "fdklazlcbxaiapsnnbqq",
    [string]$Token = "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "apikey" = $Token
}

Write-Host "Deleting users from public tables..." -ForegroundColor Yellow

# Delete from public tables first
$queries = @(
    "DELETE FROM public.profiles;",
    "DELETE FROM public.admin_users;"
)

foreach ($query in $queries) {
    $body = @{ query = $query } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -Body $body
        Write-Host "SUCCESS: $query" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $query - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Note: auth.users deletion requires service role key or admin dashboard
# Management API with PAT may not have permission to delete auth.users
Write-Host "`nNote: auth.users deletion may require:" -ForegroundColor Yellow
Write-Host "1. Service Role Key (not PAT)" -ForegroundColor Yellow
Write-Host "2. Or delete via Supabase Dashboard > Authentication > Users" -ForegroundColor Yellow
Write-Host "3. Or use Supabase CLI with service role" -ForegroundColor Yellow

# Verify
$verifyQuery = "SELECT COUNT(*) as count FROM auth.users;"
$body = @{ query = $verifyQuery } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -Body $body
    Write-Host "`nRemaining auth.users: $($result.count)" -ForegroundColor Cyan
} catch {
    Write-Host "Could not verify: $($_.Exception.Message)" -ForegroundColor Red
}
