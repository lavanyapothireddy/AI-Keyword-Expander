from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nltk.corpus import wordnet as wn
import nltk

# Download only once (safe even if already exists)
nltk.download("wordnet")
nltk.download("omw-1.4")

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Request(BaseModel):
    keyword: str


def get_synonyms(word: str):
    synonyms = set()

    # WordNet expansion (works for MOST words)
    for syn in wn.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ")
            if name.lower() != word.lower():
                synonyms.add(name)

    return list(synonyms)


@app.post("/expand")
def expand(req: Request):
    word = req.keyword.strip().lower()

    results = get_synonyms(word)

    # fallback if nothing found
    if not results:
        return {
            "keyword": word,
            "keywords": []
        }

    return {
        "keyword": word,
        "keywords": results[:10]   # limit output
    }
