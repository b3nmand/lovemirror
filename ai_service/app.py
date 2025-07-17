import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import datetime
import logging
import openai
from typing import Optional, Dict, Any

# Azure deployment trigger - hybrid AI system implementation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── BOOK CONTENT ─────────────────────────────────────────────────────────────
BOOK_CHAPTERS = {
    "communication": {
        "chapter_title": "Chapter 2: Communication and Emotional Awareness",
        "chapter_excerpt": """
Effective communication is the cornerstone of any healthy relationship. This chapter explores how to build better communication habits through empathy, active listening, and emotional awareness.

Key Principles:
• Practice active listening without interrupting
• Use "I feel" statements instead of "You always" accusations
• Validate your partner's emotions before offering solutions
• Take breaks during heated discussions to prevent escalation
• Express appreciation and gratitude regularly

Remember: Communication is not just about talking—it's about creating understanding and connection.
        """.strip(),
        "recommendation_reason": "Your communication score indicates room for improvement in how you express and receive messages in relationships."
    },
    "trust": {
        "chapter_title": "Chapter 3: Building Trust in Relationships",
        "chapter_excerpt": """
Trust is foundational in any relationship. This chapter outlines frameworks for rebuilding and strengthening trust after conflict or betrayal.

Key Principles:
• Be consistent in your words and actions
• Follow through on promises, no matter how small
• Be transparent about your feelings and intentions
• Give your partner the benefit of the doubt
• Rebuild trust through small, consistent actions over time

Remember: Trust is earned through consistent behavior, not grand gestures.
        """.strip(),
        "recommendation_reason": "Your trust score suggests you may need to work on building or maintaining trust in your relationships."
    },
    "affection": {
        "chapter_title": "Chapter 1: Consistent Effort and Affection",
        "chapter_excerpt": """
Affection is not just about grand gestures but about consistent effort in daily interactions. This chapter focuses on showing love through small, meaningful actions.

Key Principles:
• Express affection through physical touch (hugs, hand-holding)
• Use words of affirmation and appreciation daily
• Create small moments of connection throughout the day
• Remember important dates and preferences
• Show interest in your partner's life and experiences

Remember: Small, consistent acts of affection build stronger bonds than occasional grand gestures.
        """.strip(),
        "recommendation_reason": "Your affection score indicates you could benefit from more consistent expressions of love and care."
    },
    "empathy": {
        "chapter_title": "Chapter 4: Developing Emotional Intelligence",
        "chapter_excerpt": """
Emotional intelligence is crucial for understanding and responding to your partner's needs. This chapter teaches you how to develop deeper empathy and emotional awareness.

Key Principles:
• Practice perspective-taking in conflicts
• Recognize and validate your partner's emotions
• Respond to emotions before trying to solve problems
• Develop self-awareness about your own emotional triggers
• Learn to read non-verbal cues and body language

Remember: Empathy is a skill that can be developed with practice and intention.
        """.strip(),
        "recommendation_reason": "Your empathy score suggests you could enhance your ability to understand and connect with your partner's emotions."
    },
    "shared_goals": {
        "chapter_title": "Chapter 5: Aligning Visions and Goals",
        "chapter_excerpt": """
Shared goals create a strong foundation for long-term relationship success. This chapter helps you identify, communicate, and work toward common objectives.

Key Principles:
• Have regular conversations about your future together
• Identify both individual and shared goals
• Create actionable steps toward your shared vision
• Celebrate progress and milestones together
• Be flexible and willing to adjust goals as you grow

Remember: Shared goals give your relationship direction and purpose.
        """.strip(),
        "recommendation_reason": "Your shared goals score indicates you may need to better align your vision and objectives with your partner."
    }
}

# ─── HYBRID AI AND RULE-BASED LOGIC ──────────────────────────────────────────
def get_ai_response(user_input: str, user_context: Dict[str, Any], chat_history: list) -> Optional[str]:
    """Attempt to get AI response from OpenAI"""
    try:
        # Check if OpenAI API key is available
        if not os.environ.get("OPENAI_API_KEY"):
            logger.warning("⚠️ OpenAI API key not available, using fallback")
            return None
        
        # Get relevant book context for the user's question
        relevant_chunks = get_relevant_context(user_input, list(BOOK_CHAPTERS.values()))
        book_context = "\n\n".join([chunk["chapter_excerpt"] for chunk in relevant_chunks]) if relevant_chunks else "No specific book context found."
        
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

        # Initialize OpenAI client
        client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        
        # Make API call
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
            timeout=30
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"✅ AI response generated successfully for user: {user_context.get('profile', {}).get('name', 'User')}")
        return ai_response
        
    except Exception as e:
        logger.error(f"❌ AI response failed: {str(e)}")
        return None

def get_relevant_context(query: str, chapters: list, max_chunks: int = 2) -> list:
    """Get relevant book chapters based on user query"""
    query_lower = query.lower()
    relevant_chapters = []
    
    for chapter in chapters:
        chapter_text = f"{chapter['chapter_title']} {chapter['chapter_excerpt']}".lower()
        # Simple relevance scoring
        score = sum(1 for word in query_lower.split() if word in chapter_text)
        if score > 0:
            relevant_chapters.append((score, chapter))
    
    # Sort by relevance and return top chapters
    relevant_chapters.sort(key=lambda x: x[0], reverse=True)
    return [chapter for _, chapter in relevant_chapters[:max_chunks]]

def get_fallback_recommendation(assessment_scores: Dict[str, int]) -> Dict[str, str]:
    """Get book chapter recommendation based on lowest assessment score (fallback)"""
    if not assessment_scores:
        return BOOK_CHAPTERS["communication"]  # Default fallback
    
    # Find the category with the lowest score
    lowest_score = float('inf')
    lowest_category = None
    
    for category, score in assessment_scores.items():
        if category in BOOK_CHAPTERS and score < lowest_score:
            lowest_score = score
            lowest_category = category
    
    # If no valid categories found, return default
    if lowest_category is None:
        return BOOK_CHAPTERS["communication"]
    
    return BOOK_CHAPTERS[lowest_category]

def generate_hybrid_response(user_input: str, user_context: Dict[str, Any], chat_history: list) -> Dict[str, Any]:
    """Generate response using AI first, fallback to book chapters if AI fails"""
    
    # Attempt AI response first
    ai_response = get_ai_response(user_input, user_context, chat_history)
    
    if ai_response:
        # AI succeeded - return AI response
        return {
            "success": True,
            "response": ai_response,
            "response_type": "ai_generated",
            "source": "OpenAI GPT-3.5-turbo"
        }
    else:
        # AI failed - use fallback book recommendation
        logger.info("📚 Using fallback book recommendation")
        fallback = get_fallback_recommendation(user_context.get('assessment_scores', {}))
        
        return {
            "success": True,
            "response": f"Based on your assessment scores, I recommend focusing on:\n\n**{fallback['chapter_title']}**\n\n{fallback['chapter_excerpt']}\n\n**Why this recommendation?**\n{fallback['recommendation_reason']}",
            "response_type": "book_fallback",
            "source": "The Cog Effect Book",
            "chapter_title": fallback['chapter_title'],
            "chapter_excerpt": fallback['chapter_excerpt'],
            "recommendation_reason": fallback['recommendation_reason']
        }

# Initialize service
logger.info("✅ LoveMirror Hybrid AI and Book Recommendation Service initialized")

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
        health_status = {
            "status": "healthy",
            "timestamp": datetime.datetime.now().isoformat(),
            "service": "LoveMirror Hybrid AI and Book Recommendation Service",
            "version": "3.0.0",
            "features": {
                "book_chapters": len(BOOK_CHAPTERS),
                "ai_enabled": bool(os.environ.get("OPENAI_API_KEY")),
                "response_logic": "hybrid_ai_fallback",
                "ai_model": "gpt-3.5-turbo" if os.environ.get("OPENAI_API_KEY") else "disabled"
            }
        }
        
        return jsonify(health_status), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }), 503

@app.route('/api/chat', methods=['POST'])
def chat():
    """Hybrid AI chat endpoint - tries AI first, falls back to book chapters"""
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
        user_name = user_context.get('profile', {}).get('name', 'User')
        logger.info(f"Chat request from user: {user_name}")
        
        # Generate hybrid response (AI first, fallback to book chapters)
        result = generate_hybrid_response(user_input, user_context, chat_history)
        
        return jsonify({
            "success": True,
            "response": result["response"],
            "response_type": result["response_type"],
            "source": result["source"],
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

@app.route('/api/recommendation', methods=['POST'])
def get_chapter_recommendation():
    """Get book chapter recommendation based on assessment scores (fallback only)"""
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        assessment_scores = data.get('assessment_scores', {})
        user_context = data.get('user_context', {})
        
        if not assessment_scores:
            return jsonify({"error": "No assessment scores provided"}), 400
        
        # Get fallback recommendation
        fallback = get_fallback_recommendation(assessment_scores)
        
        # Log the request
        user_name = user_context.get('profile', {}).get('name', 'User')
        logger.info(f"Fallback recommendation request from user: {user_name}")
        
        return jsonify({
            "success": True,
            "recommended_chapter": fallback["chapter_title"],
            "chapter_title": fallback["chapter_title"],
            "chapter_excerpt": fallback["chapter_excerpt"],
            "recommendation_reason": fallback["recommendation_reason"],
            "assessment_scores_used": assessment_scores,
            "response_type": "book_fallback",
            "source": "The Cog Effect Book",
            "timestamp": datetime.datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Recommendation endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/api/chapters', methods=['GET'])
def get_all_chapters():
    """Get all available book chapters"""
    try:
        chapters = []
        for category, content in BOOK_CHAPTERS.items():
            chapters.append({
                "category": category,
                "chapter_title": content["chapter_title"],
                "chapter_excerpt": content["chapter_excerpt"]
            })
        
        return jsonify({
            "success": True,
            "chapters": chapters,
            "total_chapters": len(chapters),
            "timestamp": datetime.datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Chapters endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service information"""
    return jsonify({
        "service": "LoveMirror Hybrid AI and Book Recommendation Service",
        "version": "3.0.0",
        "status": "running",
        "description": "Hybrid system: AI responses with book chapter fallback",
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat",
            "recommendation": "/api/recommendation",
            "chapters": "/api/chapters"
        },
        "features": {
            "ai_enabled": bool(os.environ.get("OPENAI_API_KEY")),
            "fallback_system": "book_chapters",
            "response_types": ["ai_generated", "book_fallback"]
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