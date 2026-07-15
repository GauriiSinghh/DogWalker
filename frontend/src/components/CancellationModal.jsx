import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { useToast } from "./Toast";
import "../styles/modal-base.css";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 28 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.18 }
  }
};

const CUSTOMER_REASONS = [
  "Change of plans",
  "No longer need the service",
  "Other"
];

const ADMIN_REASONS = [
  "Change of plans",
  "No longer need the service",
  "Walker unavailable",
  "Customer no-show",
  "Policy violation",
  "Other"
];

export default function CancellationModal({ open, onClose, onConfirm, role = "customer", bookingId }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const reasons = role === "admin" ? ADMIN_REASONS : CUSTOMER_REASONS;

  // Reset fields when modal is opened/closed
  useEffect(() => {
    if (open) {
      setSelectedReason("");
      setCustomReason("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const isOther = selectedReason === "Other";
  const isValid = selectedReason && (!isOther || customReason.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    const finalReason = isOther ? customReason.trim() : selectedReason;

    try {
      await onConfirm(bookingId, finalReason, role);
      toast.success("Booking cancelled successfully.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="auth-page auth-page--overlay"
        style={{ zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
      >
        <motion.div
          className="auth-card"
          style={{ width: "100%", maxWidth: "480px", margin: "16px", padding: "28px" }}
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FiAlertTriangle style={{ color: "#ef4444", fontSize: "1.4rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--z-title, #1e293b)" }}>
                Cancel Booking
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                color: "var(--z-muted, #64748b)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "background-color 0.2s"
              }}
              className="hover-bg-light"
            >
              <FiX size={20} />
            </button>
          </header>

          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: "0.95rem", color: "var(--z-muted, #64748b)", marginBottom: "20px" }}>
              Please select a reason for cancelling booking #{bookingId}. This action cannot be undone.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {reasons.map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: selectedReason === reason ? "#f97316" : "var(--z-border, #e2e8f0)",
                    background: selectedReason === reason ? "rgba(249, 115, 22, 0.04)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <input
                    type="radio"
                    name="cancellation_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    style={{ accentColor: "#f97316", width: "16px", height: "16px" }}
                    disabled={submitting}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--z-text, #334155)" }}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {isOther && (
              <div style={{ marginBottom: "24px" }}>
                <textarea
                  placeholder="Please type your custom reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  disabled={submitting}
                  required
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--z-border, #e2e8f0)",
                    fontSize: "0.95rem",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  maxLength={250}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={submitting}
                style={{ padding: "10px 18px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: 600, minHeight: "40px" }}
              >
                Keep Booking
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!isValid || submitting}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  backgroundColor: isValid ? "#ef4444" : "var(--z-muted, #94a3b8)",
                  borderColor: isValid ? "#ef4444" : "var(--z-muted, #94a3b8)",
                  color: "#ffffff",
                  minHeight: "40px"
                }}
              >
                {submitting ? "Cancelling..." : "Cancel Booking"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
