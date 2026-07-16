$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ServerDir = Join-Path $RepoRoot "server"

. (Join-Path $ScriptDir "lib\Load-DeployConfig.ps1")

$Config = Get-DeployConfig -ScriptDir $ScriptDir
$StatePath = Join-Path $ScriptDir "deploy.state.json"
if (-not (Test-Path $StatePath)) {
    throw "Run 01-bootstrap.ps1 first."
}
$State = Get-Content $StatePath | ConvertFrom-Json

$EbApp = $State.ebAppName
$EbEnv = $State.ebEnvName
$DeployBucket = $State.deployBucket
$VersionLabel = "v-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$ZipPath = Join-Path $env:TEMP "$EbApp-$VersionLabel.zip"
$S3Key = "bundles/$VersionLabel.zip"

Write-Host "=== Deploy backend (Elastic Beanstalk, no Docker) ===" -ForegroundColor Cyan

Write-Host "Packaging server..."
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$ebIgnorePath = Join-Path $ServerDir ".ebignore"
$ignorePatterns = @()
if (Test-Path $ebIgnorePath) {
    $ignorePatterns = Get-Content $ebIgnorePath | Where-Object { $_ -and -not $_.StartsWith("#") }
}

function Should-Ignore([string]$RelativePath) {
    foreach ($pattern in $ignorePatterns) {
        $normalized = $pattern.TrimEnd("/")
        if ($RelativePath -like $normalized -or $RelativePath -like "$normalized/*") {
            return $true
        }
    }
    return $false
}

Get-ChildItem -Path $ServerDir -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($ServerDir.Length + 1).Replace("\", "/")
    if (Should-Ignore $relative) { return }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relative) | Out-Null
}
$zip.Dispose()

Write-Host "Uploading bundle to s3://$DeployBucket/$S3Key"
Invoke-Aws $Config s3 cp $ZipPath "s3://$DeployBucket/$S3Key"

Write-Host "Creating application version: $VersionLabel"
Invoke-Aws $Config elasticbeanstalk create-application-version `
    --application-name $EbApp `
    --version-label $VersionLabel `
    --source-bundle "S3Bucket=$DeployBucket,S3Key=$S3Key" `
    --process | Out-Null

$envExists = $false
$envResult = Invoke-Aws $Config elasticbeanstalk describe-environments --application-name $EbApp --environment-names $EbEnv | ConvertFrom-Json
if ($envResult.Environments -and $envResult.Environments.Count -gt 0) {
    $envExists = $true
}

$optionSettings = @(
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "NODE_ENV"; Value = $Config.NODE_ENV }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "PORT"; Value = $Config.PORT }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "MONGODB_URI"; Value = $Config.MONGODB_URI }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "JWT_SECRET"; Value = $Config.JWT_SECRET }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "JWT_REFRESH_SECRET"; Value = $Config.JWT_REFRESH_SECRET }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "SUPER_ADMIN_SETUP_KEY"; Value = $Config.SUPER_ADMIN_SETUP_KEY }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "CLIENT_ORIGIN"; Value = $Config.CLIENT_ORIGIN }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "COOKIE_SECURE"; Value = $Config.COOKIE_SECURE }
    @{ Namespace = "aws:elasticbeanstalk:application:environment"; OptionName = "COOKIE_SAME_SITE"; Value = $Config.COOKIE_SAME_SITE }
)

$optionsJson = $optionSettings | ConvertTo-Json -Compress

if (-not $envExists) {
    Write-Host "Creating EB environment: $EbEnv (this takes ~5-10 min)..."
    Invoke-Aws $Config elasticbeanstalk create-environment `
        --application-name $EbApp `
        --environment-name $EbEnv `
        --version-label $VersionLabel `
        --solution-stack-name $Config.EB_PLATFORM `
        --option-settings $optionsJson `
        --tier Name=WebServer,Type=Standard
} else {
    Write-Host "Updating EB environment: $EbEnv"
    Invoke-Aws $Config elasticbeanstalk update-environment `
        --environment-name $EbEnv `
        --version-label $VersionLabel `
        --option-settings $optionsJson
}

Write-Host "Waiting for environment to become ready..."
do {
    Start-Sleep -Seconds 15
    $envInfo = Invoke-Aws $Config elasticbeanstalk describe-environments --environment-names $EbEnv | ConvertFrom-Json
    $status = $envInfo.Environments[0].Status
    $health = $envInfo.Environments[0].Health
    Write-Host "  Status: $status | Health: $health"
} while ($status -eq "Updating")

$apiUrl = $envInfo.Environments[0].CNAME
$State | Add-Member -NotePropertyName apiUrl -NotePropertyValue "http://$apiUrl" -Force
$State | ConvertTo-Json -Depth 3 | Set-Content $StatePath -Encoding utf8

Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Backend deployed: http://$apiUrl" -ForegroundColor Green
Write-Host "Health check: http://$apiUrl/api/health"
Write-Host "Next: .\03-deploy-frontend.ps1"
