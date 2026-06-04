import { motion } from "framer-motion";

const reveal = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } };

function ProblemSolution() {
  const problems = [
    "Stuck in office meetings", "Late-night work calls", "Unexpected travel",
    "Health issues", "Traffic delays", "Family emergencies",
  ];
  const steps = ["Open Zuppy", "Request a walk", "A verified walker arrives within minutes"];

  return (
    <section id="why" className="section-alt">
      <div className="container">
        <h2 className="section-title">Your Dog Needs a Walk. Life Doesn't Wait.</h2>
        <p className="section-subtitle">
          Every pet parent knows the feeling — you're stuck, but your dog still needs care.
        </p>
        <div className="split-grid">
          <motion.article className="problem-block card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <p className="block-label">Sound familiar?</p>
            <h3>Every pet parent faces moments like:</h3>
            <ul className="styled-list arrow-list">
              {problems.map((p) => (
                <li key={p}><span className="list-arrow" aria-hidden="true">→</span> {p}</li>
              ))}
            </ul>
            <p className="problem-punchline"><strong>But your dog still needs a walk.</strong></p>
          </motion.article>

          <motion.article className="solution-block card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <p className="block-label block-label--accent">The Zuppy way</p>
            <h3>Three steps. Done in minutes.</h3>
            <ol className="styled-list ordered">
              {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
            <p className="solution-result">Your dog gets exercise, relief, and care — without you missing a beat.</p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

export default ProblemSolution;