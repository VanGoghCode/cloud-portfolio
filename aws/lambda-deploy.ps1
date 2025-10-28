param(
  [string]$Region,
  [string]$Email,
  [string]$ApiKey
)

Write-Host "[Lambda] Packaging and deploying functions..." -ForegroundColor Yellow

$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = if ($Region) { $Region } else { "us-east-1" }
$SES_FROM_EMAIL = if ($Email) { $Email } else { "" }
$DYNAMODB_CONTACT_TABLE = "portfolio-contact-messages"
$DYNAMODB_BLOGS_TABLE = "portfolio-blog-posts"
$LAMBDA_CONTACT_FUNCTION = "portfolio-contact-form"
$LAMBDA_BLOGS_FUNCTION = "portfolio-blogs-crud"
$IAM_ROLE_NAME = "portfolio-lambda-role"
$API_KEY = $ApiKey

if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
      $key = $matches[1].Trim(); $value = $matches[2].Trim()
      Set-Variable -Name $key -Value $value -Scope Script
    }
  }
}

# Helper to wait until a Lambda function finishes updating/creating
function Wait-LambdaReady($FunctionName, $Region) {
  for ($i = 1; $i -le 6; $i++) {
    $status = aws lambda get-function --function-name $FunctionName --region $Region --query 'Configuration.LastUpdateStatus' --output text 2>$null
    if ($LASTEXITCODE -eq 0 -and ($status -eq 'Successful' -or $status -eq '')) { return $true }
    Start-Sleep -Seconds (5 * $i)
  }
  return $false
}

if ([string]::IsNullOrWhiteSpace($SES_FROM_EMAIL)) {
  $SES_FROM_EMAIL = Read-Host "Enter SES email (for contact form notifications)"
  if ([string]::IsNullOrWhiteSpace($SES_FROM_EMAIL)) { Write-Host "Email is required" -ForegroundColor Red; exit 1 }
}

if ([string]::IsNullOrWhiteSpace($API_KEY)) {
  $bytes = New-Object byte[] 32; [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
  $API_KEY = [Convert]::ToBase64String($bytes)
  Write-Host "Generated API Key: $API_KEY" -ForegroundColor Green
}

$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$lambdaDir = Join-Path $PSScriptRoot "lambda"
if (-not (Test-Path $lambdaDir)) { Write-Host "Lambda directory not found: $lambdaDir" -ForegroundColor Red; exit 1 }

Push-Location $lambdaDir
if (-not (Test-Path "package.json")) { Write-Host "package.json missing in lambda dir" -ForegroundColor Red; Pop-Location; exit 1 }

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install --production --silent
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; Pop-Location; exit 1 }

# Contact
if (Test-Path "contactForm.zip") { Remove-Item "contactForm.zip" -Force }
Compress-Archive -Path contactForm.js,node_modules -DestinationPath contactForm.zip -Force

$createOutput = aws lambda create-function `
  --function-name $LAMBDA_CONTACT_FUNCTION `
  --runtime nodejs20.x `
  --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$IAM_ROLE_NAME" `
  --handler contactForm.handler `
  --zip-file fileb://contactForm.zip `
  --timeout 30 `
  --memory-size 256 `
  --environment "Variables={DYNAMODB_TABLE_NAME=$DYNAMODB_CONTACT_TABLE,SES_FROM_EMAIL=$SES_FROM_EMAIL,SES_TO_EMAIL=$SES_FROM_EMAIL}" `
  --region $AWS_REGION `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) { Write-Host "Contact Lambda created" -ForegroundColor Green } 
elseif ($createOutput -match "ResourceConflictException|already exists") {
  $codeOutput = aws lambda update-function-code --function-name $LAMBDA_CONTACT_FUNCTION --zip-file fileb://contactForm.zip --region $AWS_REGION --no-cli-pager 2>&1
  if ($LASTEXITCODE -eq 0) {
    # Wait for the function to finish updating before changing configuration
    $null = Wait-LambdaReady $LAMBDA_CONTACT_FUNCTION $AWS_REGION

    $updateOutput = aws lambda update-function-configuration `
      --function-name $LAMBDA_CONTACT_FUNCTION `
      --environment "Variables={DYNAMODB_TABLE_NAME=$DYNAMODB_CONTACT_TABLE,SES_FROM_EMAIL=$SES_FROM_EMAIL,SES_TO_EMAIL=$SES_FROM_EMAIL}" `
      --region $AWS_REGION `
      --no-cli-pager 2>&1
    if ($LASTEXITCODE -eq 0) { 
      Write-Host "Contact Lambda updated" -ForegroundColor Green 
    } else { 
      Write-Host "Failed to update contact lambda configuration: $updateOutput" -ForegroundColor Red 
    }
  } else { 
    Write-Host "Failed to update contact lambda: $codeOutput" -ForegroundColor Red 
  }
} else { Write-Host "Failed to create contact lambda: $createOutput" -ForegroundColor Red }

# Blogs
if (Test-Path "blogsCRUD.zip") { Remove-Item "blogsCRUD.zip" -Force }
Compress-Archive -Path blogsCRUD.js,node_modules -DestinationPath blogsCRUD.zip -Force

$createOutput = aws lambda create-function `
  --function-name $LAMBDA_BLOGS_FUNCTION `
  --runtime nodejs20.x `
  --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$IAM_ROLE_NAME" `
  --handler blogsCRUD.handler `
  --zip-file fileb://blogsCRUD.zip `
  --timeout 30 `
  --memory-size 256 `
  --environment "Variables={DYNAMODB_BLOGS_TABLE=$DYNAMODB_BLOGS_TABLE,API_KEY=$API_KEY,SESSION_SECRET=$SESSION_SECRET}" `
  --region $AWS_REGION `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) { Write-Host "Blogs Lambda created" -ForegroundColor Green } 
elseif ($createOutput -match "ResourceConflictException|already exists") {
  $codeOutput = aws lambda update-function-code --function-name $LAMBDA_BLOGS_FUNCTION --zip-file fileb://blogsCRUD.zip --region $AWS_REGION --no-cli-pager 2>&1
  if ($LASTEXITCODE -eq 0) {
    # Wait for the function to finish updating before changing configuration
    Write-Host "Waiting for blogs Lambda to be ready..." -ForegroundColor Yellow
    $null = Wait-LambdaReady $LAMBDA_BLOGS_FUNCTION $AWS_REGION
    
    $updateOutput = aws lambda update-function-configuration `
      --function-name $LAMBDA_BLOGS_FUNCTION `
      --environment "Variables={DYNAMODB_BLOGS_TABLE=$DYNAMODB_BLOGS_TABLE,API_KEY=$API_KEY,SESSION_SECRET=$SESSION_SECRET}" `
      --region $AWS_REGION `
      --no-cli-pager 2>&1
    if ($LASTEXITCODE -eq 0) { 
      Write-Host "Blogs Lambda updated" -ForegroundColor Green 
    } else { 
      Write-Host "Failed to update blogs lambda configuration: $updateOutput" -ForegroundColor Red 
    }
  } else { 
    Write-Host "Failed to update blogs lambda: $codeOutput" -ForegroundColor Red 
  }
} else { Write-Host "Failed to create blogs lambda: $createOutput" -ForegroundColor Red }

Pop-Location

# Persist API key locally (optional)
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) { New-Item -ItemType File -Path $envFile -Force | Out-Null }
Add-Content -Path $envFile -Value "BLOG_API_KEY=$API_KEY"
Write-Host "Saved BLOG_API_KEY to .env" -ForegroundColor Gray
