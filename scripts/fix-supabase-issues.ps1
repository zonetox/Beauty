# Fix Supabase Security & Performance Issues + Delete Users
# Usage: .\fix-supabase-issues.ps1

param(
    [string]$ProjectRef = "fdklazlcbxaiapsnnbqq",
    [string]$Token = "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd",
    [switch]$DeleteUsers = $false
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "apikey" = $Token
}

function Execute-SQL {
    param([string]$Query, [string]$Description)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "$Description" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    $body = @{
        query = $Query
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -Body $body
        Write-Host "SUCCESS" -ForegroundColor Green
        if ($result) {
            Write-Host ($result | ConvertTo-Json -Compress)
        }
        return $true
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
        return $false
    }
}

# Read SQL files
$securityFix = Get-Content "database/migrations/20250108000001_fix_security_warnings.sql" -Raw
$performanceFix = Get-Content "database/migrations/20250108000003_fix_performance_issues.sql" -Raw
$rlsPolicies = Get-Content "database/migrations/20250108000002_add_missing_rls_policies.sql" -Raw

Write-Host "`nStarting Supabase Fix Script..." -ForegroundColor Green
Write-Host "Project: $ProjectRef" -ForegroundColor Cyan

# Execute SQL file directly (Management API supports multi-statement)
function Execute-SQLFile {
    param([string]$SQL, [string]$Description)
    
    Write-Host "`nExecuting: $Description" -ForegroundColor Yellow
    return Execute-SQL -Query $SQL -Description $Description
}

# Execute fixes
Write-Host "`nStep 1: Fix Security Warnings..." -ForegroundColor Yellow
Execute-SQLFile -SQL $securityFix -Description "Security Fixes"

Write-Host "`nStep 2: Fix Performance Issues..." -ForegroundColor Yellow
Execute-SQLFile -SQL $performanceFix -Description "Performance Fixes"

Write-Host "`nStep 3: Add Missing RLS Policies..." -ForegroundColor Yellow
Execute-SQLFile -SQL $rlsPolicies -Description "RLS Policies"

# Delete users if requested
if ($DeleteUsers) {
    Write-Host "`nStep 4: Deleting All Users..." -ForegroundColor Red
    
    $deleteQueries = @(
        "DELETE FROM public.profiles;",
        "DELETE FROM public.admin_users;",
        "DELETE FROM auth.users;"
    )
    
    foreach ($query in $deleteQueries) {
        Execute-SQL -Query $query -Description "Delete Users"
    }
    
    # Verify deletion
    $verifyQuery = @"
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;
"@
    Execute-SQL -Query $verifyQuery -Description "Verify User Deletion"
}

    Write-Host "`nAll fixes completed!" -ForegroundColor Green
