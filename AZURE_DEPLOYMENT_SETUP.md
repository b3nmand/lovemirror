# Azure Deployment Setup Guide

## Overview
This guide explains how to set up Azure deployment for the LoveMirror AI service using GitHub Actions with a publish profile, which is simpler and more reliable than service principal authentication.

## Why This Approach?

### ✅ **Publish Profile Benefits:**
- **Simpler Setup**: No need to configure Azure AD service principals
- **More Reliable**: Fewer authentication points of failure
- **Easier Management**: Single secret to manage instead of multiple credentials
- **No Expiration**: Publish profiles don't expire like service principal secrets

### ❌ **Service Principal Issues:**
- Complex Azure AD configuration required
- Credentials can expire
- Multiple secrets to manage (client ID, tenant ID, subscription ID)
- More prone to authentication failures

## Setup Steps

### 1. Get Azure Web App Publish Profile

1. **Go to Azure Portal**
   - Navigate to [Azure Portal](https://portal.azure.com)
   - Find your App Service: `lovemirror-ai-service`

2. **Download Publish Profile**
   - Click on your App Service
   - Go to **Overview** page
   - Click **Get publish profile** button
   - Save the `.publishsettings` file

3. **Extract the Profile Content**
   - Open the `.publishsettings` file in a text editor
   - Copy the entire content (it's XML format)

### 2. Add GitHub Secret

1. **Go to GitHub Repository**
   - Navigate to your repository: `https://github.com/b3nmand/lovemirror`
   - Go to **Settings** → **Secrets and variables** → **Actions**

2. **Add New Secret**
   - Click **New repository secret**
   - **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Value**: Paste the entire content from the `.publishsettings` file
   - Click **Add secret**

### 3. Verify Workflow Configuration

The workflow file (`.github/workflows/main_lovemirror-ai-service.yml`) is now configured to:
- Use `publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}`
- Deploy to `lovemirror-ai-service` App Service
- Test the deployment with a health check

## Deployment Process

### **What Happens When You Push:**

1. **Build Job** (runs on `ai_service/**` changes):
   - Sets up Python 3.11
   - Installs dependencies from `requirements_azure.txt`
   - Creates deployment artifact (ZIP file)

2. **Deploy Job** (runs after successful build):
   - Downloads the build artifact
   - Deploys to Azure using publish profile
   - Waits 30 seconds for deployment to complete
   - Tests the deployment by calling the health endpoint

### **Trigger Conditions:**
- Push to `main` branch
- Changes in `ai_service/**` directory
- Manual workflow dispatch

## Testing the Setup

### 1. **Make a Test Change**
```bash
# Make a small change to trigger deployment
echo "# Test deployment" >> ai_service/README.md
git add ai_service/README.md
git commit -m "Test deployment trigger"
git push origin main
```

### 2. **Monitor GitHub Actions**
- Go to **Actions** tab in your repository
- Watch the workflow run
- Check that both build and deploy jobs succeed

### 3. **Verify Deployment**
- Check the health endpoint: `https://lovemirror-ai-service.azurewebsites.net/health`
- Test the AI service: `https://lovemirror-ai-service.azurewebsites.net/api/chat`

## Troubleshooting

### **Common Issues:**

1. **Publish Profile Invalid**
   - Ensure the entire XML content is copied
   - Check that the profile hasn't expired
   - Verify the App Service name matches

2. **Deployment Fails**
   - Check Azure App Service logs
   - Verify the App Service is running
   - Check resource quotas and limits

3. **Health Check Fails**
   - Wait longer for deployment to complete
   - Check Azure App Service status
   - Verify environment variables are set

### **Debug Steps:**

1. **Check GitHub Actions Logs**
   - Go to Actions → Failed workflow → Deploy job
   - Look for specific error messages
   - Check the deployment step output

2. **Check Azure App Service**
   - Go to Azure Portal → App Service
   - Check **Deployment Center** for deployment status
   - Review **Log stream** for runtime errors

3. **Test Locally**
   ```bash
   cd ai_service
   python app.py
   # Test endpoints locally first
   ```

## Security Considerations

### **Publish Profile Security:**
- Keep the publish profile secret secure
- Don't commit it to version control
- Rotate the profile if compromised
- Use repository-level secrets (not organization-level)

### **Access Control:**
- Limit who can access the repository secrets
- Use branch protection rules
- Require pull request reviews for main branch

## Next Steps

After successful deployment:

1. **Test the AI Service**
   - Verify CORS is working
   - Test the chat endpoint
   - Check health monitoring

2. **Monitor Performance**
   - Set up Azure Application Insights
   - Monitor response times
   - Track error rates

3. **Set Up Alerts**
   - Configure Azure Monitor alerts
   - Set up GitHub Actions notifications
   - Monitor deployment success rates

## Support

If you encounter issues:

1. **Check GitHub Actions logs** for specific error messages
2. **Verify Azure App Service status** in Azure Portal
3. **Test endpoints manually** to isolate issues
4. **Review this guide** for common solutions

## Rollback Plan

If deployment fails:

1. **Revert the Code Change**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual Deployment**
   - Use Azure Portal to deploy manually
   - Upload the working code directly

3. **Check Previous Working Version**
   - Review recent successful deployments
   - Identify what changed
