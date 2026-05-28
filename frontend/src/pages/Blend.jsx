import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Blend() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBlend = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/blend/${username}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate Blend");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>🎬 Blend</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "20px" }}>
        Find your movie compatibility with another user and get a shared watchlist.
      </p>

      <form onSubmit={handleBlend} style={styles.searchBar}>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter their username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Blending..." : "Blend"}
        </button>
      </form>

      {error && <p style={{ color: "var(--accent)", marginBottom: "20px" }}>{error}</p>}

      {result && (
        <div>
          {/* Compatibility Score Hero */}
          <div style={styles.hero}>
            <div style={styles.scoreCircle}>
              <div style={styles.scoreNumber}>{result.compatibility_score}%</div>
              <div style={styles.scoreLabel}>compatibility</div>
            </div>
            <div style={styles.heroText}>
              <h2>{result.you} & {result.them}</h2>
              <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>
                {result.shared_movies_count} movie{result.shared_movies_count !== 1 ? "s" : ""} in common
              </p>
              <p style={styles.summary}>{result.blend_summary}</p>
            </div>
          </div>

          {/* Shared Movies */}
          {result.shared_movies.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>🎯 Movies you both watched</h3>
              <div style={styles.grid}>
                {result.shared_movies.map((movie) => (
                  <Link key={movie.tmdb_id} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                    {movie.poster_url && <img src={movie.poster_url} alt={movie.title} style={styles.poster} />}
                    <div style={styles.cardInfo}>
                      <h4 style={styles.cardTitle}>{movie.title}</h4>
                      <p style={styles.ratings}>
                        You: ⭐ {movie.your_rating || "-"}/10<br />
                        {result.them}: ⭐ {movie.their_rating || "-"}/10
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Hot Takes */}
          {result.hot_takes && result.hot_takes.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>🔥 Hot Takes</h3>
              <p style={{ color: "var(--text-dim)", marginBottom: "16px", fontSize: "14px" }}>
                Movies you two seriously disagreed on
              </p>
              <div style={styles.grid}>
                {result.hot_takes.map((movie) => (
                  <Link key={movie.tmdb_id} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                    {movie.poster_url && <img src={movie.poster_url} alt={movie.title} style={styles.poster} />}
                    <div style={styles.cardInfo}>
                      <h4 style={styles.cardTitle}>{movie.title}</h4>
                      <p style={styles.ratings}>
                        You: ⭐ {movie.your_rating}/10<br />
                        {result.them}: ⭐ {movie.their_rating}/10<br />
                        <span style={{ color: "var(--accent)", fontWeight: "bold" }}>
                          {movie.rating_diff} point gap 🔥
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {/* Combined Watchlist */}
          {result.combined_watchlist && result.combined_watchlist.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>🎯 Combined Watchlist</h3>
              <p style={{ color: "var(--text-dim)", marginBottom: "16px", fontSize: "14px" }}>
                Movies you both saved to watch. Time for a movie night!
              </p>
              <div style={styles.grid}>
                {result.combined_watchlist.map((movie) => (
                  <Link key={movie.tmdb_id} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                    {movie.poster_url && <img src={movie.poster_url} alt={movie.title} style={styles.poster} />}
                    <div style={styles.cardInfo}>
                      <h4 style={styles.cardTitle}>{movie.title}</h4>
                      <p style={styles.ratings}>
                        {movie.release_date?.slice(0, 4)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Watchlist for you */}
          {result.watchlist_for_you.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>👀 {result.them}'s favorites you haven't seen</h3>
              <div style={styles.grid}>
                {result.watchlist_for_you.map((movie) => (
                  <Link key={movie.tmdb_id} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                    {movie.poster_url && <img src={movie.poster_url} alt={movie.title} style={styles.poster} />}
                    <div style={styles.cardInfo}>
                      <h4 style={styles.cardTitle}>{movie.title}</h4>
                      <p style={styles.ratings}>⭐ {movie.their_rating}/10 from {movie.recommended_by}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Watchlist for them */}
          {result.watchlist_for_them.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>🎁 Your favorites {result.them} should watch</h3>
              <div style={styles.grid}>
                {result.watchlist_for_them.map((movie) => (
                  <Link key={movie.tmdb_id} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                    {movie.poster_url && <img src={movie.poster_url} alt={movie.title} style={styles.poster} />}
                    <div style={styles.cardInfo}>
                      <h4 style={styles.cardTitle}>{movie.title}</h4>
                      <p style={styles.ratings}>⭐ {movie.your_rating}/10 from you</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  searchBar: { display: "flex", gap: "10px", marginBottom: "30px" },
  input: { flex: 1, padding: "14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "15px" },
  button: { padding: "14px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" },
  hero: { display: "flex", gap: "30px", alignItems: "center", background: "var(--bg-card)", padding: "30px", borderRadius: "16px", border: "1px solid var(--border)", marginBottom: "40px", flexWrap: "wrap" },
  scoreCircle: { width: "140px", height: "140px", borderRadius: "50%", background: "linear-gradient(135deg, #e50914, #ff1f2e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  scoreNumber: { fontSize: "36px", fontWeight: "bold" },
  scoreLabel: { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" },
  heroText: { flex: 1, minWidth: "250px" },
  summary: { marginTop: "16px", lineHeight: "1.6", color: "var(--text)" },
  section: { marginBottom: "40px" },
  sectionTitle: { marginBottom: "16px", fontSize: "20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" },
  card: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", display: "block" },
  poster: { width: "100%", height: "220px", objectFit: "cover" },
  cardInfo: { padding: "12px" },
  cardTitle: { fontSize: "14px", marginBottom: "6px" },
  ratings: { color: "var(--text-dim)", fontSize: "12px", lineHeight: "1.6" },
};

export default Blend;