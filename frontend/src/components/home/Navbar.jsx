// src/components/home/Navbar.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import logo from "../../assets/images/logo.png";
import { useAuth } from "../../hooks/useAuth.js";
import { useLocation, useNavigate } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown.jsx";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "why", label: "Why Zuppy" },
  { id: "how-it-works", label: "How It Works" },
  { id: "communities", label: "Areas" },
  { id: "services", label: "Services" },
  { id: "faq", label: "FAQ" },
];

function Navbar({ onNav, onBook }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClick = (id) => {
    setOpen(false);
    onNav(id);
  };

  const location = useLocation();

  if (location.pathname.startsWith("/policy/")) {
    return null;
  }

  return (
    <motion.header
      className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="navbar" aria-label="Main">
        <div className="nav-inner">
          {/* Left: Logo */}
          <button
            className="nav-logo"
            type="button"
            onClick={() => handleClick("home")}
            aria-label="Zuppy home"
          >
            <img src={logo} alt="Zuppy" className="nav-logo-img" />
          </button>

          {/* Center: Nav links (desktop) */}
          <div className={`nav-links ${open ? "is-open" : ""}`} id="site-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="nav-link-btn"
                onClick={() => handleClick(item.id)}
              >
                {item.label}
              </button>
            ))}

            {/* Mobile-only actions inside the drawer */}
            <div className="nav-links-actions">
              <button
                type="button"
                className="btn btn-whatsapp btn-nav-cta"
                onClick={() => {
                  setOpen(false);
                  onBook();
                }}
              >
                Book a Walk
              </button>

              {user && (
                <button
                  type="button"
                  className="btn btn-outline btn-nav-cta"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                >
                  Edit Profile
                </button>
              )}
              {user && (
                <button
                  type="button"
                  className="btn btn-outline btn-nav-cta"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile", { state: { focus: "bookings" } });
                  }}
                >
                  My Bookings
                </button>
              )}
              {user && (
                <button
                  type="button"
                  className="btn btn-outline btn-nav-cta"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Right: Desktop actions + mobile toggle */}
          <div className="nav-actions">
            <button
              type="button"
              className="btn btn-whatsapp btn-nav-cta nav-actions-desktop"
              onClick={onBook}
            >
              Book a Walk
            </button>

            {/* Desktop: single profile dropdown replaces the separate
                Profile + Logout buttons */}
            {user && (
              <div className="nav-actions-desktop">
                <ProfileDropdown />
              </div>
            )}

            <button
              className="nav-toggle"
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
    </motion.header>
  );
}

export default Navbar;