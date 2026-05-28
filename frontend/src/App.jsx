import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Blend from "./pages/Blend";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import MyMovies from "./pages/MyMovies";
import TasteDNA from "./pages/TasteDNA";
import MoodSearch from "./pages/MoodSearch";
import Navbar from "./components/Navbar";
import Watchlist from "./pages/Watchlist";
import FindFriends from "./pages/FindFriends";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Person from "./pages/Person";

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
        <Route path="/blend" element={<ProtectedRoute><Blend /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/movie/:tmdbId" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
        <Route path="/my-movies" element={<ProtectedRoute><MyMovies /></ProtectedRoute>} />
        <Route path="/taste-dna" element={<ProtectedRoute><TasteDNA /></ProtectedRoute>} />
        <Route path="/mood-search" element={<ProtectedRoute><MoodSearch /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FindFriends /></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/u/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/person/:personId" element={<ProtectedRoute><Person /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;