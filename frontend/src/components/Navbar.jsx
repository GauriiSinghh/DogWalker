import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaXmark } from "react-icons/fa6";
import { useScrollToSection } from "../hooks/useScrollToSection.js";
import { useActiveSection } from "../hooks/useActiveSection.js";

export const WHATSAPP_URL = "https://wa.me/918050958787";

const SECTIONS = ["home", "services", "communities", "about", "contact"];

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "communities", label: "Communities" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/* Mobile menu animation variants */
const menuVariants = {
  closed: { opacity: 0, y: -20, transition: { duration: 0.25, ease: "easeInOut" } },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut", staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const menuItem = {
  closed: { opacity: 0, x: -16 },
  open: { opacity: 1, x: 0 },
};

function Navbar() {
  const scrollTo = useScrollToSection();
  const active = useActiveSection(SECTIONS);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Lock body scroll while the mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleNavClick = (id) => {
    setMenuOpen(false);
    setTimeout(() => scrollTo(id), 60);
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container nav-wrapper">
        <button
          type="button"
          className="logo logo-btn"
          onClick={() => handleNavClick("home")}
        >
          🐾 Paws Pal Connect
        </button>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${active === item.id ? "active" : ""}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
              <span className="nav-underline" />
            </button>
          ))}

        
          <Link to="/booking" className="btn btn-whatsapp btn-nav">
            Book Walk
          </Link>
        </div>

        <motion.button
          type="button"
          className="hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          whileTap={{ scale: 0.85 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaXmark />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaBars />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
{/* mobiledropdown */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="mobile-menu"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  variants={menuItem}
                  className={`mobile-menu-link ${active === item.id ? "active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </motion.button>
              ))}

              <motion.div variants={menuItem}>
                <Link
                  to="/booking"
                  className="btn btn-whatsapp mobile-menu-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  Book Walk
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;