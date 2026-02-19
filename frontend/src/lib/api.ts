const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(project: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  // Tasks
  async getTasks(projectId?: string) {
    const endpoint = projectId ? `/tasks/project/${projectId}` : '/tasks';
    return this.request(endpoint);
  }

  async getAllTasks() {
    return this.request('/tasks');
  }

  async createTask(task: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  // Activities
  async getActivities() {
    return this.request('/activities');
  }

  async getProjectActivities(projectId: string) {
    return this.request(`/activities/project/${projectId}`);
  }

  // Dashboard stats - this might need a custom endpoint
  async getDashboardStats() {
    // For now, we'll calculate from existing data
    // In a real app, you'd have a dedicated stats endpoint
    const [projects, tasks] = await Promise.all([
      this.getProjects(),
      this.getAllTasks(),
    ]);

    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress').length;
    const teamMembers = await this.getUsers().then(users => users.length);

    return {
      tasksCompleted: completedTasks,
      tasksInProgress: inProgressTasks,
      projectsActive: activeProjects,
      teamMembers,
      upcomingDeadlines: 0, // TODO: calculate from tasks
      overdueItems: 0, // TODO: calculate from tasks
    };
  }
}

export const api = new ApiService(API_BASE_URL);