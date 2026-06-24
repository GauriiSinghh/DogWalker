import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

import Navbar from "../components/home/Navbar.jsx";
import Hero from "../components/home/Hero.jsx";
import ProblemSolution from "../components/home/ProblemSolution.jsx";
import WhyWalks from "../components/home/WhyWalks.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Trust from "../components/home/Trust.jsx";
import Comparison from "../components/home/Comparison.jsx";
import Coverage from "../components/home/Coverage.jsx";
import Services from "../components/home/Services.jsx";
import Testimonials from "../components/home/Testimonials.jsx";
import Faq from "../components/home/Faq.jsx";
import Cta from "../components/home/Cta.jsx";
import Footer from "../components/home/Footer.jsx";
import MobileCta from "../components/home/MobileCta.jsx";

import "../styles/landing.css";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNav = useCallback((id) => {
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }, []);

  const handleBook = useCallback(() => {
    navigate(user ? "/booking-choice" : "/login");
  }, [navigate, user]);

  return (
    <div className="zuppy has-mobile-cta">
      {!location.pathname.startsWith("/policy/") && (
  <Navbar onNav={handleNav} onBook={handleBook} />
)}
      <motion.main {...pageTransition}>
        <Hero onNav={handleNav} onBook={handleBook} />
         <Services />
        <ProblemSolution />
        <WhyWalks />
        <HowItWorks />
        <Trust />
        <Comparison />
        <Coverage />
        <Testimonials />
        <Faq />
        <Cta onBook={handleBook} />
        <Footer onNav={handleNav} onBook={handleBook} />
      </motion.main>
      <MobileCta onBook={handleBook} />
    </div>
  );
}

export default Home;