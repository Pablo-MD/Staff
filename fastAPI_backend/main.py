from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
from datetime import datetime
from pydantic import BaseModel

app = FastAPI(title="Staff Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class EmployeeBase(BaseModel):
    name: str
    status: str = "free"
    manager_id: Optional[str] = None
    project_id: Optional[str] = None

class Employee(EmployeeBase):
    id: str
    updated_at: Optional[datetime] = None

class ManagerBase(BaseModel):
    name: str
    email: Optional[str] = None

class Manager(ManagerBase):
    id: str

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class Project(ProjectBase):
    id: str

# In-memory storage (replace with database later)
employees_db = {}
managers_db = {}
projects_db = {}

# Employees endpoints
@app.get("/api/employees", response_model=List[Employee])
async def get_employees():
    return list(employees_db.values())

@app.post("/api/employees", response_model=Employee)
async def create_employee(employee: EmployeeBase):
    employee_id = str(uuid.uuid4())
    new_employee = Employee(
        id=employee_id,
        **employee.dict(),
        updated_at=datetime.now()
    )
    employees_db[employee_id] = new_employee
    return new_employee

@app.put("/api/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee: EmployeeBase):
    if employee_id not in employees_db:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    updated_employee = Employee(
        id=employee_id,
        **employee.dict(),
        updated_at=datetime.now()
    )
    employees_db[employee_id] = updated_employee
    return updated_employee

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str):
    if employee_id not in employees_db:
        raise HTTPException(status_code=404, detail="Employee not found")
    del employees_db[employee_id]
    return {"message": "Employee deleted successfully"}

# Managers endpoints
@app.get("/api/managers", response_model=List[Manager])
async def get_managers():
    return list(managers_db.values())

@app.post("/api/managers", response_model=Manager)
async def create_manager(manager: ManagerBase):
    manager_id = str(uuid.uuid4())
    new_manager = Manager(id=manager_id, **manager.dict())
    managers_db[manager_id] = new_manager
    return new_manager

@app.delete("/api/managers/{manager_id}")
async def delete_manager(manager_id: str):
    if manager_id not in managers_db:
        raise HTTPException(status_code=404, detail="Manager not found")
    del managers_db[manager_id]
    return {"message": "Manager deleted successfully"}

# Projects endpoints
@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    return list(projects_db.values())

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectBase):
    project_id = str(uuid.uuid4())
    new_project = Project(id=project_id, **project.dict())
    projects_db[project_id] = new_project
    return new_project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"message": "Project deleted successfully"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
