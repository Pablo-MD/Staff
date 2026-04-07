const API_BASE_URL = 'http://localhost:8000/api';

// Types
export interface Employee {
  id: string;
  name: string;
  status: 'free' | 'assigned' | 'on-hold';
  manager_id?: string;
  project_id?: string;
  updated_at?: string;
}

export interface Manager {
  id: string;
  name: string;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

// API response wrapper
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Employees API
export const employeesApi = {
  getAll: () => apiRequest<Employee[]>('/employees'),
  
  create: (employee: Omit<Employee, 'id' | 'updated_at'>) =>
    apiRequest<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    }),
  
  update: (id: string, employee: Omit<Employee, 'id' | 'updated_at'>) =>
    apiRequest<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    }),
  
  delete: (id: string) =>
    apiRequest<{message: string}>(`/employees/${id}`, {
      method: 'DELETE',
    }),
};

// Managers API
export const managersApi = {
  getAll: () => apiRequest<Manager[]>('/managers'),
  
  create: (manager: Omit<Manager, 'id'>) =>
    apiRequest<Manager>('/managers', {
      method: 'POST',
      body: JSON.stringify(manager),
    }),
  
  delete: (id: string) =>
    apiRequest<{message: string}>(`/managers/${id}`, {
      method: 'DELETE',
    }),
};

// Projects API
export const projectsApi = {
  getAll: () => apiRequest<Project[]>('/projects'),
  
  create: (project: Omit<Project, 'id'>) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  
  delete: (id: string) =>
    apiRequest<{message: string}>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Health check
export const healthApi = {
  check: () => apiRequest<{status: string; timestamp: string}>('/health'),
};
