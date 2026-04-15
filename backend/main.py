from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nltk.corpus import wordnet as wn
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import os
import nltk

# Download necessary NLTK data
nltk.download('wordnet')
nltk.download('omw-1.4')

app = FastAPI()

# --- CORS SETUP ---
# This allows your frontend (wherever it's hosted) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for AI components
index = None
vocab = None
model = None

@app.on_event("startup")
def load_data():
    global index, vocab, model
    try:
        # 1. Load the FAISS index
        if os.path.exists("words.index"):
            index = faiss.read_index("words.index")
        
        # 2. Load the Vocabulary
        if os.path.exists("vocab.pkl"):
            with open("vocab.pkl", "rb") as f:
                vocab = pickle.load(f)
        
        # 3. Load the AI Model (Small and fast for Render)
        model = SentenceTransformer("all-MiniLM-L6-v2")

        print("✅ AI Model & FAISS Index Loaded")
    except Exception as e:
        print(f"❌ Startup error: {e}")

class InputData(BaseModel):
    keyword: str

@app.get("/")
def home():
    return {"message": "AI Keyword Expander is Live 🚀"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "index": index is not None,
        "vocab": vocab is not None,
        "model": model is not None
    }

def clean(w):
    # Basic cleaning: only letters, reasonable length
    return w.isalpha() and len(w) <= 15

@app.post("/expand")
def expand(data: InputData):
    word = data.keyword.lower().strip()
    synonyms = set()

    # --- PHASE 1: AI SEMANTIC SEARCH ---
    if index is not None and model is not None and vocab is not None:
        query_vector = model.encode([word]).astype("float32")
        distances, indices = index.search(query_vector, 12) # Get top 12
        
        for idx in indices[0]:
            if idx != -1 and idx < len(vocab):
                w = vocab[idx].lower()
                if w != word and clean(w):
                    synonyms.add(w)

    # --- PHASE 2: WORDNET FALLBACK ---
    for pos in [wn.NOUN, wn.VERB, wn.ADJ, wn.ADV]:
        synsets = wn.synsets(word, pos=pos)
        for syn in synsets:
            for lemma in syn.lemmas():
                w = lemma.name().replace("_", " ").lower()
                if w != word and clean(w):
                    synonyms.add(w)

    # Limit to top 10 unique results
    result = sorted(list(synonyms))[:10]

    return {
        "input": word,
        "keywords": result
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
