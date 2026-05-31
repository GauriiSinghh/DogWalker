import { motion } from "framer-motion";
import {
  FaLinkedinIn,
  FaInstagram,
  FaXTwitter,
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa6";
import { useScrollToSection } from "../hooks/useScrollToSection.js";
import { WHATSAPP_URL } from "./Navbar.jsx";
import { Link } from "react-router-dom";

const SOCIALS = [
  { icon: <FaLinkedinIn />, label: "LinkedIn", href: "https://www.linkedin.com/company/paws-pal-connect/", brand: "#0a66c2" },
  { icon: <FaInstagram />, label: "Instagram", href: "https://www.instagram.com/pawspalconnect?igsh=MWN6YmJoaDY2NWtmaQ==", brand: "#e1306c" },
  { icon: <FaXTwitter />, label: "X (Twitter)", href: "https://x.com/PawsPalConnect", brand: "#000000" },
  { icon: <FaFacebookF />, label: "Facebook", href: "https://www.facebook.com/pawspalconnect", brand: "#1877f2" },
  { icon: <FaWhatsapp />, label: "WhatsApp", href: WHATSAPP_URL, brand: "#25d366" },
];

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "communities", label: "Communities" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const footerReveal = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

function Footer() {
  const scrollTo = useScrollToSection();

  return (
    <motion.footer
      variants={footerReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <h4 className="footer-brand">🐾 Paws Pal Connect</h4>
            <p className="footer-about">
              Hyperlocal premium pet care designed for modern urban communities.
            </p>

            <div className="social-row">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label={s.label}
                  style={{ "--brand": s.brand }}
                  whileHover={{ scale: 1.18, y: -4 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4>Navigation</h4>
            <ul className="footer-nav">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => scrollTo(link.id)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4>Contact</h4>
            <ul>
              <li>Bangalore, India</li>
              <li>
                <a href="mailto:support@pawspalconnect.com" className="footer-link">
                  support@pawspalconnect.com
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} className="footer-link">
                  +91 80509-58787
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4>Get Started</h4>
            <p className="footer-about">
              Book a trusted 10-minute walk in seconds.
            </p>
            <Link to ="/booking">
            <motion.button
              className="btn btn-whatsapp footer-cta-btn"
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Book A Walk
            </motion.button>
            </Link>
          </div>
        </div>

        <div className="copyright">
          © 2026 Paws Pal Connect. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;