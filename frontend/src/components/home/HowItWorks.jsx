import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const STEPS = [
  { n: 1, t: "Book a Walk", d: "Tap Book a Walk in the app." },
  { n: 2, t: "Get Matched", d: "Nearest verified walker assigned." },
  { n: 3, t: "Walker Arrives", d: "At your doorstep, on time." },
  { n: 4, t: "Safe Walk", d: "Your dog gets walked safely." },
  { n: 5, t: "All Done", d: "Photo and walk confirmation sent." },
];

function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="container">
        <h2 className="section-title">How Zuppy Works</h2>
        <p className="section-subtitle">Book in seconds. Track every step. Peace of mind included.</p>
        <motion.div className="steps" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {STEPS.map((s) => (
            <motion.article key={s.n} className="step" variants={card} whileHover={{ y: -6 }}>
              <div className="step-number">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks;