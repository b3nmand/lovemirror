# Azure Deployment Guide for AI Service

## Overview
This guide provides step-by-step instructions for deploying the LoveMirror AI Service to Azure App Service.

## Prerequisites
- Azure subscription
- GitHub repository with the AI service code
- OpenAI API key

## Quick Deployment

### 1. Set Environment Variables in Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your web app: `lovemirror-ai-service`
3. Go to **Settings** → **Configuration** → **Application settings**
4. Add these settings:
   ```
   OPENAI_API_KEY = your-actual-openai-api-key
   FLASK_ENV = production
   ```
5. Click **Save** and restart the app

### 2. Deploy via GitHub Actions
The deployment is automated via GitHub Actions. Push changes to trigger deployment:
```bash
git add .
git commit -m "Update AI service"
git push origin main
```

### 3. Test the Deployment
```bash
# Health check
curl https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net/health

# Chat test
curl -X POST https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Hello", "user_context": {"profile": {"name": "Test"}}, "chat_history": []}'
```

## Manual Deployment

### 1. Create Azure Web App
```bash
az group create --name lovemirror-rg --location "UK West"
az appservice plan create --name lovemirror-plan --resource-group lovemirror-rg --sku B1 --is-linux
az webapp create --name lovemirror-ai-service --resource-group lovemirror-rg --plan lovemirror-plan --runtime "PYTHON|3.11"
```

### 2. Configure Environment Variables
```bash
az webapp config appsettings set --name lovemirror-ai-service --resource-group lovemirror-rg --settings OPENAI_API_KEY="your-key"
```

### 3. Deploy Code
```bash
az webapp deployment source config-zip --resource-group lovemirror-rg --name lovemirror-ai-service --src release.zip
```

## Troubleshooting

### Common Issues
1. **503 Service Unavailable**: Check if `OPENAI_API_KEY` is set
2. **Import errors**: Ensure all dependencies are in `requirements.txt`
3. **Startup failures**: Check Azure logs in Portal → Logs → Log stream

### Logs
- **Azure Portal**: Web App → Logs → Log stream
- **GitHub Actions**: Repository → Actions → Latest workflow run

## API Endpoints

### Health Check
```
GET /health
```

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "user_input": "How can I improve my relationship?",
  "user_context": {
    "profile": {"name": "User"},
    "assessment_scores": {},
    "delusional_score": 5.0,
    "compatibility_score": 75
  },
  "chat_history": []
}
```

## Configuration Files

- `requirements.txt`: Python dependencies
- `startup.txt`: Azure startup command
- `.azure/config.yml`: Azure configuration
- `env.example`: Environment variables template

## Support
For issues, check:
1. Azure Portal logs
2. GitHub Actions workflow status
3. Health endpoint response 