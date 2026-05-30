import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [trending, setTrending] = useState([]);
  const [forYou, setForYou] = useState([]);
  const [myRecent, setMyRecent] = useState([]);
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingForYou, setLoadingForYou] = useState(true);

  useEffect(() => {
    api.get("/me").then((res) => setUser(res.data)).catch(() => {});
    api.get("/me/stats").then((res) => setStats(res.data)).catch(() => {});
    api.get("/trending").then((res) => setTrending(res.data.movies)).catch(() => {});
    api.get("/logs").then((res) => setMyRecent(res.data.slice(0, 12))).catch(() => {});
    api.get("/feed").then((res) => setFeed(res.data.feed.slice(0, 12))).catch(() => {});
    api.get("/ai/for-you")
      .then((res) => {
        setForYou(res.data.recommendations || []);
        setLoadingForYou(false);
      })
      .catch(() => setLoadingForYou(false));
  }, []);

  const heroMovie = trending[0];

  return (
    <div style={styles.page}>
      {heroMovie && (
        <section style={styles.hero}>
          {heroMovie.backdrop_url && (
            <img src={heroMovie.backdrop_url} alt="" style={styles.heroBackdrop} />
          )}
          <div style={styles.heroOverlay}></div>
          <div style={styles.heroContent}>
            <p style={styles.heroLabel}>TRENDING NOW</p>
            <h1 style={styles.heroTitle}>{heroMovie.title}</h1>
            <p style={styles.heroMeta}>
              {heroMovie.release_date?.slice(0, 4)} · {heroMovie.rating?.toFixed(1)}
            </p>
            <p style={styles.heroOverview}>
              {heroMovie.overview?.length > 200
                ? heroMovie.overview.slice(0, 200) + "..."
                : heroMovie.overview}
            </p>
            <div style={styles.heroActions}>
              <Link to={`/movie/${heroMovie.tmdb_id}`} style={styles.primaryBtn}>
                View Details
              </Link>
            </div>
          </div>
        </section>
      )}

      <div style={styles.content}>
        {user && (
          <p style={styles.welcome}>
            Welcome back, <span style={styles.userName}>{user.full_name || user.username}</span>
          </p>
        )}

        {stats && stats.movies_watched > 0 && (
          <div style={styles.statsBar}>
            <StatItem value={stats.movies_watched} label="Movies" />
            <StatItem value={stats.reviews_count} label="Reviews" />
            <StatItem value={stats.watchlist_count} label="Watchlist" />
            <StatItem value={stats.avg_rating || "—"} label="Avg Rating" />
          </div>
        )}

        <Row title="Trending Now" movies={trending} />

        <Row
          title="For You"
          movies={forYou}
          loading={loadingForYou}
          emptyMessage="Log a few movies to get personalized recommendations"
        />

        {myRecent.length > 0 && (
          <Row title="Recently Logged" movies={myRecent} useLogShape />
        )}

        {feed.length > 0 && (
          <Row title="Friends Are Watching" movies={feed} useLogShape showUser />
        )}
      </div>
    </div>
  );
}

function StatItem({ value, label }) {
  return (
    <div style={styles.statItem}>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
}

function Row({ title, movies, loading, emptyMessage, useLogShape, showUser }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 600, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section style={styles.row}>
        <h2 style={styles.rowTitle}>{title}</h2>
        <p style={styles.subtle}>Loading...</p>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    if (emptyMessage) {
      return (
        <section style={styles.row}>
          <h2 style={styles.rowTitle}>{title}</h2>
          <p style={styles.subtle}>{emptyMessage}</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section style={styles.row}>
      <div style={styles.rowHeader}>
        <h2 style={styles.rowTitle}>{title}</h2>
        <div style={styles.rowControls}>
          <button onClick={() => scroll(-1)} style={styles.scrollBtn}>‹</button>
          <button onClick={() => scroll(1)} style={styles.scrollBtn}>›</button>
        </div>
      </div>
      <div ref={scrollRef} style={styles.scroller}>
        {movies.map((m, idx) => (
          <Link
            key={`${m.tmdb_id}-${idx}`}
            to={`/movie/${m.tmdb_id}`}
            style={styles.card}
          >
            {m.poster_url ? (
              <img src={m.poster_url} alt={m.title} style={styles.poster} />
            ) : (
              <div style={styles.noPoster}>No Image</div>
            )}
            <div style={styles.cardInfo}>
              <p style={styles.cardTitle}>{m.title}</p>
              {showUser && m.username && (
                <p style={styles.cardSubtitle}>@{m.username}</p>
              )}
              {m.release_date && !showUser && (
                <p style={styles.cardSubtitle}>{m.release_date.slice(0, 4)}</p>
              )}
              {useLogShape && m.rating && (
                <p style={styles.cardRating}>★ {m.rating}/10</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const styles = {
  page: { paddingBottom: "60px" },
  hero: {
    position: "relative",
    height: "500px",
    marginBottom: "40px",
    overflow: "hidden",
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.5,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(180deg, transparent 0%, rgba(15,15,18,0.5) 60%, #0f0f12 100%), linear-gradient(90deg, rgba(15,15,18,0.9) 0%, transparent 60%)",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "700px",
    padding: "100px 40px 40px",
  },
  heroLabel: {
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#8b5cf6",
    fontWeight: "700",
    marginBottom: "12px",
  },
  heroTitle: {
    fontSize: "52px",
    fontWeight: "900",
    marginBottom: "16px",
    color: "#fff",
    lineHeight: 1.1,
  },
  heroMeta: { color: "#b8b8c0", fontSize: "15px", marginBottom: "16px" },
  heroOverview: { color: "#d4d4dc", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" },
  heroActions: { display: "flex", gap: "12px" },
  primaryBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    padding: "12px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    border: "none",
    cursor: "pointer",
  },
  content: { padding: "0 40px" },
  welcome: { color: "#b8b8c0", fontSize: "15px", marginBottom: "16px" },
  userName: { color: "#fff", fontWeight: "600" },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    background: "#15151a",
    border: "1px solid #1f1f24",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "50px",
  },
  statItem: { textAlign: "center" },
  statValue: { fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "4px" },
  statLabel: { fontSize: "12px", color: "#8a8a92", letterSpacing: "1.5px", textTransform: "uppercase" },
  row: { marginBottom: "50px" },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  rowTitle: { fontSize: "22px", fontWeight: "700", color: "#fff" },
  rowControls: { display: "flex", gap: "8px" },
  scrollBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#1c1c21",
    border: "1px solid #2a2a30",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scroller: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    paddingBottom: "10px",
  },
  card: {
    flexShrink: 0,
    width: "180px",
    textDecoration: "none",
    color: "inherit",
  },
  poster: {
    width: "100%",
    height: "270px",
    objectFit: "cover",
    borderRadius: "8px",
    background: "#1c1c21",
  },
  noPoster: {
    width: "100%",
    height: "270px",
    background: "#1c1c21",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5a5a62",
    fontSize: "13px",
  },
  cardInfo: { padding: "10px 0" },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardSubtitle: { fontSize: "12px", color: "#8a8a92" },
  cardRating: { fontSize: "12px", color: "#f59e0b", marginTop: "2px" },
  subtle: { color: "#8a8a92", fontSize: "14px" },
};

export default Dashboard;