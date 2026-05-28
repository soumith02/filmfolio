import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

function Person() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("acting");

  useEffect(() => {
    api.get(`/people/${personId}`)
      .then((res) => {
        setData(res.data);
        // Set initial tab based on what they're known for
        const credits = res.data.credits;
        if (credits.acting.length > 0) setTab("acting");
        else if (credits.directing.length > 0) setTab("directing");
        else if (credits.writing.length > 0) setTab("writing");
        else if (credits.producing.length > 0) setTab("producing");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [personId]);

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;
  if (!data) return <p style={{ color: "var(--text-dim)" }}>Person not found.</p>;

  const { details, credits } = data;
  const currentList = credits[tab] || [];

  const tabs = [
    { key: "acting", label: "Acting", count: credits.acting.length },
    { key: "directing", label: "Directing", count: credits.directing.length },
    { key: "writing", label: "Writing", count: credits.writing.length },
    { key: "producing", label: "Producing", count: credits.producing.length },
  ].filter(t => t.count > 0);

  return (
    <div>
      <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div style={styles.header}>
        {details.profile_url ? (
          <img src={details.profile_url} alt={details.name} style={styles.photo} />
        ) : (
          <div style={styles.noPhoto}>{details.name[0]}</div>
        )}
        <div style={styles.info}>
          <h1>{details.name}</h1>
          {details.known_for_department && (
            <p style={styles.subtitle}>Known for: {details.known_for_department}</p>
          )}
          {details.birthday && (
            <p style={styles.meta}>
              Born {details.birthday}{details.place_of_birth ? ` · ${details.place_of_birth}` : ""}
            </p>
          )}
          {details.biography && (
            <p style={styles.bio}>
              {details.biography.length > 400
                ? details.biography.slice(0, 400) + "..."
                : details.biography}
            </p>
          )}
        </div>
      </div>

      {tabs.length > 0 && (
        <>
          <div style={styles.tabBar}>
            {tabs.map((t) => (
              <button
                key={t.key}
                style={{
                  ...styles.tab,
                  ...(tab === t.key ? styles.tabActive : {})
                }}
                onClick={() => setTab(t.key)}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          <div style={styles.grid}>
            {currentList.map((movie) => (
              <Link key={`${movie.tmdb_id}-${movie.job || movie.character}`} to={`/movie/${movie.tmdb_id}`} style={styles.card}>
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} style={styles.poster} />
                ) : (
                  <div style={styles.noPoster}>No Image</div>
                )}
                <div style={styles.cardInfo}>
                  <h4 style={styles.cardTitle}>{movie.title}</h4>
                  <p style={styles.cardMeta}>
                    {movie.release_date?.slice(0, 4) || "TBA"}
                  </p>
                  {movie.character && <p style={styles.role}>as {movie.character}</p>}
                  {movie.job && <p style={styles.role}>{movie.job}</p>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  back: { background: "transparent", color: "var(--text-dim)", border: "none", fontSize: "15px", marginBottom: "20px", padding: "6px 0" },
  header: { display: "flex", gap: "30px", marginBottom: "40px", flexWrap: "wrap" },
  photo: { width: "220px", height: "330px", objectFit: "cover", borderRadius: "12px" },
  noPhoto: { width: "220px", height: "330px", background: "var(--bg-card)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "70px", fontWeight: "bold", color: "var(--text-dim)" },
  info: { flex: 1, minWidth: "260px" },
  subtitle: { color: "var(--text-dim)", marginTop: "8px", fontSize: "15px" },
  meta: { color: "var(--text-dim)", marginTop: "8px", fontSize: "14px" },
  bio: { marginTop: "16px", lineHeight: "1.6", color: "var(--text)" },
  tabBar: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "10px" },
  tab: { background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: "20px", fontSize: "14px", cursor: "pointer" },
  tabActive: { background: "var(--accent)", color: "white", border: "1px solid var(--accent)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" },
  card: { background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", display: "block" },
  poster: { width: "100%", height: "240px", objectFit: "cover" },
  noPoster: { width: "100%", height: "240px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "13px" },
  cardInfo: { padding: "12px" },
  cardTitle: { fontSize: "14px", marginBottom: "4px" },
  cardMeta: { color: "var(--text-dim)", fontSize: "12px", marginBottom: "4px" },
  role: { color: "var(--text)", fontSize: "12px", fontStyle: "italic" },
};

export default Person;