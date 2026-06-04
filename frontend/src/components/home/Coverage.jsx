import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const AREAS = [
  { t: "Whitefield", d: "Tech parks, premium apartments, and pet-friendly communities." },
  { t: "HSR Layout", d: "Fast walker access across modern residential blocks." },
  { t: "Bellandur", d: "On-demand walks for busy professionals." },
  { t: "Electronic City", d: "Reliable service near tech campuses." },
  { t: "Prestige Communities", d: "Society-aware access and premium care." },
  { t: "Sobha Communities", d: "Secure, verified walker protocols." },
];

function Coverage() {
  return (
    <section id="communities" className="section-alt">
      <div className="container">
        <h2 className="section-title">Serving Bangalore's Top Communities</h2>
        <p className="section-subtitle">Hyperlocal walkers across premium gated societies and urban neighborhoods.</p>
        <motion.div className="coverage-grid" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          {AREAS.map((c) => (
            <motion.article key={c.t} className="coverage-card" variants={card} whileHover={{ scale: 1.03 }}>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Coverage;