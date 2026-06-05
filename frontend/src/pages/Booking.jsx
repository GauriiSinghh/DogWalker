import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import SuccessModal from "../components/SuccessModal.jsx";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

function Booking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const prefillSelf = location.state?.mode === "self";
  
  const [apartment, setApartment] = useState(prefillSelf ? user?.apartment || "" : "");
  const [name, setName] = useState(prefillSelf ? user?.name || "" : "");
  const [mobile, setMobile] = useState(prefillSelf ? user?.mobile || "" : "");
  const [flatNo, setFlatNo] = useState(prefillSelf ? user?.flatNo || "" : "");
  const [address, setAddress] = useState(prefillSelf ? user?.address || "" : "");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function validateForm() {
    setError("");
    let isValid = true;
    
    const scrollToId = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (address.trim().length < 10) { isValid = false; scrollToId("address"); }
    if (!flatNo.trim()) { isValid = false; scrollToId("flatNo"); }
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile.trim())) { isValid = false; scrollToId("mobile"); }
    if (name.trim().length < 2) { isValid = false; scrollToId("name"); }
    if (!apartment) { isValid = false; scrollToId("apartment"); }

    return isValid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }

    const bookingData = {
      apartment, name, mobile, flatNo, address,
      email: user?.email || null,
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Booking failed");

      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const currentTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });

      setConfirmed({
        id: data.id,
        name,
        apartment,
        flatNo,
        mobile,
        address,
        status: data.status || "A walker will be assigned shortly",
        date: currentDate,
        time: currentTime,
        email: data.email || user?.email,
      });

      setShowErrors(false);
      setApartment(""); setName(""); setMobile(""); setFlatNo(""); setAddress("");
    } catch (err) {
      setError("Could not submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
            <h1 className="auth-title">Book a Walker</h1>
            
            {/* Added extra margin bottom since we removed the subtitle */}
            <form className="auth-form" style={{ marginTop: '24px' }} onSubmit={handleSubmit} noValidate>
              {error && <div className="global-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="apartment" className="form-label">Select Apartment</label>
                <select
                  id="apartment"
                  className={`form-select ${showErrors && !apartment ? "invalid" : ""}`}
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                >
                  <option value="">-- Choose Apartment --</option>
                  <option value="A">Sobha Dream Acres Apartment</option>
                  <option value="B">Prestige Shantiniketan</option>
                  <option value="C">Purva Fountain Square</option>
                  <option value="D">DLF Jigani</option>
                </select>
                {showErrors && !apartment && <div className="field-error-msg">Please select an apartment</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className={`form-input ${showErrors && name.trim().length < 2 ? "invalid" : ""}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nikki Smith"
                  />
                  {showErrors && name.trim().length < 2 && <div className="field-error-msg">Enter the full name</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="mobile" className="form-label">Mobile Number</label>
                  <input
                    id="mobile"
                    type="tel"
                    className={`form-input ${showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}`}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="989XXXXXXX"
                  />
                  {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && <div className="field-error-msg">Enter a valid mobile number</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="flatNo" className="form-label">Flat / Villa Number</label>
                  <input
                    id="flatNo"
                    type="text"
                    className={`form-input ${showErrors && !flatNo.trim() ? "invalid" : ""}`}
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    placeholder="A-302"
                  />
                  {showErrors && !flatNo.trim() && <div className="field-error-msg">Enter flat/villa number</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="address" className="form-label">Detailed Address</label>
                  <input
                    id="address"
                    type="text"
                    className={`form-input ${showErrors && address.trim().length < 10 ? "invalid" : ""}`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No. 10, Near Central Park..."
                  />
                  {showErrors && address.trim().length < 10 && <div className="field-error-msg">Please enter a detailed address</div>}
                </div>
              </div>

              <div className="sticky-footer">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Booking..." : "🐾 Book a Walker"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <SuccessModal
        open={!!confirmed}
        booking={confirmed || {}}
        onHome={() => navigate("/")}
      />
    </>
  );
}

export default Booking;