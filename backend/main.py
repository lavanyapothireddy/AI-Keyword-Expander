from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import os

app = FastAPI()

# --- CORS SETUP (Crucial for Website to talk to Backend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the data structure the backend expects
class RequestBody(BaseModel):
    keyword: str

# Global variables
index = None
vocab = None
model = None

@app.on_event("startup")
def load_ai():
    global index, vocab, model
    try:
        # These files must be in the same folder as main.py
        if os.path.exists("words.index") and os.path.exists("vocab.pkl"):
            index = faiss.read_index("words.index")
            with open("vocab.pkl", "rb") as f:
                vocab = pickle.load(f)
            model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ AI Engine Started Successfully")
        else:
            print("⚠️ Warning: words.index or vocab.pkl missing!")
    except Exception as e:
        print(f"❌ Error during startup: {e}")

@app.get("/")
def home():
    return {"message": "AI Keyword Expander is Live 🚀"}

@app.get("/health")
def health():
    return {"index_loaded": index is not None, "vocab_loaded": vocab is not None}

@app.post("/expand")
def expand(req: RequestBody):
    word = req.keyword.lower().strip()
    
    if not index or not model or not vocab:
        raise HTTPException(status_code=500, detail="AI Index not loaded")

    # AI Search Logic
    query_vector = model.encode([word]).astype("float32")
    distances, indices = index.search(query_vector, 10)
    
    results = []
    for i in indices[0]:
        if i != -1 and i < len(vocab):
            res_word = vocab[i]
            if res_word != word:
                results.append(res_word)
    
    return {
        "keyword": word,
        "keywords": list(set(results))[:8] # Returns top 8 unique keywords
    }
