from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, crud
from .database import get_db

def get_current_user(email: str, password: str, db: Session) -> models.User:
    user = crud.get_user_by_email(db, email=email)
    if not user or user.password != password:  # In production, use proper password hashing
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return user

def get_current_active_user(user: models.User) -> models.User:
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def admin_required(user: models.User):
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user

def team_lead_required(user: models.User):
    if user.role not in [models.UserRole.ADMIN, models.UserRole.TEAM_LEAD]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user