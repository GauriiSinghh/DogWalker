import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { FaDog, FaUsers } from "react-icons/fa";
import { API_BASE } from "../config/api.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { Link } from "react-router-dom";
import "../styles/booking-choice.css";
import "../styles/modal-base.css";
import logo from "../assets/images/logo.png";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function BookingChoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState(null); // booking object

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleBookForMyself = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apartment: user.apartment,
          name: user.name,
          mobile: user.mobile,
          flatNo: user.flatNo,
          address: user.address,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Booking failed");

      setConfirmed({
        id: data.id,
        name: data.name || user.name,
        apartment: data.apartment || user.apartment,
        flatNo: user.flatNo,
        email: data.email || user.email,
        mobile: user.mobile,
address: user.address,
date: new Date().toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}),
time: new Date().toLocaleTimeString("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
      });
    } catch (err) {
      setErrorMsg(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookForSomeoneElse = () =>
  navigate("/booking", { state: { mode: "other" } });

  if (!user) return null;

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

        <div className="modal-panel" id="panel-booking-choice">
          <h3 id="modal-title" className="modal-title">Who is this walk for?</h3>
          <p className="modal-subtitle">Choose how you'd like to book your next Zuppy walk.</p>

         
          <div className="modal-choices">
           <button
  type="button"
  className="modal-choice-card"
  onClick={handleBookForMyself}
>
              <span className="modal-choice-icon" aria-hidden="true">🐕</span>
              <span className="modal-choice-title">Book for myself</span>
              <span className="modal-choice-desc">Walk for your dog at your saved address.</span>
            </button>
            <Link to="/booking" state={{ mode: "other" }} className="modal-choice-card">
              <span className="modal-choice-icon" aria-hidden="true">🎁</span>
              <span className="modal-choice-title">Book for someone else</span>
              <span className="modal-choice-desc">Gift a walk — we'll use the address you enter.</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <SuccessModal
  open={!!confirmed}
  booking={confirmed}
  email={confirmed?.email}
  onHome={() => navigate("/")}
  onDetails={() => navigate("/booking")}
  onBookAnother={() => setConfirmed(null)}
/>
  </div>
  );
}

export default BookingChoice;