$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "lib\Load-DeployConfig.ps1")

$Config = Get-DeployConfig -ScriptDir $ScriptDir
$AccountId = Get-AwsAccountId -Config $Config
$Project = $Config.PROJECT_NAME
$Region = $Config.AWS_REGION
$EbApp = $Config.EB_APP_NAME
$FrontendBucket = "$Project-frontend-$AccountId"

Write-Host "=== Bootstrap AWS resources (no Docker) ===" -ForegroundColor Cyan
Write-Host "Account: $AccountId | Region: $Region | Project: $Project"
Write-Host ""

Write-Host "Creating Elastic Beanstalk application: $EbApp"
try {
    Invoke-Aws $Config elasticbeanstalk create-application --application-name $EbApp --description "HRMS API (Node.js)" | Out-Null
    Write-Host "  Created." -ForegroundColor Green
} catch {
    Write-Host "  Already exists (ok)." -ForegroundColor Yellow
}

Write-Host "Creating S3 frontend bucket: $FrontendBucket"
try {
    if ($Region -eq "us-east-1") {
        Invoke-Aws $Config s3api create-bucket --bucket $FrontendBucket | Out-Null
    } else {
        Invoke-Aws $Config s3api create-bucket --bucket $FrontendBucket --create-bucket-configuration "LocationConstraint=$Region" | Out-Null
    }
    Write-Host "  Created." -ForegroundColor Green
} catch {
    Write-Host "  Already exists (ok)." -ForegroundColor Yellow
}

Invoke-Aws $Config s3api put-public-access-block --bucket $FrontendBucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" | Out-Null

$deployBucket = "$EbApp-deploy-$AccountId"
Write-Host "Creating S3 deploy bucket for EB bundles: $deployBucket"
try {
    if ($Region -eq "us-east-1") {
        Invoke-Aws $Config s3api create-bucket --bucket $deployBucket | Out-Null
    } else {
        Invoke-Aws $Config s3api create-bucket --bucket $deployBucket --create-bucket-configuration "LocationConstraint=$Region" | Out-Null
    }
    Write-Host "  Created." -ForegroundColor Green
} catch {
    Write-Host "  Already exists (ok)." -ForegroundColor Yellow
}

$statePath = Join-Path $ScriptDir "deploy.state.json"
$state = @{
    accountId      = $AccountId
    region         = $Region
    projectName    = $Project
    ebAppName      = $EbApp
    ebEnvName      = $Config.EB_ENV_NAME
    frontendBucket = $FrontendBucket
    deployBucket   = $deployBucket
} | ConvertTo-Json -Depth 3

$state | Set-Content $statePath -Encoding utf8
Write-Host ""
Write-Host "Bootstrap complete. State saved to deploy.state.json" -ForegroundColor Green
Write-Host "Next: .\02-deploy-backend.ps1"
