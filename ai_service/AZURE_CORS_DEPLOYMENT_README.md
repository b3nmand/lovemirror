# Azure AI Service CORS Fix Deployment Guide

## Overview
This guide explains how to deploy the updated Azure AI service with enhanced CORS configuration to fix the CORS issues preventing the AI mentor from working.

## What Was Fixed

### 1. Enhanced CORS Configuration
- Added proper CORS headers to all responses using `@app.after_request`
- Configured `flask-cors` with explicit methods, headers, and credentials support
- Added `max_age` for better caching of preflight requests

### 2. Preflight Request Handling
- Added explicit OPTIONS route handlers for all API endpoints
- Each endpoint now properly responds to preflight requests with correct CORS headers
- Ensures browsers can validate CORS before making actual requests

### 3. Response Headers
- `Access-Control-Allow-Origin`: Set to `https://lovemirror.co.uk`
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With, Accept
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Max-Age`: 3600 seconds

## Deployment Steps

### Option 1: Azure App Service (Recommended)

1. **Update Local Files**
   - The CORS configuration has been updated in both `app.py` and `app_simple.py`
   - All necessary CORS headers and OPTIONS handlers are now in place

2. **Deploy to Azure**
   ```bash
   # If using Azure CLI
   az webapp up --name lovemirror-ai-service --resource-group your-resource-group
   
   # Or manually deploy via Azure Portal
   # 1. Go to Azure Portal > App Services
   # 2. Select your AI service app
   # 3. Go to Deployment Center
   # 4. Upload the updated files or connect to your Git repository
   ```

3. **Verify Deployment**
   - Check the health endpoint: `https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net/health`
   - Test CORS headers in browser dev tools

### Option 2: Local Testing

1. **Install Dependencies**
   ```bash
   cd ai_service
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export FLASK_ENV=development
   ```

3. **Run the Service**
   ```bash
   # For full AI service
   python app.py
   
   # For simple service
   python app_simple.py
   ```

4. **Test CORS**
   - Open browser dev tools
   - Navigate to `http://localhost:5000/health`
   - Check Network tab for CORS headers

## Testing the Fix

### 1. Frontend Integration
- The frontend has been updated to use the Azure AI service directly
- No more Supabase proxy dependency
- AI mentor should now work without CORS errors

### 2. CORS Validation
```javascript
// Test in browser console
fetch('https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_input: 'test',
    user_context: {},
    chat_history: []
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### 3. Health Check
```bash
curl -H "Origin: https://lovemirror.co.uk" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net/health
```

## Troubleshooting

### Common Issues

1. **CORS Still Blocking**
   - Verify the service is deployed with updated code
   - Check browser console for specific CORS errors
   - Ensure the domain matches exactly: `https://lovemirror.co.uk`

2. **Service Not Responding**
   - Check Azure App Service status
   - Verify environment variables are set
   - Check application logs in Azure Portal

3. **Preflight Requests Failing**
   - Ensure OPTIONS routes are properly configured
   - Check that all CORS headers are being set
   - Verify `flask-cors` is properly installed

### Debug Steps

1. **Check Azure Logs**
   - Go to Azure Portal > App Service > Log stream
   - Look for any Python errors or CORS-related issues

2. **Test Individual Endpoints**
   - Test each endpoint separately
   - Verify OPTIONS requests work for each
   - Check response headers in browser dev tools

3. **Verify Configuration**
   - Ensure `flask-cors` version is 4.0.0 or higher
   - Check that all CORS headers are being set
   - Verify the `@app.after_request` decorator is working

## Rollback Plan

If issues arise, you can:

1. **Revert to Previous Version**
   - Deploy the previous version of the app
   - The Supabase proxy approach is still available as a fallback

2. **Temporary CORS Override**
   - Temporarily set `Access-Control-Allow-Origin: *` for testing
   - Remember to restrict it back to production domain

## Security Considerations

- CORS is restricted to `https://lovemirror.co.uk` only
- Credentials are supported for authenticated requests
- Preflight requests are cached for 1 hour to reduce overhead
- All endpoints properly validate request methods and headers

## Next Steps

After successful deployment:

1. **Test the AI Mentor** in the frontend
2. **Monitor Azure logs** for any CORS-related issues
3. **Remove the Supabase proxy** if no longer needed
4. **Update documentation** to reflect the direct Azure integration

## Support

If you encounter issues:
1. Check Azure App Service logs
2. Verify CORS headers in browser dev tools
3. Test endpoints individually
4. Ensure all environment variables are set correctly
