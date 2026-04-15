from sentence_transformers import SentenceTransformer
from nltk.corpus import words
import nltk
import faiss
import numpy as np
import pickle

nltk.download("words")

print("Loading model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Loading vocabulary...")
vocab = list(set(words.words()))[:50000]  # limit for performance

print("Encoding words...")
embeddings = model.encode(vocab, show_progress_bar=True)

embeddings = np.array(embeddings).astype("float32")

print("Building FAISS index...")
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

# save index
faiss.write_index(index, "words.index")

# save vocab
with open("vocab.pkl", "wb") as f:
    pickle.dump(vocab, f)

print("DONE: Index created successfully")
