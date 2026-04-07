# FastAPI Backend for Staff Management System

This is the FastAPI backend that serves the React frontend for the Employee Status Manager.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)

### Quick Start

1. **Navigate to the backend directory:**
   ```bash
   cd fastAPI_backend
   ```

2. **Run the startup script:**
   ```bash
   ./start.sh
   ```

   Or manually:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate it
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start the server
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Start the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173 (or whatever Vite shows)
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Managers
- `GET /api/managers` - List all managers
- `POST /api/managers` - Create new manager
- `DELETE /api/managers/{id}` - Delete manager

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `DELETE /api/projects/{id}` - Delete project

### Health Check
- `GET /api/health` - Check API health status

## Data Storage

Currently uses in-memory storage for simplicity. In production, you'll want to connect this to a proper database like PostgreSQL.

## Features

- ✅ RESTful API design
- ✅ CORS support for frontend
- ✅ Automatic API documentation with Swagger
- ✅ Type safety with Pydantic models
- ✅ Error handling
- ✅ Health check endpoint

## Next Steps

To make this production-ready:

1. Add database integration (PostgreSQL with SQLAlchemy)
2. Add authentication/authorization
3. Add input validation and sanitization
4. Add logging and monitoring
5. Add unit and integration tests
6. Deploy with Docker
