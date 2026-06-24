// src/components/ProfileDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaSignOutAlt, FaUserEdit } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/profile-dropdown.css";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click / Escape
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  if (!user) return null;

  const initial = (user.name || "U").trim().charAt(0).toUpperCase();

  const handleEditProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const handleMyBookings = () => {
    setOpen(false);
    // Booking history lives within the Profile page sections.
    navigate("/profile", { state: { focus: "bookings" } });
  };

  const handleLogout = () => {
    setOpen(false);
    logout(); // reuse existing global logout handler
    navigate("/");
  };

  return (
    <div className="profile-dropdown" ref={wrapperRef}>
      <button
        type="button"
        className="profile-dropdown__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <span className="profile-dropdown__avatar">{initial}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="profile-dropdown__menu"
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="profile-dropdown__head">
              <span className="profile-dropdown__avatar profile-dropdown__avatar--lg">
                {initial}
              </span>
              <div className="profile-dropdown__head-text">
                <p className="profile-dropdown__name">{user.name || "User"}</p>
                {user.email && (
                  <p className="profile-dropdown__email">{user.email}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="profile-dropdown__item"
              role="menuitem"
              onClick={handleEditProfile}
            >
              <FaUserEdit />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              className="profile-dropdown__item"
              role="menuitem"
              onClick={handleMyBookings}
            >
              <FaCalendarAlt />
              <span>My Bookings</span>
            </button>

            <div className="profile-dropdown__divider" />

            <button
              type="button"
              className="profile-dropdown__item profile-dropdown__item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}