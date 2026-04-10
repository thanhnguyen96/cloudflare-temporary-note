param(
  [string]$ProjectName = "note-24h",
  [string]$ApiBaseUrl = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan

  if ($DryRun) {
    Write-Host "Dry-run: skipped execution."
    return
  }

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$wranglerTomlPath = Join-Path $repoRoot "worker\wrangler.toml"

function Assert-WorkerConfig {
  param([string]$WranglerToml)

  if (-not (Test-Path $WranglerToml)) {
    throw "Missing worker/wrangler.toml"
  }

  $content = Get-Content -Path $WranglerToml -Raw
  $match = [regex]::Match($content, 'database_id\s*=\s*"([^"]*)"')

  if (-not $match.Success) {
    throw "Missing `database_id` in worker/wrangler.toml"
  }

  $databaseId = $match.Groups[1].Value.Trim()
  if ([string]::IsNullOrWhiteSpace($databaseId) -or $databaseId -eq "REPLACE_WITH_D1_DATABASE_ID") {
    throw "Invalid D1 database_id in worker/wrangler.toml. Run: wrangler d1 create note-24h-db, then paste returned database_id."
  }

  $accountMatch = [regex]::Match($content, 'R2_ACCOUNT_ID\s*=\s*"([^"]*)"')
  $accessKeyMatch = [regex]::Match($content, 'R2_ACCESS_KEY_ID\s*=\s*"([^"]*)"')

  if (-not $accountMatch.Success -or $accountMatch.Groups[1].Value.Trim() -eq "REPLACE_WITH_CF_ACCOUNT_ID") {
    throw "Invalid R2_ACCOUNT_ID in worker/wrangler.toml."
  }

  if (-not $accessKeyMatch.Success -or $accessKeyMatch.Groups[1].Value.Trim() -eq "REPLACE_WITH_R2_ACCESS_KEY_ID") {
    throw "Invalid R2_ACCESS_KEY_ID in worker/wrangler.toml."
  }
}

function Resolve-ApiBaseUrl {
  param(
    [string]$Value,
    [string]$RepoRoot
  )

  $trimmed = $Value.Trim()
  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    $trimmed = Resolve-ApiBaseUrlFromEnvFiles -RepoRoot $RepoRoot
  }

  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    throw "Missing ApiBaseUrl. Set VITE_API_BASE (https) in frontend/.env.local, frontend/.env.production, or frontend/.env (or pass -ApiBaseUrl)."
  }

  if ($trimmed -notmatch '^https://') {
    throw "ApiBaseUrl must start with https://"
  }

  if ($trimmed -match 'pages\.dev') {
    throw "ApiBaseUrl must point to Worker domain, not Pages domain."
  }

  return $trimmed.TrimEnd("/")
}

function Resolve-ApiBaseUrlFromEnvFiles {
  param([string]$RepoRoot)

  $candidates = @(
    (Join-Path $RepoRoot "frontend\.env.local"),
    (Join-Path $RepoRoot "frontend\.env.production"),
    (Join-Path $RepoRoot "frontend\.env"),
    (Join-Path $RepoRoot ".env")
  )

  foreach ($path in $candidates) {
    if (-not (Test-Path $path)) {
      continue
    }

    $lines = Get-Content -Path $path
    foreach ($line in $lines) {
      $trimmed = $line.Trim()
      if ([string]::IsNullOrWhiteSpace($trimmed)) {
        continue
      }
      if ($trimmed.StartsWith("#")) {
        continue
      }
      if ($trimmed -notmatch '^VITE_API_BASE\s*=') {
        continue
      }

      $value = ($trimmed -replace '^VITE_API_BASE\s*=\s*', "").Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if ($value.StartsWith("'") -and $value.EndsWith("'")) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if (-not [string]::IsNullOrWhiteSpace($value) -and $value -match '^https://') {
        return $value
      }
    }
  }

  return ""
}

Push-Location $repoRoot
try {
  Assert-WorkerConfig -WranglerToml $wranglerTomlPath
  $resolvedApiBase = Resolve-ApiBaseUrl -Value $ApiBaseUrl -RepoRoot $repoRoot

  Invoke-Step -Name "Build frontend" -FilePath "powershell.exe" -Arguments @(
    "-NoProfile",
    "-Command",
    "`$env:VITE_API_BASE='$resolvedApiBase'; npm.cmd run build:frontend"
  )
  Invoke-Step -Name "Build worker (dry-run deploy package)" -FilePath "npm.cmd" -Arguments @("run", "build:worker")
  Invoke-Step -Name "Deploy worker" -FilePath "npm.cmd" -Arguments @("--workspace", "worker", "run", "deploy")
  Invoke-Step -Name "Deploy pages project '$ProjectName'" -FilePath "npx.cmd" -Arguments @("wrangler", "pages", "deploy", "frontend/dist", "--project-name", $ProjectName)

  Write-Host ""
  Write-Host "Deployment completed." -ForegroundColor Green
}
finally {
  Pop-Location
}
