import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";
import "../styles/signup.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
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
  const [petName, setPetName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [petImagePreview, setPetImagePreview] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [petImageError, setPetImageError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const MAX_PET_IMAGE_SIZE = 2 * 1024 * 1024;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function validateForm() {
    setError("");
    let isValid = true;
    
    const scrollToId = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (password.length < 6) { isValid = false; scrollToId("signup-password"); }
    if (!email || !email.includes("@")) { isValid = false; scrollToId("signup-email"); }
    if (address.trim().length < 10) { isValid = false; scrollToId("signup-address"); }
    if (!flatNo.trim()) { isValid = false; scrollToId("signup-flat"); }
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile.trim())) { isValid = false; scrollToId("signup-mobile"); }
    if (name.trim().length < 2) { isValid = false; scrollToId("signup-name"); }
    if (!apartment) { isValid = false; scrollToId("signup-apartment"); }
    if (petName.trim().length < 2) { isValid = false; scrollToId("signup-pet-name"); }
    if (!petImage) { isValid = false; scrollToId("signup-pet-image"); }

    return isValid;
  }

  function handlePetImageChange(e) {
    const file = e.target.files?.[0];
    setPetImageError("");

    if (!file) {
      setPetImage("");
      setPetImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPetImageError("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PET_IMAGE_SIZE) {
      setPetImageError("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPetImage(result);
      setPetImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setError("");

    if (!validateForm()) {
      setShowErrors(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment,
          name,
          mobile,
          flatNo,
          address,
          email,
          password,
          pet_name: petName.trim(),
          pet_image: petImage,
        }),
      });

      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      login(data.user, data.access_token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if(err.message.toLowerCase().includes("email")){
        setEmailError("Email is already registered");
        document.getElementById("signup-email")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setError(err.message || "SignUp Failed. Please try again.");
      }
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
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Sign up to book walks and save your details.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="global-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="signup-apartment" className="form-label">Select apartment</label>
              <select
                id="signup-apartment"
                className={`form-select ${showErrors && !apartment ? "invalid" : ""}`}
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
              >
                <option value="">-- Choose apartment --</option>
                <option value="Sobha Dream Acres Apartment">Sobha Dream Acres Apartment</option>
                <option value="Prestige Shantiniketan">Prestige Shantiniketan</option>
                <option value="Purva Fountain Square">Purva Fountain Square</option>
                <option value="DLF Jigani">DLF Jigani</option>
              </select>
              {showErrors && !apartment && <div className="field-error-msg">Please select an apartment</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-name" className="form-label">Full name</label>
                <input
                  id="signup-name"
                  type="text"
                  className={`form-input ${showErrors && name.trim().length < 2 ? "invalid" : ""}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nikki Smith"
                />
                {showErrors && name.trim().length < 2 && <div className="field-error-msg">Please enter your full name</div>}
              </div>
              <div className="form-group">
                <label htmlFor="signup-mobile" className="form-label">Mobile number</label>
                <input
                  id="signup-mobile"
                  type="tel"
                  className={`form-input ${showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}`}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="989XXXXXXX"
                />
                {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && <div className="field-error-msg">Enter a valid 10-digit number</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-flat" className="form-label">Flat / Villa number</label>
                <input
                  id="signup-flat"
                  type="text"
                  className={`form-input ${showErrors && !flatNo.trim() ? "invalid" : ""}`}
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="A-302"
                />
                {showErrors && !flatNo.trim() && <div className="field-error-msg">Required</div>}
              </div>
              <div className="form-group">
                <label htmlFor="signup-address" className="form-label">Detailed address</label>
                <input
                  id="signup-address"
                  type="text"
                  className={`form-input ${showErrors && address.trim().length < 10 ? "invalid" : ""}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tower A, Near gate 2..."
                />
                {showErrors && address.trim().length < 10 && <div className="field-error-msg">Please enter a detailed address</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-pet-name" className="form-label">Pet name</label>
                <input
                  id="signup-pet-name"
                  type="text"
                  className={`form-input ${showErrors && petName.trim().length < 2 ? "invalid" : ""}`}
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Bruno"
                />
                {showErrors && petName.trim().length < 2 && (
                  <div className="field-error-msg">Please enter your pet's name</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="signup-pet-image" className="form-label">Pet photo</label>
                <div className="pet-image-upload">
                  <input
                    id="signup-pet-image"
                    type="file"
                    accept="image/*"
                    className="pet-image-input"
                    onChange={handlePetImageChange}
                  />
                  <label htmlFor="signup-pet-image" className={`pet-image-label ${showErrors && !petImage ? "invalid" : ""}`}>
                    {petImagePreview ? (
                      <img src={petImagePreview} alt="Pet preview" className="pet-image-preview" />
                    ) : (
                      <span>Upload a photo</span>
                    )}
                  </label>
                </div>
                {showErrors && !petImage && (
                  <div className="field-error-msg">Please upload a pet photo</div>
                )}
                {petImageError && <div className="field-error-msg">{petImageError}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Email address</label>
              <input
                id="signup-email"
                type="email"
                className={`form-input ${(showErrors && (!email || !email.includes("@"))) || emailError ? "invalid" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@example.com"
              />
              {showErrors && (!email || !email.includes("@")) && <div className="field-error-msg">Enter a valid email address</div>}
              {emailError && <div className="field-error-msg">{emailError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${showErrors && password.length < 6 ? "invalid" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {showErrors && password.length < 6 && <div className="field-error-msg">Password must be at least 6 characters</div>}
            </div>

            <div className="sticky-footer">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
              <div className="auth-switch" style={{marginTop: '24px'}}>
                Already have an account?
                <Link to="/login" className="auth-switch-link">Log in</Link>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;