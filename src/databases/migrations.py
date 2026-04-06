"""
Database migration utilities for PostgreSQL schema management.
"""
from alembic import command
from alembic.config import Config
from sqlalchemy import text
import logging

from .database import db_manager
from ..table_schema import Base

logger = logging.getLogger(__name__)

class MigrationManager:
    """Manages database migrations using Alembic."""
    
    def __init__(self, alembic_ini_path="alembic.ini"):
        self.alembic_ini_path = alembic_ini_path
        self.config = Config(alembic_ini_path)
    
    def create_migration(self, message):
        """Create a new migration file."""
        try:
            command.revision(self.config, autogenerate=True, message=message)
            logger.info(f"Migration created: {message}")
        except Exception as e:
            logger.error(f"Error creating migration: {e}")
            raise
    
    def upgrade_database(self, revision="head"):
        """Upgrade database to specified revision."""
        try:
            command.upgrade(self.config, revision)
            logger.info(f"Database upgraded to revision: {revision}")
        except Exception as e:
            logger.error(f"Error upgrading database: {e}")
            raise
    
    def downgrade_database(self, revision):
        """Downgrade database to specified revision."""
        try:
            command.downgrade(self.config, revision)
            logger.info(f"Database downgraded to revision: {revision}")
        except Exception as e:
            logger.error(f"Error downgrading database: {e}")
            raise
    
    def get_current_revision(self):
        """Get current database revision."""
        try:
            with db_manager.get_session() as session:
                result = session.execute(text("SELECT version_num FROM alembic_version"))
                revision = result.scalar()
                return revision
        except Exception as e:
            logger.warning(f"Could not get current revision: {e}")
            return None

def setup_postgresql_extensions():
    """Setup PostgreSQL extensions for enhanced functionality."""
    extensions = [
        "uuid-ossp",  # For UUID generation
        "pg_trgm",    # For text similarity searches
        "btree_gin",  # For GIN indexes on common types
        "btree_gist", # For GiST indexes
    ]
    
    with db_manager.get_session() as session:
        for ext in extensions:
            try:
                session.execute(text(f"CREATE EXTENSION IF NOT EXISTS \"{ext}\""))
                logger.info(f"PostgreSQL extension '{ext}' enabled")
            except Exception as e:
                logger.warning(f"Could not enable extension '{ext}': {e}")
        
        session.commit()

def create_database_indexes():
    """Create additional performance indexes."""
    index_statements = [
        # Full-text search indexes
        "CREATE INDEX IF NOT EXISTS idx_employee_fts ON employees USING gin(to_tsvector('english', name || ' ' || COALESCE(surname, '')))",
        "CREATE INDEX IF NOT EXISTS idx_project_fts ON projects USING gin(to_tsvector('english', project_name || ' ' || COALESCE(description, '')))",
        
        # Composite indexes for common queries
        "CREATE INDEX IF NOT EXISTS idx_employee_org_status ON employees(organization_id) WHERE (SELECT status FROM employee_status WHERE employee_id = employees.id) = 'active'",
        "CREATE INDEX IF NOT EXISTS idx_project_org_status ON projects(organization_id, status)",
        
        # JSONB path indexes (PostgreSQL 14+)
        "CREATE INDEX IF NOT EXISTS idx_employee_skills_path ON employees USING gin((llm_structured->'skills'))",
        "CREATE INDEX IF NOT EXISTS idx_employee_details_skills_path ON employee_details USING gin((skills))",
    ]
    
    with db_manager.get_session() as session:
        for statement in index_statements:
            try:
                session.execute(text(statement))
                logger.info(f"Created index: {statement[:50]}...")
            except Exception as e:
                logger.warning(f"Could not create index: {e}")
        
        session.commit()

def validate_schema():
    """Validate database schema integrity."""
    validation_queries = [
        "SELECT COUNT(*) FROM employees",
        "SELECT COUNT(*) FROM organizations", 
        "SELECT COUNT(*) FROM locations",
        "SELECT COUNT(*) FROM employee_details",
        "SELECT COUNT(*) FROM employee_status",
        "SELECT COUNT(*) FROM projects",
        "SELECT COUNT(*) FROM project_assignments",
    ]
    
    with db_manager.get_session() as session:
        for query in validation_queries:
            try:
                result = session.execute(text(query))
                count = result.scalar()
                table_name = query.split("FROM ")[1].strip()
                logger.info(f"Table '{table_name}': {count} records")
            except Exception as e:
                logger.error(f"Error validating table: {e}")

# Global migration manager
migration_manager = MigrationManager()
