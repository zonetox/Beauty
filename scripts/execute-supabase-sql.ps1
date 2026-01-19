# Execute SQL Query on Supabase via Management API
# Usage: .\execute-supabase-sql.ps1 "SELECT * FROM businesses LIMIT 5;"

param(
    [Parameter(Mandatory=$true)]
    [string]$Query,
    
    [string]$ProjectRef = "fdklazlcbxaiapsnnbqq",
    [string]$Token = "sbp_65661f5f31e4514aad0cda2e81e021788e85b9dd"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "apikey" = $Token
}

$body = @{
    query = $Query
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -Body $body
    return $result
} catch {
    Write-Error "Failed to execute query: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Error "Response: $responseBody"
    }
    throw
}
