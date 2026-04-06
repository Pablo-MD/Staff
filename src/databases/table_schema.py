from sqlalchemy import Column, Integer, String, JSONB, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from src.settings import (ORGANIZATION_TABLE, LOCATION_TABLE, EMPLOYEE_TABLE,
                            EMPLOYEE_INFO_TABLE,  PROJECT_TABLE)

Base = declarative_base()

class Organization(Base):
    __tablename__ = ORGANIZATION_TABLE
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(500))
    industry = Column(String(100))
    website = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    
    # Relationships
    employees = relationship("Employee", back_populates="organization")
    projects = relationship("Project", back_populates="organization")
    
    __table_args__ = (
        Index('idx_organization_name', 'name'),
    )

class Location(Base):
    __tablename__ = LOCATION_TABLE
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    state_province = Column(String(100))
    timezone = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    
    # Relationships
    employees = relationship("Employee", back_populates="location")
    
    __table_args__ = (
        Index('idx_location_city_country', 'city', 'country'),
    )

class Employee(Base):
    __tablename__ = EMPLOYEE_TABLE
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nfq_id = Column(String(255))
    name = Column(String(255), nullable=False)
    surname = Column(String(255))
    email = Column(String(255), unique=True, nullable=False)
      
    # Foreign keys
    organization_id = Column(UUID(as_uuid=True), ForeignKey(f'{ORGANIZATION_TABLE}.id'), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey(f'{LOCATION_TABLE}.id'))
    
    # Document and processing fields
    user_blob_uri = Column(String(500))
    ocr_data = Column(JSONB)
    is_cv = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    
    # Relationships
    organization = relationship("Organization", back_populates="employees")
    location = relationship("Location", back_populates="employees")
    details = relationship("EmployeeDetails", back_populates="employee", uselist=False)
    
    __table_args__ = (
        Index('idx_employee_email', 'email'),
        Index('idx_employee_name', 'name', 'surname'),
        Index('idx_employee_organization', 'organization_id'),
        Index('idx_employee_ocr_data', 'ocr_data', postgresql_using='gin'),
        Index('idx_employee_llm_structured', 'llm_structured', postgresql_using='gin'),
    )

class EmployeeDetails(Base):
    __tablename__ = EMPLOYEE_INFO_TABLE
    
    id = Column(UUID(as_uuid=True), ForeignKey(f'{EMPLOYEE_TABLE}.id'), unique=True, nullable=False)
    
    # Professional information
    category = Column(String(100))  # Job category/role
    english_level = Column(String(50))  # English proficiency level
    cv_structured = Column(JSONB)  # Structured CV information
    experience_years = Column(Integer)  # Total years of experience
    comments = Column(String(1000))  # General comments

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    
    # Relationships
    employee = relationship("Employee", back_populates="details")
    
    __table_args__ = (
        Index('idx_employee_details_category', 'category'),
        Index('idx_employee_details_english', 'english_level'),
        Index('idx_employee_details_cv_data', 'cv_data', postgresql_using='gin'),
    )


class Project(Base):
    __tablename__ = PROJECT_TABLE
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_code = Column(String(50), unique=True, nullable=False)  # Human-readable project ID
    project_name = Column(String(255), nullable=False)
    description = Column(String(1000))
    
    # Project details
    project_manager_id = Column(UUID(as_uuid=True), ForeignKey(f'{EMPLOYEE_TABLE}.id'))
    area = Column(String(100))  # Project area/domain
    status = Column(String(50), default='planning')  # planning, active, completed, cancelled
    priority = Column(String(20), default='medium')  # low, medium, high, critical
    number_employees_needed = Column(Integer())  # Budget range or amount
    client = Column(String(255))  # Client name

    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    
    # Relationships
    organization = relationship("Organization", back_populates="projects")
    project_manager = relationship("Employee", foreign_keys=[project_manager_id])
    assignments = relationship("ProjectAssignment", back_populates="project")
    
    __table_args__ = (
        Index('idx_project_code', 'project_code'),
        Index('idx_project_name', 'project_name'),
        Index('idx_project_status', 'status'),
        Index('idx_project_organization', 'organization_id'),
        Index('idx_project_area', 'area'),
    )

class Incorporaciones(Base):
    __tablename__ = INCORPORATIONS_TABLE

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    surname = Column(String(255))
    profile = Column(String(255))
    recruiter = Column(String(255))

    organization_id = Column(UUID(as_uuid=True), ForeignKey(f'{ORGANIZATION_TABLE}.id'), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey(f'{LOCATION_TABLE}.id'))

    application_date = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))

    # status: should be onboarding when loading the information from the gsheet
    onboarding_date = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    cv = String(1000)

    email_sent = Column(Boolean)
    incorporated = Column(Boolean)

    created_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(datetime.timezone.utc), onupdate=datetime.now(datetime.timezone.utc))
    

