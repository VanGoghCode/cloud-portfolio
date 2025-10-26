# Quick Environment Setup Helper

Write-Host "🔧 Environment Configuration Helper" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
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
    Write-Host "❌ API endpoint is required" -ForegroundColor Red
    exit 1
}

# Create .env.local
$envContent = @"
# API Configuration
NEXT_PUBLIC_API_ENDPOINT=$apiEndpoint
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host ""
Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Content:" -ForegroundColor Cyan
Get-Content ".env.local"
Write-Host ""
Write-Host "⚡ Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Test the contact form" -ForegroundColor White
Write-Host "  3. Check if blogs are loading from DynamoDB" -ForegroundColor White
Write-Host ""
Write-Host "🚀 For Amplify deployment:" -ForegroundColor Yellow
Write-Host "  Add this environment variable in Amplify Console:" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_API_ENDPOINT = $apiEndpoint" -ForegroundColor Cyan
