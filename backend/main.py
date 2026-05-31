
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from email_service import send_booking_email

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],   
)

class Booking(BaseModel):
    apartment: str
    name: str
    mobile: str
    flatNo: str
    address: str

@app.get("/")
def home():
    return {"message": "Dog Walking API is running "}


@app.post("/book")
def book_walker(
    booking: Booking,
    background_tasks: BackgroundTasks):
    print("📨 New booking received:")
    print(booking)

    try:
        background_tasks.add_task(
    send_booking_email,
    booking.apartment,
    booking.name,
    booking.mobile,
    booking.flatNo,
    booking.address
)
    except Exception as e:
        print("Email failed:", e)
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {
        "status": "success",
        "message": f"Booking received from Apartment {booking.apartment}",
    }