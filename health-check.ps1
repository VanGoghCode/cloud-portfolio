Write-Host "AWS Portfolio Backend Health Check" -ForegroundColor Green -BackgroundColor Black
Write-Host ""

$script:SuccessItems = @()
$script:WarningItems = @()
$script:ErrorItems = @()
$script:ApiEndpoint = $null

function Write-Status {
    param(
        [ValidateSet('Success', 'Warning', 'Error')]
        [string]$Level,
        [string]$Message,
        [string]$Summary = $Message
    )

    switch ($Level) {
        'Success' {
            Write-Host "  $Message" -ForegroundColor Green
            $script:SuccessItems += $Summary
        }
        'Warning' {
            Write-Host "  $Message" -ForegroundColor Yellow
            $script:WarningItems += $Summary
        }
        'Error' {
            Write-Host "  $Message" -ForegroundColor Red
            $script:ErrorItems += $Summary
        }
    }
}

function Invoke-Check {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "Checking $Name..." -ForegroundColor Cyan
    & $Action
}

Invoke-Check -Name "AWS CLI" -Action {
    try {
        $awsVersion = aws --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $awsVersion) {
            Write-Status -Level Success -Message "AWS CLI installed: $awsVersion" -Summary "AWS CLI"
        } else {
            Write-Status -Level Error -Message "AWS CLI not found" -Summary "AWS CLI not installed"
        }
    } catch {
        Write-Status -Level Error -Message "AWS CLI not found" -Summary "AWS CLI not installed"
    }
}

Invoke-Check -Name "AWS credentials" -Action {
    try {
        $accountId = aws sts get-caller-identity --query Account --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $accountId) {
            Write-Status -Level Success -Message "AWS credentials configured (Account: $accountId)" -Summary "AWS Credentials"
        } else {
            Write-Status -Level Error -Message "AWS credentials not configured" -Summary "AWS credentials not configured"
        }
    } catch {
        Write-Status -Level Error -Message "Cannot verify AWS credentials" -Summary "Cannot verify AWS credentials"
    }
}

Invoke-Check -Name "DynamoDB tables" -Action {
    $tables = @('portfolio-contact-messages', 'portfolio-blog-posts')
    foreach ($table in $tables) {
        try {
            $status = aws dynamodb describe-table --table-name $table --query 'Table.TableStatus' --output text 2>$null
            if ($LASTEXITCODE -eq 0 -and $status -eq 'ACTIVE') {
                Write-Status -Level Success -Message "Table '$table' exists and is active" -Summary "DynamoDB: $table"
            } elseif ($status) {
                Write-Status -Level Warning -Message "Table '$table' exists but status: $status" -Summary "DynamoDB table '$table' not active"
            } else {
                Write-Status -Level Error -Message "Table '$table' not found" -Summary "DynamoDB table '$table' not found"
            }
        } catch {
            Write-Status -Level Error -Message "Table '$table' not found" -Summary "DynamoDB table '$table' not found"
        }
    }
}

Invoke-Check -Name "Lambda functions" -Action {
    $functions = @('portfolio-contact-form', 'portfolio-blogs-crud')
    foreach ($function in $functions) {
        try {
            $state = aws lambda get-function --function-name $function --query 'Configuration.State' --output text 2>$null
            if ($LASTEXITCODE -eq 0 -and $state -eq 'Active') {
                Write-Status -Level Success -Message "Function '$function' exists and is active" -Summary "Lambda: $function"
            } elseif ($state) {
                Write-Status -Level Warning -Message "Function '$function' exists but status: $state" -Summary "Lambda function '$function' not active"
            } else {
                Write-Status -Level Error -Message "Function '$function' not found" -Summary "Lambda function '$function' not found"
            }
        } catch {
            Write-Status -Level Error -Message "Function '$function' not found" -Summary "Lambda function '$function' not found"
        }
    }
}

Invoke-Check -Name "API Gateway" -Action {
    try {
        $apiId = aws apigateway get-rest-apis --query "items[?name=='Portfolio API'].id" --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $apiId) {
            $script:ApiEndpoint = "https://$apiId.execute-api.us-east-1.amazonaws.com/prod"
            Write-Status -Level Success -Message "API Gateway 'Portfolio API' found (ID: $apiId)" -Summary "API Gateway"
            Write-Host "     Endpoint: $($script:ApiEndpoint)" -ForegroundColor Gray
        } else {
            Write-Status -Level Error -Message "API Gateway 'Portfolio API' not found" -Summary "API Gateway not found"
        }
    } catch {
        Write-Status -Level Error -Message "Cannot check API Gateway" -Summary "Cannot check API Gateway"
    }
}

Invoke-Check -Name "SES email verification" -Action {
    try {
        # SES v2: list email identities and check their verification status
        $emails = aws sesv2 list-email-identities --query "EmailIdentities[?IdentityType=='EMAIL_ADDRESS'].IdentityName" --output json 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw "SESv2 list-email-identities failed." }

        if (-not $emails -or $emails.Count -eq 0) {
            Write-Status -Level Warning -Message "No SES email identities found" -Summary "No SES identities"
            return
        }

        $verified = @()
        foreach ($e in $emails) {
            $status = aws sesv2 get-email-identity --email-identity $e --query "VerificationStatus" --output text 2>$null
            if ($LASTEXITCODE -ne 0) { continue }
            if ($status -eq 'SUCCESS') { $verified += $e }
        }

        if ($verified.Count -gt 0) {
            Write-Status -Level Success -Message "SES has $($verified.Count) verified email(s):" -Summary "SES Email"
            foreach ($email in $verified) { Write-Host "     - $email" -ForegroundColor Gray }
        } else {
            Write-Status -Level Warning -Message "No verified emails found in SES" -Summary "No verified SES emails"
        }
    } catch {
        Write-Status -Level Error -Message "Cannot check SES" -Summary "Cannot check SES"
    }
}

Invoke-Check -Name "Environment configuration" -Action {
    if (Test-Path '.env') {
        $envContent = Get-Content '.env' -Raw
        if ($envContent -match 'NEXT_PUBLIC_API_ENDPOINT') {
            Write-Status -Level Success -Message ".env exists with API endpoint" -Summary ".env"
        } else {
            Write-Status -Level Warning -Message ".env exists but missing API endpoint" -Summary ".env missing API endpoint"
        }
    } else {
        Write-Status -Level Warning -Message ".env not found" -Summary ".env not found"
    }
}

Invoke-Check -Name "Lambda dependencies" -Action {
    if (Test-Path 'aws\lambda\node_modules') {
        Write-Status -Level Success -Message "Lambda node_modules exist" -Summary "Lambda dependencies"
    } else {
        Write-Status -Level Warning -Message "Lambda node_modules not found (run: cd aws\\lambda; npm install)" -Summary "Lambda dependencies not installed"
    }
}

Write-Host ""
Write-Host ""
Write-Host "                      HEALTH CHECK SUMMARY                  " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host ""
Write-Host ""

if ($SuccessItems.Count -gt 0) {
    Write-Host "Successful Checks ($($SuccessItems.Count)):" -ForegroundColor Green
    foreach ($item in $SuccessItems) {
        Write-Host "$item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($WarningItems.Count -gt 0) {
    Write-Host "Warnings ($($WarningItems.Count)):" -ForegroundColor Yellow
    foreach ($item in $WarningItems) {
        Write-Host "$item" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($ErrorItems.Count -gt 0) {
    Write-Host "Errors ($($ErrorItems.Count)):" -ForegroundColor Red
    foreach ($item in $ErrorItems) {
        Write-Host "$item" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host ""
Write-Host ""
if ($ErrorItems.Count -eq 0 -and $WarningItems.Count -eq 0) {
    Write-Host "ALL CHECKS PASSED! Your backend is ready!" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Test contact form at http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Deploy to Amplify" -ForegroundColor White
} elseif ($ErrorItems.Count -eq 0) {
    Write-Host "Backend is functional but has minor issues" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "$WarningItems"
    Write-Host "Recommended actions:" -ForegroundColor Cyan
    Write-Host "Review warnings above" -ForegroundColor White
    Write-Host "Run: .\\aws\\deploy.ps1 to fix missing components" -ForegroundColor White
} else {
    Write-Host "Backend setup incomplete" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "Required actions:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\\aws\\deploy.ps1 to set up AWS infrastructure" -ForegroundColor White
    Write-Host "  2. Configure AWS credentials if needed: aws configure" -ForegroundColor White
    Write-Host "  3. Re-run this health check" -ForegroundColor White
}
Write-Host ""
Write-Host ""
Write-Host ""

if ($ApiEndpoint) {
    Write-Host "Want to test the API endpoint? (y/N)" -ForegroundColor Cyan
    $testApi = Read-Host
    if ($testApi -eq 'y') {
        Write-Host ""
        Write-Host "Testing GET /blogs..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "$ApiEndpoint/blogs" -Method Get -TimeoutSec 10
            Write-Status -Level Success -Message "API is responding!" -Summary "API endpoint reachable"
            if ($response.Count -or $response.items) {
                $count = if ($response.Count) { $response.Count } elseif ($response.items) { $response.items.Count } else { 0 }
                Write-Host "  Found $count blog post(s)" -ForegroundColor Gray
            }
        } catch {
            Write-Status -Level Error -Message "API test failed: $($_.Exception.Message)" -Summary "API test failed"
        }
    }
}
