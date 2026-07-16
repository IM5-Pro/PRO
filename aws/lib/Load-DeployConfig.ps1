function Get-DeployConfig {
    param([string]$ScriptDir)

    $configPath = Join-Path $ScriptDir "deploy.config"
    if (-not (Test-Path $configPath)) {
        throw "Missing deploy.config. Copy deploy.config.example to deploy.config and fill in values."
    }

    $config = @{}
    Get-Content $configPath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $config[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    if (-not $config.AWS_PROFILE) { throw "AWS_PROFILE is required in deploy.config" }
    if (-not $config.AWS_REGION) { throw "AWS_REGION is required in deploy.config" }
    if (-not $config.PROJECT_NAME) { throw "PROJECT_NAME is required in deploy.config" }

    $config
}

function Invoke-Aws {
    param(
        [hashtable]$Config,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    & aws --profile $Config.AWS_PROFILE --region $Config.AWS_REGION @Args
    if ($LASTEXITCODE -ne 0) {
        throw "AWS command failed: aws $($Args -join ' ')"
    }
}

function Get-AwsAccountId {
    param([hashtable]$Config)

    $identity = Invoke-Aws $Config sts get-caller-identity | ConvertFrom-Json
    return $identity.Account
}
