import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function MyMovies() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = () => {
    api.get("/logs").then((res) => {
      setLogs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this log?")) return;
    await api.delete(`/logs/${id}`);
    loadLogs();
  };

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>My Movies ({logs.length})</h1>
      {logs.length === 0 && <p style={{ color: "var(--text-dim)" }}>No movies logged yet. Go search and log some!</p>}
      <div style={styles.list}>
        {logs.map((log) => (
          <div key={log.id} style={styles.row}>
            <Link to={`/movie/${log.tmdb_id}`}>
              {log.poster_url ? (
                <img src={log.poster_url} alt={log.title} style={styles.poster} />
              ) : (
                <div style={styles.noPoster}>No Image</div>
              )}
            </Link>
            <div style={styles.info}>
              <Link to={`/movie/${log.tmdb_id}`}>
                <h3>{log.title} <span style={styles.year}>({log.release_date?.slice(0, 4)})</span></h3>
              </Link>
              {log.rating && <p style={styles.rating}>⭐ {log.rating}/10</p>}
              {log.review && <p style={styles.review}>"{log.review}"</p>}
            </div>
            <button style={styles.delete} onClick={() => handleDelete(log.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "flex", gap: "16px", background: "var(--bg-card)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border)", alignItems: "center" },
  poster: { width: "70px", height: "105px", objectFit: "cover", borderRadius: "6px", cursor: "pointer" },
  noPoster: { width: "70px", height: "105px", background: "var(--bg)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "11px" },
  info: { flex: 1 },
  year: { color: "var(--text-dim)", fontWeight: "normal", fontSize: "15px" },
  rating: { color: "var(--gold)", margin: "6px 0" },
  review: { color: "var(--text-dim)", fontStyle: "italic", fontSize: "14px" },
  delete: { background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", padding: "8px 14px", borderRadius: "6px", fontSize: "13px" },
};

export default MyMovies;