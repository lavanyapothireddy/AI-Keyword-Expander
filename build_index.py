from sentence_transformers import SentenceTransformer
from nltk.corpus import words
import nltk
import faiss
import numpy as np
import pickle

nltk.download("words")

model = SentenceTransformer("all-MiniLM-L6-v2")

vocab = list(set(words.words()))[:50000]

embeddings = model.encode(vocab, show_progress_bar=True)
embeddings = np.array(embeddings).astype("float32")

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

faiss.write_index(index, "words.index")

with open("vocab.pkl", "wb") as f:
    pickle.dump(vocab, f)

print("Index ready")
