import { useState } from "react";
import api from "../api";

function TasteDNA() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ai/taste-dna");
      setResult(res.data);
    } catch (err) {
      alert("Could not generate Taste DNA");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>🧬 Your Taste DNA</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "20px" }}>AI analyzes your logged movies to reveal what makes your film taste unique.</p>

      <button style={styles.button} onClick={generate} disabled={loading}>
        {loading ? "Analyzing..." : "Generate My Taste DNA"}
      </button>

      {result && (
        <div style={styles.card}>
          <p style={styles.count}>Based on {result.movies_analyzed} logged movie{result.movies_analyzed !== 1 ? "s" : ""}</p>
          <p style={styles.dna}>{result.taste_dna}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  button: { padding: "14px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px" },
  card: { background: "var(--bg-card)", padding: "30px", borderRadius: "12px", border: "1px solid var(--border)", marginTop: "24px" },
  count: { color: "var(--text-dim)", fontSize: "13px", marginBottom: "16px" },
  dna: { fontSize: "17px", lineHeight: "1.7" },
};

export default TasteDNA;