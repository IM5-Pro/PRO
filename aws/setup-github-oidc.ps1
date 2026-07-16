<#
.SYNOPSIS
  One-time setup: GitHub Actions OIDC trust for IM5-Pro/PRO develop branch deploys.

.DESCRIPTION
  Creates (or updates) an IAM OIDC provider for GitHub and a deploy role that
  GitHub Actions can assume from the develop branch only.

  After running this script, add the printed AWS_ROLE_ARN and app secrets to:
    GitHub -> IM5-Pro/PRO -> Settings -> Secrets and variables -> Actions

.EXAMPLE
  .\setup-github-oidc.ps1
  .\setup-github-oidc.ps1 -GitHubOrg IM5-Pro -GitHubRepo PRO -Branch develop
#>
param(
    [string]$GitHubOrg = "IM5-Pro",
    [string]$GitHubRepo = "PRO",
    [string]$Branch = "develop",
    [string]$RoleName = "github-actions-im5pro-deploy"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "lib\Load-DeployConfig.ps1")

$Config = Get-DeployConfig -ScriptDir $ScriptDir
$AccountId = Get-AwsAccountId -Config $Config
$Region = $Config.AWS_REGION
$OidcProviderArn = "arn:aws:iam::${AccountId}:oidc-provider/token.actions.githubusercontent.com"
$RoleArn = "arn:aws:iam::${AccountId}:role/$RoleName"
$RepoSubjectBranch = "repo:${GitHubOrg}/${GitHubRepo}:ref:refs/heads/${Branch}"
$RepoSubjectEnvironment = "repo:${GitHubOrg}/${GitHubRepo}:environment:${Branch}"

Write-Host "=== GitHub Actions OIDC setup ===" -ForegroundColor Cyan
Write-Host "Account:  $AccountId"
Write-Host "Region:   $Region"
Write-Host "Repo:     $GitHubOrg/$GitHubRepo"
Write-Host "Branch:   $Branch"
Write-Host "Role:     $RoleName"
Write-Host ""

Write-Host "Ensuring GitHub OIDC provider exists..."
$providerExists = $false
try {
    Invoke-Aws $Config iam get-open-id-connect-provider --open-id-connect-provider-arn $OidcProviderArn | Out-Null
    $providerExists = $true
    Write-Host "  OIDC provider already exists." -ForegroundColor Yellow
} catch {
    Write-Host "  Creating OIDC provider..."
    Invoke-Aws $Config iam create-open-id-connect-provider `
        --url "https://token.actions.githubusercontent.com" `
        --client-id-list "sts.amazonaws.com" | Out-Null
    Write-Host "  Created." -ForegroundColor Green
}

$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Federated = $OidcProviderArn
            }
            Action = "sts:AssumeRoleWithWebIdentity"
            Condition = @{
                StringEquals = @{
                    "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
                }
                StringLike = @{
                    "token.actions.githubusercontent.com:sub" = @(
                        $RepoSubjectBranch
                        $RepoSubjectEnvironment
                    )
                }
            }
        }
    )
} | ConvertTo-Json -Depth 6 -Compress

$deployPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "SamDeploy"
            Effect = "Allow"
            Action = @(
                "cloudformation:*",
                "s3:*",
                "lambda:*",
                "apigateway:*",
                "cloudfront:*",
                "iam:PassRole",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:GetRolePolicy",
                "iam:TagRole",
                "iam:UntagRole",
                "events:*",
                "scheduler:*",
                "logs:*",
                "ssm:GetParameter",
                "ssm:GetParameters"
            )
            Resource = "*"
        }
    )
} | ConvertTo-Json -Depth 6 -Compress

$trustPolicyPath = Join-Path $env:TEMP "github-oidc-trust-$RoleName.json"
$deployPolicyPath = Join-Path $env:TEMP "github-oidc-deploy-$RoleName.json"
Set-Content -Path $trustPolicyPath -Value $trustPolicy -Encoding utf8
Set-Content -Path $deployPolicyPath -Value $deployPolicy -Encoding utf8

Write-Host "Creating or updating IAM role: $RoleName"
$roleExists = $false
try {
    Invoke-Aws $Config iam get-role --role-name $RoleName | Out-Null
    $roleExists = $true
} catch {
    $roleExists = $false
}

if (-not $roleExists) {
    Invoke-Aws $Config iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document "file://$trustPolicyPath" `
        --description "GitHub Actions deploy role for $GitHubOrg/$GitHubRepo ($Branch)" | Out-Null
    Write-Host "  Role created." -ForegroundColor Green
} else {
    Invoke-Aws $Config iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document "file://$trustPolicyPath" | Out-Null
    Write-Host "  Trust policy updated." -ForegroundColor Yellow
}

Invoke-Aws $Config iam put-role-policy `
    --role-name $RoleName `
    --policy-name "SamDeployPolicy" `
    --policy-document "file://$deployPolicyPath" | Out-Null

Remove-Item $trustPolicyPath, $deployPolicyPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Setup complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Create a GitHub Environment named: develop"
Write-Host "   Repository -> Settings -> Environments -> New environment"
Write-Host ""
Write-Host "2. Add these repository secrets (Settings -> Secrets and variables -> Actions):"
Write-Host ""
Write-Host "   AWS_ROLE_ARN"
Write-Host "   $RoleArn"
Write-Host ""
Write-Host "   MONGODB_URI"
Write-Host "   JWT_SECRET"
Write-Host "   JWT_REFRESH_SECRET"
Write-Host "   SUPER_ADMIN_SETUP_KEY"
Write-Host ""
Write-Host "   Optional (only if stack does not exist yet):"
Write-Host "   CLIENT_ORIGIN = your CloudFront URL, e.g. https://d2k8bpxd8iuidt.cloudfront.net"
Write-Host ""
Write-Host "3. Push the deploy workflow to the develop branch."
Write-Host "   Every push to develop will validate, deploy SAM, upload frontend, and invalidate CloudFront."
Write-Host ""
