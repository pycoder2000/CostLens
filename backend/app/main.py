from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud, auth
from .database import engine, get_db
from typing import List
from pydantic import BaseModel

models.Base.metadata.create_all(bind=engine)

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

@app.post("/login", response_model=schemas.User)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = auth.get_current_user(request.email, request.password, db)
        user = auth.get_current_active_user(user)
        return user
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
def read_users_me(email: str, password: str, db: Session = Depends(get_db)):
    user = auth.get_current_user(email, password, db)
    return user

@app.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    email: str = None,
    password: str = None,
    db: Session = Depends(get_db)
):
    if email and password:
        current_user = auth.get_current_user(email, password, db)
        auth.admin_required(current_user)
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/teams", response_model=List[schemas.Team])
def read_teams(
    skip: int = 0,
    limit: int = 100,
    email: str = None,
    password: str = None,
    db: Session = Depends(get_db)
):
    if email and password:
        current_user = auth.get_current_user(email, password, db)
        auth.team_lead_required(current_user)
    teams = crud.get_teams(db, skip=skip, limit=limit)
    return teams

@app.post("/teams", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    current_user = auth.get_current_user(email, password, db)
    auth.admin_required(current_user)
    return crud.create_team(db=db, team=team)

@app.get("/resources", response_model=List[schemas.AWSResource])
def read_resources(
    skip: int = 0,
    limit: int = 100,
    email: str = None,
    password: str = None,
    db: Session = Depends(get_db)
):
    if email and password:
        current_user = auth.get_current_user(email, password, db)
        auth.team_lead_required(current_user)
    resources = crud.get_resources(db, skip=skip, limit=limit)
    return resources

@app.put("/resources/{resource_id}/team/{team_id}")
def update_resource_team(
    resource_id: int,
    team_id: int,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    current_user = auth.get_current_user(email, password, db)
    auth.team_lead_required(current_user)
    return crud.update_resource_team(db=db, resource_id=resource_id, team_id=team_id)

@app.put("/users/{user_id}/team/{team_id}")
def update_user_team(
    user_id: int,
    team_id: int,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    current_user = auth.get_current_user(email, password, db)
    auth.admin_required(current_user)
    return crud.update_user_team(db=db, user_id=user_id, team_id=team_id)