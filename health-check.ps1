# AWS Portfolio Backend - Health Check Script

Write-Host "🏥 AWS Portfolio Backend Health Check" -ForegroundColor Green -BackgroundColor Black
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# Check 1: AWS CLI
Write-Host "Checking AWS CLI..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version 2>&1
    Write-Host "  ✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
    $success += "AWS CLI"
} catch {
    Write-Host "  ❌ AWS CLI not found" -ForegroundColor Red
    $errors += "AWS CLI not installed"
}

# Check 2: AWS Credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Cyan
try {
    $accountId = aws sts get-caller-identity --query Account --output text 2>$null
    if ($accountId) {
        Write-Host "  ✅ AWS credentials configured (Account: $accountId)" -ForegroundColor Green
        $success += "AWS Credentials"
    } else {
        Write-Host "  ❌ AWS credentials not configured" -ForegroundColor Red
        $errors += "AWS credentials not configured"
    }
} catch {
    Write-Host "  ❌ Cannot verify AWS credentials" -ForegroundColor Red
    $errors += "Cannot verify AWS credentials"
}

# Check 3: DynamoDB Tables
Write-Host "Checking DynamoDB tables..." -ForegroundColor Cyan
$tables = @("portfolio-contact-messages", "portfolio-blog-posts")
foreach ($table in $tables) {
    try {
        $tableInfo = aws dynamodb describe-table --table-name $table --query 'Table.TableStatus' --output text 2>$null
        if ($tableInfo -eq "ACTIVE") {
            Write-Host "  ✅ Table '$table' exists and is active" -ForegroundColor Green
            $success += "DynamoDB: $table"
        } else {
            Write-Host "  ⚠️  Table '$table' exists but status: $tableInfo" -ForegroundColor Yellow
            $warnings += "DynamoDB table '$table' not active"
        }
    } catch {
        Write-Host "  ❌ Table '$table' not found" -ForegroundColor Red
        $errors += "DynamoDB table '$table' not found"
    }
}

# Check 4: Lambda Functions
Write-Host "Checking Lambda functions..." -ForegroundColor Cyan
$functions = @("portfolio-contact-form", "portfolio-blogs-crud")
foreach ($function in $functions) {
    try {
        $funcInfo = aws lambda get-function --function-name $function --query 'Configuration.State' --output text 2>$null
        if ($funcInfo -eq "Active") {
            Write-Host "  ✅ Function '$function' exists and is active" -ForegroundColor Green
            $success += "Lambda: $function"
        } else {
            Write-Host "  ⚠️  Function '$function' exists but status: $funcInfo" -ForegroundColor Yellow
            $warnings += "Lambda function '$function' not active"
        }
    } catch {
        Write-Host "  ❌ Function '$function' not found" -ForegroundColor Red
        $errors += "Lambda function '$function' not found"
    }
}

# Check 5: API Gateway
Write-Host "Checking API Gateway..." -ForegroundColor Cyan
try {
    $apiId = aws apigateway get-rest-apis --query "items[?name=='Portfolio API'].id" --output text 2>$null
    if ($apiId) {
        Write-Host "  ✅ API Gateway 'Portfolio API' found (ID: $apiId)" -ForegroundColor Green
        $apiEndpoint = "https://$apiId.execute-api.us-east-1.amazonaws.com/prod"
        Write-Host "     Endpoint: $apiEndpoint" -ForegroundColor Gray
        $success += "API Gateway"
    } else {
        Write-Host "  ❌ API Gateway 'Portfolio API' not found" -ForegroundColor Red
        $errors += "API Gateway not found"
    }
} catch {
    Write-Host "  ❌ Cannot check API Gateway" -ForegroundColor Red
    $errors += "Cannot check API Gateway"
}

# Check 6: SES Email
Write-Host "Checking SES email verification..." -ForegroundColor Cyan
try {
    $verifiedEmails = aws ses list-verified-email-addresses --query 'VerifiedEmailAddresses' --output json 2>$null | ConvertFrom-Json
    if ($verifiedEmails.Count -gt 0) {
        Write-Host "  ✅ SES has $($verifiedEmails.Count) verified email(s):" -ForegroundColor Green
        foreach ($email in $verifiedEmails) {
            Write-Host "     - $email" -ForegroundColor Gray
        }
        $success += "SES Email"
    } else {
        Write-Host "  ⚠️  No verified emails found in SES" -ForegroundColor Yellow
        $warnings += "No verified SES emails"
    }
} catch {
    Write-Host "  ❌ Cannot check SES" -ForegroundColor Red
    $errors += "Cannot check SES"
}

# Check 7: Environment File
Write-Host "Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_API_ENDPOINT") {
        Write-Host "  ✅ .env.local exists with API endpoint" -ForegroundColor Green
        $success += ".env.local"
    } else {
        Write-Host "  ⚠️  .env.local exists but missing API endpoint" -ForegroundColor Yellow
        $warnings += ".env.local missing API endpoint"
    }
} else {
    Write-Host "  ⚠️  .env.local not found" -ForegroundColor Yellow
    $warnings += ".env.local not found"
}

# Check 8: Node Modules (Lambda)
Write-Host "Checking Lambda dependencies..." -ForegroundColor Cyan
if (Test-Path "aws\lambda\node_modules") {
    Write-Host "  ✅ Lambda node_modules exist" -ForegroundColor Green
    $success += "Lambda dependencies"
} else {
    Write-Host "  ⚠️  Lambda node_modules not found (run: cd aws\lambda; npm install)" -ForegroundColor Yellow
    $warnings += "Lambda dependencies not installed"
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                      HEALTH CHECK SUMMARY                  " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "✅ Successful Checks ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "   • $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "   • $item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Errors ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   • $item" -ForegroundColor Gray
    }
    Write-Host ""
}

# Overall Status
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 ALL CHECKS PASSED! Your backend is ready!" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Test contact form at http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Deploy to Amplify" -ForegroundColor White
} elseif ($errors.Count -eq 0) {
    Write-Host "✅ Backend is functional but has minor issues" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Cyan
    Write-Host "  • Review warnings above" -ForegroundColor White
    Write-Host "  • Run: .\aws\deploy.ps1 to fix missing components" -ForegroundColor White
} else {
    Write-Host "❌ Backend setup incomplete" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "Required actions:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\aws\deploy.ps1 to set up AWS infrastructure" -ForegroundColor White
    Write-Host "  2. Configure AWS credentials if needed: aws configure" -ForegroundColor White
    Write-Host "  3. Re-run this health check" -ForegroundColor White
}
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test API Endpoint (if available)
if ($apiEndpoint) {
    Write-Host "🧪 Want to test the API endpoint? (y/N)" -ForegroundColor Cyan
    $testApi = Read-Host
    if ($testApi -eq "y") {
        Write-Host ""
        Write-Host "Testing GET /blogs..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "$apiEndpoint/blogs" -Method Get -TimeoutSec 10
            Write-Host "  ✅ API is responding!" -ForegroundColor Green
            Write-Host "  Found $($response.count) blog posts" -ForegroundColor Gray
        } catch {
            Write-Host "  ❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
