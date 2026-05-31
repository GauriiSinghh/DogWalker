import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa6";
import Footer from "../components/Footer.jsx";
import { Link } from "react-router-dom";


const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

/* Reusable scroll-reveal section wrapper */
function Reveal({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={cardItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/* FAQ accordion item */
function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <motion.div className="faq-item" variants={cardItem} layout>
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <h4>{q}</h4>
        <motion.span
          className="faq-chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Home() {
  const [openFaq, setOpenFaq] = useState(-1);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    { q: "What is a 10-minute dog walk?", a: "A short, focused relief walk designed for busy schedules and quick comfort breaks." },
    { q: "How fast can I book a dog walker in Bangalore?", a: "Most requests are matched within minutes depending on local availability." },
    { q: "Are your dog walkers verified?", a: "Yes. Every walker completes verification and pet safety onboarding." },
    { q: "Do you support emergency bookings?", a: "We support fast-response bookings across select Bangalore communities." },
    { q: "Which Bangalore locations are covered?", a: "Whitefield, HSR Layout, Bellandur, Electronic City and premium gated communities." },
  ];

  return (
    <motion.main {...pageTransition}>
   {/* herosection */}
      <section className="hero" id="home">
        <motion.div
          className="container hero-grid"
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          <div className="hero-text">
            <motion.h1 variants={heroItem}>
              Bangalore’s Trusted <span>10-Minute Dog Walking</span> Service
            </motion.h1>

            <motion.p variants={heroItem}>
              Fast, safe and hyperlocal pet relief walks for busy pet parents.
              Verified walkers. Real-time updates. Premium society coverage
              across Bangalore.
            </motion.p>

            <motion.div className="hero-buttons" variants={heroItem}>
                <Link to="/booking">
              <motion.button
                className="btn btn-whatsapp"
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                Book a 10-Min Walk
              </motion.button>
              </Link>
              <motion.a
                href="#services"
                className="btn btn-outline"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
              >
                Explore Services
              </motion.a>
            </motion.div>

            <motion.div className="trust-row" variants={heroItem}>
              <span>✔ Verified Walkers</span>
              <span>✔ Real-Time Tracking</span>
              <span>✔ Society Approved Access</span>
            </motion.div>
          </div>

          <motion.div className="hero-image" variants={heroItem}>
            <motion.img
              loading="lazy"
              src="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop"
              alt="Happy dog with owner"
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="floating-card"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <strong>10-Min Relief Walks</strong>
              <p>Trusted by modern pet parents across Bangalore communities.</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
{/* services */}
      <section id="services">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Why Quick Relief Walks Matter</h2>
            <p className="section-subtitle">
              Modern schedules move fast. Your dog’s comfort shouldn’t wait.
              Paws Pal Connect helps busy pet parents ensure their furry
              companions stay relaxed, active and cared for throughout the day.
            </p>
          </Reveal>

          <motion.div
            className="card-grid"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { icon: "⏰", title: "Busy Workdays", text: "Ideal for professionals managing meetings, commutes and hybrid work schedules." },
              { icon: "🐶", title: "Quick Pet Relief", text: "Short, effective walks designed to support comfort, hydration and stress reduction." },
              { icon: "📍", title: "Hyperlocal Access", text: "Nearby trusted walkers available across premium Bangalore communities." },
            ].map((c) => (
              <motion.div key={c.title} className="card" variants={cardItem} whileHover={{ y: -10, scale: 1.02 }}>
                <div className="icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

     {/* howitworks */}
      <section>
        <div className="container">
          <Reveal>
            <h2 className="section-title">How Paws Pal Connect Works</h2>
            <p className="section-subtitle">Built for speed, trust and convenience.</p>
          </Reveal>

          <motion.div
            className="steps"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { n: 1, t: "Request", d: "Book instantly via WhatsApp." },
              { n: 2, t: "Match", d: "Nearby verified walker assigned." },
              { n: 3, t: "Walk", d: "Quick relief walk begins safely." },
              { n: 4, t: "Track", d: "Receive updates in real-time." },
              { n: 5, t: "Return", d: "Your dog returns relaxed and happy." },
            ].map((s) => (
              <motion.div key={s.n} className="step" variants={cardItem} whileHover={{ y: -8, scale: 1.03 }}>
                <div className="step-number">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    {/* communities */}
      <section id="communities">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Premium Bangalore Communities Covered</h2>
            <p className="section-subtitle">
              Expanding across trusted gated societies and premium urban neighborhoods.
            </p>
          </Reveal>

          <motion.div
            className="coverage-grid"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { t: "Whitefield", d: "Tech parks, premium apartments and pet-friendly communities." },
              { t: "HSR Layout", d: "Hyperlocal walking access across modern residential blocks." },
              { t: "Bellandur", d: "Fast response dog walking support for busy professionals." },
              { t: "Electronic City", d: "Reliable on-demand dog walking services near tech campuses." },
              { t: "Prestige Communities", d: "Society-aware premium pet care experiences." },
              { t: "Sobha Communities", d: "Secure and verified access protocols for pet parents." },
            ].map((c) => (
              <motion.div key={c.t} className="coverage-card" variants={cardItem} whileHover={{ scale: 1.04, y: -6 }}>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* about */}
      <section id="about">
        <div className="container">
          <Reveal>
            <h2 className="section-title">Built Around Trust &amp; Safety</h2>
            <p className="section-subtitle">
              Every experience is designed with your pet’s wellbeing at the center.
            </p>
          </Reveal>

          <motion.div
            className="card-grid"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { icon: "🛡️", t: "Verified Walkers", d: "Identity checks and onboarding ensure trusted local support." },
              { icon: "📲", t: "Live Updates", d: "Stay connected with real-time notifications and communication." },
              { icon: "❤️", t: "Pet-First Protocols", d: "Walk pacing, hydration and comfort tailored to every pet." },
            ].map((c) => (
              <motion.div key={c.t} className="card" variants={cardItem} whileHover={{ y: -10, scale: 1.02 }}>
                <div className="icon">{c.icon}</div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    {/* testimonials */}
      <section>
        <div className="container">
          <Reveal>
            <h2 className="section-title">Loved by Bangalore Pet Parents</h2>
          </Reveal>

          <motion.div
            className="card-grid"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              { p: "“Perfect for my work schedule. The walker arrived quickly and my Labrador came back calm and happy.”", a: "— Aditi R., Whitefield" },
              { p: "“The real-time updates gave me peace of mind during long office hours.”", a: "— Karan S., HSR Layout" },
              { p: "“Professional, reliable and genuinely caring. Exactly what urban pet parents need.”", a: "— Neha M., Bellandur" },
            ].map((t) => (
              <motion.div
                key={t.a}
                className="card testimonial"
                variants={cardItem}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <p>{t.p}</p>
                <strong>{t.a}</strong>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    {/* faq */}
      <section>
        <div className="container">
          <Reveal>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </Reveal>

          <motion.div
            className="faq"
            variants={gridContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {faqs.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>
{/* cta contact */}
      <section id="contact">
        <div className="container">
          <Reveal>
            <div className="cta-banner">
              <h2>Give Your Dog a Happier Day</h2>
              <p>
                Trusted by modern Bangalore pet parents for fast, premium and
                reliable dog walking support.
              </p>
              <Link to="/booking">
              <motion.button
               className="btn btn-whatsapp"
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Book a 10-Min Walk
              </motion.button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      
      <Footer />

     
      
    </motion.main>
  );
}

export default Home;