from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import List
import uuid
from jose import JWTError, jwt
import os

from .database import engine, get_session, init_db
from .models import Organizer, Event, OTP
from .schemas import OTPRequest, OTPVerify, Token, EventCreate, EventRead
from .auth import (
    generate_otp, hash_otp, verify_otp_hash, 
    create_access_token, send_otp_email,
    SECRET_KEY, ALGORITHM
)

app = FastAPI(title="Event Vault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/verify-otp")

async def get_current_organizer(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    organizer = session.exec(select(Organizer).where(Organizer.email == email)).first()
    if organizer is None:
        raise credentials_exception
    return organizer

@app.on_event("startup")
def on_startup():
    # In a production app, use Alembic for migrations
    # For this prototype, we'll initialize directly
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization failed: {e}")

@app.post("/auth/request-otp")
def request_otp(payload: OTPRequest, session: Session = Depends(get_session)):
    otp_code = generate_otp()
    hashed_otp = hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Clean up old OTPs for this email
    old_otps = session.exec(select(OTP).where(OTP.email == payload.email)).all()
    for old_otp in old_otps:
        session.delete(old_otp)
    
    db_otp = OTP(email=payload.email, hashed_otp=hashed_otp, expires_at=expires_at)
    session.add(db_otp)
    session.commit()
    
    # Send email
    success = send_otp_email(payload.email, otp_code)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    
    return {"message": "OTP sent successfully"}

@app.post("/auth/verify-otp", response_model=Token)
def verify_otp(payload: OTPVerify, session: Session = Depends(get_session)):
    db_otp = session.exec(
        select(OTP).where(OTP.email == payload.email).order_by(OTP.created_at.desc())
    ).first()
    
    if not db_otp or db_otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    if not verify_otp_hash(payload.otp, db_otp.hashed_otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if organizer exists, if not create
    organizer = session.exec(select(Organizer).where(Organizer.email == payload.email)).first()
    if not organizer:
        organizer = Organizer(email=payload.email)
        session.add(organizer)
        session.commit()
        session.refresh(organizer)
    
    # Clear used OTP
    session.delete(db_otp)
    session.commit()
    
    access_token = create_access_token(data={"sub": organizer.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/events", response_model=List[EventRead])
def get_events(
    organizer: Organizer = Depends(get_current_organizer),
    session: Session = Depends(get_session)
):
    events = session.exec(select(Event).where(Event.organizer_id == organizer.id)).all()
    return events

@app.post("/events", response_model=EventRead)
def create_event(
    event_data: EventCreate,
    organizer: Organizer = Depends(get_current_organizer),
    session: Session = Depends(get_session)
):
    db_event = Event(**event_data.model_dump(), organizer_id=organizer.id)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}")
def delete_event(
    event_id: uuid.UUID,
    organizer: Organizer = Depends(get_current_organizer),
    session: Session = Depends(get_session)
):
    event = session.exec(
        select(Event).where(Event.id == event_id, Event.organizer_id == organizer.id)
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    session.delete(event)
    session.commit()
    return {"message": "Event deleted"}
