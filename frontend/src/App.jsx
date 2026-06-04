import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./components/AuthContext.jsx";
import Navbar from "./components/home/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Booking from "./pages/Booking.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import BookingChoice from "./pages/BookingChoice.jsx";
import PolicyPage from "./pages/PolicyPage.jsx";

function App() {
  const location = useLocation();

  // Home renders its own Navbar/Footer; auth & booking pages hide global navbar too.
  const hideNavbar = [
  "/",
  "/booking",
  "/login",
  "/signup",
  "/booking-choice",
].includes(location.pathname);

const isPolicyPage = location.pathname.startsWith("/policy/");
{!hideNavbar && !isPolicyPage && <Navbar />}

  return (
    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
           <Route
            path="/policy/:slug"
            element={<PolicyPage />}
          />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/booking-choice"
            element={
              <ProtectedRoute>
                <BookingChoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
         
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;