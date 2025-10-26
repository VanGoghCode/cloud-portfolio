#!/bin/bash

# AWS Portfolio Infrastructure Setup Script
# This script automates the creation of AWS resources for your portfolio

set -e  # Exit on error

echo "🚀 Starting AWS Infrastructure Setup for Portfolio..."
echo ""

# Configuration
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Enter your verified SES email address: " SES_EMAIL
if [ -z "$SES_EMAIL" ]; then
    echo "❌ Email address is required"
    exit 1
fi

read -p "Enter API key for blog management (press Enter to generate random): " API_KEY
if [ -z "$API_KEY" ]; then
    API_KEY=$(openssl rand -base64 32)
    echo "✅ Generated API Key: $API_KEY"
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Using AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create DynamoDB Tables
echo "📊 Creating DynamoDB tables..."

aws dynamodb create-table \
    --table-name portfolio-contact-messages \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "⚠️  Contact messages table may already exist"

aws dynamodb create-table \
    --table-name portfolio-blog-posts \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "⚠️  Blog posts table may already exist"

echo "✅ DynamoDB tables created"
echo ""

# Step 2: Verify SES Email
echo "📧 Setting up SES..."
aws ses verify-email-identity \
    --email-address $SES_EMAIL \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "⚠️  Email may already be verified"

echo "✅ SES email verification initiated. Check your inbox for confirmation!"
echo ""

# Step 3: Create IAM Role for Lambda
echo "🔐 Creating IAM role..."

# Create trust policy
cat > /tmp/lambda-trust-policy.json <<EOF
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
EOF

aws iam create-role \
    --role-name portfolio-lambda-role \
    --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
    --no-cli-pager 2>/dev/null || echo "⚠️  IAM role may already exist"

# Attach policies
aws iam attach-role-policy \
    --role-name portfolio-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --no-cli-pager 2>/dev/null || true

aws iam attach-role-policy \
    --role-name portfolio-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
    --no-cli-pager 2>/dev/null || true

aws iam attach-role-policy \
    --role-name portfolio-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess \
    --no-cli-pager 2>/dev/null || true

echo "✅ IAM role configured"
echo "⏳ Waiting 10 seconds for IAM role propagation..."
sleep 10
echo ""

# Step 4: Package and Deploy Lambda Functions
echo "📦 Packaging Lambda functions..."

cd aws/lambda
npm install --production --silent

# Package Contact Form
zip -r contactForm.zip contactForm.js node_modules/ > /dev/null

# Create or update Lambda function
aws lambda create-function \
    --function-name portfolio-contact-form \
    --runtime nodejs20.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/portfolio-lambda-role \
    --handler contactForm.handler \
    --zip-file fileb://contactForm.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment "Variables={DYNAMODB_TABLE_NAME=portfolio-contact-messages,SES_FROM_EMAIL=$SES_EMAIL,SES_TO_EMAIL=$SES_EMAIL,AWS_REGION=$AWS_REGION}" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || \
aws lambda update-function-code \
    --function-name portfolio-contact-form \
    --zip-file fileb://contactForm.zip \
    --region $AWS_REGION \
    --no-cli-pager

echo "✅ Contact form Lambda deployed"

# Package Blog CRUD
zip -r blogsCRUD.zip blogsCRUD.js node_modules/ > /dev/null

aws lambda create-function \
    --function-name portfolio-blogs-crud \
    --runtime nodejs20.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/portfolio-lambda-role \
    --handler blogsCRUD.handler \
    --zip-file fileb://blogsCRUD.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment "Variables={DYNAMODB_BLOGS_TABLE=portfolio-blog-posts,AWS_REGION=$AWS_REGION,API_KEY=$API_KEY}" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || \
aws lambda update-function-code \
    --function-name portfolio-blogs-crud \
    --zip-file fileb://blogsCRUD.zip \
    --region $AWS_REGION \
    --no-cli-pager

echo "✅ Blogs CRUD Lambda deployed"

cd ../..
echo ""

# Step 5: Create API Gateway
echo "🌐 Setting up API Gateway..."

# Create REST API
API_RESPONSE=$(aws apigateway create-rest-api \
    --name "Portfolio API" \
    --description "API for portfolio contact form and blog posts" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || \
aws apigateway get-rest-apis \
    --query "items[?name=='Portfolio API'].id" \
    --output text \
    --region $AWS_REGION)

if [[ $API_RESPONSE == *"id"* ]]; then
    API_ID=$(echo $API_RESPONSE | jq -r '.id')
else
    API_ID=$API_RESPONSE
fi

echo "API ID: $API_ID"

# Get root resource
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $AWS_REGION \
    --query 'items[0].id' \
    --output text \
    --no-cli-pager)

# Setup /contact endpoint
echo "Setting up /contact endpoint..."
CONTACT_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part contact \
    --region $AWS_REGION \
    --query 'id' \
    --output text \
    --no-cli-pager 2>/dev/null || \
aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $AWS_REGION \
    --query "items[?pathPart=='contact'].id" \
    --output text)

# Setup POST method for contact
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $CONTACT_RESOURCE \
    --http-method POST \
    --authorization-type NONE \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CONTACT_RESOURCE \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:portfolio-contact-form/invocations" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

# Grant permission
aws lambda add-permission \
    --function-name portfolio-contact-form \
    --statement-id apigateway-contact \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

echo "✅ Contact endpoint configured"

# Setup /blogs endpoint
echo "Setting up /blogs endpoint..."
BLOGS_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part blogs \
    --region $AWS_REGION \
    --query 'id' \
    --output text \
    --no-cli-pager 2>/dev/null || \
aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $AWS_REGION \
    --query "items[?pathPart=='blogs'].id" \
    --output text)

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $BLOGS_RESOURCE \
    --http-method GET \
    --authorization-type NONE \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $BLOGS_RESOURCE \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:portfolio-blogs-crud/invocations" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

aws lambda add-permission \
    --function-name portfolio-blogs-crud \
    --statement-id apigateway-blogs \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || true

echo "✅ Blogs endpoint configured"

# Deploy API
echo "Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $AWS_REGION \
    --no-cli-pager

API_ENDPOINT="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

echo "✅ API Gateway deployed"
echo ""

# Final Output
echo "════════════════════════════════════════════════════════════"
echo "🎉 AWS Infrastructure Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "  • API Endpoint: $API_ENDPOINT"
echo "  • Region: $AWS_REGION"
echo "  • SES Email: $SES_EMAIL"
echo "  • API Key: $API_KEY"
echo ""
echo "⚡ Next Steps:"
echo "  1. Create .env.local file with:"
echo "     NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT"
echo ""
echo "  2. Check your email ($SES_EMAIL) and verify it for SES"
echo ""
echo "  3. To add blog posts to DynamoDB, use the seed script:"
echo "     ./aws/seed-blogs.sh"
echo ""
echo "  4. Test your contact form at your deployed site"
echo ""
echo "💰 Monthly Cost: \$0 (within AWS Free Tier)"
echo ""
echo "📚 For more details, see: aws/SETUP.md"
echo "════════════════════════════════════════════════════════════"
