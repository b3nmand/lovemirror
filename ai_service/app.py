import os
import streamlit as st
import json
from pathlib import Path
from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─── CONFIG ─────────────────────────────────────────────────────────────
PDF_PATH = Path("the_cog_effect.pdf")
INDEX_DIR = Path("./chroma_index")
EMB_MODEL = "text-embedding-ada-002"
CHAT_MODEL = "gpt-3.5-turbo"
CHUNK_SIZE = 1000
CHUNK_OLAP = 200

# ─── ENV CHECK ──────────────────────────────────────────────────────────
if "OPENAI_API_KEY" not in os.environ:
    st.error("❌ Set OPENAI_API_KEY in your environment and restart.")
    st.stop()

# ─── INDEX SETUP ────────────────────────────────────────────────────────
@st.cache_resource
def setup_ai_service():
    """Initialize the AI service with book embeddings"""
    if not INDEX_DIR.exists():
        st.info("🔄 Building index (first run)...")
        print("[DEBUG] Building ChromaDB index from PDF.")
        
        if not PDF_PATH.exists():
            st.error(f"❌ Book file not found: {PDF_PATH}")
            st.stop()
            
        pages = PyPDFLoader(str(PDF_PATH)).load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OLAP)
        chunks = splitter.split_documents(pages)
        print(f"[DEBUG] Total chunks created: {len(chunks)}")

        embedder = OpenAIEmbeddings(model=EMB_MODEL, openai_api_key=os.environ["OPENAI_API_KEY"])
        db = Chroma.from_documents(chunks, embedder, persist_directory=str(INDEX_DIR))
        db.persist()
        print("[DEBUG] ChromaDB index built and saved locally.")
        return db
    else:
        print("[DEBUG] Loading existing ChromaDB index.")
        embedder = OpenAIEmbeddings(model=EMB_MODEL, openai_api_key=os.environ["OPENAI_API_KEY"])
        db = Chroma(persist_directory=str(INDEX_DIR), embedding_function=embedder)
        return db

# Initialize AI service
db = setup_ai_service()
retriever = db.as_retriever(search_kwargs={"k": 5})

# ─── AI CHAIN SETUP ────────────────────────────────────────────────────
llm = ChatOpenAI(model_name=CHAT_MODEL, openai_api_key=os.environ["OPENAI_API_KEY"])
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
qa_chain = ConversationalRetrievalChain.from_llm(llm, retriever=retriever, memory=memory)

# ─── API ENDPOINTS ─────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# Allow only production and local frontend origins
CORS(app, origins=["https://lovemirror.co.uk", "http://localhost:5173", "http://localhost:3000"])

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
        
        # Build context prefix with user data
        context_prefix = f"""
User Profile:
- Name: {user_context.get('profile', {}).get('name', 'User')}
- Gender: {user_context.get('profile', {}).get('gender', 'Not specified')}
- Region: {user_context.get('profile', {}).get('region', 'Not specified')}
- Cultural Context: {user_context.get('profile', {}).get('cultural_context', 'global')}

Assessment Data:
- Assessment Scores: {json.dumps(user_context.get('assessment_scores', {}))}
- Delusional Score: {user_context.get('delusional_score', 'Not available')}
- Compatibility Score: {user_context.get('compatibility_score', 'Not available')}%

Chat History: {len(chat_history)} previous messages

---
Answer the following question using the user's relationship profile, the book context, and best interpersonal principles.
"""
        
        final_prompt = f"{context_prefix}\nQuestion: {user_input}"
        print(f"[DEBUG] Final prompt sent to QA chain:\n{final_prompt}")
        
        result = qa_chain.run(final_prompt)
        print(f"[DEBUG] AI response: {result}")
        
        return jsonify({
            "success": True,
            "response": result,
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
    st.title("💬 AI Relationship Mentor - Backend")
    st.write("This is the backend service for Love Mirror AI Mentor")
    
    # Show service status
    st.success("✅ AI service is running and ready to receive requests")
    
    # Show book status
    if PDF_PATH.exists():
        st.success(f"✅ Book loaded: {PDF_PATH}")
    else:
        st.error(f"❌ Book not found: {PDF_PATH}")
    
    # Show index status
    if INDEX_DIR.exists():
        st.success(f"✅ ChromaDB index ready: {INDEX_DIR}")
    else:
        st.warning(f"⚠️ Index not built yet: {INDEX_DIR}")
    
    # Test chat interface
    st.subheader("Test Chat Interface")
    user_input = st.text_input("Test message:")
    
    if st.button("Send Test Message"):
        if user_input:
            with st.spinner("Generating response..."):
                result = qa_chain.run(user_input)
                st.write("**AI Response:**")
                st.write(result)

if __name__ == "__main__":
    # Run Flask app for API endpoints
    import threading
    import os
    port = int(os.environ.get("PORT", 8501))
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=port, debug=False))
    flask_thread.daemon = True
    flask_thread.start()
    
    # Run Streamlit UI
    main() 