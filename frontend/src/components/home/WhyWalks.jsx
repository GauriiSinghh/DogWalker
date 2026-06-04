import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const ITEMS = [
  { icon: "⏰", title: "Busy Workdays", text: "Perfect when meetings, commutes, or hybrid work run longer than planned." },
  { icon: "🐶", title: "Quick Pet Relief", text: "Short, effective walks for comfort, hydration, and stress relief." },
  { icon: "📍", title: "Hyperlocal", text: "Nearby verified walkers across premium Bangalore communities." },
];

function WhyWalks() {
  return (
    <section id="why-walks">
      <div className="container">
        <h2 className="section-title">Why Quick Relief Walks Matter</h2>
        <p className="section-subtitle">
          Modern schedules move fast. Your dog's comfort shouldn't wait. Zuppy helps busy pet
          parents keep their companions relaxed and cared for all day.
        </p>
        <motion.div className="card-grid" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {ITEMS.map((c) => (
            <motion.article key={c.title} className="card" variants={card} whileHover={{ y: -8 }}>
              <div className="icon" aria-hidden="true">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default WhyWalks;