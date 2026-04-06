"""
Database and application settings for Staff management system.
"""
import os
from dotenv import load_dotenv
from src.utils.config_loader import ConfigManager

#Load envirnment variables from .env
load_dotenv()

#Initialize Configuration Manager
config = ConfigManager()

# Database table names
EMPLOYEE_TABLE = config.get("table.employees")
EMPLOYEE_INFO_TABLE = config.get("table.employee_details")
PROJECT_TABLE = config.get("table.projects")
ORGANIZATION_TABLE = config.get("table.organizations")
LOCATION_TABLE = config.get("table.locations")
INCORPORATIONS_TABLE = config.get("table.incorporations")

# Google Cloud PostgreSQL connection settings
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/staff_db")
DATABASE_LOCAL = os.getenv("DATABASE_LOCAL", "postgresql+psycopg2://pablo_nfq_tester:160577@localhost:5432/test_db")

# Database connection settings
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))

# Application settings
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

#Service account file
SERVICE_ACCOUNT_FILE = f"{os.getenv("SERVICE_ACCOUNT_FILE", "client_secret_41165699192-12ssnsr78o6j0a8iikdag6omfgns6d3b.apps.googleusercontent.com")}.json"

#Areas filter
ASSI_AREA_FILTER = config.get("areas")