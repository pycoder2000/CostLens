from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud, auth
from .database import engine, get_db
from typing import List
from pydantic import BaseModel
from datetime import timedelta
import logging

models.Base.metadata.create_all(bind=engine)

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Add a file handler to save logs
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Also log to console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/login", response_model=schemas.User)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_email(db, email=request.email)
        if not user or user.password != request.password:  # In production, use proper password hashing
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        user = auth.get_current_active_user(user)

        # Create token
        access_token = auth.create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Add token to user response
        user_dict = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "team_id": user.team_id,
            "access_token": access_token,
            "token_type": "bearer",
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        return user_dict
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if this is the first user
    all_users = crud.get_users(db, skip=0, limit=1)
    if not all_users:
        user.role = models.UserRole.ADMIN

    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auth.admin_required(current_user)
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/teams", response_model=List[schemas.Team])
def read_teams(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    teams = crud.get_teams(db, skip=skip, limit=limit)
    return teams

@app.post("/teams", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auth.admin_required(current_user)
    return crud.create_team(db=db, team=team)

@app.get("/resources", response_model=List[schemas.AWSResource])
def read_resources(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auth.team_lead_required(current_user)
    resources = crud.get_resources(db, skip=skip, limit=limit)
    return resources

@app.put("/resources/{resource_id}/team/{team_id}")
def update_resource_team(
    resource_id: int,
    team_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auth.team_lead_required(current_user)
    return crud.update_resource_team(db=db, resource_id=resource_id, team_id=team_id)

@app.put("/users/{user_id}/team/{team_id}")
def update_user_team(
    user_id: int,
    team_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auth.admin_required(current_user)
    return crud.update_user_team(db=db, user_id=user_id, team_id=team_id)

@app.get("/teams/{team_id}/costs", response_model=List[schemas.CostRecord])
def read_team_costs(
    team_id: int,
    start_date: str,
    end_date: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info("="*80)
    logger.info("NEW COST REQUEST RECEIVED")
    logger.info("="*80)
    logger.info(f"Request Details:")
    logger.info(f"  Team ID: {team_id}")
    logger.info(f"  Start Date: {start_date}")
    logger.info(f"  End Date: {end_date}")
    logger.info(f"  User: {current_user.email} (Role: {current_user.role})")
    logger.info(f"  User's Team ID: {current_user.team_id}")
    logger.info("="*80)

    # Check if user has access to the team
    if current_user.role != models.UserRole.ADMIN and current_user.team_id != team_id:
        logger.warning(f"ACCESS DENIED: User {current_user.email} attempted to access team {team_id} costs without permission")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this team's costs"
        )

    try:
        logger.info("Fetching costs from database...")
        costs = crud.get_team_costs(
            db=db,
            team_id=team_id,
            start_date=start_date,
            end_date=end_date
        )
        logger.info(f"Database query completed. Found {len(costs)} cost records")

        if len(costs) > 0:
            logger.info("Sample cost records:")
            for i, cost in enumerate(costs[:3]):  # Show first 3 records
                logger.info(f"Record {i+1}:")
                logger.info(f"  Date: {cost.date}")
                logger.info(f"  Service: {cost.service}")
                logger.info(f"  Amount: ${cost.amount:.2f}")
        else:
            logger.warning("No cost records found for the specified period")

        logger.info("="*80)
        return costs
    except Exception as e:
        logger.error(f"ERROR fetching costs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching costs: {str(e)}"
        )