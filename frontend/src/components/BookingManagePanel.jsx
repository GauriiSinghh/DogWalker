import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
import { useAdminTheme } from "../hooks/useAdminTheme";

const STATUS_OPTIONS = [
  {
    status: "Assigned",
    label: "Assigned",
    description: "Walker assigned",
    variant: "assigned",
  },
  {
    status: "Completed",
    label: "Completed",
    description: "Walk finished",
    variant: "completed",
  },
  {
    status: "Cancelled",
    label: "Cancelled",
    description: "Booking cancelled",
    variant: "cancelled",
  },
];

const DETAIL_ROWS = [
  { key: "name", label: "Name" },
  { key: "apartment", label: "Apartment" },
  { key: "mobile", label: "Mobile" },
];

export default function BookingManagePanel({ booking, onClose, onStatusChange }) {
  const { theme } = useAdminTheme();
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const isLight = theme === "light";

  useEffect(() => {
    if (booking) {
      setFeedback(null);
      setLoadingStatus(null);
    }
  }, [booking]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loadingStatus) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [loadingStatus, onClose]);

  if (!booking) return null;

  const handleAction = async (status) => {
    if (loadingStatus || status === booking.status) return;

    setLoadingStatus(status);
    setFeedback(null);

    try {
      await onStatusChange(booking.id, status);
      setTimeout(onClose, 450);
    } catch {
      setFeedback({ type: "error", message: "Failed to update. Please try again." });
      setLoadingStatus(null);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        className={`admin-manage${isLight ? " admin-manage--light" : ""}`}
        role="presentation"
      >
        <motion.div
          className="admin-manage__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={loadingStatus ? undefined : onClose}
        />
        <motion.div
          className="admin-manage__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-manage-title"
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="admin-manage__header">
            <div className="admin-manage__header-text">
              <span className="admin-manage__id-chip">Booking #{booking.id}</span>
              <h3 id="admin-manage-title" className="admin-manage__title">
                Manage Booking
              </h3>
            </div>
            <button
              type="button"
              className="admin-manage__close"
              onClick={onClose}
              disabled={Boolean(loadingStatus)}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          <div className="admin-manage__content">
            <section className="admin-manage__panel">
              <h4 className="admin-manage__panel-title">Details</h4>
              <div className="admin-manage__details-card">
                <dl className="admin-manage__details-list">
                  {DETAIL_ROWS.map(({ key, label }) => (
                    <div key={key} className="admin-manage__detail-row">
                      <dt>{label}</dt>
                      <dd>{booking[key]}</dd>
                    </div>
                  ))}
                  <div className="admin-manage__detail-row">
                    <dt>Current Status</dt>
                    <dd>
                      <StatusBadge status={booking.status} compact inModal />
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="admin-manage__panel">
              <h4 className="admin-manage__panel-title">Update Status</h4>
              <div className="admin-manage__status-cards" role="group" aria-label="Update status">
                {STATUS_OPTIONS.map(({ status, label, description, variant }) => {
                  const isLoading = loadingStatus === status;
                  const isCurrent = booking.status === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      className={`admin-manage__status-card admin-manage__status-card--${variant}${
                        isCurrent ? " admin-manage__status-card--current" : ""
                      }${isLoading ? " admin-manage__status-card--loading" : ""}`}
                      onClick={() => handleAction(status)}
                      disabled={Boolean(loadingStatus)}
                    >
                      <span className={`admin-manage__status-dot admin-manage__status-dot--${variant}`} />
                      <span className="admin-manage__status-card-body">
                        <span className="admin-manage__status-label">{label}</span>
                        <span className="admin-manage__status-desc">{description}</span>
                      </span>
                      {isLoading && (
                        <span className="admin-manage__card-spinner" aria-label="Updating" />
                      )}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div
                  className={`admin-manage__feedback admin-manage__feedback--${feedback.type}`}
                  role="alert"
                >
                  {feedback.message}
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
