from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEAM_LEAD = "team_lead"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(Enum(UserRole))
    team_id = Column(Integer, ForeignKey("teams.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    team = relationship("Team", back_populates="users")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="team")
    resources = relationship("AWSResource", back_populates="team")
    costs = relationship("CostRecord", back_populates="team")

class AWSResource(Base):
    __tablename__ = "aws_resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    arn = Column(String, unique=True, index=True)
    service = Column(String, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    team = relationship("Team", back_populates="resources")

class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    service = Column(String, index=True)
    amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="costs")