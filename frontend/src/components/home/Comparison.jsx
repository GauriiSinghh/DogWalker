import { motion } from "framer-motion";

const reveal = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } };

const ROWS = [
  ["❌ Advance booking", "✅ Instant on-demand"],
  ["❌ Unreliable", "✅ Background verified"],
  ["❌ No tracking", "✅ GPS tracked"],
  ["❌ No backup", "✅ Hyperlocal network"],
];

function Comparison() {
  return (
    <section id="comparison">
      <div className="container">
        <h2 className="section-title">Why Zuppy Is Different</h2>
        <p className="section-subtitle">No advance booking. No guessing. Just instant, trusted care.</p>
        <motion.div className="comparison-wrapper" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Traditional Dog Walker</th>
                <th className="highlight">Zuppy 10-Min Walk</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([a, b]) => (
                <tr key={a}><td>{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

export default Comparison;