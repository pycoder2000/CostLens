# CostLens - AWS Cost Management

A full-stack application to aggregate AWS costs for multiple teams. The app fetches AWS service costs daily (via AWS Cost Explorer), assigns costs to teams (via tags or manual mapping), and presents role-based cost views (admin, team lead, viewer).

## Features

- AWS cost data ingestion via Cost Explorer
- Role-based team-level cost visibility
- Resource-to-team mapping
- Clean UI with login and dashboards
- Daily cost updates
- Team management for admins

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- Boto3 (AWS SDK)
- APScheduler
- JWT Authentication

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- Axios

## Prerequisites

- Python 3.8+
- Node.js 18+
- AWS Account with Cost Explorer access
- AWS IAM user with appropriate permissions

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./costlens.db
SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/costlens.git
cd costlens
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Initialize the database:
```bash
cd backend
alembic upgrade head
```

5. Create an admin user:
```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123", "role": "admin"}'
```

## Usage

1. Access the application at `http://localhost:3000`
2. Log in with your credentials
3. Navigate through the dashboard to view costs and manage resources

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 