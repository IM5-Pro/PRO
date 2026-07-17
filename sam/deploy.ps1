$ErrorActionPreference = "Stop"
$SamDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $SamDir
$AwsDir = Join-Path $RepoRoot "aws"
$ClientDir = Join-Path $RepoRoot "client"
$ServerDir = Join-Path $RepoRoot "server"

. (Join-Path $AwsDir "lib\Load-DeployConfig.ps1")
$Config = Get-DeployConfig -ScriptDir $AwsDir

$Profile = $Config.AWS_PROFILE
$Region = $Config.AWS_REGION
$StackName = $Config.PROJECT_NAME

Write-Host "=== SAM deploy: $StackName ===" -ForegroundColor Cyan
Write-Host "Profile: $Profile | Region: $Region"
Write-Host ""

Write-Host "[1/4] Installing server dependencies..."
Push-Location $ServerDir
npm install --omit=dev
Pop-Location

Write-Host "[2/4] SAM build..."
Push-Location $SamDir
sam build --profile $Profile --region $Region
if ($LASTEXITCODE -ne 0) { throw "sam build failed" }

Write-Host "[3/4] SAM deploy..."
$paramOverrides = @(
    "MongoDBUri=$($Config.MONGODB_URI)"
    "JwtSecret=$($Config.JWT_SECRET)"
    "JwtRefreshSecret=$($Config.JWT_REFRESH_SECRET)"
    "SuperAdminSetupKey=$($Config.SUPER_ADMIN_SETUP_KEY)"
    "ClientOrigin=$($Config.CLIENT_ORIGIN)"
)

sam deploy `
    --profile $Profile `
    --region $Region `
    --stack-name $StackName `
    --resolve-s3 `
    --capabilities CAPABILITY_IAM `
    --no-confirm-changeset `
    --parameter-overrides @paramOverrides

if ($LASTEXITCODE -ne 0) { throw "sam deploy failed" }
Pop-Location

Write-Host "[4/4] Fetching stack outputs..."
$outputs = aws cloudformation describe-stacks `
    --profile $Profile `
    --region $Region `
    --stack-name $StackName `
    --query "Stacks[0].Outputs" | ConvertFrom-Json

$cfUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontUrl" }).OutputValue
$bucket = ($outputs | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
$distId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$apiUrl = "$cfUrl/api"

Write-Host "Building frontend with VITE_API_URL=$apiUrl"
Push-Location $ClientDir
if (-not (Test-Path "node_modules")) { npm ci }
$env:VITE_API_URL = $apiUrl
npm run build
Pop-Location

$BuildDir = Join-Path $ClientDir "build"
Write-Host "Uploading frontend to s3://$bucket"
aws s3 sync $BuildDir "s3://$bucket" --delete --profile $Profile --region $Region

Write-Host "Invalidating CloudFront cache..."
aws cloudfront create-invalidation `
    --profile $Profile `
    --distribution-id $distId `
    --paths "/*" | Out-Null

$configPath = Join-Path $AwsDir "deploy.config"
(Get-Content $configPath) `
    -replace '^CLIENT_ORIGIN=.*', "CLIENT_ORIGIN=$cfUrl" `
    -replace '^VITE_API_URL=.*', "VITE_API_URL=$apiUrl" | Set-Content $configPath

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "App URL:      $cfUrl"
Write-Host "API URL:      $apiUrl"
Write-Host ""
if ($Config.CLIENT_ORIGIN -like "*YOUR_CLOUDFRONT*" -or $Config.CLIENT_ORIGIN -eq "https://localhost") {
    Write-Host "Re-run deploy once to update API CORS with CloudFront URL:" -ForegroundColor Yellow
    Write-Host "  .\sam\deploy.ps1"
}
