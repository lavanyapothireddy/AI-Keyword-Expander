from sentence_transformers import SentenceTransformer
from nltk.corpus import words
import nltk
import faiss
import numpy as np
import pickle

# 1. Download word list
nltk.download("words")

print("Loading AI model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Preparing vocabulary...")
# Using 20,000 words keeps the file size small and fast
all_words = list(set(w.lower() for w in words.words() if w.isalpha()))
vocab = all_words[:20000] 

print(f"Encoding {len(vocab)} words... (This may take a minute)")
embeddings = model.encode(vocab, show_progress_bar=True)
embeddings = np.array(embeddings).astype("float32")

print("Building FAISS index...")
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# Save the files
faiss.write_index(index, "words.index")
with open("vocab.pkl", "wb") as f:
    pickle.dump(vocab, f)

print("✅ DONE! You now have a real words.index and vocab.pkl")
