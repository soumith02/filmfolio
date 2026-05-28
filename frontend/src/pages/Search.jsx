import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/movies/search?query=${encodeURIComponent(query)}`);
      setResults(res.data.results);
    } catch (err) {
      alert("Search failed");
    }
    setLoading(false);
  };

  const handleLog = async (movie) => {
    setLogging(movie.tmdb_id);
    const rating = prompt(`Rate "${movie.title}" out of 10 (or leave blank):`);
    const review = prompt("Write a short review (or leave blank):");
    try {
      await api.post("/logs", {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        rating: rating ? parseInt(rating) : null,
        review: review || null,
      });
      alert(`Logged "${movie.title}"!`);
    } catch (err) {
      alert("Failed to log movie");
    }
    setLogging(null);
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Search Movies</h1>
      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button style={styles.button} type="submit">Search</button>
      </form>

      {loading && <p style={{ color: "var(--text-dim)" }}>Searching...</p>}

      <div style={styles.grid}>
        {results.map((movie) => (
          <div key={movie.tmdb_id} style={styles.card}>
            <Link to={`/movie/${movie.tmdb_id}`}>
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}
            </Link>
            <div style={styles.info}>
              <Link to={`/movie/${movie.tmdb_id}`}>
                <h4>{movie.title}</h4>
              </Link>
              <p style={styles.year}>{movie.release_date?.slice(0, 4) || "N/A"} · ⭐ {movie.rating?.toFixed(1)}</p>
              <button style={styles.logBtn} onClick={() => handleLog(movie)} disabled={logging === movie.tmdb_id}>
                {logging === movie.tmdb_id ? "Logging..." : "+ Log"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  searchBar: { display: "flex", gap: "10px", marginBottom: "30px" },
  input: { flex: 1, padding: "14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "15px" },
  button: { padding: "14px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" },
  poster: { width: "100%", height: "240px", objectFit: "cover", cursor: "pointer" },
  noPoster: { width: "100%", height: "240px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" },
  info: { padding: "12px" },
  year: { color: "var(--text-dim)", fontSize: "13px", margin: "6px 0 10px" },
  logBtn: { width: "100%", padding: "8px", background: "var(--accent)", color: "white", border: "none", borderRadius: "6px", fontSize: "14px" },
};

export default Search;