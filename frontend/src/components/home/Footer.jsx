import { motion } from "framer-motion";
import {
  FaLinkedinIn,
  FaInstagram,
  FaXTwitter,
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa6";
import logo from "../../assets/images/logo.png";
import { Link } from "react-router-dom";

const QUICK_LINKS = [
  { id: "home", label: "Home" },
  { id: "why", label: "Why Zuppy" },
  { id: "how-it-works", label: "How It Works" },
  { id: "services", label: "Services" },
  { id: "faq", label: "FAQ" },
];

const SOCIALS = [
  {
    icon: <FaLinkedinIn />,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/paws-pal-connect/",
    brand: "#0a66c2",
  },
  {
    icon: <FaInstagram />,
    label: "Instagram",
    href: "https://www.instagram.com/pawspalconnect",
    brand: "#e1306c",
  },
  {
    icon: <FaXTwitter />,
    label: "X (Twitter)",
    href: "https://x.com/PawsPalConnect",
    brand: "#111111",
  },
  {
    icon: <FaFacebookF />,
    label: "Facebook",
    href: "https://www.facebook.com/pawspalconnect",
    brand: "#1877f2",
  },
  {
    icon: <FaWhatsapp />,
    label: "WhatsApp",
    href: "https://wa.me/918050958787?text=Welcome%20to%20Zuppy%20%3A%20Emergency%20Pet%20Care%20Service%20%3A%20Dog%20Walker%20in%2010%20min",
    brand: "#25d366",
  },
];

const footerStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const footerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function Footer({ onNav, onBook }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <motion.div
          className="footer-grid"
          variants={footerStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div className="footer-brand" variants={footerItem}>
            <button
              type="button"
              className="footer-logo-btn"
              onClick={() => onNav("home")}
              aria-label="Paws Pal Connect home"
            >
              <img
                src={logo}
                alt="Paws Pal Connect"
                className="footer-logo-img"
              />
            </button>
            <p className="footer-tagline">
              On-demand pet care for modern Bangalore pet parents.
            </p>
            <div className="footer-social">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="footer-social-link"
                  style={{ "--social-brand": s.brand }}
                  whileHover={{ y: -3, scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div variants={footerItem}>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-list">
              {QUICK_LINKS.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => onNav(l.id)}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
           <motion.div variants={footerItem}>
  <h4 className="footer-col-title">Company</h4>

  <ul className="footer-list">
   <li>
  <a
    href="https://dogwalkerbackend1.onrender.com/policies/privacy-policy.html"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Privacy Policy
  </a>
</li>

<li>
  <a
    href="https://dogwalkerbackend1.onrender.com/policies/terms-and-conditions.html"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Terms & Conditions
  </a>
</li>

<li>
  <a
    href="https://dogwalkerbackend1.onrender.com/policies/cancellation&refund-policy.html"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Refund & Cancellation Policy
  </a>
</li>
  </ul>
</motion.div>

          <motion.div variants={footerItem}>
            <h4 className="footer-col-title">Contact</h4>
            <ul className="footer-list">
              <li>Bangalore, India</li>
              <li>
                <a className="footer-link" href="mailto:zuppy@pawspalconnect.com">
                  zuppy@pawspalconnect.com
                </a>
              </li>
              <li>
               <a
  className="footer-link"
  href="https://wa.me/918050958787?text=Welcome%20to%20Zuppy%20%3A%20Emergency%20Pet%20Care%20Service%20%3A%20Dog%20Walker%20in%2010%20min"
  target="_blank"
  rel="noopener noreferrer"
>
  +91 80-5095-8787
</a>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={footerItem}>
            <h4 className="footer-col-title">Book Now</h4>
            <ul className="footer-list">
              <li>
                <button type="button" className="footer-link footer-link--cta" onClick={onBook}>
                  Book a Walk
                </button>
              </li>
              <li>10-Min Dog Walker</li>
              <li>Verified · Tracked · Instant</li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="footer-bottom">
          <p className="footer-powered">
            <span className="footer-powered-label">Powered by</span>
            <span className="footer-powered-brand">Paws Pal Connect</span>
          </p>
          <p className="copyright">
            © 2026 Paws Pal Connect Pvt Ltd. 
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
