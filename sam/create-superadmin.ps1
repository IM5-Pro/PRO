param(
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AwsDir = Join-Path (Split-Path -Parent $ScriptDir) "aws"
. (Join-Path $AwsDir "lib\Load-DeployConfig.ps1")
$Config = Get-DeployConfig -ScriptDir $AwsDir

$apiUrl = $Config.VITE_API_URL
if ($apiUrl -like "*YOUR_CLOUDFRONT*") {
    throw "Set VITE_API_URL in aws/deploy.config first."
}

$body = @{
    email = $Email.Trim().ToLower()
    password = $Password
    setupKey = $Config.SUPER_ADMIN_SETUP_KEY
} | ConvertTo-Json

$registerUrl = "$($apiUrl -replace '/api$','')/api/auth/register-superadmin"
Write-Host "Registering super admin at $registerUrl"

try {
    $response = Invoke-WebRequest -Uri $registerUrl -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "Success: $($response.Content)" -ForegroundColor Green
} catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host "Failed: $errorBody" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "You can now log in at $($Config.CLIENT_ORIGIN)/login"
