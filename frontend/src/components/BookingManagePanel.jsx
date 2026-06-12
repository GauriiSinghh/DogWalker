import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
import ImageLightbox from "./ImageLightbox";
import { useAdminTheme } from "../hooks/useAdminTheme";
import { getWalkers } from "../services/adminApi";

const STATUS_OPTIONS = [
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
  { key: "name", label: "Customer" },
  { key: "apartment", label: "Apartment" },
  { key: "mobile", label: "Mobile" },
  { key: "address", label: "Address" },
];

export default function BookingManagePanel({ booking, onClose, onBookingUpdate }) {
  const { theme } = useAdminTheme();
  const [loadingAction, setLoadingAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [walkers, setWalkers] = useState([]);
  const [walkersLoading, setWalkersLoading] = useState(true);
  const [selectedWalkerId, setSelectedWalkerId] = useState("");
  const isLight = theme === "light";

  useEffect(() => {
    if (booking) {
      setFeedback(null);
      setLoadingAction(null);
      setSelectedWalkerId("");
    }
  }, [booking]);

  useEffect(() => {
    if (!booking) return;

    let cancelled = false;
    setWalkersLoading(true);
    setFeedback(null);

    getWalkers({ available: true, bookingId: booking.id })
      .then((data) => {
        if (cancelled) return;
        setWalkers(Array.isArray(data) ? data : []);
        setFeedback(null);
      })
      .catch(() => {
        if (cancelled) return;
        setWalkers([]);
        setFeedback({ type: "error", message: "Could not load walkers." });
      })
      .finally(() => {
        if (!cancelled) setWalkersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [booking]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loadingAction) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [loadingAction, onClose]);

  if (!booking) return null;

  const canAssign = booking.status === "New" || booking.status === "Assigned";
  const canUpdateStatus = booking.status === "Assigned";

  const handleAssign = async () => {
    if (!selectedWalkerId || loadingAction) return;

    setLoadingAction("assign");
    setFeedback(null);

    try {
      await onBookingUpdate(booking.id, {
        status: "Assigned",
        walker_id: Number(selectedWalkerId),
      });
      setTimeout(onClose, 450);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to assign walker.",
      });
      setLoadingAction(null);
    }
  };

  const handleStatusAction = async (status) => {
    if (loadingAction || status === booking.status) return;

    setLoadingAction(status);
    setFeedback(null);

    try {
      await onBookingUpdate(booking.id, { status });
      setTimeout(onClose, 450);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update. Please try again.",
      });
      setLoadingAction(null);
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
          onClick={loadingAction ? undefined : onClose}
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
              disabled={Boolean(loadingAction)}
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
                      <dd>{booking[key] || "—"}</dd>
                    </div>
                  ))}
                  <div className="admin-manage__detail-row">
                    <dt>Current Status</dt>
                    <dd>
                      <StatusBadge status={booking.status} compact inModal />
                    </dd>
                  </div>
                  {booking.assigned_walker && (
                    <div className="admin-manage__detail-row">
                      <dt>Assigned Walker</dt>
                      <dd>{booking.assigned_walker}</dd>
                    </div>
                  )}
                  {(booking.pet_name || booking.pet_image) && (
                    <div className="admin-manage__detail-row">
                      <dt>Pet</dt>
                      <dd>
                        <div className="admin-pet-info">
                          {booking.pet_image && (
                            <ImageLightbox
                              src={booking.pet_image}
                              alt={booking.pet_name || "Pet"}
                              caption={booking.pet_name}
                            />
                          )}
                          {booking.pet_name && (
                            <span className="admin-pet-info__name">{booking.pet_name}</span>
                          )}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            {canAssign && (
              <section className="admin-manage__panel">
                <h4 className="admin-manage__panel-title">Assign Walker</h4>
                {walkersLoading ? (
                  <p className="admin-manage__hint">Loading available walkers...</p>
                ) : walkers.length === 0 ? (
                  <p className="admin-manage__hint">No walkers available right now.</p>
                ) : (
                  <div className="admin-walker-list" role="listbox" aria-label="Available walkers">
                    {walkers.map((walker) => (
                      <label
                        key={walker.id}
                        className={`admin-walker-option${
                          selectedWalkerId === String(walker.id)
                            ? " admin-walker-option--selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="walker"
                          value={walker.id}
                          checked={selectedWalkerId === String(walker.id)}
                          onChange={() => setSelectedWalkerId(String(walker.id))}
                          disabled={Boolean(loadingAction)}
                        />
                        <span className="admin-walker-option__body">
                          <span className="admin-walker-option__name">{walker.name}</span>
                          <span className="admin-walker-option__mobile">{walker.mobile}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--primary admin-manage__assign-btn"
                  onClick={handleAssign}
                  disabled={!selectedWalkerId || Boolean(loadingAction) || walkers.length === 0}
                >
                  {loadingAction === "assign"
                    ? "Assigning..."
                    : booking.status === "Assigned"
                      ? "Reassign Walker"
                      : "Assign Walker"}
                </button>
              </section>
            )}

            {(canUpdateStatus || booking.status === "New") && (
              <section className="admin-manage__panel">
                <h4 className="admin-manage__panel-title">Update Status</h4>
                <div className="admin-manage__status-cards" role="group" aria-label="Update status">
                  {booking.status === "New" && (
                    <button
                      type="button"
                      className={`admin-manage__status-card admin-manage__status-card--cancelled${
                        loadingAction === "Cancelled" ? " admin-manage__status-card--loading" : ""
                      }`}
                      onClick={() => handleStatusAction("Cancelled")}
                      disabled={Boolean(loadingAction)}
                    >
                      <span className="admin-manage__status-dot admin-manage__status-dot--cancelled" />
                      <span className="admin-manage__status-card-body">
                        <span className="admin-manage__status-label">Cancelled</span>
                        <span className="admin-manage__status-desc">Decline this request</span>
                      </span>
                      {loadingAction === "Cancelled" && (
                        <span className="admin-manage__card-spinner" aria-label="Updating" />
                      )}
                    </button>
                  )}
                  {canUpdateStatus &&
                    STATUS_OPTIONS.map(({ status, label, description, variant }) => {
                      const isLoading = loadingAction === status;
                      const isCurrent = booking.status === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          className={`admin-manage__status-card admin-manage__status-card--${variant}${
                            isCurrent ? " admin-manage__status-card--current" : ""
                          }${isLoading ? " admin-manage__status-card--loading" : ""}`}
                          onClick={() => handleStatusAction(status)}
                          disabled={Boolean(loadingAction)}
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
              </section>
            )}

            {feedback && !(feedback.type === "error" && walkers.length > 0) && (
              <div
                className={`admin-manage__feedback admin-manage__feedback--${feedback.type}`}
                role="alert"
              >
                {feedback.message}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
