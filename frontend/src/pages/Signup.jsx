import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate,useLocation, Link } from "react-router-dom";
import {
  FaBuilding,
  FaUser,
  FaPhone,
  FaHome,
  FaMapMarkerAlt,
  FaEnvelope,
  FaLock,
  FaDog,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import AuthBackLink from "../components/AuthBackLink.jsx";
import "../styles/signup.css";
import "../styles/modal-base.css";
import logo from "../assets/images/logo.png";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from || "/booking-choice";

  const [apartment, setApartment] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const[emailError, setEmailError]= useState("");

  function validateForm() {
  setError("");
  setSuccess("");

  if (!apartment) {
    document.getElementById("signup-apartment")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (name.trim().length < 2) {
    document.getElementById("signup-name")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(mobile.trim())) {
    document.getElementById("signup-phone")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (!flatNo.trim()) {
    document.getElementById("signup-flat")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (address.trim().length < 10) {
    document.getElementById("signup-address-detail")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (!email || !email.includes("@")) {
    document.getElementById("signup-email")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (password.length < 6) {
    document.getElementById("signup-password")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  return true;
}

  async function handleSubmit(e) {
    e.preventDefault();
    setEmailError("")

   if (!validateForm()) {
  setShowErrors(true);
  return;
}

    setLoading(true);
    try {
     const response = await fetch(`${API_BASE}/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apartment, name, mobile, flatNo, address, email, password }),
});

let responsedata = {};
try { responsedata = await response.json(); } catch { responsedata = {}; }

if (response.status === 404) {
  throw new Error("Signup service not found. Please check API_BASE configuration.");
}
if (!response.ok) {
  throw new Error(responsedata.detail || "Signup failed");
}
     

      login(responsedata.user, responsedata.access_token);
setSuccess("✅ Account created! Redirecting...");
setTimeout(() => {
  navigate(redirectTo, { replace: true });   // ← was "/booking-choice"
}, 1500);
    } catch (err) {
      console.error("❌ Signup error:", err);
      if(err.message.toLowerCase().includes("email")){
      setEmailError("Email is already registered");
    } else{
      setError(err.message || "SignUp Failed. Please try again. ")
    }
    
  }
  finally{
    setLoading(false);
  }}

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

        <div className="modal-panel" id="panel-signup">
         
          <h3 id="modal-title" className="modal-title">Create an account</h3>
          <p className="modal-subtitle">Sign up to book walks and save your home address for faster checkout.</p>

          <form id="form-signup" className="modal-form" onSubmit={handleSubmit} >
            <div className="form-field">
              <label htmlFor="signup-apartment">Select apartment</label>
              <select
  className={showErrors && !apartment ? "invalid" : ""}
  id="signup-apartment"
  value={apartment}
  onChange={(e) => setApartment(e.target.value)}
 >
                <option value="">-- Choose apartment --</option>
                <option value="Sobha Dream Acres Apartment">Sobha Dream Acres Apartment</option>
                <option value="Prestige Shantiniketan">Prestige Shantiniketan</option>
                <option value="Purva Fountain Square">Purva Fountain Square</option>
                <option value="DLF Jigani">DLF Jigani</option>
              </select>
              {showErrors && !apartment && (
  <small className="field-error">
    Please select an apartment
  </small>
)}
            </div>
            <div className="form-field">
              <label htmlFor="signup-name">Full name</label>
              <input id ="signup-name" className={showErrors &&  name.trim().length < 2 ? "invalid" : ""}
               type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"  placeholder="Nikki Smith" />
           {showErrors && name.trim().length < 2 && (
  <small className="field-error">
    Please enter your full name
  </small>
)}
            </div>
            
            <div className="form-field">
            <label htmlFor="signup-phone">Mobile number</label>

<input
  className={showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}
  type="tel"
  id="signup-phone"
  name="mobile"
  value={mobile}
  onChange={(e) => setMobile(e.target.value)}
  autoComplete="tel"
  
  placeholder="989XXXXXXX"
/>
            {showErrors &&
 !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && (
  <small className="field-error">
    Please enter a valid 10-digit mobile number
  </small>
)}
            </div>
            <div className="form-field">
              <label htmlFor="signup-flat">Flat / villa number</label>
              <input
  className={showErrors && !flatNo.trim() ? "invalid" : ""}
  type="text"
  id="signup-flat"
  value={flatNo}
  onChange={(e) => setFlatNo(e.target.value)}
  placeholder="A-302" />
           {showErrors && !flatNo.trim() && (
  <small className="field-error">
    Please enter flat/villa number
  </small>
)}
            </div>
            <div className="form-field">
              <label htmlFor="signup-address-detail">Detailed address</label>
             <input
  className={showErrors && address.trim().length < 10 ? "invalid" : ""}
  type="text"
  id="signup-address-detail"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
 autoComplete="street-address" required placeholder="House No. 10, Near Central Park, Sector 15" />
           {showErrors && address.trim().length < 5 && (
  <small className="field-error">
    Please enter a detailed address
  </small>
)}
            </div>
            <div className="form-field">
              <label htmlFor="signup-email">Email address</label>
             
           <input type="email" id="signup-email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"  placeholder="your@email.com" />
            {showErrors && (!email || !email.includes("@")) && (
  <small className="field-error">
    Please enter a valid email address
  </small>

)}
            </div>
            <div className="form-field">
              <label htmlFor="signup-password">Password</label>
              <div className="password-wrap">
                <input
  className={showErrors && password.length < 6 ? "invalid" : ""}
  type="password"
  id="signup-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
 autoComplete="new-password"  placeholder="Min 6 characters" />
                <button type="button" className="password-toggle" aria-label="Show password">Show</button>
                {showErrors && password.length < 6 && (
  <small className="field-error">
    Password must be at least 6 characters
  </small>
)}
{emailError && (
  <small className="field-error">
    {emailError} 
 </small>
)}
              </div>
            </div>
            
           <button
  type="submit"
  className="btn btn-modal-primary"
  disabled={loading}
>
  {loading ? "Creating Account..." : "Create Account"}
</button>
          </form>
          <p className="modal-footer-text">Already have an account? <Link to="/login" className="modal-link">Log in</Link></p>
        </div>
      </div>
    </div>
  </div>

  );
}

export default Signup;