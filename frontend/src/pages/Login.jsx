import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import { setAdminToken } from "../utils/adminAuth.js";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";
import "../styles/login.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = location.state?.from || "/booking-choice";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function validateForm() {
    setError("");
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
      const adminResponse = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let adminData = {};
      try {
        adminData = await adminResponse.json();
      } catch {
        adminData = {};
      }

      if (adminResponse.ok && adminData.access_token) {
        setAdminToken(adminData.access_token);
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      const adminAuthRejected = adminResponse.status === 401;

      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const userError =
          typeof data.detail === "string" ? data.detail : null;
        const adminError =
          adminAuthRejected && typeof adminData.detail === "string"
            ? adminData.detail
            : null;
        throw new Error(
          userError || adminError || "Invalid email or password"
        );
      }

      login(data.user, data.access_token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
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
    <div className="auth-page">
      <motion.div 
        className="auth-card"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
      >
        <div className="auth-header">
          <Link to="/" className="auth-header-logo">
            <img src={logo} alt="Zuppy" />
          </Link>
          <Link to="/" className="auth-close" aria-label="Close">
            <FaTimes size={16} />
          </Link>
        </div>

        <div className="auth-body">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to book and manage your walks.</p>
          
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="global-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <input
                type="email"
                id="login-email"
                className={`form-input ${showErrors && (!email || !email.includes("@")) ? "invalid" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  className={`form-input ${showErrors && password.length < 6 ? "invalid" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-footer">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
              
              <div className="auth-switch">
                Don't have an account? 
                <Link to="/signup" className="auth-switch-link">Sign up</Link>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;