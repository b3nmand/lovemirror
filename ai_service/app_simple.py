import os
import streamlit as st
import json
from pathlib import Path
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory
from flask import Flask, request, jsonify
from flask_cors import CORS
import pypdf

# ─── CONFIG ─────────────────────────────────────────────────────────────
PDF_PATH = Path("the_cog_effect.pdf")
CHUNK_SIZE = 1000
CHUNK_OLAP = 200

# ─── ENV CHECK ──────────────────────────────────────────────────────────
if "OPENAI_API_KEY" not in os.environ:
    st.error("❌ Set OPENAI_API_KEY in your environment and restart.")
    st.stop()

# ─── DOCUMENT PROCESSING ────────────────────────────────────────────────
@st.cache_resource
def load_book_content():
    """Load and process the book content"""
    if not PDF_PATH.exists():
        st.error(f"❌ Book file not found: {PDF_PATH}")
        st.stop()
    
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
        
        st.success(f"✅ Book loaded: {len(chunks)} chunks created")
        return chunks
        
    except Exception as e:
        st.error(f"❌ Error loading book: {str(e)}")
        st.stop()

# Load book content
book_chunks = load_book_content()

# ─── AI CHAIN SETUP ────────────────────────────────────────────────────
llm = ChatOpenAI(model_name="gpt-3.5-turbo", openai_api_key=os.environ["OPENAI_API_KEY"])
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

def get_relevant_context(user_input, chunks, top_k=3):
    """Simple keyword-based context retrieval"""
    user_words = set(user_input.lower().split())
    relevant_chunks = []
    
    for chunk in chunks:
        chunk_words = set(chunk.lower().split())
        overlap = len(user_words.intersection(chunk_words))
        if overlap > 0:
            relevant_chunks.append((overlap, chunk))
    
    # Sort by relevance and take top k
    relevant_chunks.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in relevant_chunks[:top_k]]

def generate_response(user_input, user_context, chat_history):
    """Generate AI response using book knowledge"""
    # Get relevant book context
    relevant_chunks = get_relevant_context(user_input, book_chunks)
    book_context = "\n\n".join(relevant_chunks) if relevant_chunks else "No specific book content found for this question."
    
    # Build the prompt
    context_prefix = f"""
You are an AI Relationship Mentor with access to "The Cog Effect" book knowledge.

User Profile:
- Name: {user_context.get('profile', {}).get('name', 'User')}
- Gender: {user_context.get('profile', {}).get('gender', 'Not specified')}
- Region: {user_context.get('profile', {}).get('region', 'Not specified')}
- Cultural Context: {user_context.get('profile', {}).get('cultural_context', 'global')}

Assessment Data:
- Assessment Scores: {json.dumps(user_context.get('assessment_scores', {}))}
- Delusional Score: {user_context.get('delusional_score', 'Not available')}
- Compatibility Score: {user_context.get('compatibility_score', 'Not available')}%

Relevant Book Knowledge:
{book_context}

Chat History: {len(chat_history)} previous messages

---
Provide personalized relationship advice using the book knowledge, user's profile, and assessment data. Be empathetic, practical, and culturally aware.
"""
    
    final_prompt = f"{context_prefix}\n\nUser Question: {user_input}\n\nAI Response:"
    
    try:
        response = llm.predict(final_prompt)
        return response
    except Exception as e:
        return f"I apologize, but I encountered an error while processing your request: {str(e)}"

# ─── API ENDPOINTS ─────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "AI service is running"}), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint for Love Mirror integration"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        user_input = data.get('user_input', '')
        user_context = data.get('user_context', {})
        chat_history = data.get('chat_history', [])
        
        if not user_input:
            return jsonify({"error": "No user input provided"}), 400
        
        print(f"[DEBUG] Processing request: {user_input}")
        
        # Generate response
        response = generate_response(user_input, user_context, chat_history)
        
        print(f"[DEBUG] Generated response: {response[:100]}...")
        
        return jsonify({
            "success": True,
            "response": response,
            "user_context_used": user_context
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# ─── STREAMLIT UI (for testing) ────────────────────────────────────────
def main():
    st.title("💬 AI Relationship Mentor - Backend (Simple)")
    st.write("This is the simplified backend service for Love Mirror AI Mentor")
    
    # Show service status
    st.success("✅ AI service is running and ready to receive requests")
    
    # Show book status
    if PDF_PATH.exists():
        st.success(f"✅ Book loaded: {PDF_PATH}")
        st.info(f"📚 Processed {len(book_chunks)} text chunks")
    else:
        st.error(f"❌ Book not found: {PDF_PATH}")
    
    # Test chat interface
    st.subheader("Test Chat Interface")
    user_input = st.text_input("Test message:")
    
    if st.button("Send Test Message"):
        if user_input:
            with st.spinner("Generating response..."):
                response = generate_response(
                    user_input, 
                    {"profile": {"name": "Test User"}}, 
                    []
                )
                st.write("**AI Response:**")
                st.write(response)

if __name__ == "__main__":
    # Run Flask app for API endpoints
    import threading
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=8501, debug=False))
    flask_thread.daemon = True
    flask_thread.start()
    
    # Run Streamlit UI
    main() 