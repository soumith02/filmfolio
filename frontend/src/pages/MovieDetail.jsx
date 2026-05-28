import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

function MovieDetail() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [watchlisting, setWatchlisting] = useState(false);

  useEffect(() => {
    api.get(`/movies/${tmdbId}`)
      .then((res) => {
        setMovie(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tmdbId]);

  const handleLog = async () => {
    if (!movie) return;
    setLogging(true);
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
    setLogging(false);
  };

  const handleAddToWatchlist = async () => {
    if (!movie) return;
    setWatchlisting(true);
    try {
      await api.post("/watchlist", {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
      });
      alert(`Added "${movie.title}" to watchlist!`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add to watchlist");
    }
    setWatchlisting(false);
  };

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;
  if (!movie) return <p style={{ color: "var(--text-dim)" }}>Movie not found.</p>;

  return (
    <div>
      <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div style={styles.container}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} style={styles.poster} />
        ) : (
          <div style={styles.noPoster}>No Image</div>
        )}

        <div style={styles.info}>
          <h1>{movie.title}</h1>
          <p style={styles.meta}>
            {movie.release_date?.slice(0, 4)} · {movie.runtime} min · ⭐ {movie.rating?.toFixed(1)}
          </p>

          {movie.genres && movie.genres.length > 0 && (
            <div style={styles.tags}>
              {movie.genres.map((g) => (
                <span key={g} style={styles.tag}>{g}</span>
              ))}
            </div>
          )}

          <p style={styles.overview}>{movie.overview}</p>

          {movie.directors && movie.directors.length > 0 && (
            <p style={styles.detail}>
              <strong>Director{movie.directors.length > 1 ? "s" : ""}:</strong>{" "}
              {movie.directors.map((d, idx) => (
                <span key={d.id}>
                  <Link to={`/person/${d.id}`} style={styles.personLink}>{d.name}</Link>
                  {idx < movie.directors.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}

          {movie.writers && movie.writers.length > 0 && (
            <p style={styles.detail}>
              <strong>Writer{movie.writers.length > 1 ? "s" : ""}:</strong>{" "}
              {movie.writers.map((w, idx) => (
                <span key={w.id}>
                  <Link to={`/person/${w.id}`} style={styles.personLink}>{w.name}</Link>
                  {idx < movie.writers.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}

          <div style={styles.buttonRow}>
            <button style={styles.logBtn} onClick={handleLog} disabled={logging}>
              {logging ? "Logging..." : "+ Log this movie"}
            </button>
            <button style={styles.watchlistBtn} onClick={handleAddToWatchlist} disabled={watchlisting}>
              {watchlisting ? "Adding..." : "🔖 Add to Watchlist"}
            </button>
          </div>
        </div>
      </div>

      {movie.cast && movie.cast.length > 0 && (
        <section style={styles.castSection}>
          <h3 style={{ marginBottom: "16px" }}>Cast</h3>
          <div style={styles.castGrid}>
            {movie.cast.map((person) => (
              <Link key={person.id} to={`/person/${person.id}`} style={styles.castCard}>
                {person.profile_url ? (
                  <img src={person.profile_url} alt={person.name} style={styles.castPhoto} />
                ) : (
                  <div style={styles.noProfile}>{person.name[0]}</div>
                )}
                <div style={styles.castInfo}>
                  <p style={styles.castName}>{person.name}</p>
                  <p style={styles.castChar}>{person.character}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const styles = {
  back: { background: "transparent", color: "var(--text-dim)", border: "none", fontSize: "15px", marginBottom: "20px", padding: "6px 0" },
  container: { display: "flex", gap: "30px", flexWrap: "wrap" },
  poster: { width: "280px", height: "420px", objectFit: "cover", borderRadius: "12px" },
  noPoster: { width: "280px", height: "420px", background: "var(--bg-card)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" },
  info: { flex: 1, minWidth: "280px" },
  meta: { color: "var(--text-dim)", margin: "8px 0 16px" },
  tags: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
  tag: { background: "var(--bg-card)", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", border: "1px solid var(--border)" },
  overview: { fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" },
  detail: { color: "var(--text-dim)", marginBottom: "8px", lineHeight: "1.5" },
  personLink: { color: "var(--text)", textDecoration: "underline" },
  buttonRow: { display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" },
  logBtn: { padding: "14px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "bold" },
  watchlistBtn: { padding: "14px 28px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "15px", fontWeight: "bold" },
  castSection: { marginTop: "50px" },
  castGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" },
  castCard: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" },
  castPhoto: { width: "100%", height: "180px", objectFit: "cover" },
  noProfile: { width: "100%", height: "180px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", color: "var(--text-dim)", fontWeight: "bold" },
  castInfo: { padding: "10px" },
  castName: { fontSize: "14px", fontWeight: "bold", marginBottom: "4px" },
  castChar: { fontSize: "12px", color: "var(--text-dim)" },
};

export default MovieDetail;