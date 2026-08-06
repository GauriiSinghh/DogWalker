// src/pages/Booking.jsx
import { useState, useEffect, useRef} from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
import { payForBooking } from "../services/razorpay.js";
import SuccessModal from "../components/SuccessModal.jsx";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";
import "../styles/signup.css";
import SelectPetStep from "../components/SelectPetStep.jsx";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};
const APARTMENT_PRICES = {
  "Sobha Dream Acres Apartment": 19900,
  "Prestige Shantiniketan": 24900,
  "Purva Fountain Square": 22900,
  "DLF Jigani": 17900,
};

function Booking() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const prefillSelf = location.state?.mode === "self";
  const bookForOther = location.state?.mode === "other";

  // Prefill from the LIVE user context (single source of truth).
  const [apartment, setApartment] = useState(prefillSelf ? user?.apartment || "" : "");
  const [name, setName] = useState(prefillSelf ? user?.name || "" : "");
  const [mobile, setMobile] = useState(prefillSelf ? user?.mobile || "" : "");
  const [flatNo, setFlatNo] = useState(prefillSelf ? user?.flatNo || "" : "");
  const [address, setAddress] = useState(prefillSelf ? user?.address || "" : "");
  const [petName, setPetName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [petImagePreview, setPetImagePreview] = useState("");
  const [petImageError, setPetImageError] = useState("");

  const MAX_PET_IMAGE_SIZE = 2 * 1024 * 1024;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [currentStep, setCurrentStep] = useState(() => {
    if (prefillSelf) {
      const hasRequiredDetails =
        user?.apartment &&
        user?.name?.trim()?.length >= 2 &&
        /^(\+91|91)?[6-9]\d{9}$/.test(user?.mobile?.trim() || "") &&
        user?.flatNo?.trim() &&
        user?.address?.trim()?.length >= 10;
      return hasRequiredDetails ? "pet" : "details";
    }
    return location.state?.step || "details";
  });

  const [selectedPet, setSelectedPet] = useState(null);
  const formRef = useRef(null);
  const [bookingAmount, setBookingAmount] = useState(
    prefillSelf && user?.apartment ? APARTMENT_PRICES[user.apartment] ?? null : null
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Keep "Book for myself" fields in sync with the live context if it changes
  // (e.g. user edited their profile right before navigating here).
  useEffect(() => {
    if (!prefillSelf || !user) return;
    setApartment(user.apartment || "");
    setName(user.name || "");
    setMobile(user.mobile || "");
    setFlatNo(user.flatNo || "");
    setAddress(user.address || "");
    setBookingAmount(
      user.apartment ? APARTMENT_PRICES[user.apartment] ?? null : null
    );
  }, [prefillSelf, user]);

  useEffect(() => {
    async function loadProfile() {
      if (!prefillSelf) return;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();

          setApartment(data.apartment || "");
          setName(data.name || "");
          setMobile(data.mobile || "");
          setFlatNo(data.flatNo || "");
          setAddress(data.address || "");
          setBookingAmount(
            data.apartment ? APARTMENT_PRICES[data.apartment] ?? null : null
          );

          // Sync global context so other screens stay consistent.
          updateUser({
            name: data.name || "",
            email: data.email || user?.email || "",
            mobile: data.mobile || "",
            apartment: data.apartment || "",
            flatNo: data.flatNo || "",
            address: data.address || "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadProfile();
  }, [prefillSelf]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateForm() {
    setError("");
    let isValid = true;
    
    const scrollToId = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (address.trim().length < 10) { isValid = false; scrollToId("address"); }
    if (!flatNo.trim()) { isValid = false; scrollToId("flatNo"); }
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile.trim())) { isValid = false; scrollToId("mobile"); }
    if (name.trim().length < 2) { isValid = false; scrollToId("name"); }
    if (!apartment) { isValid = false; scrollToId("apartment"); }
    if (bookForOther && petName.trim().length < 2) { isValid = false; scrollToId("pet-name"); }
    if (bookForOther && !petImage) { isValid = false; scrollToId("pet-image"); }

    return isValid;
  }

  function handlePetImageChange(e) {
    const file = e.target.files?.[0];
    setPetImageError("");

    if (!file) {
      setPetImage("");
      setPetImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPetImageError("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PET_IMAGE_SIZE) {
      setPetImageError("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPetImage(result);
      setPetImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleApartmentChange(value) {
    setApartment(value);
    if (!value) {
      setBookingAmount(null);
      return;
    }
    // optimistic from local map
    setBookingAmount(APARTMENT_PRICES[value] ?? null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/apartment-price?apartment=${encodeURIComponent(value)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setBookingAmount(data.amount);
      }
    } catch {
      // keep optimistic value
    }
  }

  // Direct book + pay for self-bookings (called from SelectPetStep)
  async function handleBookAndPay(pet) {
    setSubmitting(true);
    setError("");

    const bookingData = {
      apartment,
      name,
      mobile,
      flatNo,
      address,
      email: user?.email || null,
      pet_id: pet.id,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Booking failed");

      updateUser({ apartment, name, mobile, flatNo, address });

      await payForBooking({
        bookingId: data.id,
        token,
        user,
        name,
        email: data.email || user?.email,
        mobile,
      });

      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const currentTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });

      setConfirmed({
        id: data.id,
        name,
        apartment,
        flatNo,
        mobile,
        address,
        status: data.status || "A walker will be assigned shortly",
        date: currentDate,
        time: currentTime,
        email: data.email || user?.email,
      });

      setShowErrors(false);
    } catch (err) {
      setError(err.message || "Could not complete booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }
if (prefillSelf && !selectedPet) {
  setCurrentStep("pet");
  return;
}
    const bookingData = {
  apartment,
  name,
  mobile,
  flatNo,
  address,
  email: user?.email || null,

  ...(prefillSelf && selectedPet && {
    pet_id: selectedPet.id,
  }),
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Booking failed");

      // If this was a self-booking, keep global context aligned with submitted data.
      if (prefillSelf) {
        updateUser({ apartment, name, mobile, flatNo, address });
      }

      await payForBooking({
        bookingId: data.id,
        token,
        user,
        name,
        email: data.email || user?.email,
        mobile,
      });

      const currentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const currentTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });

      setConfirmed({
        id: data.id,
        name,
        apartment,
        flatNo,
        mobile,
        address,
        status: data.status || "A walker will be assigned shortly",
        date: currentDate,
        time: currentTime,
        email: data.email || user?.email,
      });

      setShowErrors(false);
      setApartment(""); setName(""); setMobile(""); setFlatNo(""); setAddress("");
      setPetName(""); setPetImage(""); setPetImagePreview("");
    } catch (err) {
      setError(err.message || "Could not complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    
  {currentStep === "details" && (
      <div className="auth-page">
        <motion.div 
          className="auth-card"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageTransition}
        >
          <div className="auth-header">
            <Link to="/" className="auth-header-logo">
              <img src={logo} alt="Zuppy" />
            </Link>
            <Link to="/" className="auth-close" aria-label="Close">
              <FaTimes size={16} />
            </Link>
          </div>

          <div className="auth-body">
            <h1 className="auth-title">Book a Walker</h1>
            {bookForOther && (
              <p className="auth-subtitle">Enter the recipient&apos;s details and their pet&apos;s info.</p>
            )}

            <form ref={formRef} className="auth-form" style={{ marginTop: bookForOther ? "16px" : "24px" }} onSubmit={handleSubmit} noValidate>
              {error && <div className="global-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="apartment" className="form-label">Select Apartment</label>
                <select
                  id="apartment"
                  className={`form-select ${showErrors && !apartment ? "invalid" : ""}`}
                  value={apartment}
                  onChange={(e) => handleApartmentChange(e.target.value)}
                >
                  <option value="">-- Choose Apartment --</option>
                  <option value="Sobha Dream Acres Apartment">Sobha Dream Acres Apartment</option>
                  <option value="Prestige Shantiniketan">Prestige Shantiniketan</option>
                  <option value="Purva Fountain Square">Purva Fountain Square</option>
                  <option value="DLF Jigani">DLF Jigani</option>
                </select>
                {showErrors && !apartment && <div className="field-error-msg">Please select an apartment</div>}
                {bookingAmount != null && (
                  <p className="price-display">Booking Amount: ₹{(bookingAmount / 100).toFixed(0)}</p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className={`form-input ${showErrors && name.trim().length < 2 ? "invalid" : ""}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nikki Smith"
                  />
                  {showErrors && name.trim().length < 2 && <div className="field-error-msg">Enter the full name</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="mobile" className="form-label">Mobile Number</label>
                  <input
                    id="mobile"
                    type="tel"
                    className={`form-input ${showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) ? "invalid" : ""}`}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="989XXXXXXX"
                  />
                  {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(mobile.trim()) && <div className="field-error-msg">Enter a valid mobile number</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="flatNo" className="form-label">Flat / Villa Number</label>
                  <input
                    id="flatNo"
                    type="text"
                    className={`form-input ${showErrors && !flatNo.trim() ? "invalid" : ""}`}
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    placeholder="A-302"
                  />
                  {showErrors && !flatNo.trim() && <div className="field-error-msg">Enter flat/villa number</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="address" className="form-label">Detailed Address</label>
                  <input
                    id="address"
                    type="text"
                    className={`form-input ${showErrors && address.trim().length < 10 ? "invalid" : ""}`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No. 10, Near Central Park..."
                  />
                  {showErrors && address.trim().length < 10 && <div className="field-error-msg">Please enter a detailed address</div>}
                </div>
              </div>

              {bookForOther && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pet-name" className="form-label">Pet name</label>
                    <input
                      id="pet-name"
                      type="text"
                      className={`form-input ${showErrors && petName.trim().length < 2 ? "invalid" : ""}`}
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="Bruno"
                    />
                    {showErrors && petName.trim().length < 2 && (
                      <div className="field-error-msg">Please enter the pet&apos;s name</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="pet-image" className="form-label">Pet photo</label>
                    <div className="pet-image-upload">
                      <input
                        id="pet-image"
                        type="file"
                        accept="image/*"
                        className="pet-image-input"
                        onChange={handlePetImageChange}
                      />
                      <label
                        htmlFor="pet-image"
                        className={`pet-image-label ${showErrors && !petImage ? "invalid" : ""}`}
                      >
                        {petImagePreview ? (
                          <img src={petImagePreview} alt="Pet preview" className="pet-image-preview" />
                        ) : (
                          <span>Upload a photo</span>
                        )}
                      </label>
                    </div>
                    {showErrors && !petImage && (
                      <div className="field-error-msg">Please upload a pet photo</div>
                    )}
                    {petImageError && <div className="field-error-msg">{petImageError}</div>}
                  </div>
                </div>
              )}

              <div className="sticky-footer">
                <button type={prefillSelf ? "button" : "submit"} className="btn-primary" disabled={loading}
onClick={()=>{
    if(prefillSelf){
        if(!validateForm()){
            setShowErrors(true);
            return;
        }
        setCurrentStep("pet");
        return;
    }

   formRef.current?.requestSubmit();
}}>
                  {prefillSelf
  ? "Continue"
  : loading
      ? "Processing..."
      : "🐾 Book a Walker"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
  )}
  {currentStep === "pet" && (
<div className="auth-page">
    <motion.div
      className="auth-card"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <SelectPetStep
        selectedPetId={selectedPet?.id}
        onSelectPet={setSelectedPet}
        onBack={() => setCurrentStep("details")}
        onContinue={(pet) => handleBookAndPay(pet)}
        submitting={submitting}
      />
      {error && currentStep === "pet" && (
        <div style={{ padding: "0 24px 16px" }}>
          <div className="global-error">{error}</div>
        </div>
      )}
    </motion.div>
  </div>
)}

      <SuccessModal
        open={!!confirmed}
        booking={confirmed || {}}
        onHome={() => navigate("/")}
      />
    </>
  );
}

export default Booking;