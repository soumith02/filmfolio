import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/me");
      setMe(meRes.data);

      // Check if logged in user is following this profile user
      const followRes = await api.get("/me/following");
      setFollowing(followRes.data.following);
      setIsFollowing(followRes.data.following.some((u) => u.username === username));

      // We don't have a public profile endpoint, but we can use users/search to find them
      const searchRes = await api.get(`/users/search?query=${username}`);
      // For now, just use Blend's data to fetch their info indirectly
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [username]);

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

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.avatar}>{username[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h1>{username}</h1>
          <p style={styles.subtle}>@{username}</p>
        </div>
        {!isMe && (
          <div style={styles.actions}>
            {isFollowing ? (
              <button style={styles.unfollowBtn} onClick={handleUnfollow}>Following</button>
            ) : (
              <button style={styles.followBtn} onClick={handleFollow}>Follow</button>
            )}
            <button style={styles.blendBtn} onClick={() => navigate(`/blend?with=${username}`)}>
              🎬 Blend
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: { display: "flex", alignItems: "center", gap: "20px", background: "var(--bg-card)", padding: "30px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "30px", flexWrap: "wrap" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "32px", color: "white" },
  subtle: { color: "var(--text-dim)", marginTop: "4px" },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  followBtn: { background: "var(--accent)", color: "white", border: "none", padding: "10px 22px", borderRadius: "6px", fontWeight: "bold" },
  unfollowBtn: { background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", padding: "10px 22px", borderRadius: "6px" },
  blendBtn: { background: "transparent", color: "var(--text)", border: "1px solid var(--border)", padding: "10px 22px", borderRadius: "6px" },
};

export default Profile;