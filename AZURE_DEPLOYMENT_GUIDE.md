# Azure Deployment Guide for AI Relationship Mentor

This guide will help you deploy your AI Relationship Mentor service to Azure App Service.

## 🚀 Overview

The AI service is built as a Flask API that's optimized for Azure deployment. It provides:
- **PDF Processing**: Loads "The Cog Effect book into searchable chunks
- **AI Chat API**: Uses OpenAI GPT-3.5-turbo for personalized relationship advice
- **Context Integration**: Incorporates user assessment data and cultural context
- **Health Monitoring**: Built-in health checks and logging

## 📁 Project Structure

```
ai_service/
├── app.py                    # Main Flask application
├── requirements_azure.txt    # Azure-optimized dependencies
├── startup.txt              # Azure startup command
├── web.config               # Azure configuration
└── the_cog_effect.pdf       # Book file (you need to add this)
```

## 🔧 Prerequisites

1**Azure Account**: Active Azure subscription2ure CLI**: Install from [docs.microsoft.com](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Python3.9 For local testing
4. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)5Book File**: Place `the_cog_effect.pdf` in the `ai_service/` directory

## 🛠️ Step-by-Step Deployment

### Step 1: Prepare Your Environment

1*Install Azure CLI** (if not already installed):
   ```bash
   # Windows
   winget install Microsoft.AzureCLI
   
   # macOS
   brew install azure-cli
   
   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Login to Azure**:
   ```bash
   az login
   ```

3. **Set your subscription** (if you have multiple):
   ```bash
   az account set --subscription Your-Subscription-Name
   ```

### Step 2: Create Azure Resources

1. **Create a Resource Group**:
   ```bash
   az group create --name lovemirror-ai-rg --location East US"
   ```

2ate an App Service Plan**:
   ```bash
   az appservice plan create \
     --name lovemirror-ai-plan \
     --resource-group lovemirror-ai-rg \
     --sku B1 \
     --is-linux
   ```

3. **Create the Web App**:
   ```bash
   az webapp create \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --plan lovemirror-ai-plan \
     --runtime "PYTHON:3.9
   ```

### Step 3: Configure Environment Variables

1. **Set OpenAI API Key**:
   ```bash
   az webapp config appsettings set \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --settings OPENAI_API_KEY="your-openai-api-key-here
   ```

2. **Set Python version** (optional):
   ```bash
   az webapp config appsettings set \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --settings PYTHON_VERSION="3.9
   ```

### Step 4: Deploy Your Code1 **Navigate to the ai_service directory**:
   ```bash
   cd ai_service
   ```
2Deploy using Azure CLI**:
   ```bash
   az webapp deployment source config-local-git \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg
   
   # Get the deployment URL
   az webapp deployment list-publishing-credentials \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg
   ```

3. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial Azure deployment"
   git remote add azure <deployment-url-from-step-2
   git push azure main
   ```

### Step 5: Test Your Deployment

1. **Check the health endpoint**:
   ```bash
   curl https://lovemirror-ai-service.azurewebsites.net/health
   ```

2 the chat endpoint**:
   ```bash
   curl -X POST https://lovemirror-ai-service.azurewebsites.net/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       user_input": How can I improve communication?",
       user_context": {
        profile": {name": "Test User", "gender": Not specified",region": "Global"},
         assessment_scores: [object Object]communication":3},
        delusional_score:5compatibility_score": 75       },
    chat_history": []
     }'
   ```

## 🔄 Alternative Deployment Methods

### Method1: GitHub Actions (Recommended)

1. **Create `.github/workflows/azure-deploy.yml`**:
   ```yaml
   name: Deploy to Azure
   on:
     push:
       branches: [ main ]
       paths:ai_service/**' ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v2    
       - name: Deploy to Azure Web App
         uses: azure/webapps-deploy@v2
         with:
           app-name: 'lovemirror-ai-service'
           publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
           package: ./ai_service
   ```2et publish profile**:
   ```bash
   az webapp deployment list-publishing-profiles \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --xml
   ```

3 to GitHub Secrets**: Copy the output to `AZURE_WEBAPP_PUBLISH_PROFILE` secret

### Method 2: Azure DevOps
1reate Azure DevOps pipeline**:
   ```yaml
   trigger:
   - main
   
   pool:
     vmImage: 'ubuntu-latest   
   steps:
   - task: UsePythonVersion@0
     inputs:
       versionSpec: '3.9  
   - script: |
       pip install -r ai_service/requirements_azure.txt
     displayName: 'Install dependencies'
   
   - task: ArchiveFiles@2
     inputs:
       rootFolderOrFile: 'ai_service'
       includeRootFolder: false
       archiveType: 'zip'
       archiveFile:$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
   
   - task: AzureWebApp@1
     inputs:
       azureSubscription: 'Your-Azure-Subscription'
       appName: 'lovemirror-ai-service'
       package:$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
   ```

## 🔧 Configuration Options

### Scaling Options
1**Scale up** (more resources):
   ```bash
   az appservice plan update \
     --name lovemirror-ai-plan \
     --resource-group lovemirror-ai-rg \
     --sku S1
   ```

2*Scale out** (more instances):
   ```bash
   az appservice plan update \
     --name lovemirror-ai-plan \
     --resource-group lovemirror-ai-rg \
     --number-of-workers 3
   ```

### Custom Domain

1. **Add custom domain**:
   ```bash
   az webapp config hostname add \
     --webapp-name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --hostname ai.lovemirror.co.uk
   ```

2 **Configure SSL**:
   ```bash
   az webapp config ssl bind \
     --certificate-thumbprint <thumbprint> \
     --ssl-type SNI \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg
   ```

## 📊 Monitoring and Logging

### View Logs

1 **Stream logs**:
   ```bash
   az webapp log tail \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg
   ```

2 **Download logs**:
   ```bash
   az webapp log download \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg
   ```

### Application Insights

1. **Create Application Insights**:
   ```bash
   az monitor app-insights component create \
     --app lovemirror-ai-insights \
     --location "East US" \
     --resource-group lovemirror-ai-rg \
     --application-type web
   ```

2. **Connect to Web App**:
   ```bash
   az webapp config appsettings set \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
   ```

## 🔒 Security Considerations
1*Enable HTTPS only**:
   ```bash
   az webapp update \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --https-only true
   ```2. **Configure CORS** (already done in app.py):
   - Allowed origins: lovemirror.co.uk, localhost for development3ironment Variables**: Never commit API keys to source control

## 🧪 Testing

### Local Testing

1. **Install dependencies**:
   ```bash
   cd ai_service
   pip install -r requirements_azure.txt
   ```

2. **Set environment variable**:
   ```bash
   export OPENAI_API_KEY="your-api-key
   ```

3 **Run locally**:
   ```bash
   python app.py
   ```

4. **Test endpoints**:
   ```bash
   curl http://localhost:500/health
   curl -X POST http://localhost:5000i/chat -H "Content-Type: application/json-d{"user_input":test"}'
   ```

### Production Testing
1. **Health check**:
   ```bash
   curl https://lovemirror-ai-service.azurewebsites.net/health
   ```

2. **Full chat test**:
   ```bash
   curl -X POST https://lovemirror-ai-service.azurewebsites.net/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       user_input": How can I improve communication with my partner?",
       user_context": {
        profile": {name": "Test User,gender:Male", "region": North America"},
         assessment_scores: [object Object]communication": 3, "trust:4thy":2},
        delusional_score:6.5compatibility_score": 78       },
    chat_history": []
     }'
   ```

## 🔄 Update Frontend Configuration

After deployment, update your frontend environment variables:

1 **Development** (`.env.local`):
   ```bash
   VITE_AI_SERVICE_URL=http://localhost:5000`
2. **Production** (Azure App Service environment variables):
   ```bash
   VITE_AI_SERVICE_URL=https://lovemirror-ai-service.azurewebsites.net
   ```

## 🚨 Troubleshooting

### Common Issues

1. **App won't start**:
   - Check logs: `az webapp log tail`
   - Verify `the_cog_effect.pdf` is in the root directory
   - Check environment variables are set

2 **Import errors**:
   - Verify `requirements_azure.txt` is correct
   - Check Python version compatibility

3 **CORS errors**:
   - Verify CORS origins in `app.py`
   - Check frontend URL is in allowed origins

4. **OpenAI API errors**:
   - Verify API key is correct
   - Check API key has sufficient credits
   - Ensure API key is properly set in Azure

### Performance Optimization

1. **Enable caching**:
   ```bash
   az webapp config appsettings set \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --settings WEBSITE_LOCAL_CACHE_OPTION=Always
   ```

2. **Optimize startup time**:
   - Use smaller PDF chunks
   - Implement lazy loading for book content

## 📈 Cost Optimization

1. **Use Basic tier** for development:
   ```bash
   az appservice plan update \
     --name lovemirror-ai-plan \
     --resource-group lovemirror-ai-rg \
     --sku B1
   ```

2. **Scale down during off-hours**:
   ```bash
   az webapp config set \
     --name lovemirror-ai-service \
     --resource-group lovemirror-ai-rg \
     --min-tls-version1.2```

## 🎉 Success Checklist

- [ ] Azure resources created
- [ ] Environment variables configured
-loyed successfully
- [ ] Health endpoint responding
-t endpoint working
- [ ] Frontend configuration updated
-roperly configured
- [ ] SSL certificate configured
-  Monitoring set up
- [ ] Logs accessible

## 📞 Support

- **Azure Documentation**: [docs.microsoft.com](https://docs.microsoft.com/en-us/azure/app-service/)
- **Azure CLI Reference**: [docs.microsoft.com](https://docs.microsoft.com/en-us/cli/azure/)
- **App Service Troubleshooting**: [docs.microsoft.com](https://docs.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs)

---

**Your AI Relationship Mentor will be live at:** `https://lovemirror-ai-service.azurewebsites.net` 