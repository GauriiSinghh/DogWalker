import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaBuilding, FaUser, FaPhone, FaHome, FaMapMarkerAlt, FaDog,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import SuccessModal from "../components/SuccessModal.jsx";
import logo from "../assets/images/logo.png";
import "../styles/signup.css";
import "../styles/modal-base.css";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
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

function validateForm() {
  setError("");

  if (!apartment) {
    document.getElementById("apartment")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (name.trim().length < 2) {
    document.getElementById("name")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

  if (!phoneRegex.test(mobile.trim())) {
    document.getElementById("mobile")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (!flatNo.trim()) {
    document.getElementById("flatNo")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  if (address.trim().length < 10) {
    document.getElementById("address")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  return true;
}

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }

    // email = logged-in account email so the user always gets a confirmation
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
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const currentTime = new Date().toLocaleTimeString("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
console.log(currentDate, currentTime);
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
             
              <h3 id="modal-title" className="modal-title">Book a Walker</h3>
              <p className="modal-subtitle">  A walker at your door in 10 minutes</p>
    
              <form id="form-signup" className="modal-form" onSubmit={handleSubmit} noValidate >
            <div className="form-field">
              <label htmlFor="apartment"> Select Apartment</label>
              <select id="apartment"
                className={showErrors && !apartment ? "invalid" : ""}
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                
              >
                <option value="">-- Choose Apartment --</option>
                <option value="A">Sobha Dream Acres Apartment</option>
                <option value="B">Prestige Shantiniketan</option>
                <option value="C">Purva Fountain Square</option>
                <option value="D">DLF Jigani</option>
              </select>
              {showErrors && !apartment && (
                <small className="field-error">Please select an apartment</small>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="name"> Full Name</label>
              <input id="name"
                className={showErrors && name.trim().length < 2 ? "invalid" : ""}
                type="text" value={name} autoComplete="name" placeholder="Nikki Smith"
                onChange={(e) => setName(e.target.value)}
              />
              {showErrors && name.trim().length < 2 && (
                <small className="field-error">Enter the full name</small>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="mobile"> Mobile Number</label>
              <input id="mobile"
                className={showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}
                type="tel" autoComplete="tel" value={mobile} placeholder="989XXXXXXX"
                onChange={(e) => setMobile(e.target.value)}
              />
              {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && (
                <small className="field-error">Enter a valid mobile number</small>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="flatNo">Flat / Villa Number</label>
              <input id="flatNo"
                className={showErrors && !flatNo.trim() ? "invalid" : ""}
                type="text" value={flatNo} autoComplete="address-line1" placeholder="A-302"
                onChange={(e) => setFlatNo(e.target.value)}
              />
              {showErrors && !flatNo.trim() && (
                <small className="field-error">Enter flat/villa number</small>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="address"> Detailed Address</label>
              <textarea id="address"
                className={showErrors && address.trim().length < 10 ? "invalid" : ""}
                rows="2" value={address} autoComplete="address-line2"
                placeholder="House No. 10, Near Central Park, Sector 15"
                onChange={(e) => {
                  setAddress(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
              {showErrors && address.trim().length < 10 && (
                <small className="field-error">Please enter a detailed address</small>
              )}
            </div>

            {error && <div className="toast error-toast">{error}</div>}

            <button
              type="submit" className="btn btn-modal-primary "
              disabled={loading}
            >
              {loading ? "Booking..." :"🐾 Book a Walker"}
                
            </button>
          </form>
          </div>
          </div>
          </div>
          </div>
  
        
      

      <SuccessModal
        open={!!confirmed}
        booking={confirmed || {}}
        email={confirmed?.email}
        onHome={() => navigate("/")}
        onDetails={() => navigate("/")}
        onBookAnother={() => setConfirmed(null)}
      />
      </>
    
  );
}

export default Booking;