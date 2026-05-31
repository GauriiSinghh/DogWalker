import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

const NAVBAR_OFFSET = 80; // sticky navbar height

export function useScrollToSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollTo = useCallback(
    (sectionId) => {
      const doScroll = () => {
        const el = document.getElementById(sectionId);
        if (!el) return;
        const top =
          el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      };

      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(doScroll, 120);
      } else {
        doScroll();
      }
    },
    [navigate, location.pathname]
  );

  return scrollTo;
}