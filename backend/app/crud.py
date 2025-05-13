from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime, timedelta
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        email=user.email,
        password=user.password,
        role=user.role,
        team_id=user.team_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_team(db: Session, team_id: int):
    return db.query(models.Team).filter(models.Team.id == team_id).first()

def get_teams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Team).offset(skip).limit(limit).all()

def create_team(db: Session, team: schemas.TeamCreate):
    db_team = models.Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

def get_aws_resource(db: Session, resource_id: int):
    return db.query(models.AWSResource).filter(models.AWSResource.id == resource_id).first()

def get_aws_resources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AWSResource).offset(skip).limit(limit).all()

def create_aws_resource(db: Session, resource: schemas.AWSResourceCreate):
    db_resource = models.AWSResource(**resource.dict())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def update_aws_resource_team(db: Session, resource_id: int, team_id: int):
    db_resource = get_aws_resource(db, resource_id)
    if db_resource:
        db_resource.team_id = team_id
        db.commit()
        db.refresh(db_resource)
    return db_resource

def update_user_team(db: Session, user_id: int, team_id: Optional[int]):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.team_id = team_id
        db.commit()
        db.refresh(db_user)
    return db_user

def get_team_costs(
    db: Session,
    team_id: int,
    start_date: str,
    end_date: str
) -> List[models.CostRecord]:
    logger.info(f"Executing database query for team {team_id}")
    logger.info(f"Date range: {start_date} to {end_date}")

    query = db.query(models.CostRecord).filter(
        models.CostRecord.team_id == team_id,
        models.CostRecord.date >= start_date,
        models.CostRecord.date <= end_date
    )

    # Log the SQL query
    logger.info(f"SQL Query: {query}")

    results = query.all()
    logger.info(f"Query returned {len(results)} records")
    return results

def create_cost_record(db: Session, cost: schemas.CostRecordCreate):
    db_cost = models.CostRecord(**cost.dict())
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    return db_cost

def get_daily_costs(
    db: Session,
    team_id: Optional[int] = None,
    date: Optional[datetime] = None
):
    query = db.query(models.CostRecord)

    if team_id:
        query = query.filter(models.CostRecord.team_id == team_id)
    if date:
        query = query.filter(models.CostRecord.date == date)

    return query.all()