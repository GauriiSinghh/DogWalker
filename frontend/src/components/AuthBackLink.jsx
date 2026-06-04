import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

function AuthBackLink() {
  return (
    <Link to="/" className="auth-back-link" aria-label="Back to homepage">
      <FaArrowLeft aria-hidden />
      <span>Back to Home</span>
    </Link>
  );
}

export default AuthBackLink;
