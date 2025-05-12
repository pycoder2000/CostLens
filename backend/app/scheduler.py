from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import crud, aws
from .database import SessionLocal

def update_daily_costs():
    db = SessionLocal()
    try:
        cost_explorer = aws.AWSCostExplorer()
        yesterday = datetime.now() - timedelta(days=1)
        costs = cost_explorer.get_daily_costs(yesterday, yesterday)

        for cost in costs:
            team = crud.get_team_by_name(db, cost['team'])
            if team:
                cost_record = crud.CostRecordCreate(
                    date=cost['date'],
                    team_id=team.id,
                    service=cost['service'],
                    amount=cost['amount']
                )
                crud.create_cost_record(db, cost_record)
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        update_daily_costs,
        CronTrigger(hour=0, minute=0),  # Run at midnight
        id='update_daily_costs',
        name='Update daily AWS costs',
        replace_existing=True
    )
    scheduler.start() 