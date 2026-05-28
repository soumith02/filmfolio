import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/watchlist").then((res) => {
      setItems(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    if (!confirm("Remove from watchlist?")) return;
    await api.delete(`/watchlist/${id}`);
    load();
  };

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>🔖 My Watchlist ({items.length})</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "30px" }}>
        Movies you want to watch.
      </p>

      {items.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>
          Watchlist is empty. Search for movies and add them!
        </p>
      )}

      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <Link to={`/movie/${item.tmdb_id}`}>
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}
            </Link>
            <div style={styles.info}>
              <Link to={`/movie/${item.tmdb_id}`}>
                <h4>{item.title}</h4>
              </Link>
              <p style={styles.year}>{item.release_date?.slice(0, 4) || "N/A"}</p>
              <button style={styles.removeBtn} onClick={() => handleRemove(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" },
  poster: { width: "100%", height: "240px", objectFit: "cover", cursor: "pointer" },
  noPoster: { width: "100%", height: "240px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" },
  info: { padding: "12px" },
  year: { color: "var(--text-dim)", fontSize: "13px", margin: "6px 0 10px" },
  removeBtn: { width: "100%", padding: "8px", background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontSize: "13px" },
};

export default Watchlist;