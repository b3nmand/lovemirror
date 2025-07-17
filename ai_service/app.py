import os
import json
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from langchain_community.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pypdf
import datetime
import logging

# Azure deployment trigger - updated for latest deployment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── CONFIG ─────────────────────────────────────────────────────────────
PDF_PATH = Path("the_cog_effect.pdf")
CHUNK_SIZE = 1000
CHUNK_OLAP = 200
# ─── ENV CHECK ──────────────────────────────────────────────────────────
if "OPENAI_API_KEY" not in os.environ:
    logger.error("❌ Set OPENAI_API_KEY in your environment and restart.")
    raise RuntimeError("OPENAI_API_KEY environment variable is required")

# ─── DOCUMENT PROCESSING ────────────────────────────────────────────────────
def load_book_content():
    """Load and process the book content"""
        if not PDF_PATH.exists():
        logger.warning(f"⚠️ Book file not found: {PDF_PATH}")
        logger.info("📚 Using fallback relationship knowledge base")
        return get_fallback_knowledge()
    
    try:
        # Read PDF content
        with open(PDF_PATH, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"
        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OLAP
        )
        chunks = splitter.split_text(text_content)
        
        logger.info(f"✅ Book loaded: {len(chunks)} chunks created")
        return chunks
        
    except Exception as e:
        logger.error(f"❌ Error loading book: {str(e)}")
        logger.info("📚 Falling back to relationship knowledge base")
        return get_fallback_knowledge()

def get_fallback_knowledge():
    """Provide fallback relationship knowledge when PDF is not available"""
    knowledge_base = [
        "Healthy relationships are built on mutual respect, trust, and open communication. Both partners should feel valued and heard.",
        "Effective communication involves active listening, expressing feelings clearly, and avoiding blame or criticism.",
        "Trust is fundamental to any relationship. It's built through consistent actions, honesty, and reliability over time.",
        "Setting and respecting boundaries is crucial for maintaining healthy relationships and individual well-being.",
        "Conflict resolution skills are essential. Focus on the issue, not the person, and work together to find solutions.",
        "Emotional intelligence helps partners understand and respond to each other's feelings appropriately.",
        "Quality time together strengthens bonds, while also maintaining individual interests and friendships.",
        "Appreciation and gratitude should be expressed regularly to maintain positive relationship dynamics.",
        "Personal growth and self-improvement benefit both individuals and the relationship as a whole.",
        "Cultural differences should be respected and understood, with open dialogue about values and traditions.",
        "Financial compatibility and shared goals are important aspects of long-term relationship success.",
        "Physical and emotional intimacy should be mutually satisfying and respectful of both partners' needs.",
        "Supporting each other's dreams and aspirations creates a stronger partnership foundation.",
        "Forgiveness and the ability to move past conflicts are essential for relationship longevity.",
        "Shared values and life goals help align partners for long-term compatibility and happiness."
    ]
    logger.info(f"✅ Fallback knowledge loaded: {len(knowledge_base)} principles")
    return knowledge_base

# Load book content on startup
try:
    book_chunks = load_book_content()
    logger.info("✅ Book content loaded successfully")
except Exception as e:
    logger.error(f"Failed to load book content: {e}")
    book_chunks = []

# ─── AI SETUP ─────────────────────────────────────────────────────────────
def setup_ai():
    """Initialize OpenAI chat model"""
    return ChatOpenAI(
        model_name="gpt-3.5-turbo",
        openai_api_key=os.environ["OPENAI_API_KEY"],
        temperature=0.7
    )

try:
    llm = setup_ai()
    logger.info("✅ AI model initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize AI model: {e}")
    llm = None

# ─── CONTEXT RETRIEVAL ────────────────────────────────────────────────────
def get_relevant_context(query, chunks, max_chunks=3):
    """Retrieve relevant chunks based on simple keyword matching"""
    query_lower = query.lower()
    relevant_chunks = []
    
    for chunk in chunks:
        chunk_lower = chunk.lower()
        # Simple relevance scoring
        score = sum(1 for word in query_lower.split() if word in chunk_lower)
        if score > 0:
            relevant_chunks.append((score, chunk))
    
    # Sort by relevance and return top chunks
    relevant_chunks.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in relevant_chunks[:max_chunks]]

# ─── RESPONSE GENERATION ────────────────────────────────────────────────────
def generate_response(user_input, user_context, chat_history):
    """Generate AI response using book knowledge and user context"""
    try:
        if not llm:
            raise Exception("AI model not initialized")
            
        # Get relevant book context
        relevant_chunks = get_relevant_context(user_input, book_chunks)
        book_context = "\n\n".join(relevant_chunks) if relevant_chunks else "No specific book context found."
        # Build comprehensive prompt
        prompt = f"""
You are an AI Relationship Mentor based on "The Cog Effect" book knowledge. 

User Context:
- Name: {user_context.get('profile', {}).get('name', 'User')}
- Gender: {user_context.get('profile', {}).get('gender', 'Not specified')}
- Region: {user_context.get('profile', {}).get('region', 'Not specified')}
- Cultural Context: {user_context.get('profile', {}).get('cultural_context', 'global')}

Assessment Data:
- Assessment Scores: {json.dumps(user_context.get('assessment_scores', {}))}
- Delusional Score: {user_context.get('delusional_score', 'Not available')}
- Compatibility Score: {user_context.get('compatibility_score', 'Not available')}%

Book Knowledge Context:
{book_context}

Chat History: {len(chat_history)} previous messages

User Question: {user_input}

Please provide personalized relationship advice based on:
1. The user's specific assessment data and profile
2. Relevant knowledge from "The Cog Effect" book
3. Best practices for healthy relationships
4. Cultural sensitivity for their region and background

Provide practical, actionable advice that addresses their specific situation.
"""

        # Generate response
        response = llm.predict(prompt)
        logger.info(f"Generated response for user: {user_context.get('profile', {}).get('name', 'User')}")
        return response
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again."

# ─── FLASK APP SETUP ────────────────────────────────────────────────────────
app = Flask(__name__)

# Configure CORS for Azure deployment
CORS(app, origins=[
    "https://lovemirror.co.uk", 
    "https://www.lovemirror.co.uk", 
    "http://localhost:5173", 
    "http://localhost:3000", 
    "https://lovemirror-ai-service-gzasfnbbbpcaf7ff.ukwest-01.azurewebsites.net"
])

# Production configuration
if not app.debug:
    app.config['PROPAGATE_EXCEPTIONS'] = True

# ─── API ENDPOINTS ──────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if core components are working
        health_status = {
            "status": "healthy",
            "timestamp": datetime.datetime.now().isoformat(),
            "components": {
                "book_loaded": len(book_chunks) > 0,
                "ai_model": llm is not None,
                "openai_key": "OPENAI_API_KEY" in os.environ
            }
        }
        
        # Overall health based on critical components
        overall_health = all([
            len(book_chunks) > 0,
            llm is not None,
            "OPENAI_API_KEY" in os.environ
        ])
        
        status_code = 200 if overall_health else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }), 503

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint for AI relationship advice"""
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400          
        user_input = data.get('user_input', '')
        user_context = data.get('user_context', {})
        chat_history = data.get('chat_history', [])
        
        if not user_input:
            return jsonify({"error": "No user input provided"}), 400          
        # Log the request
        logger.info(f"Chat request from user: {user_context.get('profile', {}).get('name', 'User')}")
        
        # Generate response
        response = generate_response(user_input, user_context, chat_history)
        
        return jsonify({
            "success": True,
            "response": response,
            "user_context_used": user_context,
            "timestamp": datetime.datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service information"""
    return jsonify({
        "service": "AI Relationship Mentor",
        "version": 1.0,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat"
        },
        "timestamp": datetime.datetime.now().isoformat()
    }), 200

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return send_from_directory(
        os.path.join(app.root_path, 'static'),
        'favicon.ico', 
        mimetype='image/vnd.microsoft.icon'
    )

# ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)