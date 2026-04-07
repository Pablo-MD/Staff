import * as React from 'react';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Plus, 
  Trash2, 
  LogOut, 
  LogIn,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// API imports
import { employeesApi, managersApi, projectsApi, healthApi } from '@/services/api';
import type { Employee, Manager, Project } from '@/services/api';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}


// --- Main App Component ---

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-md border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-6 h-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-40 text-slate-700">
                {this.state.error?.message}
              </pre>
            </CardContent>
            <div className="p-6 pt-0">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-slate-900"
              >
                Reload Application
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Wrap the main App export
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [isApiReady, setIsApiReady] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'managers' | 'projects'>('employees');

  // Form states
  const [newEmployee, setNewEmployee] = useState({ name: '', status: 'free' as Employee['status'], manager_id: '', project_id: '' });
  const [newManager, setNewManager] = useState({ name: '', email: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  // --- API Connection Test ---
  useEffect(() => {
    async function testConnection() {
      try {
        await healthApi.check();
        setIsApiReady(true);
      } catch (error) {
        console.error("API connection failed:", error);
        toast.error("Failed to connect to backend API. Please ensure the server is running on localhost:8000");
        setIsApiReady(false);
      }
    }
    testConnection();
  }, []);

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!isApiReady) return;
    
    try {
      const [employeesData, managersData, projectsData] = await Promise.all([
        employeesApi.getAll(),
        managersApi.getAll(),
        projectsApi.getAll()
      ]);
      
      setEmployees(employeesData);
      setManagers(managersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data from server');
    }
  };

  useEffect(() => {
    fetchData();
  }, [isApiReady]);

  // --- Actions ---
  const addEmployee = async () => {
    if (!newEmployee.name) return;
    try {
      await employeesApi.create(newEmployee);
      setNewEmployee({ name: '', status: 'free', manager_id: '', project_id: '' });
      toast.success('Employee added');
      fetchData();
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const updateEmployeeStatus = async (id: string, status: Employee['status']) => {
    try {
      const employee = employees.find(e => e.id === id);
      if (!employee) return;
      
      await employeesApi.update(id, { 
        ...employee, 
        status,
        manager_id: employee.manager_id,
        project_id: employee.project_id
      });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const assignManager = async (employeeId: string, managerId: string) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;
      
      await employeesApi.update(employeeId, { 
        ...employee, 
        manager_id: managerId || undefined,
        project_id: employee.project_id
      });
      toast.success('Manager assigned');
      fetchData();
    } catch (error) {
      console.error('Failed to assign manager:', error);
      toast.error('Failed to assign manager');
    }
  };

  const assignProject = async (employeeId: string, projectId: string) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;
      
      await employeesApi.update(employeeId, { 
        ...employee, 
        project_id: projectId || undefined,
        manager_id: employee.manager_id
      });
      toast.success('Project assigned');
      fetchData();
    } catch (error) {
      console.error('Failed to assign project:', error);
      toast.error('Failed to assign project');
    }
  };

  const addManager = async () => {
    if (!newManager.name) return;
    try {
      await managersApi.create(newManager);
      setNewManager({ name: '', email: '' });
      toast.success('Manager added');
      fetchData();
    } catch (error) {
      console.error('Failed to add manager:', error);
      toast.error('Failed to add manager');
    }
  };

  const addProject = async () => {
    if (!newProject.name) return;
    try {
      await projectsApi.create(newProject);
      setNewProject({ name: '', description: '' });
      toast.success('Project added');
      fetchData();
    } catch (error) {
      console.error('Failed to add project:', error);
      toast.error('Failed to add project');
    }
  };

  const deleteItem = async (type: 'employees' | 'managers' | 'projects', id: string) => {
    try {
      if (type === 'employees') {
        await employeesApi.delete(id);
      } else if (type === 'managers') {
        await managersApi.delete(id);
      } else if (type === 'projects') {
        await projectsApi.delete(id);
      }
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  // --- Render Helpers ---
  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'free': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Free</Badge>;
      case 'assigned': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Briefcase className="w-3 h-3 mr-1" /> Assigned</Badge>;
      case 'on-hold': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> On Hold</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!isApiReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <LayoutDashboard className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Connecting to API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Employee Status Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium">FastAPI Backend</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchData}
              className="text-slate-500 hover:text-slate-900"
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Employees</p>
                  <h3 className="text-3xl font-bold mt-1">{employees.length}</h3>
                </div>
                <Users className="w-8 h-8 text-slate-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Available (Free)</p>
                  <h3 className="text-3xl font-bold mt-1 text-green-600">
                    {employees.filter(e => e.status === 'free').length}
                  </h3>
                </div>
                <UserCheck className="w-8 h-8 text-green-100" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Projects</p>
                  <h3 className="text-3xl font-bold mt-1 text-blue-600">{projects.length}</h3>
                </div>
                <Briefcase className="w-8 h-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-fit mb-6">
          <Button 
            variant={activeTab === 'employees' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('employees')}
            className={activeTab === 'employees' ? 'bg-white shadow-sm' : ''}
          >
            Employees
          </Button>
          <Button 
            variant={activeTab === 'managers' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('managers')}
            className={activeTab === 'managers' ? 'bg-white shadow-sm' : ''}
          >
            Managers
          </Button>
          <Button 
            variant={activeTab === 'projects' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('projects')}
            className={activeTab === 'projects' ? 'bg-white shadow-sm' : ''}
          >
            Projects
          </Button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === 'employees' && (
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl">Employee Directory</CardTitle>
                  <CardDescription>Manage status and assignments</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-slate-900">
                      <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>Enter the details for the new team member.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          value={newEmployee.name} 
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select 
                          value={newEmployee.status} 
                          onValueChange={(v: any) => setNewEmployee({...newEmployee, status: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addEmployee}>Save Employee</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Manager</TableHead>
                      <TableHead className="font-semibold text-slate-700">Project</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          No employees found. Add your first team member to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => (
                        <TableRow key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <Select 
                              value={employee.status} 
                              onValueChange={(v: any) => updateEmployeeStatus(employee.id, v)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs border-none bg-transparent hover:bg-slate-100 p-0 px-2">
                                <SelectValue>{getStatusBadge(employee.status)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={employee.manager_id || 'none'} 
                              onValueChange={(v) => assignManager(employee.id, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs border-none bg-transparent hover:bg-slate-100 p-0 px-2">
                                <SelectValue placeholder="Unassigned">
                                  {managers.find(m => m.id === employee.manager_id)?.name || 'Unassigned'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {managers.map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={employee.project_id || 'none'} 
                              onValueChange={(v) => assignProject(employee.id, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs border-none bg-transparent hover:bg-slate-100 p-0 px-2">
                                <SelectValue placeholder="No Project">
                                  {projects.find(p => p.id === employee.project_id)?.name || 'No Project'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Project</SelectItem>
                                {projects.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteItem('employees', employee.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === 'managers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
                <CardHeader>
                  <CardTitle>Add Manager</CardTitle>
                  <CardDescription>Register a new manager in the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="m-name">Name</Label>
                    <Input 
                      id="m-name" 
                      placeholder="Manager name" 
                      value={newManager.name} 
                      onChange={(e) => setNewManager({...newManager, name: e.target.value})} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-email">Email (Optional)</Label>
                    <Input 
                      id="m-email" 
                      placeholder="manager@company.com" 
                      value={newManager.email} 
                      onChange={(e) => setNewManager({...newManager, email: e.target.value})} 
                    />
                  </div>
                  <Button onClick={addManager} className="w-full bg-slate-900">Add Manager</Button>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Managers List</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Name</TableHead>
                        <TableHead className="font-semibold text-slate-700">Email</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-slate-500">No managers found.</TableCell>
                        </TableRow>
                      ) : (
                        managers.map((manager) => (
                          <TableRow key={manager.id}>
                            <TableCell className="font-medium">{manager.name}</TableCell>
                            <TableCell className="text-slate-500">{manager.email || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteItem('managers', manager.id)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
                <CardHeader>
                  <CardTitle>New Project</CardTitle>
                  <CardDescription>Create a new project for assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="p-name">Project Name</Label>
                    <Input 
                      id="p-name" 
                      placeholder="Project Alpha" 
                      value={newProject.name} 
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="p-desc">Description</Label>
                    <Input 
                      id="p-desc" 
                      placeholder="Short description" 
                      value={newProject.description} 
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})} 
                    />
                  </div>
                  <Button onClick={addProject} className="w-full bg-slate-900">Create Project</Button>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Project Name</TableHead>
                        <TableHead className="font-semibold text-slate-700">Description</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-slate-500">No projects found.</TableCell>
                        </TableRow>
                      ) : (
                        projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell className="text-slate-500">{project.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteItem('projects', project.id)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>© 2026 Employee Status Manager • FastAPI Backend</p>
        </div>
      </footer>
    </div>
  );
}
