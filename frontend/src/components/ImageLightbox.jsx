import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

export default function ImageLightbox({
  src,
  alt = "Image",
  caption,
  thumbClassName = "admin-pet-info__image",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!src) return null;

  const label = caption || alt;

  return (
    <>
      <button
        type="button"
        className="image-lightbox__trigger"
        onClick={() => setOpen(true)}
        aria-label={`View larger preview of ${label}`}
      >
        <img src={src} alt={alt} className={thumbClassName} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="image-lightbox" role="presentation">
              <motion.button
                type="button"
                className="image-lightbox__backdrop"
                aria-label="Close preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="image-lightbox__dialog"
                role="dialog"
                aria-modal="true"
                aria-label={label}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                <button
                  type="button"
                  className="image-lightbox__close"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                >
                  <FiX />
                </button>
                <img src={src} alt={alt} className="image-lightbox__image" />
                {label && <p className="image-lightbox__caption">{label}</p>}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
