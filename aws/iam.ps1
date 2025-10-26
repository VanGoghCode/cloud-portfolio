param(
  [string]$Region
)

Write-Host "[IAM] Creating role and attaching policies..." -ForegroundColor Yellow

$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = if ($Region) { $Region } else { "us-east-1" }
$IAM_ROLE_NAME = "portfolio-lambda-role"

if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
      $key = $matches[1].Trim(); $value = $matches[2].Trim()
      Set-Variable -Name $key -Value $value -Scope Script
    }
  }
}

$trustPolicyJson = @{
  Version = "2012-10-17"
  Statement = @(
    @{ 
      Effect    = "Allow"
      Principal = @{ Service = @("lambda.amazonaws.com") }
      Action    = "sts:AssumeRole"
    }
  )
}
$trustPolicyFile = Join-Path $env:TEMP "lambda-trust-policy.json"

# Serialize to JSON and ensure it's valid and written without BOM (AWS CLI can reject BOM-prefixed files)
$trustPolicyJsonString = $trustPolicyJson | ConvertTo-Json -Depth 10
try {
  $null = $trustPolicyJsonString | ConvertFrom-Json
} catch {
  Write-Host "Generated trust policy is not valid JSON:" -ForegroundColor Red
  Write-Host $trustPolicyJsonString
  exit 1
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($trustPolicyFile, $trustPolicyJsonString, $utf8NoBom)

$createRoleOutput = aws iam create-role `
  --role-name $IAM_ROLE_NAME `
  --assume-role-policy-document "file://$trustPolicyFile" `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "IAM role created" -ForegroundColor Green
} elseif ($createRoleOutput -match "EntityAlreadyExists|already exists") {
  Write-Host "IAM role already exists" -ForegroundColor Yellow
} else {
  Write-Host "Failed to create IAM role: $createRoleOutput" -ForegroundColor Red
  Write-Host "Trust policy JSON used:" -ForegroundColor DarkYellow
  Write-Host $trustPolicyJsonString
  exit 1
}

aws iam attach-role-policy --role-name $IAM_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --no-cli-pager 2>$null
aws iam attach-role-policy --role-name $IAM_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess --no-cli-pager 2>$null
aws iam attach-role-policy --role-name $IAM_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess --no-cli-pager 2>$null

Write-Host "Policies attached. Waiting 10s for propagation..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
