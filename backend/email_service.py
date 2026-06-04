import os
from dotenv import load_dotenv
import resend

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Paws Pal Connect <onboarding@resend.dev>")

resend.api_key = RESEND_API_KEY

def send_booking_email(apartment, name, mobile, flatNo, address):
    """Send booking notification to ADMIN"""
    print("📧 send_booking_email function started")
    print("FROM_EMAIL  =", FROM_EMAIL)
    print("ADMIN_EMAIL =", ADMIN_EMAIL)

    if not RESEND_API_KEY:
        print("❌ Email NOT sent: RESEND_API_KEY is missing.")
        return
    if not ADMIN_EMAIL:
        print("❌ Email NOT sent: ADMIN_EMAIL is missing.")
        return

    subject = f"🐾 New Booking from Apartment {apartment}"
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
        print(f"✅ Admin email sent | Resend response: {response}")
    except Exception as e:
        print(f"❌ Admin email sending failed: {repr(e)}")


def send_user_confirmation_email(user_name, user_email, apartment, flatNo, address):
    """Send booking confirmation to USER"""
    print(f"📧 send_user_confirmation_email function started for {user_email}")

    if not RESEND_API_KEY:
        print("❌ User confirmation email NOT sent: RESEND_API_KEY is missing.")
        return
    if not user_email:
        print("❌ User confirmation email NOT sent: user_email is missing.")
        return

    subject = "🐾 Your Paws Pal Connect Booking Confirmed!"
    body = (
        f"Hi {user_name},\n\n"
        f"Thank you for booking with Paws Pal Connect! 🐶\n\n"
        f"Here's a summary of your booking:\n\n"
        f"Apartment: {apartment}\n"
        f"Flat/Villa No: {flatNo}\n"
        f"Address: {address}\n\n"
        f"A verified walker has been notified and will arrive at your doorstep within 10 minutes.\n\n"
        f"You'll receive live updates about the walk.\n\n"
        f"Questions? Contact us at zuppy@pawspalconnect.com\n\n"
        f"Happy walking! 🐾\n"
        f"— Paws Pal Connect Team"
    )

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [user_email],
            "subject": subject,
            "text": body,
        }
        response = resend.Emails.send(params)
        print(f"✅ User confirmation email sent to {user_email} | Resend response: {response}")
    except Exception as e:
        print(f"❌ User confirmation email sending failed: {repr(e)}")