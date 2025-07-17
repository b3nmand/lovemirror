import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import logging

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

# ─── RECOMMENDATION LOGIC ────────────────────────────────────────────────────
def get_recommendation(assessment_scores):
    """Get book chapter recommendation based on lowest assessment score"""
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
            "service": "LoveMirror Book Recommendation Service",
            "version": "2.0.0",
            "features": {
                "book_chapters": len(BOOK_CHAPTERS),
                "recommendation_logic": "score-based"
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

@app.route('/api/recommendation', methods=['POST'])
def get_chapter_recommendation():
    """Get book chapter recommendation based on assessment scores"""
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        assessment_scores = data.get('assessment_scores', {})
        user_context = data.get('user_context', {})
        
        if not assessment_scores:
            return jsonify({"error": "No assessment scores provided"}), 400
        
        # Get recommendation
        recommendation = get_recommendation(assessment_scores)
        
        # Log the request
        user_name = user_context.get('profile', {}).get('name', 'User')
        logger.info(f"Recommendation request from user: {user_name}")
        
        return jsonify({
            "success": True,
            "recommended_chapter": recommendation["chapter_title"],
            "chapter_title": recommendation["chapter_title"],
            "chapter_excerpt": recommendation["chapter_excerpt"],
            "recommendation_reason": recommendation["recommendation_reason"],
            "assessment_scores_used": assessment_scores,
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

@app.route('/favicon.ico')
def favicon():
    """Serve favicon"""
    return send_from_directory(
        os.path.join(app.root_path, 'static'),
        'favicon.ico', 
        mimetype='image/vnd.microsoft.icon'
    )

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service information"""
    return jsonify({
        "service": "LoveMirror Book Recommendation Service",
        "version": "2.0.0",
        "status": "running",
        "description": "Simplified recommendation system based on assessment scores",
        "endpoints": {
            "health": "/health",
            "recommendation": "/api/recommendation",
            "chapters": "/api/chapters"
        },
        "timestamp": datetime.datetime.now().isoformat()
    }), 200

# ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False) 