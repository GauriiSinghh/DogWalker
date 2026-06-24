// src/pages/BookingChoice.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { FaTimes, FaRegUser, FaGift } from "react-icons/fa";
import { API_BASE } from "../config/api.js";
import { payForBooking } from "../services/razorpay.js";
import SuccessModal from "../components/SuccessModal.jsx";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

function BookingChoice() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
}, []);

  const handleBookForMyself = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");

      // Single source of truth: pull the freshest profile, sync context,
      // and submit those exact values (covers edits made just before booking).
     const current = user;

      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apartment: current.apartment,
          name: current.name,
          mobile: current.mobile,
          flatNo: current.flatNo,
          address: current.address,
          email: current.email,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Booking failed"
        );
      }

      await payForBooking({
        bookingId: data.id,
        token,
        user: current,
        name: current.name,
        email: current.email,
        mobile: current.mobile,
      });

      setConfirmed({
        id: data.id,
        name: data.name || current.name,
        apartment: data.apartment || current.apartment,
        flatNo: current.flatNo,
        mobile: current.mobile,
        address: current.address,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        }),
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: true,
        }),
      });
    } catch (err) {
      setErrorMsg(
        err.name === "TypeError"
          ? "Unable to reach the server. Please try again."
          : err.message || "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
            <h1 className="auth-title">Who is this walk for?</h1>
            <p className="auth-subtitle">Select an option to continue booking.</p>

            {errorMsg && <div className="global-error">{errorMsg}</div>}

            <div className="choice-grid">
              <button 
                type="button"
                className="choice-card"
                onClick={handleBookForMyself}
                disabled={loading}
              >
                <div className="choice-icon-wrap">
                  <FaRegUser />
                </div>
                <div className="choice-content">
                  <div className="choice-title">For myself</div>
                  <div className="choice-desc">Walk for your dog at your saved address</div>
                </div>
                <div className="choice-arrow">→</div>
              </button>

              <Link 
                to="/booking" 
                state={{ mode: "other" }} 
                className="choice-card"
              >
                <div className="choice-icon-wrap">
                  <FaGift />
                </div>
                <div className="choice-content">
                  <div className="choice-title">For someone else</div>
                  <div className="choice-desc">Gift a walk to a different address</div>
                </div>
                <div className="choice-arrow">→</div>
              </Link>
            </div>
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

export default BookingChoice;