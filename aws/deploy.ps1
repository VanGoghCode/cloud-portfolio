
Write-Host "Starting AWS Infrastructure Setup for Portfolio..." -ForegroundColor Green
Write-Host ""

# Load configuration from config.env if it exists
$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = "us-east-1"
$SES_EMAIL = ""
$DYNAMODB_CONTACT_TABLE = "portfolio-contact-messages"
$DYNAMODB_BLOGS_TABLE = "portfolio-blog-posts"
$LAMBDA_CONTACT_FUNCTION = "portfolio-contact-form"
$LAMBDA_BLOGS_FUNCTION = "portfolio-blogs-crud"
$IAM_ROLE_NAME = "portfolio-lambda-role"

if (Test-Path $configFile) {
    Write-Host "Loading configuration from config.env..." -ForegroundColor Cyan
    Get-Content $configFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Variable -Name $key -Value $value -Scope Script
        }
    }
    Write-Host "Configuration loaded" -ForegroundColor Green
    Write-Host ""
}

# Prompt for missing required values
if ([string]::IsNullOrWhiteSpace($AWS_REGION)) {
    $AWS_REGION = Read-Host "Enter AWS Region (default: us-east-1)"
    if ([string]::IsNullOrWhiteSpace($AWS_REGION)) { $AWS_REGION = "us-east-1" }
}

if ([string]::IsNullOrWhiteSpace($SES_EMAIL)) {
    $SES_EMAIL = Read-Host "Enter your verified SES email address"
    if ([string]::IsNullOrWhiteSpace($SES_EMAIL)) {
        Write-Host "Email address is required" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Using configuration:" -ForegroundColor Cyan
Write-Host "  Region: $AWS_REGION" -ForegroundColor Gray
Write-Host "  Email: $SES_EMAIL" -ForegroundColor Gray
Write-Host ""

$API_KEY = Read-Host "Enter API key for blog management (press Enter to generate random)"
if ([string]::IsNullOrWhiteSpace($API_KEY)) {
    $API_KEY = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Host "Generated API Key: $API_KEY" -ForegroundColor Green
}

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "Using AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create DynamoDB Tables
Write-Host "Creating DynamoDB tables..." -ForegroundColor Yellow

try {
    aws dynamodb create-table `
        --table-name $DYNAMODB_CONTACT_TABLE `
        --attribute-definitions AttributeName=id,AttributeType=S `
        --key-schema AttributeName=id,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "Contact messages table may already exist" -ForegroundColor Yellow
}

try {
    aws dynamodb create-table `
        --table-name $DYNAMODB_BLOGS_TABLE `
        --attribute-definitions AttributeName=id,AttributeType=S `
        --key-schema AttributeName=id,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "Blog posts table may already exist" -ForegroundColor Yellow
}

Write-Host "DynamoDB tables created" -ForegroundColor Green
Write-Host ""

# Step 2: Verify SES Email
Write-Host "Setting up SES..." -ForegroundColor Yellow
try {
    aws ses verify-email-identity `
        --email-address $SES_EMAIL `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    Write-Host "Email may already be verified" -ForegroundColor Yellow
}

Write-Host "SES email verification initiated. Check your inbox!" -ForegroundColor Green
Write-Host ""

# Step 3: Create IAM Role
Write-Host "Creating IAM role..." -ForegroundColor Yellow

$trustPolicyJson = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
}

$trustPolicyFile = Join-Path $env:TEMP "lambda-trust-policy.json"
$trustPolicyJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $trustPolicyFile -Encoding utf8

try {
    aws iam create-role `
        --role-name $IAM_ROLE_NAME `
        --assume-role-policy-document "file://$trustPolicyFile" `
        --no-cli-pager 2>$null
} catch {
    Write-Host "IAM role may already exist" -ForegroundColor Yellow
}

aws iam attach-role-policy `
    --role-name $IAM_ROLE_NAME `
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole `
    --no-cli-pager 2>$null

aws iam attach-role-policy `
    --role-name $IAM_ROLE_NAME `
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess `
    --no-cli-pager 2>$null

aws iam attach-role-policy `
    --role-name $IAM_ROLE_NAME `
    --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess `
    --no-cli-pager 2>$null

Write-Host "IAM role configured" -ForegroundColor Green
Write-Host "Waiting 10 seconds for IAM role propagation..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
Write-Host ""

# Step 4: Package and Deploy Lambda Functions
Write-Host "Packaging Lambda functions..." -ForegroundColor Yellow

Push-Location aws\lambda
npm install --production --silent

# Package Contact Form
Compress-Archive -Path contactForm.js,node_modules -DestinationPath contactForm.zip -Force

# Deploy Contact Form Lambda
try {
    aws lambda create-function `
        --function-name $LAMBDA_CONTACT_FUNCTION `
        --runtime nodejs20.x `
        --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$IAM_ROLE_NAME" `
        --handler contactForm.handler `
        --zip-file fileb://contactForm.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={DYNAMODB_TABLE_NAME=$DYNAMODB_CONTACT_TABLE,SES_FROM_EMAIL=$SES_EMAIL,SES_TO_EMAIL=$SES_EMAIL,AWS_REGION=$AWS_REGION}" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    aws lambda update-function-code `
        --function-name $LAMBDA_CONTACT_FUNCTION `
        --zip-file fileb://contactForm.zip `
        --region $AWS_REGION `
        --no-cli-pager
}

Write-Host "Contact form Lambda deployed" -ForegroundColor Green

# Package Blog CRUD
Compress-Archive -Path blogsCRUD.js,node_modules -DestinationPath blogsCRUD.zip -Force

try {
    aws lambda create-function `
        --function-name $LAMBDA_BLOGS_FUNCTION `
        --runtime nodejs20.x `
        --role "arn:aws:iam::$($AWS_ACCOUNT_ID):role/$IAM_ROLE_NAME" `
        --handler blogsCRUD.handler `
        --zip-file fileb://blogsCRUD.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={DYNAMODB_BLOGS_TABLE=$DYNAMODB_BLOGS_TABLE,AWS_REGION=$AWS_REGION,API_KEY=$API_KEY}" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {
    aws lambda update-function-code `
        --function-name $LAMBDA_BLOGS_FUNCTION `
        --zip-file fileb://blogsCRUD.zip `
        --region $AWS_REGION `
        --no-cli-pager
}

Write-Host "Blogs CRUD Lambda deployed" -ForegroundColor Green

Pop-Location
Write-Host ""

# Step 5: Create API Gateway
Write-Host "Setting up API Gateway..." -ForegroundColor Yellow

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

# Create /contact resource
$contactResourceResponse = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query "items[?path=='/contact'].id" --output text --no-cli-pager 2>$null

if ([string]::IsNullOrWhiteSpace($contactResourceResponse)) {
    $contactResourceJson = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $ROOT_ID `
        --path-part "contact" `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    $CONTACT_RESOURCE_ID = $contactResourceJson.id
} else {
    $CONTACT_RESOURCE_ID = $contactResourceResponse
}

# Create POST method for /contact
try {
    aws apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method POST `
        --authorization-type NONE `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Integrate /contact with Lambda
try {
    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method POST `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri "arn:aws:apigateway:$($AWS_REGION):lambda:path/2015-03-31/functions/arn:aws:lambda:$($AWS_REGION):$($AWS_ACCOUNT_ID):function:$LAMBDA_CONTACT_FUNCTION/invocations" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Add Lambda permission for API Gateway
try {
    aws lambda add-permission `
        --function-name $LAMBDA_CONTACT_FUNCTION `
        --statement-id apigateway-contact `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:$($AWS_REGION):$($AWS_ACCOUNT_ID):$API_ID/*/*/contact" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Enable CORS for /contact
try {
    aws apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method OPTIONS `
        --authorization-type NONE `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates '{"application/json":"{\"statusCode\":200}"}' `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-integration-response `
        --rest-api-id $API_ID `
        --resource-id $CONTACT_RESOURCE_ID `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Create /blogs resource
$blogsResourceResponse = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query "items[?path=='/blogs'].id" --output text --no-cli-pager 2>$null

if ([string]::IsNullOrWhiteSpace($blogsResourceResponse)) {
    $blogsResourceJson = aws apigateway create-resource `
        --rest-api-id $API_ID `
        --parent-id $ROOT_ID `
        --path-part "blogs" `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    $BLOGS_RESOURCE_ID = $blogsResourceJson.id
} else {
    $BLOGS_RESOURCE_ID = $blogsResourceResponse
}

# Create GET method for /blogs
try {
    aws apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method GET `
        --authorization-type NONE `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Integrate /blogs with Lambda
try {
    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method GET `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri "arn:aws:apigateway:$($AWS_REGION):lambda:path/2015-03-31/functions/arn:aws:lambda:$($AWS_REGION):$($AWS_ACCOUNT_ID):function:$LAMBDA_BLOGS_FUNCTION/invocations" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Add Lambda permission for API Gateway (blogs)
try {
    aws lambda add-permission `
        --function-name $LAMBDA_BLOGS_FUNCTION `
        --statement-id apigateway-blogs `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:$($AWS_REGION):$($AWS_ACCOUNT_ID):$API_ID/*/*/blogs" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Enable CORS for /blogs
try {
    aws apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method OPTIONS `
        --authorization-type NONE `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates '{"application/json":"{\"statusCode\":200}"}' `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

try {
    aws apigateway put-integration-response `
        --rest-api-id $API_ID `
        --resource-id $BLOGS_RESOURCE_ID `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' `
        --region $AWS_REGION `
        --no-cli-pager 2>$null
} catch {}

# Deploy API
Write-Host "Deploying API to production stage..." -ForegroundColor Cyan
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $AWS_REGION --no-cli-pager 2>$null

$API_ENDPOINT = "https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

Write-Host "API Gateway deployed" -ForegroundColor Green
Write-Host ""

# Final Output
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "AWS Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - API Endpoint: $API_ENDPOINT"
Write-Host "  - Region: $AWS_REGION"
Write-Host "  - SES Email: $SES_EMAIL"
Write-Host "  - API Key: $API_KEY"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create .env.local file with:"
Write-Host "     NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT"
Write-Host ""
Write-Host "  2. Check your email ($SES_EMAIL) and verify it for SES"
Write-Host ""
Write-Host "  3. Test your contact form at your deployed site"
Write-Host ""
Write-Host "Monthly Cost: FREE (within AWS Free Tier)" -ForegroundColor Green
Write-Host ""
Write-Host "For more details, see: aws\SETUP.md"
Write-Host "=============================================================" -ForegroundColor Cyan

# Save to .env.local
$envFile = Join-Path $PSScriptRoot "..\.env.local"
"NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT" | Out-File -FilePath $envFile -Encoding utf8
"BLOG_API_KEY=$API_KEY" | Out-File -FilePath $envFile -Append -Encoding utf8
Write-Host "Configuration saved to .env.local" -ForegroundColor Green