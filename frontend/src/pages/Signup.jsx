import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/signup", {
        username,
        email,
        full_name: fullName,
        password,
      });
      // Auto-login after signup
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      const res = await api.post("/login", formData);
      localStorage.setItem("token", res.data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CRITIQO</h1>
        <p style={styles.subtitle}>Create your account</p>
        <form onSubmit={handleSignup}>
          <input style={styles.input} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={styles.input} type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit">Sign Up</button>
        </form>
        <p style={styles.switch}>
          Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" },
  card: { background: "var(--bg-card)", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", border: "1px solid var(--border)" },
  logo: { textAlign: "center", fontSize: "28px", marginBottom: "8px", letterSpacing: "6px", fontWeight: "800" },  subtitle: { textAlign: "center", color: "var(--text-dim)", marginBottom: "30px" },
  input: { width: "100%", padding: "14px", marginBottom: "16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "15px" },
  button: { width: "100%", padding: "14px", background: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", marginTop: "8px" },
  error: { color: "var(--accent)", fontSize: "14px", marginBottom: "12px" },
  switch: { textAlign: "center", marginTop: "20px", color: "var(--text-dim)", fontSize: "14px" },
  link: { color: "var(--accent)", fontWeight: "bold" },
};

export default Signup;