from sqlalchemy import  Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import datetime

from sqlalchemy.sql import base

from src.setting import DATABASE_LOCAL
from src.utils.data_transformer import data_transformer
from src.database.table_schema import Incorporaciones, Project, Employee, EmployeeDetails, Location, Organization

Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

class DatabaseLocalManager: 

    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._session = None

    def initialize_engine(self):

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

            self.SessionLocal = scoped_session(
                sessionmaker(
                    bind=self.engine,
                    autocommit=False,
                    autoflush=False,
                    expire_on_commit=False
                )
            )

            logger.info("Database engine initialized successfully")
    
    def check_schema(self): 
        pass
    def create_schema(self):
        pass
    def update_schema(self):
        pass
    def update_incorporaciones(self, entries: list(Incorporaciones)):
        pass
    def register_employee(self, entries: list(Employee)):
        pass
    def register_organization(self, entries: list(Organization)):
        try: 
            self.session.add(entries)
            self.session.commit()
        except Exception as e: 
            self.rollback()
            print(f"Error: {e}")

    def register_location(self, entries: list(Location)): 
        try: 
            self.session.add(entries)
            self.session.commit()
        except Exception as e: 
            self.rollback()
            print(f"Error: {e}")

    def register_proyect(self, entries: list(Project)):
        pass
    def register_incorporations(self, entries: list(Incorporaciones)):
        try: 
            self.session.add(entries)
            self.session.commit()
        except Exception as e: 
            self.rollback()
            print(f"Error: {e}")
