from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import nltk
from nltk.corpus import words

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("all-MiniLM-L6-v2")

# download once
nltk.download("words")

# 🔥 REAL VOCABULARY (NOT MANUAL)
VOCAB = list(set(words.words()))  # 200k+ English words


class InputData(BaseModel):
    keyword: str


@app.post("/expand")
def expand_keyword(data: InputData):
    keyword = data.keyword.strip().lower()

    input_vec = model.encode(keyword, convert_to_tensor=True)

    scored = []

    # search across REAL language vocabulary
    for w in VOCAB:
        if len(w) < 3:
            continue

        vec = model.encode(w, convert_to_tensor=True)
        score = util.cos_sim(input_vec, vec).item()

        scored.append((w.lower(), score))

    # sort by similarity
    scored.sort(key=lambda x: x[1], reverse=True)

    # remove exact match
    result = [w for w, s in scored if w != keyword][:10]

    return {
        "input": keyword,
        "keywords": result
    }