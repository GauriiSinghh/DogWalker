import { Navigate } from "react-router-dom";
import { isAdminAuthenticated } from "../utils/adminAuth";

export default function AdminProtectedRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
