import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [labOpen, setLabOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const labRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    api.get("/me").then((res) => setUser(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (labRef.current && !labRef.current.contains(e.target)) setLabOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>CRITIQO</Link>
      </div>

      <form onSubmit={handleSearch} style={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search movies, people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </form>

      <div style={styles.right}>
        <div ref={labRef} style={styles.dropdownWrap}>
          <button style={styles.navBtn} onClick={() => setLabOpen(!labOpen)}>
            The Lab <span style={styles.caret}>▾</span>
          </button>
          {labOpen && (
            <div style={styles.dropdown}>
              <Link to="/blend" style={styles.dropdownItem} onClick={() => setLabOpen(false)}>Blend</Link>
              <Link to="/mood-search" style={styles.dropdownItem} onClick={() => setLabOpen(false)}>Mood Search</Link>
              <Link to="/taste-dna" style={styles.dropdownItem} onClick={() => setLabOpen(false)}>Taste DNA</Link>
            </div>
          )}
        </div>

        <Link to="/friends" style={styles.navLink}>Friends</Link>
        <Link to="/feed" style={styles.navLink}>Feed</Link>

        <div ref={profileRef} style={styles.dropdownWrap}>
          <button style={styles.profileBtn} onClick={() => setProfileOpen(!profileOpen)}>
            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase() || "?"}</div>
            <span style={styles.caret}>▾</span>
          </button>
          {profileOpen && (
            <div style={styles.dropdown}>
              <Link to={`/u/${user?.username}`} style={styles.dropdownItem} onClick={() => setProfileOpen(false)}>Profile</Link>
              <Link to="/my-movies" style={styles.dropdownItem} onClick={() => setProfileOpen(false)}>My Movies</Link>
              <Link to="/watchlist" style={styles.dropdownItem} onClick={() => setProfileOpen(false)}>Watchlist</Link>
              <div style={styles.divider}></div>
              <button onClick={handleLogout} style={{...styles.dropdownItem, ...styles.logoutItem}}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    padding: "14px 40px",
    background: "rgba(15, 15, 18, 0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #1f1f24",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  left: { flexShrink: 0 },
  brand: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "3px",
    color: "#fff",
    textDecoration: "none",
  },
  searchWrap: { flex: 1, maxWidth: "500px" },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    background: "#1c1c21",
    border: "1px solid #2a2a30",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  right: { display: "flex", alignItems: "center", gap: "20px", marginLeft: "auto" },
  navLink: {
    color: "#b8b8c0",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
    padding: "6px 0",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#b8b8c0",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 0",
  },
  caret: { fontSize: "10px", opacity: 0.7 },
  dropdownWrap: { position: "relative" },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "#1c1c21",
    border: "1px solid #2a2a30",
    borderRadius: "8px",
    minWidth: "180px",
    padding: "6px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: 110,
  },
  dropdownItem: {
    display: "block",
    padding: "10px 14px",
    color: "#e8e8ec",
    fontSize: "14px",
    textDecoration: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
  },
  divider: { height: "1px", background: "#2a2a30", margin: "6px 0" },
  logoutItem: { color: "#ef4444" },
  profileBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: 0,
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
    color: "white",
  },
};

export default Navbar;