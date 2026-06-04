import { motion } from "framer-motion";

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const card = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

const QUOTES = [
  { p: "Perfect for my work schedule. The walker arrived quickly and my Labrador came back calm and happy.", a: "— Aditi R., Whitefield" },
  { p: "The live updates gave me peace of mind during long office hours.", a: "— Karan S., HSR Layout" },
  { p: "Professional, reliable, and genuinely caring. Exactly what urban pet parents need.", a: "— Neha M., Bellandur" },
];

function Testimonials() {
  return (
    <section id="testimonials">
      <div className="container">
        <h2 className="section-title">Loved by Bangalore Pet Parents</h2>
        <motion.div className="card-grid" variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          {QUOTES.map((q) => (
            <motion.blockquote key={q.a} className="card testimonial" variants={card} whileHover={{ y: -8 }}>
              <p>"{q.p}"</p>
              <cite><strong>{q.a}</strong></cite>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;