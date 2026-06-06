import { FiEdit2 } from "react-icons/fi";

export default function BookingActions({ booking, isActive, onManage }) {
  return (
    <button
      type="button"
      className={`admin-btn admin-btn--manage${isActive ? " admin-btn--manage-active" : ""}`}
      onClick={() => onManage(booking)}
      aria-label={`Manage booking ${booking.id}`}
      aria-pressed={isActive}
    >
      <FiEdit2 size={14} aria-hidden="true" />
      <span>{isActive ? "Managing" : "Manage"}</span>
    </button>
  );
}
