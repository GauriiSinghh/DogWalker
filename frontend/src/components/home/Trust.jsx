import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const ITEMS = [
  { t: "Background Verified", d: "Identity checks before every walk." },
  { t: "Trained & Pet Friendly", d: "Pet behavior and safety protocols." },
  { t: "GPS Tracked", d: "Full visibility from start to finish." },
  { t: "Rated by Pet Parents", d: "Quality enforced by real feedback." },
  { t: "Emergency Aware", d: "Protocols for unexpected situations." },
  { t: "Live Updates", d: "Stay connected every step of the way." },
];

function Trust() {
  return (
    <section id="about" className="section-alt">
      <div className="container">
        <h2 className="section-title">Trust &amp; Safety First</h2>
        <p className="section-subtitle">
          Every Zuppy Walker is vetted, trained, and accountable — because your pet deserves nothing less.
        </p>
        <motion.div className="trust-grid" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          {ITEMS.map((c) => (
            <motion.article key={c.t} className="trust-item card" variants={card} whileHover={{ y: -6 }}>
              <span className="trust-check">✅</span>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Trust;