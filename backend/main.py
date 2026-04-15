from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("all-MiniLM-L6-v2")

index = faiss.read_index("words.index")

with open("vocab.pkl", "rb") as f:
    vocab = pickle.load(f)


class InputData(BaseModel):
    keyword: str


# 🟢 HEALTH CHECK (NEW)
@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "AI Keyword Expander is running 🚀"
    }


@app.get("/")
def home():
    return {"message": "AI Keyword Expander API Running"}


@app.post("/expand")
def expand(data: InputData):
    word = data.keyword.strip().lower()

    vec = model.encode([word]).astype("float32")

    distances, indices = index.search(vec, 10)

    result = []
    for i in indices[0]:
        w = vocab[i]
        if w != word:
            result.append(w)

    return {
        "input": word,
        "keywords": result[:10]
    }


# Render support
if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port
    )
