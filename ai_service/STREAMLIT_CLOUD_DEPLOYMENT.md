# Streamlit Cloud Deployment Guide

This guide will help you deploy your AI Relationship Mentor app to Streamlit Cloud.

## 🚀 Quick Start

### 1. Prepare Your Repository

Ensure your repository has the following structure:
```
ai_service/
├── streamlit_app.py          # Main Streamlit app
├── requirements_streamlit_cloud.txt  # Dependencies
├── the_cog_effect.pdf        # Book file
└── STREAMLIT_CLOUD_DEPLOYMENT.md  # This guide
```

### 2. Set Up Streamlit Cloud

1. **Go to Streamlit Cloud:**
   - Visit [share.streamlit.io](https://share.streamlit.io)
   - Sign in with your GitHub account

2. **Connect Your Repository:**
   - Click "New app"
   - Select your GitHub repository
   - Choose the branch (usually `main` or `master`)

3. **Configure Your App:**
   - **Main file path:** `ai_service/streamlit_app.py`
   - **Python version:** 3.9 or higher

### 3. Set Environment Variables

In Streamlit Cloud dashboard, add these secrets:

```toml
[secrets]
OPENAI_API_KEY = "your-openai-api-key-here"
```

**How to add secrets:**
1. Go to your app in Streamlit Cloud
2. Click "Settings" (⚙️ icon)
3. Scroll to "Secrets"
4. Add your OpenAI API key

### 4. Deploy

1. Click "Deploy" 
2. Wait for the build to complete (usually 2-5 minutes)
3. Your app will be available at: `https://your-app-name.streamlit.app`

## 🔧 Configuration Options

### Custom Domain (Optional)
- Go to app settings
- Click "Custom domain"
- Add your domain and follow DNS instructions

### Advanced Settings
- **Memory:** Default is 1GB (sufficient for this app)
- **Timeout:** Default is 30 seconds
- **Max upload size:** 200MB (sufficient for PDF)

## 📁 File Requirements

### Required Files:
- `streamlit_app.py` - Main application
- `requirements_streamlit_cloud.txt` - Dependencies
- `the_cog_effect.pdf` - Book file (must be in same directory)

### Optional Files:
- `.streamlit/config.toml` - Custom configuration
- `README.md` - App documentation

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check requirements.txt syntax
   - Ensure all dependencies are listed
   - Verify Python version compatibility

2. **App Won't Start:**
   - Check environment variables are set
   - Verify file paths are correct
   - Check logs for specific errors

3. **PDF Not Found:**
   - Ensure `the_cog_effect.pdf` is in the same directory as `streamlit_app.py`
   - Check file permissions

4. **OpenAI API Errors:**
   - Verify API key is correct
   - Check API key has sufficient credits
   - Ensure API key is properly set in secrets

### Debug Mode:
Add this to your app for debugging:
```python
import streamlit as st
st.write("Debug info:", st.secrets)
```

## 🔄 Updating Your App

1. **Make changes** to your code
2. **Push to GitHub** (main branch)
3. **Streamlit Cloud** automatically redeploys
4. **Check deployment** in the dashboard

## 📊 Monitoring

### Built-in Analytics:
- Page views
- User sessions
- Error rates
- Performance metrics

### Custom Analytics:
```python
import streamlit as st

# Track usage
if st.button("Get Advice"):
    # Your analytics code here
    st.success("Advice generated!")
```

## 🎯 Best Practices

### Performance:
- Use `@st.cache_resource` for expensive operations
- Load data once and reuse
- Keep file sizes reasonable

### Security:
- Never commit API keys to GitHub
- Use Streamlit secrets for sensitive data
- Validate user inputs

### User Experience:
- Add loading indicators
- Provide clear error messages
- Use consistent styling

## 🔗 Integration with Love Mirror

Once deployed, update your Love Mirror app:

```typescript
// In your aiConfig.ts
export const AI_CONFIG = {
  BASE_URL: 'https://your-app-name.streamlit.app',
  // ... other config
};
```

## 📈 Scaling Considerations

### Free Tier Limits:
- 1 app per account
- 1GB RAM
- 30-second timeout
- 200MB file upload

### Pro Features (if needed):
- Multiple apps
- More RAM
- Longer timeouts
- Custom domains
- Priority support

## 🎉 Success Checklist

- [ ] Repository connected to Streamlit Cloud
- [ ] Environment variables set
- [ ] App builds successfully
- [ ] PDF file loads correctly
- [ ] OpenAI API responds
- [ ] User interface works
- [ ] Integration with Love Mirror tested

## 📞 Support

- **Streamlit Cloud Docs:** [docs.streamlit.io](https://docs.streamlit.io)
- **Community Forum:** [discuss.streamlit.io](https://discuss.streamlit.io)
- **GitHub Issues:** [github.com/streamlit/streamlit](https://github.com/streamlit/streamlit)

---

**Your AI Relationship Mentor will be live at:** `https://your-app-name.streamlit.app` 