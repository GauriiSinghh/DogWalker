import { motion } from "framer-motion";
import { FaShieldDog } from "react-icons/fa6";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function Hero({ onNav, onBook }) {
  return (
    <section className="hero" id="home">
      <motion.div
        className="container hero-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="hero-content">
          <motion.p className="eyebrow" variants={item}>
            Zuppy Walk · Bangalore
          </motion.p>
          <motion.h1 variants={item}>
            Zuppy
            <span className="hero-tagline">Pet Care in Minutes</span>
          </motion.h1>
          <motion.p className="hero-lead" variants={item}>
            Get a Dog Walker in 10 Minutes
          </motion.p>
          <motion.p className="hero-intro" variants={item}>
            Stuck in a meeting? Running late? Your dog shouldn&apos;t wait. Open Zuppy,
            tap Book a Walk, and a verified walker arrives at your doorstep — fast.
          </motion.p>
          <motion.div className="hero-buttons" variants={item}>
            <motion.button
              type="button"
              className="btn btn-whatsapp"
              onClick={onBook}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Book a Walk
            </motion.button>
            <motion.button
              type="button"
              className="btn btn-outline"
              onClick={() => onNav("how-it-works")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              How It Works
            </motion.button>
          </motion.div>
          <motion.div className="trust-row" variants={item}>
            <span>✔ Verified Walkers</span>
            <span>✔ GPS Tracked</span>
            <span>✔ Live Updates</span>
          </motion.div>
        </div>

        <motion.div className="hero-image" variants={item}>
          <div className="hero-visual">
            <motion.img
              loading="eager"
              src="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1600&auto=format&fit=crop"
              alt="Happy dog ready for a Zuppy walk in Bangalore"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="hero-verified-badge"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <span className="hero-verified-icon" aria-hidden>
                <FaShieldDog />
              </span>
              <div className="hero-verified-text">
                <strong>Zuppy Walk</strong>
                <p>Verified walkers. Real-time updates. At your doorstep in minutes.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;