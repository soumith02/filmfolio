import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/feed").then((res) => {
      setFeed(res.data.feed);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>📡 Feed</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "30px" }}>
        Recent movies your friends have logged.
      </p>

      {feed.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>
          Your feed is empty. Follow some friends and they'll appear here!
        </p>
      )}

      <div style={styles.list}>
        {feed.map((item) => (
          <div key={item.id} style={styles.card}>
            <Link to={`/movie/${item.tmdb_id}`}>
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}
            </Link>
            <div style={styles.info}>
              <div style={styles.header}>
                <Link to={`/u/${item.username}`} style={styles.avatar}>
                  {item.username[0].toUpperCase()}
                </Link>
                <div>
                  <Link to={`/u/${item.username}`}>
                    <strong>{item.username}</strong>
                  </Link>
                  <span style={styles.subtle}> logged a movie</span>
                </div>
              </div>
              <Link to={`/movie/${item.tmdb_id}`}>
                <h3 style={{ marginTop: "10px" }}>{item.title} <span style={styles.year}>({item.release_date?.slice(0, 4)})</span></h3>
              </Link>
              {item.rating && <p style={styles.rating}>⭐ {item.rating}/10</p>}
              {item.review && <p style={styles.review}>"{item.review}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: { display: "flex", gap: "16px", background: "var(--bg-card)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border)", alignItems: "flex-start" },
  poster: { width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" },
  noPoster: { width: "80px", height: "120px", background: "var(--bg)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "11px" },
  info: { flex: 1 },
  header: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "15px", color: "white" },
  year: { color: "var(--text-dim)", fontWeight: "normal", fontSize: "16px" },
  subtle: { color: "var(--text-dim)", fontSize: "14px" },
  rating: { color: "var(--gold)", margin: "8px 0" },
  review: { color: "var(--text-dim)", fontStyle: "italic", fontSize: "14px", lineHeight: "1.5" },
};

export default Feed;