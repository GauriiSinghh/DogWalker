# email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


def send_booking_email(apartment, name, mobile, flatNo, address):
    """Builds and sends the booking notification email to the admin."""
    print("send_booking_email function started")
    print("EMAIL_USER =", EMAIL_USER)
    print("ADMIN_EMAIL =", ADMIN_EMAIL)

    subject = f"Booking from Apartment {apartment}"

    body = (
        f"🏢 Apartment      : {apartment}\n"
        f"👤 Customer Name  : {name}\n"
        f"📱 Mobile Number  : {mobile}\n"
        f"🏠 Flat/Villa No  : {flatNo}\n\n"
        "📍ADDRESS:\n"
        f"{address}\n\n"
    )

    message = MIMEMultipart()
    message["From"] = EMAIL_USER
    message["To"] = ADMIN_EMAIL
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    # Connect to Gmail's SMTP server and send — NOW INSIDE the function
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30)
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(message)
        server.quit()
        print(f"✅ Email sent to {ADMIN_EMAIL}")
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")