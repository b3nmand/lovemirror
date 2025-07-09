# AI Service Integration Setup

This guide explains how to integrate your AI service (Streamlit app) with the Love Mirror application.

## 🚀 Quick Start

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# AI Service Configuration
VITE_AI_SERVICE_URL=http://localhost:8501
```

### 2. AI Service Endpoints

Your Streamlit app should expose the following endpoints:

#### Health Check Endpoint
```
GET /health
```
Returns: `200 OK` if service is healthy

#### Chat Endpoint
```
POST /api/chat
```

**Request Body:**
```json
{
  "user_input": "How can I improve communication with my partner?",
  "user_context": {
    "profile": {
      "name": "Alex",
      "gender": "male",
      "region": "West Africa",
      "cultural_context": "traditional"
    },
    "assessment_scores": {
      "communication": 4,
      "trust": 3,
      "empathy": 2,
      "shared_goals": 5
    },
    "delusional_score": 7.3,
    "compatibility_score": 82.0
  },
  "chat_history": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant", 
      "content": "Previous AI response"
    }
  ]
}
```

**Response Body:**
```json
{
  "response": "Based on your assessment data, I can see that communication is an area for growth...",
  "success": true
}
```

## 🔧 Configuration

### Development Setup

1. **Start your Streamlit app:**
   ```bash
   cd your-streamlit-app
   streamlit run app.py
   ```

2. **Set environment variable:**
   ```bash
   export VITE_AI_SERVICE_URL=http://localhost:8501
   ```

3. **Start Love Mirror:**
   ```bash
   npm run dev
   ```

### Production Setup

1. **Deploy your Streamlit app** to a hosting service (Heroku, Railway, etc.)

2. **Set the production URL:**
   ```bash
   VITE_AI_SERVICE_URL=https://your-ai-service.herokuapp.com
   ```

## 📁 File Structure

```
src/
├── lib/
│   ├── aiService.ts      # AI service integration
│   └── aiConfig.ts       # Configuration
├── pages/
│   └── AIRelationshipMentor.tsx  # AI Mentor page
```

## 🔍 Features

### AI Service Integration
- **Real-time chat** with AI mentor
- **User context integration** (profile, assessment scores, etc.)
- **Chat history** for contextual conversations
- **Fallback responses** when AI service is unavailable
- **Error handling** with user-friendly messages

### Status Monitoring
- **Health checks** to verify AI service availability
- **Status indicators** in the UI
- **Automatic fallback** to generated responses

### Configuration
- **Environment-based** configuration
- **Development/production** settings
- **Timeout handling** (30 seconds default)
- **Logging** (enabled in development)

## 🛠️ Customization

### Adding New AI Features

1. **Extend the AI service interface:**
   ```typescript
   interface AIRequestPayload {
     userInput: string;
     userContext: UserContext;
     chatHistory: Message[];
     // Add new fields as needed
   }
   ```

2. **Update the Streamlit app** to handle new request fields

3. **Modify the UI** to display new features

### Error Handling

The system includes comprehensive error handling:
- **Network errors** → Fallback responses
- **Timeout errors** → User-friendly messages
- **Service unavailable** → Automatic fallback
- **Invalid responses** → Error logging

## 🔒 Security Considerations

1. **CORS Configuration**: Ensure your Streamlit app allows requests from your Love Mirror domain
2. **Rate Limiting**: Implement rate limiting on your AI service
3. **Input Validation**: Validate user input before sending to AI service
4. **Error Logging**: Log errors without exposing sensitive information

## 🧪 Testing

### Test AI Service Connection
```typescript
import { testAIConnection } from '@/lib/aiService';

const isAvailable = await testAIConnection();
console.log('AI Service available:', isAvailable);
```

### Test Chat Integration
```typescript
import { callAIService } from '@/lib/aiService';

const result = await callAIService({
  userInput: "Test message",
  userContext: { /* ... */ },
  chatHistory: []
});
```

## 📝 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your Streamlit app allows requests from your frontend domain
   - Add CORS headers to your Streamlit app

2. **Connection Timeout**
   - Check if your AI service is running
   - Verify the URL in environment variables
   - Increase timeout in `aiConfig.ts` if needed

3. **Invalid Response Format**
   - Ensure your AI service returns the expected JSON format
   - Check the response structure matches the interface

### Debug Mode

Enable debug logging by setting:
```bash
VITE_AI_DEBUG=true
```

This will log all AI service requests and responses to the console.

## 🚀 Next Steps

1. **Deploy your Streamlit app** to a production environment
2. **Set up monitoring** for your AI service
3. **Add analytics** to track AI usage
4. **Implement caching** for common responses
5. **Add user feedback** collection for AI responses 