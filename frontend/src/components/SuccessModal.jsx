import { AnimatePresence, motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

function SuccessModal({ open, booking = {}, onHome }) {
  if (!open) return null;
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="auth-page auth-page--overlay"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
        >
          <motion.div 
            className="auth-card auth-card--success"
            variants={modalVariants}
          >
            <div className="auth-header auth-header--minimal">
              <div className="auth-header-logo">
                <img src={logo} alt="Zuppy" />
              </div>
            </div>

            <div className="auth-body success-card">
              <div className="success-hero">
                <div className="success-icon-wrap" aria-hidden="true">
                  <span className="success-icon-check">
                    <FaCheck />
                  </span>
                </div>
                <h2 className="success-title">Booking confirmed</h2>
              </div>
              
              <div className="success-summary">
                <div className="summary-item">
                  <div className="summary-label">Name</div>
                  <div className="summary-value">
                    {booking.name ? booking.name.charAt(0).toUpperCase() + booking.name.slice(1) : ""}
                  </div>
                </div>
                
                <div className="summary-item">
                  <div className="summary-label">Contact</div>
                  <div className="summary-value">{booking.mobile}</div>
                </div>
                
                <div className="summary-item">
                  <div className="summary-label">Pickup Address</div>
                  <div className="summary-value">
                    {booking.flatNo}, {booking.apartment}, {booking.address}
                  </div>
                </div>
                
                <div className="summary-item">
                  <div className="summary-label">Requested On</div>
                  <div className="summary-value">
                    {booking.date} at {booking.time}
                  </div>
                </div>
              </div>

              <button className="btn-primary btn-primary--done" onClick={onHome}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SuccessModal;
