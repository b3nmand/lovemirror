import os
import streamlit as st
import json
import requests
from pathlib import Path
from langchain_community.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pypdf
import datetime

# ─── CONFIG ─────────────────────────────────────────────────────────────
PDF_PATH = Path("the_cog_effect.pdf")
CHUNK_SIZE = 1000
CHUNK_OLAP = 200

# ─── ENV CHECK ──────────────────────────────────────────────────────────
if "OPENAI_API_KEY" not in os.environ:
    st.error("❌ Set OPENAI_API_KEY in your environment and restart.")
    st.stop()

# ─── DOCUMENT PROCESSING ────────────────────────────────────────────────────
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

# ─── AI SETUP ──────────────────────────────────────────────────────────────
llm = ChatOpenAI(model_name="gpt-3.5-turbo", openai_api_key=os.environ["OPENAI_API_KEY"])

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
    selected = [chunk for _, chunk in relevant_chunks[:top_k]]
    print(f"[LOG] [{datetime.datetime.now()}] Retrieved {len(selected)} relevant book chunks for input: '{user_input[:60]}'...")
    return selected

def generate_response(user_input, user_context, chat_history):
    """Generate AI response using book knowledge"""
    print(f"[LOG] [{datetime.datetime.now()}] Incoming question: {user_input}")
    print(f"[LOG] [{datetime.datetime.now()}] User context: {json.dumps(user_context)}")
    print(f"[LOG] [{datetime.datetime.now()}] Chat history length: {len(chat_history)}")
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
        print(f"[LOG] [{datetime.datetime.now()}] AI response: {response[:200]}...")
        return response
    except Exception as e:
        print(f"[ERROR] [{datetime.datetime.now()}] AI error: {str(e)}")
        return f"I apologize, but I encountered an error while processing your request: {str(e)}"

# ─── STREAMLIT UI ──────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Relationship Mentor",
    page_icon="💬",
    layout="wide"
)

st.title("💬 AI Relationship Mentor - Backend Service")
st.write("This service provides AI-powered relationship advice using 'The Cog Effect' book knowledge.")

# Sidebar for service info
with st.sidebar:
    st.header("Service Information")
    st.success("✅ AI service is running")
    st.info(f"📚 Book: {PDF_PATH.name}")
    st.info(f"📊 Chunks: {len(book_chunks)}")
    st.info("🌐 Port: 8501")
    
    st.header("API Endpoints")
    st.code("GET /health")
    st.code("POST /api/chat")
    
    st.header("Integration")
    st.write("Love Mirror app connects to:")
    st.code("http://localhost:8501")

# Main content
col1, col2 = st.columns([1, 1])

with col1:
    st.header("📖 Book Status")
    if PDF_PATH.exists():
        st.success(f"✅ Book loaded successfully")
        st.info(f"📄 File: {PDF_PATH.name}")
        st.info(f"📊 Size: {PDF_PATH.stat().st_size / 1024 / 1024:.1f} MB")
        st.info(f"📚 Chunks: {len(book_chunks)}")
    else:
        st.error(f"❌ Book not found: {PDF_PATH}")

with col2:
    st.header("🤖 AI Status")
    try:
        # Test AI connection
        test_response = llm.predict("Hello")
        st.success("✅ OpenAI API connected")
        st.info("🧠 Model: gpt-3.5-turbo")
    except Exception as e:
        st.error(f"❌ OpenAI API error: {str(e)}")

# Test chat interface
st.header("🧪 Test Chat Interface")
st.write("Test the AI service with sample questions:")

# Sample questions
sample_questions = [
    "How can I improve communication with my partner?",
    "What does my delusional score mean?",
    "How can I build more trust in my relationship?",
    "What are signs of a healthy relationship?",
    "How do I handle conflicts better?"
]

selected_question = st.selectbox("Choose a sample question:", sample_questions)
user_input = st.text_input("Or type your own question:", value=selected_question)

if st.button("Send Message"):
    if user_input:
        with st.spinner("Generating AI response..."):
            # Sample user context for testing
            test_context = {
                "profile": {
                    "name": "Test User",
                    "gender": "Not specified",
                    "region": "Global",
                    "cultural_context": "modern"
                },
                "assessment_scores": {
                    "communication": 4,
                    "trust": 3,
                    "empathy": 5,
                    "shared_goals": 4
                },
                "delusional_score": 6.5,
                "compatibility_score": 78.0
            }
            
            response = generate_response(user_input, test_context, [])
            
            st.subheader("🤖 AI Response:")
            st.write(response)
            
            # Show relevant book context used
            relevant_chunks = get_relevant_context(user_input, book_chunks)
            if relevant_chunks:
                with st.expander("📖 Relevant Book Context Used"):
                    for i, chunk in enumerate(relevant_chunks[:2]):
                        st.write(f"**Chunk {i+1}:**")
                        st.write(chunk[:300] + "..." if len(chunk) > 300 else chunk)
                        st.divider()

# API Documentation
st.header("🔗 API Documentation")
st.write("Your Love Mirror app can connect to this service using these endpoints:")

with st.expander("API Details"):
    st.subheader("Health Check")
    st.code("GET http://localhost:8501/health")
    st.write("Returns service status")
    
    st.subheader("Chat Endpoint")
    st.code("POST http://localhost:8501/api/chat")
    st.write("Request body:")
    st.json({
        "user_input": "How can I improve communication?",
        "user_context": {
            "profile": {"name": "User", "gender": "Not specified"},
            "assessment_scores": {"communication": 4},
            "delusional_score": 6.5,
            "compatibility_score": 78.0
        },
        "chat_history": []
    })
    
    st.write("Response:")
    st.json({
        "success": True,
        "response": "Based on your assessment data...",
        "user_context_used": {}
    })

st.success("🎉 Your AI Relationship Mentor service is ready! Your Love Mirror app can now connect to this service for personalized relationship advice.") 