import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const SERVICES = [
  { live: true, badge: "Available Now", icon: "🐕", t: "Zuppy Walk", d: "10-Min Dog Walker" },
  { badge: "Coming Soon", icon: "🩺", t: "Zuppy Vet", d: "Emergency Vet Assistance" },
  { badge: "Coming Soon", icon: "🚕", t: "Zuppy Move", d: "Pet Transportation" },
  { badge: "Coming Soon", icon: "✂️", t: "Zuppy Care", d: "Grooming & Pet Sitting" },
  { badge: "Coming Soon", icon: "🍖", t: "Zuppy Food", d: "Pet Essentials" },
  { badge: "Coming Soon", icon: "🤖", t: "Zuppy AI", d: "AI Pet Assistant" },
  { badge: "Coming Soon", icon: "🚨", t: "Emergency Response", d: "Critical Pet Care" },
];

function Services() {
  return (
    <section id="services" className="section-alt">
      <div className="container">
        <h2 className="section-title">Pet Care Services from Zuppy</h2>
        <p className="section-subtitle">
          Start with Zuppy Walk today — a verified dog walker at your door in 10 minutes.
          More on-demand pet services are on the way to make caring for your companion even easier.
        </p>
        <motion.div className="services-grid" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
          {SERVICES.map((s) => (
            <motion.article
              key={s.t}
              className={`roadmap-card ${s.live ? "roadmap-card--live" : ""}`}
              variants={card}
              whileHover={{ y: -6 }}
            >
              <span className={`roadmap-badge ${s.live ? "" : "roadmap-badge--soon"}`}>{s.badge}</span>
              <div className="roadmap-icon">{s.icon}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Services;