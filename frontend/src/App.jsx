import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./components/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import Navbar from "./components/home/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Booking from "./pages/Booking.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import BookingChoice from "./pages/BookingChoice.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsConditions from "./pages/TermsConditions.jsx";
import RefundCancellationPolicy from "./pages/RefundCancellationPolicy.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Profile from "./pages/Profile.jsx";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));

function App() {
  const location = useLocation();

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

  return (
    <AuthProvider>
      <ToastProvider>
        {!hideNavbar && !isPolicyPage && <Navbar />}

        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="auth-page"><div className="auth-card"><div className="auth-body" style={{padding:"24px"}}>Loading dashboard…</div></div></div>}>
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

            <Route path="/policy/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/policy/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/policy/cancellation&refund-policy" element={<RefundCancellationPolicy />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;