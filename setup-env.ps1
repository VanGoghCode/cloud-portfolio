# Quick Environment Setup Helper

Write-Host "Environment Configuration Helper" -ForegroundColor Green
Write-Host ""

$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "$envFile already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Exiting without changes." -ForegroundColor Cyan
        exit 0
    }
}

Write-Host "Enter your API Gateway endpoint URL" -ForegroundColor Cyan
Write-Host "(Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod)" -ForegroundColor Gray
$apiEndpoint = Read-Host "API Endpoint"

if ([string]::IsNullOrWhiteSpace($apiEndpoint)) {
    Write-Host "API endpoint is required" -ForegroundColor Red
    exit 1
}

# Read BLOG_API_KEY without echoing
Write-Host "Enter BLOG_API_KEY (server-only; not exposed to the browser)" -ForegroundColor Cyan
$secureKey = Read-Host "BLOG_API_KEY" -AsSecureString
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
$blogApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$envContent = @"
# API Configuration
NEXT_PUBLIC_API_ENDPOINT=$apiEndpoint
BLOG_API_KEY=$blogApiKey
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8

Write-Host ""
Write-Host " $envFile created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host " Preview (BLOG_API_KEY hidden):" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_API_ENDPOINT=$apiEndpoint"
Write-Host "BLOG_API_KEY=********"
Write-Host ""
Write-Host " Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Set the same vars in Amplify Console for production" -ForegroundColor White