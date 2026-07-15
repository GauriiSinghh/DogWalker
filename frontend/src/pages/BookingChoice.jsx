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
             onClick={() =>
  navigate("/booking", {
    state: {
      mode: "self",
      step: "pet",
    },
  })
}
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