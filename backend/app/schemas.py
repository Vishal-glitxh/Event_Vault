from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: uuid.UUID
    organizer_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
