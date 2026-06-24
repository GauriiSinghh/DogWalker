// src/components/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext(null);

// Decode JWT payload without a library
function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData && isTokenValid(token)) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      // expired or invalid → clean up
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Single source of truth updater — merges partial profile changes into the
  // current user and keeps localStorage in sync, so the Booking form and the
  // rest of the app immediately reflect edits made on the Profile page.
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      try {
        localStorage.setItem("user", JSON.stringify(next));
      } catch {
        // ignore storage write errors
      }
      return next;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}