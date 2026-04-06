"""
Database connection and session management for Google Cloud PostgreSQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
import logging

from src.settings import DATABASE_URL, DB_POOL_SIZE, DB_MAX_OVERFLOW, DB_POOL_TIMEOUT, DB_POOL_RECYCLE
from .table_schema import Base

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database connections and sessions for PostgreSQL."""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._session = None
    
    def initialize_engine(self):
        """Initialize the database engine with PostgreSQL optimizations."""
        if self.engine is None:
            self.engine = create_engine(
                DATABASE_URL,
                # PostgreSQL-specific settings
                poolclass=QueuePool,
                pool_size=DB_POOL_SIZE,
                max_overflow=DB_MAX_OVERFLOW,
                pool_timeout=DB_POOL_TIMEOUT,
                pool_recycle=DB_POOL_RECYCLE,
                pool_pre_ping=True,  # Verify connections before use
                
                # Connection settings
                connect_args={
                    "application_name": "staff_management",
                    "connect_timeout": 10,
                },
                
                # Query optimization
                echo=False,  # Set to True for SQL debugging
                future=True,  # Use SQLAlchemy 2.0 style
                
                # PostgreSQL specific
                executemany_mode='values',
                executemany_values_page_size=10000,
            )
            
            # Create session factory
            self.SessionLocal = scoped_session(
                sessionmaker(
                    bind=self.engine,
                    autocommit=False,
                    autoflush=False,
                    expire_on_commit=False
                )
            )
            
            logger.info("Database engine initialized successfully")
    
    def create_tables(self):
        """Create all database tables."""
        if self.engine is None:
            self.initialize_engine()
        
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            raise
    
    def drop_tables(self):
        """Drop all database tables (use with caution)."""
        if self.engine is None:
            self.initialize_engine()
        
        try:
            Base.metadata.drop_all(bind=self.engine)
            logger.info("Database tables dropped successfully")
        except Exception as e:
            logger.error(f"Error dropping database tables: {e}")
            raise
    
    def get_session(self):
        """Get a database session."""
        if self.SessionLocal is None:
            self.initialize_engine()
        
        return self.SessionLocal()
    
    def close_session(self):
        """Close the current session."""
        if self._session:
            self._session.close()
            self._session = None
    
    def close_all_sessions(self):
        """Close all sessions."""
        if self.SessionLocal:
            self.SessionLocal.remove()
    
    def dispose_engine(self):
        """Dispose of the database engine."""
        if self.engine:
            self.engine.dispose()
            self.engine = None
            self.SessionLocal = None
            logger.info("Database engine disposed")

# Global database manager instance
db_manager = DatabaseManager()

# Dependency for getting database sessions
def get_db():
    """Dependency function to get database session."""
    session = db_manager.get_session()
    try:
        yield session
    finally:
        session.close()

# Initialize database on import
def init_database():
    """Initialize the database connection and create tables."""
    db_manager.initialize_engine()
    db_manager.create_tables()

# Close database connections on shutdown
def close_database():
    """Close all database connections."""
    db_manager.close_all_sessions()
    db_manager.dispose_engine()
