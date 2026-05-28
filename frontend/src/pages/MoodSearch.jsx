import { useState } from "react";
import api from "../api";

function MoodSearch() {
  const [mood, setMood] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!mood.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await api.get(`/ai/mood-search?mood=${encodeURIComponent(mood)}`);
      setResults(res.data.recommendations);
    } catch (err) {
      alert("Mood search failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>✨ Mood Search</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "20px" }}>Describe what you're in the mood for, and AI will find the perfect movies.</p>
      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input
          style={styles.input}
          type="text"
          placeholder="e.g. something dark and atmospheric but not too violent"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />
        <button style={styles.button} type="submit">Find</button>
      </form>

      {loading && <p style={{ color: "var(--text-dim)" }}>AI is thinking...</p>}

      <div style={styles.grid}>
        {results.map((movie) => (
          <div key={movie.tmdb_id} style={styles.card}>
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={movie.title} style={styles.poster} />
            ) : (
              <div style={styles.noPoster}>No Image</div>
            )}
            <div style={styles.info}>
              <h4>{movie.title}</h4>
              <p style={styles.year}>{movie.release_date?.slice(0, 4) || "N/A"}</p>
              <p style={styles.reason}>💡 {movie.reason}</p>
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" },
  poster: { width: "100%", height: "280px", objectFit: "cover" },
  noPoster: { width: "100%", height: "280px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" },
  info: { padding: "14px" },
  year: { color: "var(--text-dim)", fontSize: "13px", margin: "6px 0" },
  reason: { color: "var(--text)", fontSize: "13px", marginTop: "8px", lineHeight: "1.4" },
};

export default MoodSearch;