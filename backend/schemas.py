from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# Schema for creating a new user (what the API receives during signup)
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)


# Schema for returning user data (what the API sends back)
# Notice: no password field! We never expose passwords, even hashed.
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


        # Schema for login request
class UserLogin(BaseModel):
    username: str
    password: str


# Schema for the token response
class Token(BaseModel):
    access_token: str
    token_type: str