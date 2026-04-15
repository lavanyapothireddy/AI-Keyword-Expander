from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import os

app = FastAPI()

# CORS (frontend support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI model (lightweight)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load FAISS index
index = faiss.read_index("words.index")

# Load vocabulary
with open("vocab.pkl", "rb") as f:
    vocab = pickle.load(f)


class InputData(BaseModel):
    keyword: str


@app.get("/")
def home():
    return {"message": "AI Keyword Expander Running 🚀"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AI Keyword Expander",
        "message": "Backend is running successfully 🚀"
    }
@app.post("/expand")
def expand(data: InputData):
    word = data.keyword.strip().lower()

    # convert input to vector
    vec = model.encode([word]).astype("float32")

    # search similar words
    distances, indices = index.search(vec, 10)

    results = []

    for i in indices[0]:
        w = vocab[i]
        if w != word:
            results.append(w)

    return {
        "input": word,
        "keywords": results[:10]
    }


# Render compatibility
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
