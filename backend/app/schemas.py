from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: Optional[UserRole] = None
    team_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class User(BaseModel):
    id: int
    email: str
    role: Optional[UserRole] = UserRole.VIEWER
    team_id: Optional[int] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str


class TeamCreate(TeamBase):
    pass


class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AWSResourceBase(BaseModel):
    name: str
    arn: str
    service: str
    team_id: Optional[int] = None


class AWSResourceCreate(AWSResourceBase):
    pass


class AWSResource(AWSResourceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CostRecordBase(BaseModel):
    date: datetime
    team_id: int
    service: str
    amount: float


class CostRecordCreate(CostRecordBase):
    pass


class CostRecord(BaseModel):
    id: int
    date: str
    team_id: int
    service: str
    amount: float

    class Config:
        from_attributes = True