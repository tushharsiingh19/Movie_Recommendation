# 🎬 Movie Recommendation System

A full-stack Movie Recommendation System that uses Machine Learning and Content-Based Filtering to recommend movies similar to a user's selected movie. The application features a modern React frontend, a Flask backend, and a cosine similarity recommendation engine trained on TMDB movie data.

## 🚀 Features

* Movie search using TMDB API
* Content-based movie recommendations
* Machine Learning recommendation engine
* Interactive React user interface
* Flask REST API backend
* Movie posters and details integration
* Popular movie browsing
* Responsive and modern UI
* Real-time recommendation generation

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* CSS
* TMDB API

### Backend

* Flask
* Flask-CORS
* Pandas
* Requests

### Machine Learning

* Scikit-Learn
* CountVectorizer
* Cosine Similarity
* Content-Based Filtering

## 📊 Machine Learning Workflow

1. Movie metadata is collected from the TMDB dataset.
2. Features such as overview, genres, keywords, cast, and crew are combined.
3. Text data is vectorized using CountVectorizer.
4. Cosine Similarity is computed between movies.
5. Similar movies are recommended based on similarity scores.

## 📁 Project Structure

Movie_Recommendation/

├── frontend/

│ └── MovieRecommender.jsx

├── backend/

│ ├── app.py

│ ├── movies.pkl

│ └── similarity.pkl

├── requirements.txt

└── README.md

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/tushharsiingh19/Movie_Recommendation.git
cd Movie_Recommendation
```

### Backend Setup

```bash
pip install flask flask-cors pandas scikit-learn requests
python app.py
```

Backend runs on:

```text
http://localhost:5000
```

### Frontend Setup

```bash
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

## API Endpoints

### Get Recommendations

```http
POST /recommend
```

Request:

```json
{
  "movie": "Inception"
}
```

Response:

```json
{
  "movie": "Inception",
  "recommendations": [
    "Interstellar",
    "The Matrix",
    "The Dark Knight"
  ]
}
```

### Get Movies

```http
GET /movies
```

### Health Check

```http
GET /health
```

## Dataset

The recommendation engine is trained using the TMDB 5000 Movie Dataset, which contains information about:

* Movie titles
* Genres
* Keywords
* Cast
* Crew
* Overviews

## Future Enhancements

* User authentication
* Favorite movies list
* Collaborative filtering
* Hybrid recommendation system
* Deep Learning recommendations
* Movie trailers integration
* Cloud deployment
* Personalized user profiles

## Author

Tushar Singh

B.Tech CSE, NIT Kurukshetra

## License

This project is developed for educational and portfolio purposes.
