import { useState, useEffect, useRef } from "react";

// ── CONFIG ──────────────────────────────────────────────────────────────────
const TMDB_API_KEY = "2ae3b76f4b488d16adecb70bb793a326"; // 🔑 Replace with your TMDB API key
const TMDB_BASE    = "https://api.themoviedb.org/3";
const TMDB_IMG     = "https://image.tmdb.org/t/p/w500";
const BACKEND_URL  = "https://movie-recommendation-1-84na.onrender.com/" // 🔗 Your Flask/FastAPI backend

// ── HELPERS ─────────────────────────────────────────────────────────────────
async function fetchPopularMovies(page = 1) {
  const res = await fetch(
    `${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
  );
  const data = await res.json();
  return data.results || [];
}

async function searchMovies(query) {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results || [];
}

async function getRecommendations(movieTitle) {
  // Calls your Flask/FastAPI backend which loads the pickle ML model
  const res = await fetch(`${BACKEND_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movie: movieTitle }),
  });
  const data = await res.json();
  return data.recommendations || [];
}

// ── STAR RATING ─────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  const stars = Math.round(rating / 2);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= stars ? "#e50914" : "#444", fontSize: 10 }}>★</span>
      ))}
    </div>
  );
}

// ── MOVIE CARD ───────────────────────────────────────────────────────────────
function MovieCard({ movie, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const poster = movie.poster_path
    ? `${TMDB_IMG}${movie.poster_path}`
    : null;

  return (
    <div
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        flex: "0 0 auto",
        width: 160,
        borderRadius: 8,
        overflow: "hidden",
        background: "#1a1a1a",
        border: hovered ? "2px solid #e50914" : "2px solid transparent",
        transform: hovered ? "scale(1.06) translateY(-4px)" : "scale(1)",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        boxShadow: hovered ? "0 16px 40px rgba(229,9,20,0.35)" : "0 4px 12px rgba(0,0,0,0.5)",
        animation: `fadeSlideUp 0.5s ease forwards`,
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
      }}
    >
      {poster ? (
        <img
          src={poster}
          alt={movie.title}
          style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", height: 230, background: "#2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#555", fontSize: 13
        }}>
          No Poster
        </div>
      )}
      <div style={{ padding: "10px 10px 12px" }}>
        <p style={{
          margin: "0 0 4px", color: "#fff", fontSize: 12, fontFamily: "'Oswald', sans-serif",
          fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          letterSpacing: 0.5
        }}>
          {movie.title}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <StarRating rating={movie.vote_average || 0} />
          <span style={{ color: "#888", fontSize: 10 }}>
            {movie.release_date?.slice(0, 4) || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function MovieModal({ movie, recommendations, loadingRec, onClose }) {
  if (!movie) return null;
  const poster = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn 0.2s ease"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111", borderRadius: 16, maxWidth: 780, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          border: "1px solid #2a2a2a",
          boxShadow: "0 30px 80px rgba(229,9,20,0.2)"
        }}
      >
        {/* Backdrop */}
        {backdrop && (
          <div style={{
            height: 240, backgroundImage: `url(${backdrop})`,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: "16px 16px 0 0", position: "relative"
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "16px 16px 0 0",
              background: "linear-gradient(to bottom, transparent 40%, #111 100%)"
            }} />
          </div>
        )}

        <div style={{ padding: "0 28px 28px", marginTop: backdrop ? -60 : 28, position: "relative" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
            {poster && (
              <img src={poster} alt={movie.title} style={{
                width: 100, borderRadius: 8,
                border: "3px solid #e50914",
                boxShadow: "0 8px 24px rgba(229,9,20,0.3)",
                flexShrink: 0
              }} />
            )}
            <div>
              <h2 style={{
                margin: "0 0 6px", color: "#fff",
                fontFamily: "'Oswald', sans-serif", fontSize: 26,
                letterSpacing: 1
              }}>{movie.title}</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{
                  background: "#e50914", color: "#fff", padding: "2px 10px",
                  borderRadius: 4, fontSize: 11, fontWeight: 700,
                  fontFamily: "'Oswald', sans-serif", letterSpacing: 1
                }}>
                  ★ {movie.vote_average?.toFixed(1)}
                </span>
                <span style={{ color: "#888", fontSize: 12 }}>{movie.release_date?.slice(0, 4)}</span>
              </div>
            </div>
          </div>

          <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.7, margin: "18px 0 0" }}>
            {movie.overview || "No overview available."}
          </p>

          {/* Recommendations */}
          <div style={{ marginTop: 28 }}>
            <h3 style={{
              color: "#e50914", fontFamily: "'Oswald', sans-serif",
              fontSize: 16, letterSpacing: 2, textTransform: "uppercase",
              margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8
            }}>
              <span>ML Recommendations</span>
              {loadingRec && (
                <span style={{
                  width: 14, height: 14, border: "2px solid #e50914",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.8s linear infinite"
                }} />
              )}
            </h3>
            {!loadingRec && recommendations.length === 0 && (
              <p style={{ color: "#555", fontSize: 12 }}>
                Connect your Flask backend with the pickle model to see recommendations.
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {recommendations.map((r, i) => (
                <div key={i} style={{
                  background: "#1e1e1e", border: "1px solid #2a2a2a",
                  borderRadius: 6, padding: "8px 14px",
                  color: "#ddd", fontSize: 12,
                  fontFamily: "'Oswald', sans-serif", letterSpacing: 0.5
                }}>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MovieRecommender() {
  const [movies, setMovies]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState("");
  const [searching, setSearching]     = useState(false);
  const [sortBy, setSortBy]           = useState("popularity");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selected, setSelected]       = useState(null);
  const [recMovies, setRecMovies]     = useState([]);
  const [loadingRec, setLoadingRec]   = useState(false);
  const [section, setSection]         = useState("popular"); // popular | search
  const [navActive, setNavActive]     = useState("Home");
  const [page, setPage]               = useState(1);
  const inputRef = useRef(null);

  // Initial load
  useEffect(() => {
    loadPopular(1);
  }, []);

  async function loadPopular(p = 1) {
    setLoading(true);
    try {
      const data = await fetchPopularMovies(p);
      setMovies(p === 1 ? data : (prev) => [...prev, ...data]);
      setSection("popular");
    } catch { /* show error gracefully */ }
    finally { setLoading(false); }
  }

  // Sort movies
  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === "popularity") return b.popularity - a.popularity;
    if (sortBy === "rating")     return b.vote_average - a.vote_average;
    if (sortBy === "newest")     return (b.release_date || "").localeCompare(a.release_date || "");
    if (sortBy === "title")      return a.title.localeCompare(b.title);
    return 0;
  });

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setLoading(true);
    try {
      const data = await searchMovies(query.trim());
      setMovies(data);
      setSection("search");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  async function handleMovieClick(movie) {
    setSelected(movie);
    setRecMovies([]);
    setLoadingRec(true);
    try {
      const recs = await getRecommendations(movie.title);
      setRecMovies(recs);
    } catch { /* backend not running */ }
    finally { setLoadingRec(false); }
  }

  const SORT_OPTIONS = [
    { key: "popularity", label: "Popularity" },
    { key: "rating",     label: "Rating" },
    { key: "newest",     label: "Newest" },
    { key: "title",      label: "Title A–Z" },
  ];

  const NAV_ITEMS = ["Home", "About", "Movies", "Favourite", "Setting"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #e50914; border-radius: 3px; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite;
        }
        .nav-link {
          background: none; border: none; cursor: pointer;
          color: #aaa; font-family: 'Barlow', sans-serif;
          font-size: 14px; letter-spacing: 0.5px;
          padding: 6px 4px;
          transition: color 0.2s;
          border-bottom: 2px solid transparent;
        }
        .nav-link:hover, .nav-link.active {
          color: #fff; border-bottom-color: #e50914;
        }
        .sort-option {
          padding: 8px 16px; cursor: pointer; color: #ccc;
          font-family: 'Barlow', sans-serif; font-size: 13px;
          transition: background 0.15s, color 0.15s;
        }
        .sort-option:hover { background: #2a2a2a; color: #fff; }
        .sort-option.active { color: #e50914; font-weight: 600; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Barlow', sans-serif" }}>

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1a1a1a",
          padding: "0 32px", height: 56,
          display: "flex", alignItems: "center", gap: 24
        }}>
          {/* Sign In */}
          <button style={{
            background: "#e50914", color: "#fff", border: "none",
            padding: "7px 20px", borderRadius: 4, cursor: "pointer",
            fontFamily: "'Oswald', sans-serif", fontSize: 13,
            letterSpacing: 1, fontWeight: 600,
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#c1000f"}
            onMouseLeave={e => e.currentTarget.style.background = "#e50914"}
          >
            Sign In
          </button>

          {/* Search icon */}
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }}
            onClick={() => inputRef.current?.focus()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 28, marginLeft: 8, flex: 1, justifyContent: "center" }}>
            {NAV_ITEMS.map((n) => (
              <button key={n}
                className={`nav-link${navActive === n ? " active" : ""}`}
                onClick={() => { setNavActive(n); if (n === "Home") { setQuery(""); loadPopular(1); } }}
              >{n}</button>
            ))}
          </div>

          {/* Settings icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" style={{ cursor: "pointer" }}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 100%)",
          padding: "52px 32px 48px",
        }}>
          {/* Background cinema seats effect */}
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "50%",
            background: "linear-gradient(to right, #0a0a0a, transparent)",
            zIndex: 1,
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "55%",
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 48px,
              rgba(229,9,20,0.04) 48px, rgba(229,9,20,0.04) 50px
            ), repeating-linear-gradient(
              90deg, transparent, transparent 60px,
              rgba(229,9,20,0.04) 60px, rgba(229,9,20,0.04) 62px
            )`,
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Title */}
            <h1 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: "clamp(52px, 8vw, 96px)",
              fontWeight: 700, lineHeight: 0.95,
              color: "#e50914",
              letterSpacing: "-1px",
              textShadow: "0 0 60px rgba(229,9,20,0.5)",
              marginBottom: 32,
              animation: "fadeSlideUp 0.6s ease forwards",
            }}>
              MOVIE<br />
              <span style={{ color: "#fff" }}>RECOMMENDER</span>
            </h1>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{
              display: "flex", maxWidth: 560,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 40, border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              overflow: "hidden",
              animation: "fadeSlideUp 0.6s 0.1s ease forwards",
              opacity: 0,
            }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for a movie..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "#fff", padding: "14px 24px",
                  fontFamily: "'Barlow', sans-serif", fontSize: 15,
                }}
              />
              <button type="submit" disabled={searching} style={{
                background: "#e50914", border: "none", cursor: "pointer",
                padding: "0 24px", color: "#fff",
                borderRadius: "0 40px 40px 0",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#c1000f"}
                onMouseLeave={e => e.currentTarget.style.background = "#e50914"}
              >
                {searching ? (
                  <span style={{
                    width: 18, height: 18, border: "2px solid #fff",
                    borderTopColor: "transparent", borderRadius: "50%",
                    display: "block", animation: "spin 0.8s linear infinite"
                  }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────────────────── */}
        <div style={{ padding: "32px 32px 60px" }}>

          {/* Section header + sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{
                color: "#fff", fontFamily: "'Oswald', sans-serif",
                fontSize: 20, letterSpacing: 1, fontWeight: 600,
              }}>
                {section === "popular" ? "Based on Popularity" : `Results for "${query}"`}
              </h2>
              {!loading && (
                <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>
                  {sortedMovies.length} movies
                </p>
              )}
            </div>

            {/* Sort By */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                style={{
                  background: "none", border: "1px solid #2a2a2a", cursor: "pointer",
                  color: "#ccc", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 6,
                  fontFamily: "'Oswald', sans-serif", fontSize: 13, letterSpacing: 1,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#e50914"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
              >
                SORT BY
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="6" y1="12" x2="18" y2="12"/>
                  <line x1="9" y1="18" x2="15" y2="18"/>
                </svg>
              </button>
              {showSortMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#161616", border: "1px solid #2a2a2a",
                  borderRadius: 8, overflow: "hidden", zIndex: 30,
                  minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
                }}>
                  {SORT_OPTIONS.map((opt) => (
                    <div key={opt.key}
                      className={`sort-option${sortBy === opt.key ? " active" : ""}`}
                      onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Movie grid */}
          {loading ? (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: 160, height: 290, borderRadius: 8 }} />
              ))}
            </div>
          ) : sortedMovies.length === 0 ? (
            <div style={{
              textAlign: "center", color: "#555", padding: "80px 0",
              fontFamily: "'Oswald', sans-serif", fontSize: 18, letterSpacing: 1
            }}>
              NO MOVIES FOUND
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {sortedMovies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} onClick={handleMovieClick} index={i} />
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && section === "popular" && (
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <button
                onClick={() => { const next = page + 1; setPage(next); loadPopular(next); }}
                style={{
                  background: "none", border: "2px solid #e50914",
                  color: "#e50914", padding: "12px 40px", borderRadius: 4,
                  cursor: "pointer", fontFamily: "'Oswald', sans-serif",
                  fontSize: 14, letterSpacing: 2, fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e50914"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e50914"; }}
              >
                LOAD MORE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ───────────────────────────────────────────────── */}
      {selected && (
        <MovieModal
          movie={selected}
          recommendations={recMovies}
          loadingRec={loadingRec}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
