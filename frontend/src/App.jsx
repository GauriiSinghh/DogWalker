import { Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsConditions from "./pages/TermsConditions.jsx";
import RefundCancellationPolicy from "./pages/RefundCancellationPolicy.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx"
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Profile from "./pages/Profile.jsx";

function App() {
  const location = useLocation();

  // Home renders its own Navbar/Footer; auth & booking pages hide global navbar too.
  const hideNavbar = [
  "/",
  "/booking",
  "/login",
  "/signup",
  "/booking-choice",
  "/admin/login",
  "/admin/dashboard",
  "/profile",
  "/my-bookings",
].includes(location.pathname);

const isPolicyPage = location.pathname.startsWith("/policy/");
{!hideNavbar && !isPolicyPage && <Navbar />}

  return (
  
    

    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
         
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin-login" element={<Navigate to="/login" replace />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile view="profile" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <Profile view="bookings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/" replace />} />

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
         <Route
  path="/policy/privacy-policy"
  element={<PrivacyPolicy />}
/>

<Route
  path="/policy/terms-and-conditions"
  element={<TermsConditions />}
/>

<Route
  path="/policy/cancellation&refund-policy"
  element={<RefundCancellationPolicy />}
/>
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;