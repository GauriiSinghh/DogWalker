import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/modal-base.css";
import "../styles/booking-confirmation.css";
import logo from "../assets/images/logo.png";



function SuccessModal({ open, booking = {}, email, onHome, onDetails, onBookAnother }) {
  console.log("SuccessModal booking:", booking);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
           className="modal-overlay" id="booking-modal">
           <motion.div>
       
               <div
      className="modal-dialog"
     
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
       <button
  className="modal-close"
  aria-label="Close dialog"
  onClick={onBookAnother}
>
  &times;
</button>
           
            
 <div className="modal-panel" id="panel-confirmation">
          
          <h3 id="modal-title" className="modal-title">Booking confirmed</h3>
          <p className="modal-subtitle">Your walk request has been received.</p>

          <div className="booking-summary" id="booking-summary">
            <dl>
              <dt>Name</dt>
              <dd>{booking.name ? booking.name.charAt(0).toUpperCase() + booking.name.slice(1) : ""}</dd>
              <dt>Pickup address</dt>
              <dd>{booking.flatNo}, {booking.apartment}, {booking.address}</dd>
              <dt>Contact</dt>
              <dd>{booking.mobile}</dd>
              <dt>Requested On</dt>
              <dd>{booking.date} at {booking.time}</dd>
            </dl>
          </div>
          <p className="confirmation-email" id="confirmation-email-msg">Confirmation email sent to {email}</p>

          <button className="btn btn-modal-primary btn-done-link" onClick={onHome}>
            Done
          </button>
        </div>
        </div>
        </div>
     
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SuccessModal;