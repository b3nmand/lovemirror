# Azure Environment Setup Script
# Run this after creating the Azure Web App

Write-Host "🔧 Azure Environment Setup" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if Azure CLI is available
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it or use Azure Portal." -ForegroundColor Red
    Write-Host "   Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}

# Set environment variables
$webAppName = "lovemirror-ai-service"
$resourceGroup = "lovemirror-rg"

Write-Host "`n🔑 Setting up environment variables..." -ForegroundColor Yellow

# Check if OPENAI_API_KEY is set
$openaiKey = $env:OPENAI_API_KEY
if (-not $openaiKey) {
    Write-Host "❌ OPENAI_API_KEY not found in environment" -ForegroundColor Red
    Write-Host "   Please set it: `$env:OPENAI_API_KEY = 'your-key-here'" -ForegroundColor Yellow
    exit 1
}

# Set the environment variable in Azure
Write-Host "Setting OPENAI_API_KEY in Azure Web App..." -ForegroundColor Yellow
try {
    az webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings OPENAI_API_KEY="$openaiKey" --output none
    Write-Host "✅ OPENAI_API_KEY set successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set OPENAI_API_KEY" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Set other recommended settings
Write-Host "`n⚙️  Setting additional configuration..." -ForegroundColor Yellow

try {
    # Set Python version
    az webapp config set --name $webAppName --resource-group $resourceGroup --linux-fx-version "PYTHON|3.11" --output none
    Write-Host "✅ Python 3.11 configured" -ForegroundColor Green
    
    # Set startup command
    az webapp config set --name $webAppName --resource-group $resourceGroup --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 app:app" --output none
    Write-Host "✅ Startup command configured" -ForegroundColor Green
    
    # Enable logging
    az webapp log config --name $webAppName --resource-group $resourceGroup --web-server-logging filesystem --output none
    Write-Host "✅ Logging enabled" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to set configuration" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub Actions and re-run the failed workflow" -ForegroundColor White
Write-Host "2. Test the deployment: https://$webAppName.azurewebsites.net/health" -ForegroundColor White
Write-Host "3. Update your frontend environment variables" -ForegroundColor White 