from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

class Request(BaseModel):
    keyword: str


# 🔥 LOAD WORD LIST FROM FILE
def load_vocab():
    with open("backend/words.txt", "r", encoding="utf-8") as f:
        words = [w.strip().lower() for w in f.readlines() if w.strip()]
    return list(set(words))


VOCAB = load_vocab()

# Precompute embeddings (important for speed)
VOCAB_EMB = model.encode(VOCAB, convert_to_tensor=True)


@app.post("/expand")
def expand(req: Request):
    word = req.keyword.lower().strip()

    if not word:
        return {"error": "Empty input"}

    # Encode input
    word_emb = model.encode(word, convert_to_tensor=True)

    # Similarity
    scores = util.cos_sim(word_emb, VOCAB_EMB)[0]

    # Sort results
    top_results = scores.argsort(descending=True)

    results = []
    for idx in top_results:
        candidate = VOCAB[int(idx)]

        if candidate != word and candidate not in results:
            results.append(candidate)

        if len(results) == 8:
            break

    return {
        "keyword": word,
        "keywords": results
    }
