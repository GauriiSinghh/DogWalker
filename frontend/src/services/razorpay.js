import { API_BASE } from "../config/api.js";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function createOrder(bookingId, token) {
  const response = await fetch(`${API_BASE}/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Could not start payment"
    );
  }
  return data;
}

async function verifyPayment(bookingId, paymentResponse, token) {
  const response = await fetch(`${API_BASE}/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Payment verification failed"
    );
  }
  if (!data.success) {
    throw new Error(data.message || "Payment verification failed");
  }
  return data;
}

export async function payForBooking({ bookingId, token, user, name, email, mobile }) {
  if (!RAZORPAY_KEY_ID) {
    throw new Error(" not configured. Please contact support.");
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error("Could not load payment gateway. Please try again.");
  }

  const order = await createOrder(bookingId, token);

  return new Promise((resolve, reject) => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Zuppy",
      description: "Dog walking booking",
      prefill: {
        name: name || user?.name || "",
        email: email || user?.email || "",
        contact: mobile || user?.mobile || "",
      },
      theme: { color: "#FF6B35" },
      handler: async (paymentResponse) => {
        try {
          const result = await verifyPayment(bookingId, paymentResponse, token);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled. Please complete payment to confirm."));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      reject(
        new Error(response.error?.description || "Payment failed. Please try again.")
      );
    });
    rzp.open();
  });
}
