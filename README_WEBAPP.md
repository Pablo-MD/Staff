# Staff Management Web Application

A full-stack web application for managing employees, projects, and organizations using FastAPI (backend) and React (frontend).

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with OAuth2
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios

## Features

### Authentication
- User login/logout with JWT tokens
- Protected routes
- Token-based authentication

### Employee Management
- Create, read, update, delete employees
- Employee details and status tracking
- Organization and location assignment
- Search and filtering capabilities

### Project Management
- Create and manage projects
- Assign employees to projects
- Project managers and budget tracking
- Timeline management

### Organization Management
- Create and manage organizations
- Industry and website information
- Employee statistics per organization

### Dashboard
- Overview statistics
- Employee status summary
- Project and organization counts
- Recent activity feed

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Staff
```

2. Start the application with Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Login Credentials
- Email: admin@company.com
- Password: admin123

## Development Setup

### Backend Development

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login-json` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee
- `GET /api/employees/{id}/details` - Get employee details
- `PUT /api/employees/{id}/details` - Update employee details
- `GET /api/employees/{id}/status` - Get employee status
- `PUT /api/employees/{id}/status` - Update employee status

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/projects/{id}/assignments` - Get project assignments
- `POST /api/projects/{id}/assignments` - Create assignment
- `DELETE /api/projects/{id}/assignments/{assignment_id}` - Remove assignment

### Organizations
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/{id}` - Get organization
- `PUT /api/organizations/{id}` - Update organization
- `DELETE /api/organizations/{id}` - Delete organization
- `GET /api/organizations/{id}/employees` - Get organization employees
- `GET /api/organizations/{id}/stats` - Get organization statistics

## Database Schema

The application uses the existing PostgreSQL database schema from the original Staff Management System:

- **organizations** - Company/organization information
- **locations** - Geographic location data
- **employees** - Main employee records
- **employee_details** - Extended employee information (CV, skills, education)
- **employee_status** - Current employment status and position
- **projects** - Project management data
- **project_assignments** - Many-to-many relationship between employees and projects

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/staff_db
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```

## Security Considerations

- JWT tokens should be stored securely (httpOnly cookies in production)
- Change the default JWT secret key
- Use HTTPS in production
- Implement proper input validation
- Add rate limiting to API endpoints
- Use environment variables for sensitive configuration

## Deployment

### Google Cloud Run
1. Build and push Docker images to Google Container Registry
2. Deploy backend and frontend as separate services
3. Configure Cloud SQL for PostgreSQL database
4. Set up proper networking and security rules

### Traditional Hosting
1. Deploy backend to a Python-capable server (Gunicorn + Nginx)
2. Build and deploy frontend static files to a web server
3. Configure reverse proxy for API routing
4. Set up SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information]

## Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the database schema in the original README
- Contact the development team
