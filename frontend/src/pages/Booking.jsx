import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding, FaUser, FaPhone, FaHome, FaMapMarkerAlt, FaDog,
} from "react-icons/fa";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function Booking() {
  const navigate = useNavigate();
  
  const [apartment, setApartment] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
// validate
  function validateForm() {
    setError("");
    setSuccess("");
    if (!apartment) return false;
    if (name.trim().length < 2) return false;
   const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(mobile.trim())) 
    return false;


    if (!flatNo.trim()) return false;
    if (address.trim().length < 10) return false;
    return true;
  }

//   submit
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      setShowErrors(true);
      return;
    }

    const bookingData = { apartment, name, mobile, flatNo, address };
    console.log("📤 Sending booking data:", bookingData);

    setLoading(true); 

    try {
      const response = await fetch("http://localhost:8000/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Server responded with an error.");
      }

      const data = await response.json();
      console.log("✅ Server response:", data);

      setSuccess("✅ Booking confirmed! A walker has been notified.");
      setTimeout(() => {
        navigate("/"); 
      }, 10000);
      setShowErrors(false);

      setApartment("");
      setName("");
      setMobile("");
      setFlatNo("");
      setAddress("");
    } catch (err) {
      console.error("❌ Error:", err);
      setError("Could not submit booking. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.main
      className="booking-page"
      {...pageTransition}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="container booking-container">
        <motion.div
          className="booking-card"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Banner */}
          <div className="booking-banner">
            <div className="booking-banner-icon"><FaDog /></div>
            <h1>Emergency Dog Walking</h1>
            <p className="subtitle">A walker at your door in 10 minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            {/* Apartment */}
            <div className="field">
              <label><FaBuilding className="label-icon" /> Select Apartment</label>
              <select
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

            {/* Full Name */}
            <div className="field">
              <label><FaUser className="label-icon" /> Full Name</label>
              <input
                className={showErrors && name.trim().length < 2 ? "invalid" : ""}
                type="text"
                value={name}
                autoComplete="name"
                placeholder="Nikki Smith"
                onChange={(e) => setName(e.target.value)}
              />
              {showErrors && name.trim().length < 2 && (
                <small className="field-error">Enter your full name</small>
              )}
            </div>

            {/* Mobile */}
            <div className="field">
              <label><FaPhone className="label-icon" /> Mobile Number</label>
              <input
                className={showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}
                type="tel"
                autoComplete="tel"
                value={mobile}
                placeholder="989XXXXXXX"
                onChange={(e) =>{
                 setMobile(e.target.value)
                if(showErrors){
                  setError(false);
                }}}
              />
              {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && (
                <small className="field-error">Enter a valid mobile number</small>
              )}
            </div>

            {/* Flat/Villa */}
            <div className="field">
              <label><FaHome className="label-icon" /> Flat / Villa Number</label>
              <input
                className={showErrors && !flatNo.trim() ? "invalid" : ""}
                type="text"
                value={flatNo}
                autoComplete="address-line1"
                placeholder="A-302"
                onChange={(e) => setFlatNo(e.target.value)}
              />
              {showErrors && !flatNo.trim() && (
                <small className="field-error">Enter flat/villa number</small>
              )}
            </div>

            {/* Address */}
            <div className="field">
              <label><FaMapMarkerAlt className="label-icon" /> Detailed Address</label>
              <textarea
                className={showErrors && address.trim().length < 10 ? "invalid" : ""}
                rows="2"
                value={address}
                autoComplete="address-line2"
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

            {/* Messages */}
            {error && <div className="toast error-toast">{error}</div>}
            {success && <div className="toast success">{success}</div>}

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              whileHover={!loading ? { y: -3, scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="spinner-wrap">
                  <span className="spinner"></span> Booking...
                </span>
              ) : (
                "🐾 Book a Walker"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.main>
  );
}

export default Booking;