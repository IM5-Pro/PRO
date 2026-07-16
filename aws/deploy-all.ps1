$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== HRMS AWS deploy (all steps) ===" -ForegroundColor Cyan
& (Join-Path $ScriptDir "01-bootstrap.ps1")
& (Join-Path $ScriptDir "02-deploy-backend.ps1")
& (Join-Path $ScriptDir "03-deploy-frontend.ps1")
& (Join-Path $ScriptDir "04-cloudfront.ps1")
Write-Host ""
Write-Host "=== Deploy pipeline finished ===" -ForegroundColor Green
