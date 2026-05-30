import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("movies");

  // Filter/sort/search state
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/me");
      setMe(meRes.data);

      const isOwn = meRes.data.username === username;

      if (isOwn) {
        const statsRes = await api.get("/me/stats");
        setStats(statsRes.data);
        const logsRes = await api.get("/logs");
        setLogs(logsRes.data);
        const wlRes = await api.get("/watchlist");
        setWatchlist(wlRes.data);
      }

      const followingRes = await api.get("/me/following");
      setIsFollowing(followingRes.data.following.some((u) => u.username === username));
      setFollowingCount(followingRes.data.following.length);

      const followersRes = await api.get("/me/followers");
      setFollowerCount(followersRes.data.followers.length);
    } catch (err) {
      console.error("Profile load error:", err);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      await api.post(`/follow/${username}`);
      setIsFollowing(true);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not follow");
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.delete(`/follow/${username}`);
      setIsFollowing(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not unfollow");
    }
  };

  const isMe = me && me.username === username;
  const ratedLogs = logs.filter((l) => l.rating);
  const reviewedLogs = logs.filter((l) => l.review);
  const likedLogs = logs.filter((l) => l.rating && l.rating >= 8);

  // Get base items for current tab
  const baseItems = useMemo(() => {
    if (tab === "movies") return logs;
    if (tab === "reviews") return reviewedLogs;
    if (tab === "liked") return likedLogs;
    if (tab === "watchlist") return watchlist;
    if (tab === "ratings") return ratedLogs;
    return [];
  }, [tab, logs, watchlist, reviewedLogs, likedLogs, ratedLogs]);

  // Apply search, sort, filter
  const displayItems = useMemo(() => {
    let items = [...baseItems];

    // Search by title
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      items = items.filter((m) => m.title?.toLowerCase().includes(q));
    }

    // Filter by rating
    if (filterRating !== "all" && (tab === "movies" || tab === "ratings")) {
      if (filterRating === "high") {
        items = items.filter((m) => m.rating && m.rating >= 8);
      } else if (filterRating === "mid") {
        items = items.filter((m) => m.rating && m.rating >= 5 && m.rating < 8);
      } else if (filterRating === "low") {
        items = items.filter((m) => m.rating && m.rating < 5);
      } else if (filterRating === "unrated") {
        items = items.filter((m) => !m.rating);
      }
    }

    // Sort
    if (sortBy === "recent") {
      items.sort((a, b) => {
        const da = new Date(a.watched_date || a.added_at || a.created_at || 0).getTime();
        const db = new Date(b.watched_date || b.added_at || b.created_at || 0).getTime();
        return db - da;
      });
    } else if (sortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "title") {
      items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "year") {
      items.sort((a, b) => {
        const ya = parseInt(a.release_date?.slice(0, 4) || 0);
        const yb = parseInt(b.release_date?.slice(0, 4) || 0);
        return yb - ya;
      });
    }

    return items;
  }, [baseItems, searchQ, sortBy, filterRating, tab]);

  if (loading) return <p style={styles.subtle}>Loading...</p>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.avatar}>{username[0].toUpperCase()}</div>
        <div style={styles.userInfo}>
          <h1 style={styles.username}>{username}</h1>
          <p style={styles.joinDate}>@{username}</p>
          <div style={styles.followStats}>
            <span><strong>{followingCount}</strong> Following</span>
            <span><strong>{followerCount}</strong> Followers</span>
          </div>
        </div>
        {!isMe && (
          <div style={styles.actions}>
            {isFollowing ? (
              <button style={styles.unfollowBtn} onClick={handleUnfollow}>Following</button>
            ) : (
              <button style={styles.followBtn} onClick={handleFollow}>Follow</button>
            )}
            <button style={styles.blendBtn} onClick={() => navigate("/blend")}>Blend</button>
          </div>
        )}
      </header>

      {isMe && stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statBigValue}>
              {stats.time_spent.days}<span style={styles.statUnit}>d</span>{" "}
              {stats.time_spent.hours}<span style={styles.statUnit}>h</span>{" "}
              {stats.time_spent.minutes}<span style={styles.statUnit}>m</span>
            </p>
            <p style={styles.statBigLabel}>Time spent watching</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statBigValue}>{stats.movies_watched}</p>
            <p style={styles.statBigLabel}>Movies watched</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statBigValue}>{stats.reviews_count}</p>
            <p style={styles.statBigLabel}>Reviews written</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statBigValue}>{stats.avg_rating || "—"}</p>
            <p style={styles.statBigLabel}>Average rating</p>
          </div>
        </div>
      )}

      {isMe ? (
        <>
          <nav style={styles.tabBar}>
            <TabBtn label="Movies" count={logs.length} active={tab === "movies"} onClick={() => setTab("movies")} />
            <TabBtn label="Reviews" count={reviewedLogs.length} active={tab === "reviews"} onClick={() => setTab("reviews")} />
            <TabBtn label="Liked" count={likedLogs.length} active={tab === "liked"} onClick={() => setTab("liked")} />
            <TabBtn label="Watchlist" count={watchlist.length} active={tab === "watchlist"} onClick={() => setTab("watchlist")} />
            <TabBtn label="Ratings" count={ratedLogs.length} active={tab === "ratings"} onClick={() => setTab("ratings")} />
          </nav>

          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search this list..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              style={styles.toolInput}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.toolSelect}>
              <option value="recent">Sort: Most recent</option>
              <option value="rating">Sort: Highest rated</option>
              <option value="title">Sort: A to Z</option>
              <option value="year">Sort: Newest first</option>
            </select>
            {(tab === "movies" || tab === "ratings") && (
              <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={styles.toolSelect}>
                <option value="all">All ratings</option>
                <option value="high">8+ rated</option>
                <option value="mid">5-7 rated</option>
                <option value="low">Below 5</option>
                <option value="unrated">Unrated</option>
              </select>
            )}
            <p style={styles.resultCount}>{displayItems.length} {displayItems.length === 1 ? "result" : "results"}</p>
          </div>

          <section style={styles.tabContent}>
            {tab === "reviews" && <ReviewList items={displayItems} />}
            {tab === "ratings" && <RatingList items={displayItems} />}
            {(tab === "movies" || tab === "liked" || tab === "watchlist") && (
              <MovieGrid items={displayItems} emptyMessage="Nothing here yet." />
            )}
          </section>
        </>
      ) : (
        <p style={styles.subtle}>This is {username}'s profile. To see their movies, run a Blend with them.</p>
      )}
    </div>
  );
}

function TabBtn({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.tabBtn, ...(active ? styles.tabBtnActive : {}) }}>
      {label}
      {count > 0 && <span style={styles.tabCount}>{count}</span>}
    </button>
  );
}

function MovieGrid({ items, emptyMessage }) {
  if (!items || items.length === 0) {
    return <p style={styles.subtle}>{emptyMessage}</p>;
  }
  return (
    <div style={styles.grid}>
      {items.map((m) => (
        <Link key={m.id || m.tmdb_id} to={`/movie/${m.tmdb_id}`} style={styles.card}>
          {m.poster_url ? (
            <img src={m.poster_url} alt={m.title} style={styles.poster} />
          ) : (
            <div style={styles.noPoster}>No Image</div>
          )}
          <p style={styles.cardTitle}>{m.title}</p>
          {m.rating && <p style={styles.cardRating}>★ {m.rating}</p>}
        </Link>
      ))}
    </div>
  );
}

function ReviewList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.subtle}>No reviews yet.</p>;
  }
  return (
    <div style={styles.reviewList}>
      {items.map((m) => (
        <div key={m.id} style={styles.reviewItem}>
          <Link to={`/movie/${m.tmdb_id}`}>
            {m.poster_url && <img src={m.poster_url} alt={m.title} style={styles.smallPoster} />}
          </Link>
          <div style={styles.reviewBody}>
            <Link to={`/movie/${m.tmdb_id}`} style={styles.reviewTitle}>
              {m.title} <span style={styles.reviewYear}>({m.release_date?.slice(0, 4)})</span>
            </Link>
            {m.rating && <p style={styles.reviewRating}>★ {m.rating}/10</p>}
            <p style={styles.reviewText}>"{m.review}"</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingList({ items }) {
  if (!items || items.length === 0) {
    return <p style={styles.subtle}>No ratings yet.</p>;
  }
  return (
    <div style={styles.ratingList}>
      {items.map((m) => (
        <Link key={m.id} to={`/movie/${m.tmdb_id}`} style={styles.ratingRow}>
          {m.poster_url && <img src={m.poster_url} alt={m.title} style={styles.smallPoster} />}
          <div style={styles.ratingInfo}>
            <p style={styles.ratingTitle}>{m.title}</p>
            <p style={styles.ratingYear}>{m.release_date?.slice(0, 4)}</p>
          </div>
          <p style={styles.ratingValue}>{m.rating}<span style={styles.ratingMax}>/10</span></p>
        </Link>
      ))}
    </div>
  );
}

const styles = {
  page: { padding: "40px", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "24px", marginBottom: "40px", flexWrap: "wrap" },
  avatar: { width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", fontWeight: "800", color: "#fff", flexShrink: 0 },
  userInfo: { flex: 1 },
  username: { fontSize: "32px", fontWeight: "800", color: "#fff", marginBottom: "4px" },
  joinDate: { color: "#8a8a92", fontSize: "14px", marginBottom: "12px" },
  followStats: { display: "flex", gap: "20px", color: "#b8b8c0", fontSize: "14px" },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  followBtn: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer" },
  unfollowBtn: { background: "transparent", color: "#b8b8c0", border: "1px solid #2a2a30", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
  blendBtn: { background: "#1c1c21", color: "#fff", border: "1px solid #2a2a30", padding: "10px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" },
  statCard: { background: "#15151a", border: "1px solid #1f1f24", borderRadius: "12px", padding: "24px", textAlign: "center" },
  statBigValue: { fontSize: "32px", fontWeight: "800", color: "#fff", marginBottom: "6px" },
  statUnit: { fontSize: "18px", color: "#8a8a92", marginLeft: "2px" },
  statBigLabel: { fontSize: "12px", color: "#8a8a92", letterSpacing: "1.5px", textTransform: "uppercase" },
  tabBar: { display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #1f1f24", flexWrap: "wrap" },
  tabBtn: { background: "transparent", border: "none", color: "#8a8a92", fontSize: "14px", fontWeight: "600", cursor: "pointer", padding: "12px 18px", borderBottom: "2px solid transparent", display: "flex", alignItems: "center", gap: "8px" },
  tabBtnActive: { color: "#fff", borderBottom: "2px solid #8b5cf6" },
  tabCount: { fontSize: "11px", background: "#2a2a30", color: "#b8b8c0", padding: "2px 8px", borderRadius: "10px" },
  toolbar: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" },
  toolInput: { flex: "1 1 200px", padding: "8px 14px", background: "#15151a", border: "1px solid #1f1f24", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none" },
  toolSelect: { padding: "8px 14px", background: "#15151a", border: "1px solid #1f1f24", borderRadius: "8px", color: "#fff", fontSize: "13px", cursor: "pointer" },
  resultCount: { color: "#8a8a92", fontSize: "13px", marginLeft: "auto" },
  tabContent: { minHeight: "200px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" },
  card: { textDecoration: "none", color: "inherit" },
  poster: { width: "100%", height: "220px", objectFit: "cover", borderRadius: "6px", background: "#1c1c21" },
  noPoster: { width: "100%", height: "220px", background: "#1c1c21", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5a62", fontSize: "12px" },
  cardTitle: { fontSize: "13px", fontWeight: "600", color: "#fff", marginTop: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardRating: { fontSize: "12px", color: "#f59e0b", marginTop: "2px" },
  reviewList: { display: "flex", flexDirection: "column", gap: "20px" },
  reviewItem: { display: "flex", gap: "16px", background: "#15151a", padding: "16px", borderRadius: "10px", border: "1px solid #1f1f24" },
  smallPoster: { width: "70px", height: "105px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  reviewBody: { flex: 1 },
  reviewTitle: { color: "#fff", fontSize: "16px", fontWeight: "700", textDecoration: "none" },
  reviewYear: { color: "#8a8a92", fontWeight: "400" },
  reviewRating: { color: "#f59e0b", fontSize: "14px", margin: "6px 0" },
  reviewText: { color: "#d4d4dc", fontSize: "14px", lineHeight: 1.6, fontStyle: "italic" },
  ratingList: { display: "flex", flexDirection: "column", gap: "10px" },
  ratingRow: { display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", background: "#15151a", border: "1px solid #1f1f24", borderRadius: "10px", textDecoration: "none" },
  ratingInfo: { flex: 1 },
  ratingTitle: { color: "#fff", fontWeight: "600", fontSize: "15px" },
  ratingYear: { color: "#8a8a92", fontSize: "13px", marginTop: "2px" },
  ratingValue: { fontSize: "24px", fontWeight: "800", color: "#f59e0b" },
  ratingMax: { fontSize: "14px", color: "#8a8a92", fontWeight: "400" },
  subtle: { color: "#8a8a92", fontSize: "14px", padding: "20px 0" },
};

export default Profile;