param(
    [string]$ProfileName = "hrms-prod",
    [string]$Region = "ap-south-1",
    [string]$AccessKeyId = "",
    [string]$SecretAccessKey = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "deploy.config"

Write-Host ""
Write-Host "=== Configure NEW AWS account ===" -ForegroundColor Cyan
Write-Host "This creates a separate AWS CLI profile (does not change your default profile)."
Write-Host ""

if (-not $AccessKeyId) {
    $AccessKeyId = Read-Host "AWS Access Key ID"
}

if (-not $SecretAccessKey) {
    $SecureSecret = Read-Host "AWS Secret Access Key" -AsSecureString
    $SecretAccessKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureSecret)
    )
}

$InputRegion = ""
if (-not $PSBoundParameters.ContainsKey("Region")) {
    $InputRegion = Read-Host "AWS Region [$Region]"
}
if ($InputRegion) { $Region = $InputRegion }

$InputProfile = ""
if (-not $PSBoundParameters.ContainsKey("ProfileName")) {
    $InputProfile = Read-Host "Profile name [$ProfileName]"
}
if ($InputProfile) { $ProfileName = $InputProfile }

aws configure set aws_access_key_id $AccessKeyId --profile $ProfileName
aws configure set aws_secret_access_key $SecretAccessKey --profile $ProfileName
aws configure set region $Region --profile $ProfileName
aws configure set output json --profile $ProfileName

Write-Host ""
Write-Host "Verifying credentials..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity --profile $ProfileName | ConvertFrom-Json

Write-Host "Connected to account: $($identity.Account)" -ForegroundColor Green
Write-Host "User/Role: $($identity.Arn)"

$AccountId = $identity.Account
$AccountId | Out-File -FilePath (Join-Path $ScriptDir ".account-id") -Encoding utf8 -NoNewline

if (-not (Test-Path $ConfigPath)) {
    Copy-Item (Join-Path $ScriptDir "deploy.config.example") $ConfigPath
    Write-Host "Created deploy.config from example." -ForegroundColor Green
}

(Get-Content $ConfigPath) `
    -replace '^AWS_PROFILE=.*', "AWS_PROFILE=$ProfileName" `
    -replace '^AWS_REGION=.*', "AWS_REGION=$Region" | Set-Content $ConfigPath

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit aws\deploy.config (MongoDB URI, JWT secrets, etc.)"
Write-Host "  2. Run:  .\aws\01-bootstrap.ps1"
Write-Host "  3. Run:  .\aws\02-deploy-backend.ps1   (Elastic Beanstalk - no Docker)"
Write-Host "  4. Run:  .\aws\03-deploy-frontend.ps1   (S3)"
Write-Host "  5. Run:  .\aws\04-cloudfront.ps1"
Write-Host ""
