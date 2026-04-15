from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import os

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    keyword: str

# Global variables (initially empty to save RAM)
index = None
vocab = None
model = None

def get_ai_resources():
    """Loads the AI components only when the first request arrives."""
    global index, vocab, model
    
    if model is None:
        print("🤖 Loading AI Model (Lazy Load)...")
        # Using a very small, efficient model to stay under 512MB
        model = SentenceTransformer("all-MiniLM-L6-v2")
    
    if index is None or vocab is None:
        print("📥 Loading Index and Vocab...")
        try:
            # Important: Use absolute paths if files are in the same folder
            base_path = os.path.dirname(__file__)
            index_path = os.path.join(base_path, "words.index")
            vocab_path = os.path.join(base_path, "vocab.pkl")

            if os.path.exists(index_path) and os.path.exists(vocab_path):
                index = faiss.read_index(index_path)
                with open(vocab_path, "rb") as f:
                    vocab = pickle.load(f)
                print("✅ AI Resources Loaded successfully")
            else:
                print(f"❌ Missing files at: {base_path}")
        except Exception as e:
            print(f"❌ Error loading files: {e}")

@app.get("/")
def home():
    return {"message": "AI Keyword Expander is Ready"}

@app.get("/health")
def health():
    return {"status": "healthy", "port": os.environ.get("PORT", 8000)}

@app.post("/expand")
def expand(req: RequestBody):
    global index, vocab, model
    
    # Trigger lazy load if not already loaded
    get_ai_resources()
    
    word = req.keyword.lower().strip()
    
    if not index or not model or not vocab:
        raise HTTPException(status_code=500, detail="AI Index could not be loaded on the server.")

    # AI Search Logic
    query_vector = model.encode([word]).astype("float32")
    distances, indices = index.search(query_vector, 12)
    
    results = []
    for i in indices[0]:
        if i != -1 and i < len(vocab):
            res_word = vocab[i]
            if res_word != word:
                results.append(res_word)
    
    return {
        "keyword": word, 
        "keywords": list(dict.fromkeys(results))[:8] 
    }

if __name__ == "__main__":
    # Render requires binding to 0.0.0.0 and the assigned $PORT
    port = int(os.environ.get("PORT", 8000))
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
