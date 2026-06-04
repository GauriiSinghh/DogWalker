import { useEffect } from "react";
import "../styles/policy.css";
function TermsConditions() {
 

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
  <div className="doc-header">
    <div>
      <div className="doc-title">Terms & Conditions</div>
      <div className="doc-meta">Effective Date: June 3, 2026 &nbsp;·&nbsp; Version 1.0</div>
    </div>
    <span className="badge">Active</span>
  </div>

  <div className="section">
    <div className="section-title">  Acceptance of terms</div>
    <div className="section-body">
      <p>By downloading, registering, or using the Zuppy application, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform. These terms constitute a legally binding agreement between you and Zuppy Pet Technologies Pvt. Ltd.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  The Zuppy service</div>
    <div className="section-body">
      <p>Zuppy is a technology platform that connects pet owners with:</p>
      <ul>
        <li><strong>On-demand dog walkers</strong> — available within 10 minutes in serviceable areas</li>
        <li><strong>Emergency pet care</strong> — coordination with partner vets, pet ambulances, and overnight boarding</li>
        <li><strong>Scheduled pet services</strong> — grooming, bathing, daycare, and training</li>
      </ul>
      <div className="highlight-box">  Zuppy is a marketplace platform, not a veterinary or medical services provider. In a life-threatening emergency, always call a vet directly.</div>
    </div>
  </div>

  <div className="section">
    <div className="section-title"> User eligibility & account</div>
    <div className="section-body">
      <ul>
        <li>You must be at least 18 years old to create an account</li>
        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
        <li>You must provide accurate and up-to-date information</li>
        <li>One account per person; accounts are non-transferable</li>
        <li>Zuppy reserves the right to suspend accounts that violate these terms</li>
      </ul>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Pet owner responsibilities</div>
    <div className="section-body">
      <ul>
        <li>Provide complete and accurate health and behavioural information about your pet</li>
        <li>Disclose any aggression, medical conditions, or special handling requirements</li>
        <li>Ensure your pet is vaccinated as per local regulations</li>
        <li>Provide appropriate gear (leash, collar with ID tag) for your pet</li>
        <li>Be reachable by phone during the service</li>
      </ul>
      <p><strong>Liability:</strong> You are fully liable for any injury, damage, or loss caused by your pet during a Zuppy-facilitated service. Zuppy facilitates but does not assume ownership-level responsibility for your pet's actions.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Service provider conduct</div>
    <div className="section-body">
      <p>All Zuppy walkers and carers are background-verified, insured, and trained in pet first aid. However, they are independent service providers, not employees of Zuppy. Zuppy is not liable for the actions of individual service providers beyond what is covered by our platform guarantee.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Payments & pricing</div>
    <div className="section-body">
      <p>All prices are displayed in INR and inclusive of applicable GST. Payment is charged at the time of booking confirmation. Surge pricing may apply during peak hours, holidays, or emergency bookings — you will be shown the final price before confirming.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Prohibited conduct</div>
    <div className="section-body">
      <p>You must not:</p>
      <ul>
        <li>Abuse, harass, or threaten any walker, carer, or Zuppy staff</li>
        <li>Book services you do not intend to use repeatedly (fake bookings)</li>
        <li>Attempt to take service providers off-platform</li>
        <li>Misrepresent your pet's behaviour or health condition</li>
        <li>Use the platform for any unlawful purpose</li>
      </ul>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Zuppy guarantee</div>
    <div className="section-body">
      <div className="highlight-box">If a walker does not arrive within the promised time window, or if your pet is injured during a walk due to walker negligence, Zuppy will provide a full refund and cover verified veterinary expenses up to ₹10,000 per incident.</div>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Limitation of liability</div>
    <div className="section-body">
      <p>Zuppy's aggregate liability to you shall not exceed the amount paid by you for the specific service in dispute. We are not liable for indirect, incidental, or consequential damages.</p>
    </div>
  </div>

  <div className="section">
    <div className="section-title">  Governing law</div>
    <div className="section-body">
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka. We encourage resolution through our in-app support channel before any legal action.</p>
    </div>
  </div>

  <div className="footer-note">For legal enquiries: legal@zuppy.app · Zuppy Pet Technologies Pvt. Ltd., Bengaluru, Karnataka, India.</div>
</div>
</div>
</div>
    );
}

export default TermsConditions;
