param(
  [string]$Region,
  [string]$Email
)

Write-Host "[SES] Verifying email..." -ForegroundColor Yellow

$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = if ($Region) { $Region } else { "us-east-1" }
$SES_EMAIL = if ($Email) { $Email } else { "" }

if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
      $key = $matches[1].Trim(); $value = $matches[2].Trim()
      Set-Variable -Name $key -Value $value -Scope Script
    }
  }
}

if ([string]::IsNullOrWhiteSpace($SES_EMAIL)) {
  $SES_EMAIL = Read-Host "Enter your verified SES email address"
  if ([string]::IsNullOrWhiteSpace($SES_EMAIL)) { Write-Host "Email is required" -ForegroundColor Red; exit 1 }
}

$sesOutput = aws ses verify-email-identity `
  --email-address $SES_EMAIL `
  --region $AWS_REGION `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0 -or $sesOutput -match 'already') {
  Write-Host "SES email verification initiated. Check your inbox!" -ForegroundColor Green
} else {
  Write-Host ("SES verification may have failed: {0}" -f $sesOutput) -ForegroundColor Yellow
}
