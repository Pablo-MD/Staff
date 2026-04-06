# Staff Management Database System

A relational database system for managing employee information, projects, and organizational data, optimized for Google Cloud PostgreSQL.

## Features

- **Relational Schema**: Properly normalized database with foreign key relationships
- **PostgreSQL Optimized**: Uses UUID primary keys, JSONB with GIN indexes, and performance optimizations
- **Cloud Ready**: Configured for Google Cloud PostgreSQL with connection pooling
- **Migration Support**: Alembic-based database migrations
- **Full-Text Search**: Built-in search capabilities for employees and projects

## Database Schema

### Core Tables

1. **organizations** - Company/organization information
2. **locations** - Geographic location data
3. **employees** - Main employee records
4. **employee_details** - Extended employee information (CV, skills, education)
5. **employee_status** - Current employment status and position
6. **projects** - Project management data
7. **project_assignments** - Many-to-many relationship between employees and projects

### Key Relationships

- Employees belong to Organizations and Locations
- Each Employee has one EmployeeDetails and one EmployeeStatus record
- Employees can be assigned to multiple Projects through ProjectAssignments
- Projects belong to Organizations and have optional Project Managers

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+ (Google Cloud PostgreSQL recommended)
- Google Cloud account (for cloud deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Staff
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

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database connection details
```

### Google Cloud PostgreSQL Setup

1. Create a Google Cloud PostgreSQL instance
2. Set up the Cloud SQL Auth Proxy or enable direct connections
3. Update your `.env` file with the connection string

Example connection string:
```
DATABASE_URL=postgresql://username:password@127.0.0.1:5432/staff_db
```

### Database Initialization

```python
from src.utils.databases.core.database import init_database
from src.utils.databases.core.migrations import setup_postgresql_extensions

# Initialize database and create tables
init_database()

# Setup PostgreSQL extensions for enhanced functionality
setup_postgresql_extensions()
```

## Usage

### Basic Database Operations

```python
from src.utils.databases.core.database import get_db
from src.utils.databases.table_schema import Employee, Organization

# Get database session
db = next(get_db())

# Create organization
org = Organization(name="Tech Corp", industry="Technology")
db.add(org)
db.commit()

# Create employee
employee = Employee(
    name="John",
    surname="Doe", 
    email="john.doe@techcorp.com",
    organization_id=org.id
)
db.add(employee)
db.commit()
```

### Querying with Relationships

```python
# Get employee with all related data
employee = db.query(Employee).filter(Employee.email == "john.doe@techcorp.com").first()

# Access related data
print(f"Organization: {employee.organization.name}")
print(f"Location: {employee.location.city if employee.location else 'Not set'}")
print(f"Status: {employee.status.status if employee.status else 'Not set'}")
```

### Full-Text Search

```python
from sqlalchemy import text

# Search employees by name
result = db.execute(text("""
    SELECT e.name, e.surname, e.email 
    FROM employees e 
    WHERE to_tsvector('english', e.name || ' ' || COALESCE(e.surname, '')) 
    @@ plainto_tsquery('english', :search_term)
"""), {"search_term": "john doe"})

for row in result:
    print(f"{row.name} {row.surname} - {row.email}")
```

## Database Migrations

### Create New Migration

```python
from src.utils.databases.core.migrations import migration_manager

migration_manager.create_migration("add_new_field_to_employees")
```

### Apply Migrations

```python
from src.utils.databases.core.migrations import migration_manager

migration_manager.upgrade_database()
```

## Performance Optimizations

The schema includes several PostgreSQL-specific optimizations:

- **UUID Primary Keys**: More efficient than autoincrement integers
- **GIN Indexes**: Optimized JSONB queries for structured data
- **Full-Text Search**: Native PostgreSQL text search capabilities
- **Connection Pooling**: Efficient database connection management
- **Composite Indexes**: Optimized for common query patterns

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `DB_POOL_SIZE` | Database connection pool size | 10 |
| `DB_MAX_OVERFLOW` | Max overflow connections | 20 |
| `DEBUG` | Enable debug mode | False |
| `LOG_LEVEL` | Logging level | INFO |

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/
flake8 src/
mypy src/
```

## Deployment

### Google Cloud Run

1. Build container image
2. Push to Google Container Registry
3. Deploy to Cloud Run with database connection

### Cloud SQL Proxy

For secure connections to Google Cloud SQL:

```bash
./cloud_sql_proxy -instances=your-project:your-region:your-instance=tcp:5432
```

## License

[Add your license information]
