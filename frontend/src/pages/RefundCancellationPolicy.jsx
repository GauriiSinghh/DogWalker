import { useEffect } from "react";
import "../styles/policy.css";
function RefundCancellationPolicy() {
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}, []);
  return (
   


<div className="policy-page">
  <div className="policy-container">
    <div id="tc" className="doc">
    <div>
      <div className="doc-title">Cancellation & Refund Policy</div>
      <div className="doc-meta">Effective Date: June 3, 2026 &nbsp;·&nbsp; Version 1.0</div>
    </div>
    <span className="badge">Active</span>
  </div>

  <div className="section">
    <div className="section-title"> On-demand walk cancellations</div>
    <div className="section-body">
      <div className="table-grid">
        <div className="tg-head">Cancelled when</div><div className="tg-head">Refund</div>
        <div className="tg-cell">Before walker is assigned</div><div className="tg-cell">100% full refund</div>
        <div className="tg-cell">After walker assigned, before they depart</div><div className="tg-cell">100% refund</div>
        <div className="tg-cell">After walker is en route (within 5 mins of ETA)</div><div className="tg-cell">50% refund; convenience fee of ₹49 applies</div>
        <div className="tg-cell">After walker has arrived at your door</div><div className="tg-cell">No refund; full booking charge applies</div>
      </div>
    </div>
  </div>

  <div className="section">
    <div className="section-title">"  Scheduled services cancellations</div>
    <div className="section-body">
      <div className="table-grid">
        <div className="tg-head">Cancelled when</div><div className="tg-head">Refund</div>
        <div className="tg-cell">More than 24 hrs before service</div><div className="tg-cell">100% full refund</div>
        <div className="tg-cell">12–24 hrs before service</div><div className="tg-cell">75% refund</div>
        <div className="tg-cell">4–12 hrs before service</div><div className="tg-cell">50% refund</div>
        <div className="tg-cell">Less than 4 hrs before service</div><div className="tg-cell">No refund</div>
      </div>
    </div>
  </div>

  <div className="section">
    <div className="section-title"> Emergency pet care</div>
    <div className="section-body">
      <div className="highlight-box">Emergency bookings are non-cancellable once a care provider is dispatched. In cases where the emergency is resolved before the provider's arrival, a cancellation fee of 25% applies and the remaining 75% is refunded.</div>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Walker/provider cancellations</div>
    <div className="section-body">
      <p>If a walker or provider cancels your confirmed booking:</p>
      <ul>
        <li>You receive a <strong>100% refund</strong> automatically within 2–4 hours</li>
        <li>Zuppy will attempt to rematch you with the next available provider</li>
        <li>If no provider is available and your pet is in an emergency, our support team will coordinate directly with partner vets</li>
      </ul>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Service quality refunds</div>
    <div className="section-body">
      <p>If you are dissatisfied with the quality of service, you may raise a complaint within <strong>24 hours</strong> of service completion via the app. Zuppy will review your complaint within 48 hours. Eligible refunds of up to 100% may be granted at Zuppy's discretion for verified quality failures.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Refund processing</div>
    <div className="section-body">
      <ul>
        <li><strong>In-app wallet:</strong> Instant (within minutes)</li>
        <li><strong>UPI / net banking:</strong> 1–3 business days</li>
        <li><strong>Credit / debit card:</strong> 5–7 business days depending on your bank</li>
      </ul>
      <p style={{marginTop: "8px"}}>Refunds are issued to the original payment method. Zuppy Wallet credits may be used for any future booking.</p>
    </div>
  </div>

  <div className="contact-card">
    <div className="contact-item">
      <div className="contact-label">In-app support</div>
      <div className="contact-val">Help → Raise a ticket</div>
    </div>
    <div className="contact-item">
      <div className="contact-label">Email</div>
      <div className="contact-val">support@zuppy.app</div>
    </div>
    <div className="contact-item">
      <div className="contact-label">Emergency helpline</div>
      <div className="contact-val">1800-XXX-ZUPPY (24×7)</div>
    </div>
  </div>

  <div className="footer-note">Zuppy Pet Technologies Pvt. Ltd. reserves the right to amend this policy at any time. Changes will be communicated via the app. Continued use of the service constitutes acceptance of the updated policy.</div>
</div>
</div>
  ); 
}
export default RefundCancellationPolicy;