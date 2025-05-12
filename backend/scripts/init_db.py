import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User, Team, AWSResource, CostRecord
from datetime import datetime, timedelta
import random

def init_db():
    db = SessionLocal()
    try:
        # Create teams
        teams = [
            Team(name="Platform"),
            Team(name="Data"),
            Team(name="Infrastructure"),
        ]
        for team in teams:
            db.add(team)
        db.commit()

        # Create users
        users = [
            User(
                email="admin@example.com",
                password="admin123",
                role="admin",
                team_id=teams[0].id
            ),
            User(
                email="lead@example.com",
                password="lead123",
                role="team_lead",
                team_id=teams[1].id
            ),
            User(
                email="viewer@example.com",
                password="viewer123",
                role="viewer",
                team_id=teams[2].id
            ),
        ]
        for user in users:
            db.add(user)
        db.commit()

        # Create AWS resources
        services = ["EC2", "S3", "RDS", "Lambda", "DynamoDB"]
        resources = []
        for i in range(20):
            resource = AWSResource(
                name=f"resource-{i}",
                arn=f"arn:aws:{random.choice(services)}:us-west-2:123456789012:resource-{i}",
                service=random.choice(services),
                team_id=random.choice(teams).id
            )
            resources.append(resource)
            db.add(resource)
        db.commit()

        # Create cost records for the last 30 days
        for i in range(30):
            date = datetime.now() - timedelta(days=i)
            for team in teams:
                for service in services:
                    cost = CostRecord(
                        date=date,
                        team_id=team.id,
                        service=service,
                        amount=random.uniform(10, 1000)
                    )
                    db.add(cost)
        db.commit()

        print("Database initialized with sample data!")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()