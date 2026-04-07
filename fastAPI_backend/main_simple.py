from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json

app = FastAPI(title="Staff Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
employees_db = {}
managers_db = {}
projects_db = {}

# Simple data models (without Pydantic)
def create_employee(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "status": data.get("status", "free"),
        "manager_id": data.get("manager_id"),
        "project_id": data.get("project_id"),
        "updated_at": datetime.now().isoformat()
    }

def create_manager(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "email": data.get("email")
    }

def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "description": data.get("description")
    }

# Employees endpoints
@app.get("/api/employees")
async def get_employees():
    return list(employees_db.values())

@app.post("/api/employees")
async def create_employee_endpoint(employee_data: Dict[str, Any]):
    employee = create_employee(employee_data)
    employees_db[employee["id"]] = employee
    return employee

@app.put("/api/employees/{employee_id}")
async def update_employee(employee_id: str, employee_data: Dict[str, Any]):
    if employee_id not in employees_db:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update existing employee
    existing = employees_db[employee_id].copy()
    existing.update(employee_data)
    existing["updated_at"] = datetime.now().isoformat()
    employees_db[employee_id] = existing
    return existing

@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: str):
    if employee_id not in employees_db:
        raise HTTPException(status_code=404, detail="Employee not found")
    del employees_db[employee_id]
    return {"message": "Employee deleted successfully"}

# Managers endpoints
@app.get("/api/managers")
async def get_managers():
    return list(managers_db.values())

@app.post("/api/managers")
async def create_manager_endpoint(manager_data: Dict[str, Any]):
    manager = create_manager(manager_data)
    managers_db[manager["id"]] = manager
    return manager

@app.delete("/api/managers/{manager_id}")
async def delete_manager(manager_id: str):
    if manager_id not in managers_db:
        raise HTTPException(status_code=404, detail="Manager not found")
    del managers_db[manager_id]
    return {"message": "Manager deleted successfully"}

# Projects endpoints
@app.get("/api/projects")
async def get_projects():
    return list(projects_db.values())

@app.post("/api/projects")
async def create_project_endpoint(project_data: Dict[str, Any]):
    project = create_project(project_data)
    projects_db[project["id"]] = project
    return project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"message": "Project deleted successfully"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
