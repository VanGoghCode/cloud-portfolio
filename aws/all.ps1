param(
  [string]$Region,
  [switch]$SkipHealthCheck,
  [switch]$SkipEnvSetup
)

$regionArg = if ($Region) { "-Region $Region" } else { "" }

Write-Host "=== Running full AWS setup ===" -ForegroundColor Cyan

# Step 1: Set up DynamoDB tables first (no dependencies)
Write-Host "`n[1/7] Setting up DynamoDB..." -ForegroundColor Yellow
& "$PSScriptRoot\dynamodb.ps1" $regionArg

# Step 2: Configure SES for email (no dependencies)
Write-Host "`n[2/7] Configuring SES..." -ForegroundColor Yellow
& "$PSScriptRoot\ses.ps1" $regionArg

# Step 3: Create IAM roles (needed before Lambda deployment)
Write-Host "`n[3/7] Creating IAM roles..." -ForegroundColor Yellow
& "$PSScriptRoot\iam.ps1" $regionArg

# Step 4: Deploy Lambda functions (depends on IAM roles and DynamoDB)
Write-Host "`n[4/7] Deploying Lambda functions..." -ForegroundColor Yellow
& "$PSScriptRoot\lambda-deploy.ps1" $regionArg

# Step 5: Set up Admin Authentication (depends on Lambda, DynamoDB, and SES)
Write-Host "`n[5/7] Setting up Admin Authentication..." -ForegroundColor Yellow
& "$PSScriptRoot\admin-auth.ps1" $regionArg

# Step 6: Set up API Gateway (depends on Lambda functions)
Write-Host "`n[6/7] Configuring API Gateway..." -ForegroundColor Yellow
& "$PSScriptRoot\apigateway.ps1" $regionArg

# Capture API Gateway endpoint automatically
Write-Host "`nRetrieving API Gateway endpoint..." -ForegroundColor Cyan
$apiId = aws apigateway get-rest-apis --query "items[?name=='Portfolio API'].id" --output text 2>$null
$effectiveRegion = if ($Region) { $Region } else { "us-east-1" }
$apiEndpoint = if ($apiId) { "https://$apiId.execute-api.$effectiveRegion.amazonaws.com/prod" } else { $null }

if ($apiEndpoint) {
    Write-Host "API Endpoint: $apiEndpoint" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not retrieve API endpoint automatically" -ForegroundColor Yellow
}

# Step 7: Seed initial blog data (optional, depends on DynamoDB and Lambda)
Write-Host "`n[7/7] Seeding blog data..." -ForegroundColor Yellow
& "$PSScriptRoot\seed-blogs.ps1" $regionArg

Write-Host "`n=== AWS Infrastructure Setup Complete ===" -ForegroundColor Green

# Step 8: Run health check to verify all resources
if (-not $SkipHealthCheck) {
    Write-Host "`n[8/9] Running health check..." -ForegroundColor Yellow
    & "$PSScriptRoot\..\health-check.ps1"
} else {
    Write-Host "`nSkipping health check" -ForegroundColor Gray
}

# Step 9: Setup environment file for local development
if (-not $SkipEnvSetup) {
    Write-Host "`n[9/9] Setting up environment configuration..." -ForegroundColor Yellow
    
    if ($apiEndpoint) {
        # Auto-populate if we have the endpoint
        Write-Host "Auto-configuring .env.local with API endpoint..." -ForegroundColor Cyan
        Write-Host "You'll still need to provide BLOG_API_KEY" -ForegroundColor Gray
        
        # Pass the endpoint to setup-env.ps1 (requires modifying that script)
        $env:AUTO_API_ENDPOINT = $apiEndpoint
        & "$PSScriptRoot\..\setup-env.ps1"
        Remove-Item Env:\AUTO_API_ENDPOINT -ErrorAction SilentlyContinue
    } else {
        & "$PSScriptRoot\..\setup-env.ps1"
    }
} else {
    Write-Host "`nSkipping environment setup" -ForegroundColor Gray
    if ($apiEndpoint) {
        Write-Host "`nYour API endpoint is: $apiEndpoint" -ForegroundColor Cyan
        Write-Host "Add this to your .env.local manually if needed" -ForegroundColor Gray
    }
}

Write-Host "`n=== Complete Setup Finished ===" -ForegroundColor Green
Write-Host "`nYour AWS backend is ready! Run 'npm run dev' to start your Next.js app." -ForegroundColor Cyan