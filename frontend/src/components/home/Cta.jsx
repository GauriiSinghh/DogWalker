import { motion } from "framer-motion";


function Cta({ onBook }) {
  return (
    <section id="contact">
      <div className="container">
        <motion.div
          className="cta-banner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h2>Give Your Dog a Happier Day</h2>
          <p>Trusted by Bangalore pet parents for on-demand dog walking and other services. One tap is all it takes.</p>
          <motion.button className="btn btn-whatsapp" onClick={onBook} whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            Book a Walk
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default Cta;