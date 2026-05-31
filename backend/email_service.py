import smtplib                              
from email.mime.text import MIMEText        
from email.mime.multipart import MIMEMultipart
import os                                   
from dotenv import load_dotenv             
load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Admin
ADMIN_EMAIL = "gaurisinghme1712@gmail.com"


def send_booking_email(apartment, name, mobile, flatNo, address):
    """Builds and sends the booking notification email to the admin."""

    subject = f"Booking from Apartment {apartment}"

#emailformt
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

    # # Connect to Gmail's SMTP server and send
    server = smtplib.SMTP("smtp.gmail.com", 587)  # connect
    server.starttls()                            
    server.login(EMAIL_USER, EMAIL_PASSWORD)    
    server.send_message(message)                  # sendemail
    server.quit()                                

    print(f"✅ Email sent to {ADMIN_EMAIL}")