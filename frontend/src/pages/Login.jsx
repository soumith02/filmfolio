import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // The login endpoint expects form data
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/login", formData);
      // Save the token
      localStorage.setItem("token", response.data.access_token);
      // Go to dashboard
      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🎬 FilmFolio</h1>
        <p style={styles.subtitle}>Track movies. Discover your taste.</p>

        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit">Log In</button>
        </form>

        <p style={styles.switch}>
          Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  card: {
    background: "var(--bg-card)",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid var(--border)",
  },
  logo: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "8px",
  },
  subtitle: {
    textAlign: "center",
    color: "var(--text-dim)",
    marginBottom: "30px",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "16px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "8px",
  },
  error: {
    color: "var(--accent)",
    fontSize: "14px",
    marginBottom: "12px",
  },
  switch: {
    textAlign: "center",
    marginTop: "20px",
    color: "var(--text-dim)",
    fontSize: "14px",
  },
  link: {
    color: "var(--accent)",
    fontWeight: "bold",
  },
};

export default Login;