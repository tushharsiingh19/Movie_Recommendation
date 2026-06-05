"""
Movie Recommender - Flask Backend
==================================
Uses a pre-trained cosine-similarity model saved as a pickle file.
Works with the React frontend (MovieRecommender.jsx).

Setup:
  pip install flask flask-cors pandas scikit-learn requests

Run:
  python app.py

Expected files in same directory:
  - movies.pkl     → DataFrame with columns: movie_id, title, tags
  - similarity.pkl → Precomputed cosine similarity matrix (numpy array)

To generate these from TMDB / your dataset, see the notebook section below.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import requests
import os

app = Flask(__name__)
CORS(app)  # Allow React dev server (localhost:3000) to call this API

# ── CONFIG ────────────────────────────────────────────────────────────────────
TMDB_API_KEY = "2ae3b76f4b488d16adecb70bb793a326"   # 🔑 Replace with your TMDB API key
MOVIES_PKL   = "movies.pkl"
SIMILARITY_PKL = "similarity.pkl"

# ── LOAD MODELS ───────────────────────────────────────────────────────────────
movies_df   = None
similarity  = None

def load_models():
    global movies_df, similarity
    if os.path.exists(MOVIES_PKL) and os.path.exists(SIMILARITY_PKL):
        with open(MOVIES_PKL, "rb") as f:
            movies_df = pickle.load(f)
        with open(SIMILARITY_PKL, "rb") as f:
            similarity = pickle.load(f)
        print(f"✅ Loaded {len(movies_df)} movies from pickle files.")
    else:
        print("⚠️  Pickle files not found. Using fallback demo recommendations.")
        _build_demo_model()

def _build_demo_model():
    """
    Builds a tiny demo model so the API works even without pickle files.
    Replace with your real dataset + model training.
    """
    global movies_df, similarity
    from sklearn.feature_extraction.text import CountVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    demo_data = {
        "movie_id": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "title": [
            "The Dark Knight", "Inception", "Interstellar", "The Matrix",
            "Avengers: Endgame", "Iron Man", "The Godfather", "Pulp Fiction",
            "Forrest Gump", "The Shawshank Redemption"
        ],
        "tags": [
            "batman dc superhero action crime gotham dark",
            "dream subconscious heist action thriller mind",
            "space time wormhole scifi adventure family",
            "virtual reality scifi action hacker dystopia",
            "superhero marvel action avengers infinity",
            "superhero marvel ironman action tech billionaire",
            "mafia crime family drama italy power",
            "crime hitman drama nonlinear violence",
            "war disability love history america south",
            "prison freedom friendship hope drama"
        ]
    }
    movies_df = pd.DataFrame(demo_data)
    cv = CountVectorizer(max_features=500, stop_words="english")
    vectors = cv.fit_transform(movies_df["tags"]).toarray()
    similarity = cosine_similarity(vectors)
    print("✅ Demo model ready (10 movies).")

# ── RECOMMENDATION LOGIC ──────────────────────────────────────────────────────
def recommend(movie_title: str, top_n: int = 10):
    """
    Returns top_n recommended movie titles for the given movie.
    """
    if movies_df is None or similarity is None:
        return []

    # Case-insensitive match
    matches = movies_df[movies_df["title"].str.lower() == movie_title.lower()]
    if matches.empty:
        # Fuzzy partial match fallback
        matches = movies_df[movies_df["title"].str.lower().str.contains(
            movie_title.lower(), na=False
        )]
    if matches.empty:
        return []

    idx = matches.index[0]
    distances = sorted(
        enumerate(similarity[idx]),
        key=lambda x: x[1],
        reverse=True
    )
    # Skip the movie itself (index 0 is perfect match)
    results = [movies_df.iloc[i]["title"] for i, _ in distances[1: top_n + 1]]
    return results

# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.route("/recommend", methods=["POST"])
def recommend_endpoint():
    """
    POST /recommend
    Body: { "movie": "The Dark Knight" }
    Response: { "recommendations": ["Inception", "Batman Begins", ...] }
    """
    data = request.get_json(force=True)
    movie = data.get("movie", "").strip()

    if not movie:
        return jsonify({"error": "movie field required"}), 400

    recs = recommend(movie)
    return jsonify({"movie": movie, "recommendations": recs})


@app.route("/movies", methods=["GET"])
def list_movies():
    """
    GET /movies?q=inception
    Returns movies from your dataset (optional search filter).
    """
    if movies_df is None:
        return jsonify({"movies": []})

    q = request.args.get("q", "").lower()
    df = movies_df if not q else movies_df[
        movies_df["title"].str.lower().str.contains(q, na=False)
    ]
    return jsonify({"movies": df["title"].tolist()[:50]})


@app.route("/poster/<int:movie_id>", methods=["GET"])
def get_poster(movie_id):
    """
    GET /poster/550
    Fetches poster URL from TMDB for a given movie_id.
    """
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}"
    try:
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        d = r.json()
        poster = f"https://image.tmdb.org/t/p/w500{d.get('poster_path', '')}"
        return jsonify({"poster_url": poster, "title": d.get("title")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "movies_loaded": len(movies_df) if movies_df is not None else 0,
        "model_loaded": similarity is not None
    })
load_models()
@app.route("/")
def home():
    return jsonify({
        "message": "Movie Recommender API is running",
        "health": "/health",
        "movies": "/movies"
    })

# ── NOTEBOOK: HOW TO TRAIN & SAVE YOUR OWN MODEL ─────────────────────────────
"""
=== Training Your Own Model (run in Jupyter Notebook or a separate script) ===

import pandas as pd
import ast
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle

# 1. Load TMDB dataset (download from kaggle: tmdb-movie-metadata)
movies = pd.read_csv("tmdb_5000_movies.csv")
credits = pd.read_csv("tmdb_5000_credits.csv")

movies = movies.merge(credits, on="title")
movies = movies[["movie_id","title","overview","genres","keywords","cast","crew"]].dropna()

# 2. Parse JSON columns
def parse_names(obj):
    return [i["name"] for i in ast.literal_eval(obj)][:3]

def get_director(obj):
    for i in ast.literal_eval(obj):
        if i["job"] == "Director":
            return [i["name"]]
    return []

movies["genres"]   = movies["genres"].apply(parse_names)
movies["keywords"] = movies["keywords"].apply(parse_names)
movies["cast"]     = movies["cast"].apply(parse_names)
movies["crew"]     = movies["crew"].apply(get_director)

# 3. Build tags
movies["tags"] = (
    movies["overview"].str.split()
    + movies["genres"]
    + movies["keywords"]
    + movies["cast"]
    + movies["crew"]
)
movies["tags"] = movies["tags"].apply(lambda x: " ".join(x).lower())

final = movies[["movie_id", "title", "tags"]].reset_index(drop=True)

# 4. Vectorize
cv = CountVectorizer(max_features=5000, stop_words="english")
vectors = cv.fit_transform(final["tags"]).toarray()
similarity = cosine_similarity(vectors)

# 5. Save
with open("movies.pkl", "wb") as f:
    pickle.dump(final, f)
with open("similarity.pkl", "wb") as f:
    pickle.dump(similarity, f)

print("Saved movies.pkl and similarity.pkl ✅")
"""

# ── ENTRY POINT ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_models()
    print("🚀 Starting Movie Recommender API on http://localhost:5000")
    app.run(debug=True, port=5000)
