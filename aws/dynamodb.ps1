param(
  [string]$Region
)

Write-Host "[DynamoDB] Creating tables..." -ForegroundColor Yellow

# Load config
$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = if ($Region) { $Region } else { "us-east-1" }
$DYNAMODB_CONTACT_TABLE = "portfolio-contact-messages"
$DYNAMODB_BLOGS_TABLE = "portfolio-blog-posts"

if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
      $key = $matches[1].Trim(); $value = $matches[2].Trim()
      Set-Variable -Name $key -Value $value -Scope Script
    }
  }
}

# Contact table
$createTableOutput = aws dynamodb create-table `
  --table-name $DYNAMODB_CONTACT_TABLE `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $AWS_REGION `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "Contact messages table created" -ForegroundColor Green
} elseif ($createTableOutput -match 'ResourceInUseException' -or $createTableOutput -match 'already exists') {
  Write-Host "Contact messages table already exists" -ForegroundColor Yellow
} else {
  Write-Host "Failed to create contact messages table: $createTableOutput" -ForegroundColor Red
}

# Blogs table
$createTableOutput = aws dynamodb create-table `
  --table-name $DYNAMODB_BLOGS_TABLE `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region $AWS_REGION `
  --no-cli-pager 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "Blog posts table created" -ForegroundColor Green
} elseif ($createTableOutput -match 'ResourceInUseException' -or $createTableOutput -match 'already exists') {
  Write-Host "Blog posts table already exists" -ForegroundColor Yellow
} else {
  Write-Host "Failed to create blog posts table: $createTableOutput" -ForegroundColor Red
}
