const STATUS_CLASSES = {
  New: "admin-status-badge--pending",
  Assigned: "admin-status-badge--confirmed",
  Completed: "admin-status-badge--completed",
  Cancelled: "admin-status-badge--cancelled",
  Pending: "admin-status-badge--pending",
  Confirmed: "admin-status-badge--confirmed",
  Active: "admin-status-badge--active",
  Available: "admin-status-badge--completed",
  Busy: "admin-status-badge--active",
  Offline: "admin-status-badge--cancelled",
  Started: "admin-status-badge--active",
  Reached: "admin-status-badge--active",
};

const STATUS_LABELS = {
  New: "Pending",
  Assigned: "Assigned",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Available: "Available",
  Busy: "Busy",
  Offline: "Offline",
  Started: "Started",
  Reached: "Reached",
};

export default function StatusBadge({ status, compact = false, inModal = false }) {
  const badgeClass = STATUS_CLASSES[status] || "admin-status-badge--pending";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`admin-status-badge ${badgeClass}${compact ? " admin-status-badge--compact" : ""}${
        inModal ? " admin-status-badge--modal" : ""
      }`}
    >
      {label}
    </span>
  );
}
