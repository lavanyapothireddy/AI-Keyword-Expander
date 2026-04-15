from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import faiss
import pickle
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load FAISS + vocab only (LIGHTWEIGHT)
index = faiss.read_index("words.index")

with open("vocab.pkl", "rb") as f:
    vocab = pickle.load(f)


class InputData(BaseModel):
    keyword: str


@app.get("/")
def home():
    return {"message": "AI Keyword Expander Running 🚀"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/expand")
def expand(data: InputData):
    word = data.keyword.lower().strip()

    # ⚡ FAISS search only (NO MODEL)
    vec = np.random.rand(384).astype("float32")  # dummy vector for demo
    distances, indices = index.search(np.array([vec]), 10)

    results = []
    for i in indices[0]:
        results.append(vocab[i])

    return {
        "input": word,
        "keywords": results[:10]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
