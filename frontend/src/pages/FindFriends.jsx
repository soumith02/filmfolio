import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function FindFriends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);

  const loadFollowData = async () => {
    try {
      const f1 = await api.get("/me/following");
      setFollowing(f1.data.following);
      const f2 = await api.get("/me/followers");
      setFollowers(f2.data.followers);
    } catch (err) {}
  };

  useEffect(() => { loadFollowData(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setResults(res.data.users);
    } catch (err) {
      alert("Search failed");
    }
  };

  const handleFollow = async (username) => {
    try {
      await api.post(`/follow/${username}`);
      setResults((prev) => prev.map((u) => u.username === username ? { ...u, is_following: true } : u));
      loadFollowData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not follow");
    }
  };

  const handleUnfollow = async (username) => {
    try {
      await api.delete(`/follow/${username}`);
      setResults((prev) => prev.map((u) => u.username === username ? { ...u, is_following: false } : u));
      loadFollowData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not unfollow");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "8px" }}>👥 Find Friends</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: "20px" }}>
        Search for users by username and follow them.
      </p>

      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button style={styles.button} type="submit">Search</button>
      </form>

      {results.length > 0 && (
        <section style={styles.section}>
          <h3>Results</h3>
          <div style={styles.list}>
            {results.map((u) => (
              <div key={u.id} style={styles.row}>
                <Link to={`/u/${u.username}`} style={styles.userInfo}>
                  <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
                  <div>
                    <h4>{u.username}</h4>
                    {u.full_name && <p style={styles.subtle}>{u.full_name}</p>}
                  </div>
                </Link>
                {u.is_following ? (
                  <button style={styles.unfollowBtn} onClick={() => handleUnfollow(u.username)}>
                    Following
                  </button>
                ) : (
                  <button style={styles.followBtn} onClick={() => handleFollow(u.username)}>
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={styles.twoCol}>
        <section style={styles.section}>
          <h3>Following ({following.length})</h3>
          {following.length === 0 && <p style={styles.subtle}>Not following anyone yet.</p>}
          <div style={styles.list}>
            {following.map((u) => (
              <Link key={u.username} to={`/u/${u.username}`} style={styles.row}>
                <div style={styles.userInfo}>
                  <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
                  <div>
                    <h4>{u.username}</h4>
                    {u.full_name && <p style={styles.subtle}>{u.full_name}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h3>Followers ({followers.length})</h3>
          {followers.length === 0 && <p style={styles.subtle}>No followers yet.</p>}
          <div style={styles.list}>
            {followers.map((u) => (
              <Link key={u.username} to={`/u/${u.username}`} style={styles.row}>
                <div style={styles.userInfo}>
                  <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
                  <div>
                    <h4>{u.username}</h4>
                    {u.full_name && <p style={styles.subtle}>{u.full_name}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  searchBar: { display: "flex", gap: "10px", marginBottom: "30px" },
  input: { flex: 1, padding: "14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "15px" },
  button: { padding: "14px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" },
  section: { marginBottom: "30px" },
  list: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" },
  userInfo: { display: "flex", alignItems: "center", gap: "14px", flex: 1 },
  avatar: { width: "44px", height: "44px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" },
  subtle: { color: "var(--text-dim)", fontSize: "13px" },
  followBtn: { background: "var(--accent)", color: "white", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "bold", fontSize: "13px" },
  unfollowBtn: { background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: "6px", fontSize: "13px" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
};

export default FindFriends;