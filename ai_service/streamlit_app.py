import os
import streamlit as st
import json
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

# ─── AI SETUP ─────────────────────────────────────────────────────────────
@st.cache_resource
def setup_ai():
    """Initialize OpenAI chat model"""
    return ChatOpenAI(
        model_name="gpt-3.5-turbo",
        openai_api_key=os.environ["OPENAI_API_KEY"],
        temperature=0.7
    )

llm = setup_ai()

# ─── CONTEXT RETRIEVAL ────────────────────────────────────────────────────
def get_relevant_context(query, chunks, max_chunks=3):
    """Get relevant chunks based on simple keyword matching"""
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
        return response
        
    except Exception as e:
        st.error(f"Error generating response: {str(e)}")
        return "I apologize, but I'm having trouble generating a response right now. Please try again."

# ─── STREAMLIT UI ──────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Relationship Mentor",
    page_icon="💬",
    layout="wide"
)

st.title("💬 AI Relationship Mentor")
st.write("Get personalized relationship advice based on 'The Cog Effect' book knowledge and your assessment data.")

# Sidebar for service info
with st.sidebar:
    st.header("Service Information")
    st.success("✅ AI service is running")
    st.info(f"📚 Book: {PDF_PATH.name}")
    st.info(f"📊 Chunks: {len(book_chunks)}")
    
    st.header("How to Use")
    st.write("1. Enter your question below")
    st.write("2. Add your assessment context")
    st.write("3. Get personalized advice")

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

# User input section
st.header("💭 Ask Your Question")

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

# User context input
st.subheader("📊 Your Assessment Data (Optional)")
col1, col2 = st.columns(2)

with col1:
    user_name = st.text_input("Your Name:", value="User")
    user_gender = st.selectbox("Gender:", ["Not specified", "Male", "Female", "Other"])
    user_region = st.text_input("Region:", value="Global")

with col2:
    communication_score = st.slider("Communication Score:", 1, 5, 3)
    trust_score = st.slider("Trust Score:", 1, 5, 3)
    empathy_score = st.slider("Empathy Score:", 1, 5, 3)
    shared_goals_score = st.slider("Shared Goals Score:", 1, 5, 3)

delusional_score = st.slider("Delusional Score:", 0.0, 10.0, 5.0, 0.1)
compatibility_score = st.slider("Compatibility Score (%):", 0, 100, 75)

# Generate response
if st.button("Get AI Advice", type="primary"):
    if user_input:
        with st.spinner("Generating personalized advice..."):
            # Build user context
            user_context = {
                "profile": {
                    "name": user_name,
                    "gender": user_gender,
                    "region": user_region,
                    "cultural_context": "modern"
                },
                "assessment_scores": {
                    "communication": communication_score,
                    "trust": trust_score,
                    "empathy": empathy_score,
                    "shared_goals": shared_goals_score
                },
                "delusional_score": delusional_score,
                "compatibility_score": compatibility_score
            }
            
            response = generate_response(user_input, user_context, [])
            
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

# Footer
st.markdown("---")
st.markdown("**Powered by OpenAI GPT-3.5-turbo and 'The Cog Effect' book knowledge**")
st.markdown("*This AI mentor provides personalized relationship advice based on your assessment data and relationship psychology principles.*") 