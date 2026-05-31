import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Booking from "./pages/Booking.jsx";

function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/booking" && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;