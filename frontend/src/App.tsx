import * as React from 'react';
import { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';
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

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

interface Employee {
  id: string;
  name: string;
  status: 'free' | 'assigned' | 'on-hold';
  managerId?: string;
  projectId?: string;
  updatedAt?: any;
}

interface Manager {
  id: string;
  name: string;
  email?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

// --- Error Handling ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Operation failed: ${errInfo.error}`);
  throw new Error(JSON.stringify(errInfo));
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'managers' | 'projects'>('employees');

  // Form states
  const [newEmployee, setNewEmployee] = useState({ name: '', status: 'free' as Employee['status'], managerId: '', projectId: '' });
  const [newManager, setNewManager] = useState({ name: '', email: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  // --- Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // --- Connection Test ---
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          toast.error("Firebase connection failed. Check configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // --- Real-time Data Fetching ---
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const unsubEmployees = onSnapshot(
      query(collection(db, 'employees'), orderBy('name')),
      (snapshot) => {
        setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'employees')
    );

    const unsubManagers = onSnapshot(
      query(collection(db, 'managers'), orderBy('name')),
      (snapshot) => {
        setManagers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manager)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'managers')
    );

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), orderBy('name')),
      (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'projects')
    );

    return () => {
      unsubEmployees();
      unsubManagers();
      unsubProjects();
    };
  }, [isAuthReady, user]);

  // --- Actions ---
  const addEmployee = async () => {
    if (!newEmployee.name) return;
    try {
      await addDoc(collection(db, 'employees'), {
        ...newEmployee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewEmployee({ name: '', status: 'free', managerId: '', projectId: '' });
      toast.success('Employee added');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'employees');
    }
  };

  const updateEmployeeStatus = async (id: string, status: Employee['status']) => {
    try {
      await updateDoc(doc(db, 'employees', id), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success('Status updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const assignManager = async (employeeId: string, managerId: string) => {
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        managerId,
        updatedAt: serverTimestamp()
      });
      toast.success('Manager assigned');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${employeeId}`);
    }
  };

  const assignProject = async (employeeId: string, projectId: string) => {
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        projectId,
        updatedAt: serverTimestamp()
      });
      toast.success('Project assigned');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${employeeId}`);
    }
  };

  const addManager = async () => {
    if (!newManager.name) return;
    try {
      await addDoc(collection(db, 'managers'), {
        ...newManager,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewManager({ name: '', email: '' });
      toast.success('Manager added');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'managers');
    }
  };

  const addProject = async () => {
    if (!newProject.name) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewProject({ name: '', description: '' });
      toast.success('Project added');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success('Item deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
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

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <LayoutDashboard className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="text-center">
            <div className="mx-auto bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Employee Status Manager</CardTitle>
            <CardDescription>Sign in to manage your team assignments</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={handleLogin} className="w-full max-w-xs bg-slate-900 hover:bg-slate-800">
              <LogIn className="w-4 h-4 mr-2" /> Sign in with Google
            </Button>
          </CardContent>
        </Card>
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
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
              <span className="font-medium">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
              <LogOut className="w-4 h-4 mr-2" /> Logout
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
                              value={employee.managerId || 'none'} 
                              onValueChange={(v) => assignManager(employee.id, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs border-none bg-transparent hover:bg-slate-100 p-0 px-2">
                                <SelectValue placeholder="Unassigned">
                                  {managers.find(m => m.id === employee.managerId)?.name || 'Unassigned'}
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
                              value={employee.projectId || 'none'} 
                              onValueChange={(v) => assignProject(employee.id, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs border-none bg-transparent hover:bg-slate-100 p-0 px-2">
                                <SelectValue placeholder="No Project">
                                  {projects.find(p => p.id === employee.projectId)?.name || 'No Project'}
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
          <p>© 2026 Employee Status Manager • Real-time Sync Enabled</p>
        </div>
      </footer>
    </div>
  );
}
