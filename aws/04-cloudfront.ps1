$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "lib\Load-DeployConfig.ps1")

$Config = Get-DeployConfig -ScriptDir $ScriptDir
$StatePath = Join-Path $ScriptDir "deploy.state.json"
if (-not (Test-Path $StatePath)) {
    throw "Run 01-bootstrap.ps1 first."
}
$State = Get-Content $StatePath | ConvertFrom-Json

$Bucket = $State.frontendBucket
$Region = $State.region
$ApiHost = ""

if ($State.apiUrl) {
    $ApiHost = ([uri]$State.apiUrl).Host
} else {
    $envInfo = Invoke-Aws $Config elasticbeanstalk describe-environments --environment-names $State.ebEnvName | ConvertFrom-Json
    $ApiHost = $envInfo.Environments[0].CNAME
}

Write-Host "=== Create CloudFront distribution ===" -ForegroundColor Cyan
Write-Host "Frontend origin: $Bucket.s3.$Region.amazonaws.com"
Write-Host "API origin: $ApiHost"

$originAccessControl = @{
    Name = "$($State.projectName)-s3-oac"
    OriginAccessControlOriginType = "s3"
    SigningBehavior = "always"
    SigningProtocol = "sigv4"
}

try {
    $oacResult = Invoke-Aws $Config cloudfront create-origin-access-control --origin-access-control-config ($originAccessControl | ConvertTo-Json -Compress) | ConvertFrom-Json
    $oacId = $oacResult.OriginAccessControl.Id
} catch {
    $existing = Invoke-Aws $Config cloudfront list-origin-access-controls | ConvertFrom-Json
    $oacId = ($existing.OriginAccessControlList.Items | Where-Object { $_.Name -eq $originAccessControl.Name }).Id
    if (-not $oacId) { throw "Could not create or find Origin Access Control." }
}

$callerRef = "$($State.projectName)-$(Get-Date -Format 'yyyyMMddHHmmss')"
$distributionConfig = @{
    CallerReference = $callerRef
    Comment = "$($State.projectName) HRMS"
    Enabled = $true
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 2
        Items = @(
            @{
                Id = "S3-frontend"
                DomainName = "$Bucket.s3.$Region.amazonaws.com"
                OriginAccessControlId = $oacId
                S3OriginConfig = @{ OriginAccessIdentity = "" }
            },
            @{
                Id = "EB-api"
                DomainName = $ApiHost
                CustomOriginConfig = @{
                    HTTPPort = 80
                    HTTPSPort = 443
                    OriginProtocolPolicy = "http-only"
                    OriginSslProtocols = @{ Quantity = 1; Items = @("TLSv1.2") }
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-frontend"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{ Quantity = 2; Items = @("GET", "HEAD"); CachedMethods = @{ Quantity = 2; Items = @("GET", "HEAD") } }
        Compress = $true
        ForwardedValues = @{ QueryString = $false; Cookies = @{ Forward = "none" } }
        MinTTL = 0
        DefaultTTL = 86400
        MaxTTL = 31536000
    }
    CacheBehaviors = @{
        Quantity = 1
        Items = @(
            @{
                PathPattern = "/api/*"
                TargetOriginId = "EB-api"
                ViewerProtocolPolicy = "redirect-to-https"
                AllowedMethods = @{ Quantity = 7; Items = @("GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"); CachedMethods = @{ Quantity = 2; Items = @("GET", "HEAD") } }
                Compress = $true
                ForwardedValues = @{
                    QueryString = $true
                    Headers = @{ Quantity = 3; Items = @("Origin", "Authorization", "Cookie") }
                    Cookies = @{ Forward = "all" }
                }
                MinTTL = 0
                DefaultTTL = 0
                MaxTTL = 0
            }
        )
    }
    CustomErrorResponses = @{
        Quantity = 2
        Items = @(
            @{ ErrorCode = 403; ResponsePagePath = "/index.html"; ResponseCode = "200"; ErrorCachingMinTTL = 0 }
            @{ ErrorCode = 404; ResponsePagePath = "/index.html"; ResponseCode = "200"; ErrorCachingMinTTL = 0 }
        )
    }
    ViewerCertificate = @{ CloudFrontDefaultCertificate = $true }
}

$configJson = $distributionConfig | ConvertTo-Json -Depth 10 -Compress
$distResult = Invoke-Aws $Config cloudfront create-distribution --distribution-config $configJson | ConvertFrom-Json
$domain = $distResult.Distribution.DomainName
$distId = $distResult.Distribution.Id

# Allow CloudFront OAC to read S3 bucket
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "AllowCloudFrontOAC"
            Effect = "Allow"
            Principal = @{ Service = "cloudfront.amazonaws.com" }
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$Bucket/*"
            Condition = @{
                StringEquals = @{
                    "AWS:SourceArn" = "arn:aws:cloudfront::$(Get-AwsAccountId -Config $Config):distribution/$distId"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 6 -Compress

Invoke-Aws $Config s3api put-bucket-policy --bucket $Bucket --policy $policy | Out-Null

$State | Add-Member -NotePropertyName cloudFrontDomain -NotePropertyValue $domain -Force
$State | Add-Member -NotePropertyName cloudFrontId -NotePropertyValue $distId -Force
$State | ConvertTo-Json -Depth 3 | Set-Content $StatePath -Encoding utf8

$cfUrl = "https://$domain"
$configPath = Join-Path $ScriptDir "deploy.config"
(Get-Content $configPath) `
    -replace '^CLIENT_ORIGIN=.*', "CLIENT_ORIGIN=$cfUrl" `
    -replace '^VITE_API_URL=.*', "VITE_API_URL=$cfUrl/api" | Set-Content $configPath

Write-Host ""
Write-Host "CloudFront URL: $cfUrl" -ForegroundColor Green
Write-Host "Distribution ID: $distId"
Write-Host ""
Write-Host "IMPORTANT: CloudFront takes 5-15 minutes to deploy." -ForegroundColor Yellow
Write-Host "Then re-run:"
Write-Host "  .\02-deploy-backend.ps1   (updates CLIENT_ORIGIN)"
Write-Host "  .\03-deploy-frontend.ps1  (rebuild with CloudFront API URL)"
