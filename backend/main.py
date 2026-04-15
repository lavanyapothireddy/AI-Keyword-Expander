from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import faiss
import pickle
import numpy as np
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

index = None
vocab = None


@app.on_event("startup")
def load_data():
    global index, vocab

    try:
        index = faiss.read_index("words.index")

        with open("vocab.pkl", "rb") as f:
            vocab = pickle.load(f)

        print("✅ Loaded FAISS + vocab")

    except Exception as e:
        print("❌ Startup error:", e)


class InputData(BaseModel):
    keyword: str

@app.get("/")
def home():
    return {"message": "AI Keyword Expander Running 🚀"}
@app.get("/health")
def health():
    return {
        "status": "ok",
        "index_loaded": index is not None,
        "vocab_loaded": vocab is not None
    }


@app.post("/expand")
def expand(data: InputData):
    word = data.keyword.lower().strip()

    vec = np.random.rand(384).astype("float32")
    distances, indices = index.search(np.array([vec]), 10)

    results = [vocab[i] for i in indices[0]]

    return {
        "input": word,
        "keywords": results
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
