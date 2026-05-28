import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import MyMovies from "./pages/MyMovies";
import TasteDNA from "./pages/TasteDNA";
import MoodSearch from "./pages/MoodSearch";
import Navbar from "./components/Navbar";

// A wrapper that only shows pages if the user is logged in
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
        {children}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/my-movies" element={<ProtectedRoute><MyMovies /></ProtectedRoute>} />
        <Route path="/taste-dna" element={<ProtectedRoute><TasteDNA /></ProtectedRoute>} />
        <Route path="/mood-search" element={<ProtectedRoute><MoodSearch /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;