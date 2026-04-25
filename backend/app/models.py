from typing import Optional, List
from datetime import datetime
import uuid
from sqlmodel import SQLModel, Field, Relationship

class Organizer(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    events: List["Event"] = Relationship(back_populates="organizer")

class OTP(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True)
    hashed_otp: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    date: datetime
    location: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    organizer_id: uuid.UUID = Field(foreign_key="organizer.id")
    organizer: Organizer = Relationship(back_populates="events")
