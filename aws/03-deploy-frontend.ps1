$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ClientDir = Join-Path $RepoRoot "client"

. (Join-Path $ScriptDir "lib\Load-DeployConfig.ps1")

$Config = Get-DeployConfig -ScriptDir $ScriptDir
$StatePath = Join-Path $ScriptDir "deploy.state.json"
if (-not (Test-Path $StatePath)) {
    throw "Run 01-bootstrap.ps1 first."
}
$State = Get-Content $StatePath | ConvertFrom-Json
$Bucket = $State.frontendBucket

Write-Host "=== Deploy frontend to S3 ===" -ForegroundColor Cyan

$apiUrl = $Config.VITE_API_URL
if ($apiUrl -like "*YOUR_CLOUDFRONT*") {
  if ($State.apiUrl) {
    $apiUrl = "$($State.apiUrl)/api"
    Write-Host "Using temporary API URL from EB: $apiUrl" -ForegroundColor Yellow
    Write-Host "Re-run after CloudFront setup with VITE_API_URL in deploy.config."
  } else {
    throw "Set VITE_API_URL in deploy.config or deploy backend first."
  }
}

Push-Location $ClientDir
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing client dependencies..."
        npm ci
    }

    Write-Host "Building React app..."
    $env:VITE_API_URL = $apiUrl
    npm run build
} finally {
    Pop-Location
}

$BuildDir = Join-Path $ClientDir "build"
if (-not (Test-Path $BuildDir)) {
    throw "Build folder not found at $BuildDir"
}

Write-Host "Syncing build/ to s3://$Bucket"
Invoke-Aws $Config s3 sync $BuildDir "s3://$Bucket" --delete

Write-Host ""
Write-Host "Frontend deployed to s3://$Bucket" -ForegroundColor Green
Write-Host "Next: .\04-cloudfront.ps1"
