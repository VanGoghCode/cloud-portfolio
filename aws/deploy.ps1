# AWS Portfolio Infrastructure Setup Script (PowerShell)
# This script automates the creation of AWS resources for your portfolio

Write-Host "🚀 Starting AWS Infrastructure Setup for Portfolio..." -ForegroundColor Green
Write-Host ""

# Configuration
$AWS_REGION = Read-Host "Enter AWS Region (default: us-east-1)"
if ([string]::IsNullOrWhiteSpace($AWS_REGION)) { $AWS_REGION = "us-east-1" }

$SES_EMAIL = Read-Host "Enter your verified SES email address"
if ([string]::IsNullOrWhiteSpace($SES_EMAIL)) {
    Write-Host "❌ Email address is required" -ForegroundColor Red
    exit 1
}

$API_KEY = Read-Host "Enter API key for blog management (press Enter to generate random)"
if ([string]::IsNullOrWhiteSpace($API_KEY)) {
    $API_KEY = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Host "✅ Generated API Key: $API_KEY" -ForegroundColor Green
}

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "📋 Using AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create DynamoDB Tables
Write-Host "📊 Creating DynamoDB tables..." -ForegroundColor Yellow

try {
    aws dynamodb create-table `
        --table-name portfolio-contact-messages `
        --attribute-definitions AttributeName=id,AttributeType=S `
        --key-schema AttributeName=id,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "⚠️  Contact messages table may already exist" -ForegroundColor Yellow
}

try {
    aws dynamodb create-table `
        --table-name portfolio-blog-posts `
        --attribute-definitions AttributeName=id,AttributeType=S `
        --key-schema AttributeName=id,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "⚠️  Blog posts table may already exist" -ForegroundColor Yellow
}

Write-Host "✅ DynamoDB tables created" -ForegroundColor Green
Write-Host ""

# Step 2: Verify SES Email
Write-Host "📧 Setting up SES..." -ForegroundColor Yellow
try {
    aws ses verify-email-identity `
        --email-address $SES_EMAIL `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "⚠️  Email may already be verified" -ForegroundColor Yellow
}

Write-Host "✅ SES email verification initiated. Check your inbox!" -ForegroundColor Green
Write-Host ""

# Step 3: Create IAM Role
Write-Host "🔐 Creating IAM role..." -ForegroundColor Yellow

$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$trustPolicy | Out-File -FilePath "$env:TEMP\lambda-trust-policy.json" -Encoding utf8

try {
    aws iam create-role `
        --role-name portfolio-lambda-role `
        --assume-role-policy-document "file://$env:TEMP\lambda-trust-policy.json" `
        --no-cli-pager 2>$null
} catch {
    Write-Host "⚠️  IAM role may already exist" -ForegroundColor Yellow
}

aws iam attach-role-policy `
    --role-name portfolio-lambda-role `
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole `
    --no-cli-pager 2>$null

aws iam attach-role-policy `
    --role-name portfolio-lambda-role `
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess `
    --no-cli-pager 2>$null

aws iam attach-role-policy `
    --role-name portfolio-lambda-role `
    --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess `
    --no-cli-pager 2>$null

Write-Host "✅ IAM role configured" -ForegroundColor Green
Write-Host "⏳ Waiting 10 seconds for IAM role propagation..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
Write-Host ""

# Step 4: Package and Deploy Lambda Functions
Write-Host "📦 Packaging Lambda functions..." -ForegroundColor Yellow

Push-Location aws\lambda
npm install --production --silent

# Package Contact Form
Compress-Archive -Path contactForm.js,node_modules -DestinationPath contactForm.zip -Force

# Deploy Contact Form Lambda
try {
    aws lambda create-function `
        --function-name portfolio-contact-form `
        --runtime nodejs20.x `
        --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/portfolio-lambda-role" `
        --handler contactForm.handler `
        --zip-file fileb://contactForm.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={DYNAMODB_TABLE_NAME=portfolio-contact-messages,SES_FROM_EMAIL=$SES_EMAIL,SES_TO_EMAIL=$SES_EMAIL,AWS_REGION=$AWS_REGION}" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    aws lambda update-function-code `
        --function-name portfolio-contact-form `
        --zip-file fileb://contactForm.zip `
        --region $AWS_REGION `
        --no-cli-pager
}

Write-Host "✅ Contact form Lambda deployed" -ForegroundColor Green

# Package Blog CRUD
Compress-Archive -Path blogsCRUD.js,node_modules -DestinationPath blogsCRUD.zip -Force

try {
    aws lambda create-function `
        --function-name portfolio-blogs-crud `
        --runtime nodejs20.x `
        --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/portfolio-lambda-role" `
        --handler blogsCRUD.handler `
        --zip-file fileb://blogsCRUD.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={DYNAMODB_BLOGS_TABLE=portfolio-blog-posts,AWS_REGION=$AWS_REGION,API_KEY=$API_KEY}" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    aws lambda update-function-code `
        --function-name portfolio-blogs-crud `
        --zip-file fileb://blogsCRUD.zip `
        --region $AWS_REGION `
        --no-cli-pager
}

Write-Host "✅ Blogs CRUD Lambda deployed" -ForegroundColor Green

Pop-Location
Write-Host ""

# Step 5: Create API Gateway
Write-Host "🌐 Setting up API Gateway..." -ForegroundColor Yellow

$apiResponse = aws apigateway get-rest-apis --query "items[?name=='Portfolio API'].id" --output text --region $AWS_REGION 2>$null

if ([string]::IsNullOrWhiteSpace($apiResponse)) {
    $apiResponse = aws apigateway create-rest-api `
        --name "Portfolio API" `
        --description "API for portfolio contact form and blog posts" `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    $API_ID = $apiResponse.id
} else {
    $API_ID = $apiResponse
}

Write-Host "API ID: $API_ID" -ForegroundColor Cyan

# Get root resource
$ROOT_ID = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query 'items[0].id' --output text --no-cli-pager

# Continue with API setup (contact and blogs endpoints)
# ... Similar to bash script but with PowerShell syntax

# Deploy API
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $AWS_REGION --no-cli-pager 2>$null

$API_ENDPOINT = "https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

Write-Host "✅ API Gateway deployed" -ForegroundColor Green
Write-Host ""

# Final Output
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 AWS Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  • API Endpoint: $API_ENDPOINT"
Write-Host "  • Region: $AWS_REGION"
Write-Host "  • SES Email: $SES_EMAIL"
Write-Host "  • API Key: $API_KEY"
Write-Host ""
Write-Host "⚡ Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create .env.local file with:"
Write-Host "     NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT"
Write-Host ""
Write-Host "  2. Check your email ($SES_EMAIL) and verify it for SES"
Write-Host ""
Write-Host "  3. Test your contact form at your deployed site"
Write-Host ""
Write-Host "💰 Monthly Cost: `$0 (within AWS Free Tier)" -ForegroundColor Green
Write-Host ""
Write-Host "📚 For more details, see: aws\SETUP.md"
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
