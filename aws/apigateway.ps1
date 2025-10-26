param(
  [string]$Region
)

Write-Host "[API] Creating/Updating API Gateway..." -ForegroundColor Yellow

$configFile = Join-Path $PSScriptRoot "config.env"
$AWS_REGION = if ($Region) { $Region } else { "us-east-1" }
$LAMBDA_CONTACT_FUNCTION = "portfolio-contact-form"
$LAMBDA_BLOGS_FUNCTION = "portfolio-blogs-crud"
$API_GATEWAY_NAME = "Portfolio API"

if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
      $key = $matches[1].Trim(); $value = $matches[2].Trim()
      Set-Variable -Name $key -Value $value -Scope Script
    }
  }
}

$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)

$apiResponse = aws apigateway get-rest-apis --query "items[?name=='$API_GATEWAY_NAME'].id" --output text --region $AWS_REGION 2>$null
if ([string]::IsNullOrWhiteSpace($apiResponse)) {
  $apiResponse = aws apigateway create-rest-api --name "$API_GATEWAY_NAME" --description "Portfolio API" --region $AWS_REGION --output json | ConvertFrom-Json
  $API_ID = $apiResponse.id
} else { $API_ID = $apiResponse }

Write-Host "API ID: $API_ID" -ForegroundColor Cyan
$ROOT_ID = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query 'items[0].id' --output text --no-cli-pager

function Ensure-Resource($pathPart) {
  $rid = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query "items[?path=='/$pathPart'].id" --output text --no-cli-pager 2>$null
  if ([string]::IsNullOrWhiteSpace($rid)) {
    ($null = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part $pathPart --region $AWS_REGION --output json); 
    $rid = aws apigateway get-resources --rest-api-id $API_ID --region $AWS_REGION --query "items[?path=='/$pathPart'].id" --output text --no-cli-pager
  }
  return $rid
}

function Enable-CORS($resourceId) {
  aws apigateway put-method --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --authorization-type NONE --region $AWS_REGION --no-cli-pager 2>&1 | Out-Null

  $reqTemplates = "{`"application/json`":`"{\\`"statusCode\\`":200}`"}"
  aws apigateway put-integration --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --type MOCK --request-templates $reqTemplates --region $AWS_REGION --no-cli-pager 2>&1 | Out-Null

  aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" --region $AWS_REGION --no-cli-pager 2>&1 | Out-Null

  $respParams = "{`"method.response.header.Access-Control-Allow-Headers`":`"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`",`"method.response.header.Access-Control-Allow-Methods`":`"'GET,POST,OPTIONS'`",`"method.response.header.Access-Control-Allow-Origin`":`"'*'`"}"
  aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters $respParams --region $AWS_REGION --no-cli-pager 2>&1 | Out-Null
}

# /contact POST -> contact lambda
$CONTACT_RESOURCE_ID = Ensure-Resource -pathPart "contact"
Enable-CORS $CONTACT_RESOURCE_ID
aws apigateway put-method --rest-api-id $API_ID --resource-id $CONTACT_RESOURCE_ID --http-method POST --authorization-type NONE --region $AWS_REGION --no-cli-pager 2>$null
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $CONTACT_RESOURCE_ID --http-method POST --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Origin=false" --region $AWS_REGION --no-cli-pager 2>$null
aws apigateway put-integration --rest-api-id $API_ID --resource-id $CONTACT_RESOURCE_ID --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${LAMBDA_CONTACT_FUNCTION}/invocations" --region $AWS_REGION --no-cli-pager 2>$null
aws lambda add-permission --function-name $LAMBDA_CONTACT_FUNCTION --statement-id apigateway-contact --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${AWS_REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*/*/contact" --region $AWS_REGION --no-cli-pager 2>$null

# /blogs GET -> blogs lambda
$BLOGS_RESOURCE_ID = Ensure-Resource -pathPart "blogs"
Enable-CORS $BLOGS_RESOURCE_ID
aws apigateway put-method --rest-api-id $API_ID --resource-id $BLOGS_RESOURCE_ID --http-method GET --authorization-type NONE --region $AWS_REGION --no-cli-pager 2>$null
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $BLOGS_RESOURCE_ID --http-method GET --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Origin=false" --region $AWS_REGION --no-cli-pager 2>$null
aws apigateway put-integration --rest-api-id $API_ID --resource-id $BLOGS_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${LAMBDA_BLOGS_FUNCTION}/invocations" --region $AWS_REGION --no-cli-pager 2>$null
aws lambda add-permission --function-name $LAMBDA_BLOGS_FUNCTION --statement-id apigateway-blogs --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${AWS_REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*/*/blogs" --region $AWS_REGION --no-cli-pager 2>$null

Start-Sleep -Seconds 3

$deployed = $false
for ($i=1; $i -le 3 -and -not $deployed; $i++) {
  $deployOutput = aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $AWS_REGION --no-cli-pager 2>&1
  if ($LASTEXITCODE -eq 0) {
    $deployed = $true
  } elseif ($deployOutput -match 'No integration defined for method') {
    Write-Host "Waiting for integrations to propagate... (attempt $i)" -ForegroundColor Yellow
    Start-Sleep -Seconds (2 * $i)
  } else {
    Write-Host "Create deployment failed: $deployOutput" -ForegroundColor Red
    break
  }
}

if (-not $deployed) { Write-Host "Deployment not created; please re-run this script shortly." -ForegroundColor Red; exit 1 }

$API_ENDPOINT = "https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"
Write-Host "API deployed: $API_ENDPOINT" -ForegroundColor Green

# Save/update NEXT_PUBLIC_API_ENDPOINT in .env without clobbering other vars
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) { New-Item -ItemType File -Path $envFile -Force | Out-Null }

$lines = Get-Content $envFile -ErrorAction SilentlyContinue
$updated = $false
$output = @()
foreach ($line in $lines) {
  if ($line -match '^NEXT_PUBLIC_API_ENDPOINT=') {
    $output += "NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT"
    $updated = $true
  } else {
    $output += $line
  }
}
if (-not $updated) { $output += "NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT" }
Set-Content -Path $envFile -Value ($output -join "`n")
Write-Host "Saved NEXT_PUBLIC_API_ENDPOINT to .env (preserved other vars)" -ForegroundColor Gray
