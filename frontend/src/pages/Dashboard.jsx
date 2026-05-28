import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    api.get("/me").then((res) => setUser(res.data)).catch(() => {});
    api.get("/logs").then((res) => setLogCount(res.data.length)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>Welcome back{user ? `, ${user.full_name || user.username}` : ""} 👋</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "30px" }}>
        You've logged {logCount} movie{logCount !== 1 ? "s" : ""} so far.
      </p>

      <div style={styles.grid}>
        <Link to="/search" style={styles.card}>
          <h3>🔍 Search Movies</h3>
          <p style={styles.cardText}>Find and log movies you've watched.</p>
        </Link>
        <Link to="/my-movies" style={styles.card}>
          <h3>🎞️ My Movies</h3>
          <p style={styles.cardText}>See everything you've logged.</p>
        </Link>
        <Link to="/mood-search" style={styles.card}>
          <h3>✨ Mood Search</h3>
          <p style={styles.cardText}>Describe a mood, get perfect picks.</p>
        </Link>
        <Link to="/taste-dna" style={styles.card}>
          <h3>🧬 Taste DNA</h3>
          <p style={styles.cardText}>Discover what your taste says about you.</p>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)" },
  cardText: { color: "var(--text-dim)", marginTop: "8px", fontSize: "14px" },
};

export default Dashboard;