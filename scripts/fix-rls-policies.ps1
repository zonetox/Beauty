# Fix RLS Policies one by one
param(
    [string]$ProjectRef = "fdklazlcbxaiapsnnbqq",
    [string]$Token = "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "apikey" = $Token
}

$policies = @(
    # Admin Activity Logs
    "DROP POLICY IF EXISTS admin_activity_logs_select_admin ON public.admin_activity_logs;",
    "CREATE POLICY admin_activity_logs_select_admin ON public.admin_activity_logs FOR SELECT USING (public.is_admin());",
    "DROP POLICY IF EXISTS admin_activity_logs_insert_admin ON public.admin_activity_logs;",
    "CREATE POLICY admin_activity_logs_insert_admin ON public.admin_activity_logs FOR INSERT WITH CHECK (public.is_admin());",
    "DROP POLICY IF EXISTS admin_activity_logs_update_admin ON public.admin_activity_logs;",
    "CREATE POLICY admin_activity_logs_update_admin ON public.admin_activity_logs FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());",
    "DROP POLICY IF EXISTS admin_activity_logs_delete_admin ON public.admin_activity_logs;",
    "CREATE POLICY admin_activity_logs_delete_admin ON public.admin_activity_logs FOR DELETE USING (public.is_admin());",
    
    # Email Notifications Log
    "DROP POLICY IF EXISTS email_notifications_log_select_admin ON public.email_notifications_log;",
    "CREATE POLICY email_notifications_log_select_admin ON public.email_notifications_log FOR SELECT USING (public.is_admin());",
    "DROP POLICY IF EXISTS email_notifications_log_insert_service ON public.email_notifications_log;",
    "CREATE POLICY email_notifications_log_insert_service ON public.email_notifications_log FOR INSERT WITH CHECK (true);",
    "DROP POLICY IF EXISTS email_notifications_log_update_admin ON public.email_notifications_log;",
    "CREATE POLICY email_notifications_log_update_admin ON public.email_notifications_log FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());",
    "DROP POLICY IF EXISTS email_notifications_log_delete_admin ON public.email_notifications_log;",
    "CREATE POLICY email_notifications_log_delete_admin ON public.email_notifications_log FOR DELETE USING (public.is_admin());"
)

Write-Host "Fixing RLS Policies..." -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($query in $policies) {
    $body = @{ query = $query } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -Body $body
        Write-Host "SUCCESS: $($query.Substring(0, [Math]::Min(60, $query.Length)))..." -ForegroundColor Green
        $successCount++
        Start-Sleep -Milliseconds 300
    } catch {
        Write-Host "ERROR: $($query.Substring(0, [Math]::Min(60, $query.Length)))..." -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`nCompleted: $successCount success, $errorCount errors" -ForegroundColor Cyan
