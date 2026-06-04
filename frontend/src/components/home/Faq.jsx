import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  { q: "What is Zuppy Walk?", a: "Zuppy Walk is our on-demand 10-minute dog walking service — a verified walker at your doorstep in minutes, not hours." },
  { q: "How fast can I get a walker?", a: "Most requests are matched within minutes, depending on your location and walker availability nearby." },
  { q: "Are walkers verified?", a: "Yes. Every Zuppy Walker completes background verification, training, and pet safety onboarding." },
  { q: "Will I get updates during the walk?", a: "Absolutely. You'll receive live updates — walker assigned, arriving, walk started, completed, and a photo shared." },
  { q: "Which areas do you cover?", a: "Whitefield, HSR Layout, Bellandur, Electronic City, and premium gated communities across Bangalore." },
];

function Faq() {
  const [open, setOpen] = useState(-1);

  return (
    <section id="faq" className="section-alt">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <article className="faq-item" key={f.q}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span className="chevron" aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Faq;