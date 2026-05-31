import os
from dotenv import load_dotenv
import resend

load_dotenv()

# Resend configuration (all via environment variables)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
# The "from" address. Must be a Resend-verified domain, OR use the
# Resend test sender "onboarding@resend.dev" until your domain is verified.
FROM_EMAIL = os.getenv("FROM_EMAIL", "Paws Pal Connect <onboarding@resend.dev>")

# Configure the Resend SDK with the API key
resend.api_key = RESEND_API_KEY


def send_booking_email(apartment, name, mobile, flatNo, address):
    """Builds and sends the booking notification email to the admin via Resend."""
    print("📧 send_booking_email function started")
    print("FROM_EMAIL  =", FROM_EMAIL)
    print("ADMIN_EMAIL =", ADMIN_EMAIL)

    # Fail clearly (and early) if config is missing — but never crash the booking
    if not RESEND_API_KEY:
        print("❌ Email NOT sent: RESEND_API_KEY is missing in environment variables.")
        return
    if not ADMIN_EMAIL:
        print("❌ Email NOT sent: ADMIN_EMAIL is missing in environment variables.")
        return

    subject = f"Booking from Apartment {apartment}"

    # Same notification content as before
    body = (
        f"🏢 Apartment      : {apartment}\n"
        f"👤 Customer Name  : {name}\n"
        f"📱 Mobile Number  : {mobile}\n"
        f"🏠 Flat/Villa No  : {flatNo}\n\n"
        "📍 ADDRESS:\n"
        f"{address}\n\n"
    )

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": subject,
            "text": body,
        }
        response = resend.Emails.send(params)
        print(f"✅ Email sent to {ADMIN_EMAIL} | Resend response: {response}")
    except Exception as e:
        # Log clearly so failures are visible in Render logs,
        # but do NOT raise — booking must still succeed.
        print(f"❌ Email sending failed via Resend: {repr(e)}")