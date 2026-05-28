import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🎬 FilmFolio</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/search" style={styles.link}>Search</Link>
        <Link to="/my-movies" style={styles.link}>My Movies</Link>
        <Link to="/mood-search" style={styles.link}>Mood Search</Link>
        <Link to="/taste-dna" style={styles.link}>Taste DNA</Link>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 30px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "10px" },
  brand: { fontSize: "22px", fontWeight: "bold" },
  links: { display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" },
  link: { color: "var(--text-dim)", fontSize: "15px" },
  logout: { background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", padding: "6px 14px", borderRadius: "6px", fontSize: "14px" },
};

export default Navbar;