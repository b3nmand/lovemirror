#!/bin/bash

echo "🚀 Setting up AI Relationship Mentor Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if the book file exists
if [ ! -f "the_cog_effect.pdf" ]; then
    echo "❌ Book file 'the_cog_effect.pdf' not found in current directory."
    echo "Please place the book file in this directory and run the script again."
    exit 1
fi

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable is not set."
    echo "Please set it with: export OPENAI_API_KEY='your-api-key-here'"
    echo "Or create a .env file with: OPENAI_API_KEY=your-api-key-here"
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements_azure.txt

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the AI service:"
echo "   python app.py"
echo ""
echo "🌐 The service will be available at:"
echo "   - Flask API: http://localhost:5000"
echo "   - API Health: http://localhost:5000/health"
echo "   - API Chat: http://localhost:5000/api/chat"
echo ""
echo "🔗 Love Mirror will connect to: http://localhost:5000" 