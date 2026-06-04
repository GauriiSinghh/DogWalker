import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import AuthBackLink from "../components/AuthBackLink.jsx";
import "../styles/login.css";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Where to go after auth (set by ProtectedRoute). Default to booking choice.
  const redirectTo = location.state?.from || "/booking-choice";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  function validateForm() {
    setError("");
    setSuccess("");
    if (!email || !email.includes("@")) return false;
    if (password.length < 6) return false;
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Handle non-JSON / 404 responses gracefully (root cause of "Not Found")
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 404) {
        throw new Error("Login service not found. Please check API_BASE configuration.");
      }
      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      login(data.user, data.access_token);
      setSuccess("✅ Login successful! Redirecting...");
      setTimeout(() => navigate(redirectTo, { replace: true }), 1200);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(
        err.name === "TypeError"
          ? "Network error. Please check your connection."
          : err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" id="booking-modal">
    <div
      className="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex="-1"
    >
      <aside className="modal-brand">
        <Link to="/" className="modal-brand-logo">
          <img src={logo} alt="Zuppy" width="120" height="40" />
        </Link>
        <p className="modal-brand-eyebrow">You can easily</p>
        <h2 className="modal-brand-headline">On-Demand Dog Walking in Bangalore</h2>
        <p className="modal-brand-text">Verified walkers at your doorstep in minutes.</p>
      </aside>

      <div className="modal-body">
        <Link to="/" className="modal-close" aria-label="Close dialog">&times;</Link>

        <div className="modal-panel" id="panel-login">
        
          <h3 id="modal-title" className="modal-title">Log in</h3>
          <p className="modal-subtitle">Access your walks, saved address, and bookings in one place.</p>
          
          <form id="form-login" className="modal-form" onSubmit={handleSubmit} >  
            <div className="form-field">
              <label htmlFor="login-email">Your email</label>
             <input
  type="email"
  id="login-email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
  required
  placeholder="you@email.com"
/>
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="password-wrap">
               <input
  type="password"
  id="login-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"
  required
  placeholder="••••••••"
/>
{error && (
  <small className="field-error">
    {error}
  </small>
)}

                <button type="button" className="password-toggle" aria-label="Show password">Show</button>
              </div>
            </div>
            <button type="submit" className="btn btn-modal-primary"
            disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="modal-footer-text">Don't have an account? <Link to="/signup" className="modal-link">Create an account</Link></p>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Login;