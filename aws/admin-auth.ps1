# Admin Authentication Setup Script
# Creates DynamoDB table for auth codes and deploys admin auth Lambda

Write-Host "=== Admin Authentication Setup ===" -ForegroundColor Cyan
Write-Host ""

# Load configuration
$configPath = "$PSScriptRoot\config.env"
if (-not (Test-Path $configPath)) {
    Write-Host "Error: config.env not found. Please run setup-env.ps1 first" -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content $configPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$AWS_REGION = $env:AWS_REGION
$DYNAMODB_AUTH_TABLE = "PortfolioAuthCodes"

Write-Host "Region: $AWS_REGION" -ForegroundColor Yellow
Write-Host "Auth Table: $DYNAMODB_AUTH_TABLE" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create DynamoDB table for auth codes
Write-Host "Step 1: Creating DynamoDB table for auth codes..." -ForegroundColor Green

$tableExists = aws dynamodb describe-table --table-name $DYNAMODB_AUTH_TABLE --region $AWS_REGION 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Table $DYNAMODB_AUTH_TABLE already exists" -ForegroundColor Yellow
} else {
    Write-Host "Creating table $DYNAMODB_AUTH_TABLE..." -ForegroundColor Yellow
    
    aws dynamodb create-table --table-name $DYNAMODB_AUTH_TABLE --attribute-definitions AttributeName=code,AttributeType=S --key-schema AttributeName=code,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $AWS_REGION --tags Key=Project,Value=Portfolio Key=Purpose,Value=AdminAuth

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Waiting for table to be active..." -ForegroundColor Yellow
        aws dynamodb wait table-exists --table-name $DYNAMODB_AUTH_TABLE --region $AWS_REGION
        
        Write-Host "Table created successfully" -ForegroundColor Green
        
        # Enable TTL for automatic cleanup of expired codes
        Write-Host "Enabling TTL on expiresAt attribute..." -ForegroundColor Yellow
        aws dynamodb update-time-to-live --table-name $DYNAMODB_AUTH_TABLE --time-to-live-specification "Enabled=true, AttributeName=expiresAt" --region $AWS_REGION
    } else {
        Write-Host "Failed to create table" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 2: Generate session secret if not exists
Write-Host "Step 2: Checking session secret..." -ForegroundColor Green

if (-not $env:SESSION_SECRET) {
    Write-Host "Generating session secret..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $SESSION_SECRET = [Convert]::ToBase64String($bytes)
    
    # Add to config.env
    Add-Content -Path $configPath -Value "SESSION_SECRET=$SESSION_SECRET"
    [Environment]::SetEnvironmentVariable("SESSION_SECRET", $SESSION_SECRET, "Process")
    
    Write-Host "Session secret generated and saved to config.env" -ForegroundColor Green
} else {
    Write-Host "Session secret already exists" -ForegroundColor Green
}

Write-Host ""

# Step 3: Create/Update Lambda function for admin auth
Write-Host "Step 3: Deploying admin auth Lambda function..." -ForegroundColor Green

# Get Lambda role ARN
$LAMBDA_ROLE_ARN = aws iam get-role --role-name portfolio-lambda-role --query 'Role.Arn' --output text --region $AWS_REGION 2>$null

if (-not $LAMBDA_ROLE_ARN) {
    Write-Host "Error: Lambda role not found. Please run iam.ps1 first" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$lambdaDir = "$PSScriptRoot\lambda"
$tempDir = "$PSScriptRoot\temp"

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Copy-Item "$lambdaDir\adminAuth.js" "$tempDir\"
Copy-Item "$lambdaDir\package.json" "$tempDir\"

# Install dependencies
Push-Location $tempDir
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --production --silent
Pop-Location

# Create ZIP
Write-Host "Creating ZIP file..." -ForegroundColor Yellow
$zipPath = "$PSScriptRoot\admin-auth-lambda.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

# Check if Lambda function exists
$functionExists = aws lambda get-function --function-name PortfolioAdminAuth --region $AWS_REGION 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Yellow
    
    aws lambda update-function-code --function-name PortfolioAdminAuth --zip-file "fileb://$zipPath" --region $AWS_REGION | Out-Null
    
    # Update environment variables
    $envVars = @{
        Variables = @{
            DYNAMODB_AUTH_TABLE = $DYNAMODB_AUTH_TABLE
            SES_FROM_EMAIL = $env:SES_FROM_EMAIL
            SES_FROM_EMAIL = $env:SES_FROM_EMAIL
            SESSION_SECRET = $env:SESSION_SECRET
            NODE_ENV = "production"
        }
    } | ConvertTo-Json -Compress
    
    aws lambda update-function-configuration --function-name PortfolioAdminAuth --environment $envVars --region $AWS_REGION | Out-Null
    
    Write-Host "Lambda function updated" -ForegroundColor Green
} else {
    Write-Host "Creating new Lambda function..." -ForegroundColor Yellow
    
    aws lambda create-function --function-name PortfolioAdminAuth --runtime nodejs20.x --role $LAMBDA_ROLE_ARN --handler adminAuth.handler --zip-file "fileb://$zipPath" --timeout 30 --memory-size 256 --environment "Variables={DYNAMODB_AUTH_TABLE=$DYNAMODB_AUTH_TABLE,SES_FROM_EMAIL=$($env:SES_FROM_EMAIL),SES_FROM_EMAIL=$($env:SES_FROM_EMAIL),SESSION_SECRET=$($env:SESSION_SECRET),NODE_ENV=production}" --region $AWS_REGION --tags Project=Portfolio,Purpose=AdminAuth | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Lambda function created" -ForegroundColor Green
    } else {
        Write-Host "Failed to create Lambda function" -ForegroundColor Red
        exit 1
    }
}

# Clean up ZIP file
Remove-Item $zipPath -Force

Write-Host ""

# Step 4: Add Lambda permissions for API Gateway
Write-Host "Step 4: Setting up API Gateway integration..." -ForegroundColor Green

$API_ID = aws apigateway get-rest-apis --query "items[?name=='Portfolio API'].id" --output text --region $AWS_REGION

if ($API_ID) {
    Write-Host "API Gateway ID: $API_ID" -ForegroundColor Yellow
    
    # Grant API Gateway permission to invoke Lambda
    $statementId = "apigateway-admin-auth-invoke"
    
    aws lambda add-permission --function-name PortfolioAdminAuth --statement-id $statementId --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${AWS_REGION}:*:${API_ID}/*" --region $AWS_REGION 2>$null
    
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 254) {
        Write-Host "API Gateway permissions configured" -ForegroundColor Green
    }
} else {
    Write-Host "Warning: API Gateway not found. Run apigateway.ps1 to create API routes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Admin Authentication Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update API Gateway to add admin auth routes (run apigateway.ps1)" -ForegroundColor White
Write-Host "2. Redeploy blogs Lambda with updated auth code (run lambda-deploy.ps1)" -ForegroundColor White
Write-Host "3. Test admin authentication flow" -ForegroundColor White
Write-Host ""
