import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  Template,
  TemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ApiResponse,
} from '../types/template';
import type { LoginRequest, LoginResponse, AdminUser } from '../types/admin';
import type { UserListResponse, UserDetail } from '../types/user';
import type { JobListResponse, JobDetail, JobStats, JobListParams, AlertListResponse, AlertStats, AlertListParams, JobAlert } from '../types/job';

// Dashboard types
export interface DashboardSummary {
  // Job stats
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  today_jobs: number;
  today_failed: number;
  today_failure_rate: number;
  // User stats
  total_users: number;
  guest_users: number;
  registered_users: number;
  total_credits: number;
  // Alert stats
  pending_alerts: number;
}

// Base URL for API
const BASE_URL = 'https://chameleon-api-446996287300.us-central1.run.app';

// Create axios instance with JWT token
const createApiClient = (token: string): AxiosInstance => {
  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1/admin`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return client;
};

// Auth API
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${BASE_URL}/api/v1/admin/login`,
      { email, password } as LoginRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
};

// Verify JWT token is still valid
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const client = createApiClient(token);
    await client.get('/verify');
    return true;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      return false;
    }
    throw error;
  }
};

// Get current user info
export const getCurrentUser = async (token: string): Promise<{ user: AdminUser; permissions: string[] }> => {
  const client = createApiClient(token);
  const response = await client.get<ApiResponse<{ user: AdminUser; permissions: string[] }>>('/me');
  return response.data.data;
};

// Template API
export class TemplateApi {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async listTemplates(params?: {
    type?: string;
    page?: number;
    page_size?: number;
  }): Promise<TemplateListResponse> {
    const response = await this.client.get<ApiResponse<TemplateListResponse>>('/templates', {
      params,
    });
    return response.data.data;
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await this.client.get<ApiResponse<Template>>(`/templates/${id}`);
    return response.data.data;
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const response = await this.client.post<ApiResponse<Template>>('/templates', data);
    return response.data.data;
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const response = await this.client.put<ApiResponse<Template>>(`/templates/${id}`, data);
    return response.data.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.client.delete(`/templates/${id}`);
  }

  async getCategories(): Promise<string[]> {
    const response = await this.client.get<ApiResponse<{ categories: string[] }>>('/templates/categories');
    return response.data.data.categories;
  }

  async uploadFile(file: File): Promise<{ url: string; key: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<{ url: string; key: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async batchUpdateTemplates(ids: string[], updates: { is_active?: boolean; is_public?: boolean }): Promise<number> {
    const response = await this.client.patch<ApiResponse<{ updated: number }>>('/templates/batch', {
      ids,
      ...updates,
    });
    return response.data.data.updated;
  }

  async duplicateTemplate(id: string): Promise<Template> {
    const response = await this.client.post<ApiResponse<Template>>(`/templates/${id}/duplicate`);
    return response.data.data;
  }
}

// Singleton pattern for API client
let templateApi: TemplateApi | null = null;

export const getTemplateApi = (token?: string): TemplateApi => {
  if (!templateApi && token) {
    templateApi = new TemplateApi(token);
  }
  if (!templateApi) {
    throw new Error('Template API not initialized');
  }
  return templateApi;
};

export const initTemplateApi = (token: string): void => {
  templateApi = new TemplateApi(token);
};

export const clearTemplateApi = (): void => {
  templateApi = null;
};

// Session storage helpers
const AUTH_KEY = 'admin_auth';

export const saveAuth = (data: LoginResponse): void => {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({
    token: data.token,
    user: data.user,
    permissions: data.permissions,
    expires_at: data.expires_at,
  }));
};

export const getAuth = (): { token: string; user: AdminUser; permissions: string[]; expires_at: string } | null => {
  const data = sessionStorage.getItem(AUTH_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    // Check if token is expired
    if (new Date(parsed.expires_at) < new Date()) {
      clearAuth();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

// User API
export class UserApi {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async listUsers(params?: {
    page?: number;
    page_size?: number;
    email?: string;
    account_type?: string;
    acquisition_source?: string;
  }): Promise<UserListResponse> {
    const response = await this.client.get<ApiResponse<UserListResponse>>('/users', {
      params,
    });
    return response.data.data;
  }

  async getUser(id: string): Promise<UserDetail> {
    const response = await this.client.get<ApiResponse<UserDetail>>(`/users/${id}`);
    return response.data.data;
  }

  async grantCredits(id: string, amount: number, reason?: string): Promise<{ transaction_id: string; amount: number; reason: string }> {
    const response = await this.client.post<ApiResponse<{ transaction_id: string; amount: number; reason: string }>>(`/users/${id}/credits`, {
      amount,
      reason,
    });
    return response.data.data;
  }
}

// Singleton pattern for User API client
let userApi: UserApi | null = null;

export const getUserApi = (token?: string): UserApi => {
  if (!userApi && token) {
    userApi = new UserApi(token);
  }
  if (!userApi) {
    throw new Error('User API not initialized');
  }
  return userApi;
};

export const initUserApi = (token: string): void => {
  userApi = new UserApi(token);
};

export const clearUserApi = (): void => {
  userApi = null;
};

// Job API
export class JobApi {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async listJobs(params?: JobListParams): Promise<JobListResponse> {
    const response = await this.client.get<ApiResponse<JobListResponse>>('/jobs', {
      params,
    });
    return response.data.data;
  }

  async getJob(id: string): Promise<JobDetail> {
    const response = await this.client.get<ApiResponse<JobDetail>>(`/jobs/${id}`);
    return response.data.data;
  }

  async getJobStats(): Promise<JobStats> {
    const response = await this.client.get<ApiResponse<JobStats>>('/jobs/stats');
    return response.data.data;
  }
}

// Singleton pattern for Job API client
let jobApi: JobApi | null = null;

export const getJobApi = (token?: string): JobApi => {
  if (!jobApi && token) {
    jobApi = new JobApi(token);
  }
  if (!jobApi) {
    throw new Error('Job API not initialized');
  }
  return jobApi;
};

export const initJobApi = (token: string): void => {
  jobApi = new JobApi(token);
};

export const clearJobApi = (): void => {
  jobApi = null;
};

// Alert API
export class AlertApi {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = createApiClient(token);
  }

  async listAlerts(params?: AlertListParams): Promise<AlertListResponse> {
    const response = await this.client.get<ApiResponse<AlertListResponse>>('/alerts', {
      params,
    });
    return response.data.data;
  }

  async getAlert(id: string): Promise<JobAlert> {
    const response = await this.client.get<ApiResponse<JobAlert>>(`/alerts/${id}`);
    return response.data.data;
  }

  async getAlertStats(): Promise<AlertStats> {
    const response = await this.client.get<ApiResponse<AlertStats>>('/alerts/stats');
    return response.data.data;
  }

  async acknowledgeAlert(id: string, notes: string): Promise<{ message: string; alert_id: string }> {
    const response = await this.client.post<ApiResponse<{ message: string; alert_id: string }>>(`/alerts/${id}/acknowledge`, {
      notes,
    });
    return response.data.data;
  }

  async acknowledgeBatch(alertIds: string[], notes: string): Promise<{ message: string; acknowledged_count: number }> {
    const response = await this.client.post<ApiResponse<{ message: string; acknowledged_count: number }>>('/alerts/acknowledge-batch', {
      alert_ids: alertIds,
      notes,
    });
    return response.data.data;
  }

  async createTicket(id: string, ticketId: string, ticketUrl: string, notes: string): Promise<{ message: string; alert_id: string; ticket_id: string; ticket_url: string }> {
    const response = await this.client.post<ApiResponse<{ message: string; alert_id: string; ticket_id: string; ticket_url: string }>>(`/alerts/${id}/ticket`, {
      ticket_id: ticketId,
      ticket_url: ticketUrl,
      notes,
    });
    return response.data.data;
  }
}

// Singleton pattern for Alert API client
let alertApi: AlertApi | null = null;

export const getAlertApi = (token?: string): AlertApi => {
  if (!alertApi && token) {
    alertApi = new AlertApi(token);
  }
  if (!alertApi) {
    throw new Error('Alert API not initialized');
  }
  return alertApi;
};

export const initAlertApi = (token: string): void => {
  alertApi = new AlertApi(token);
};

export const clearAlertApi = (): void => {
  alertApi = null;
};

// Clear all auth and API clients
export const clearAuth = (): void => {
  sessionStorage.removeItem(AUTH_KEY);
  clearTemplateApi();
  clearUserApi();
  clearJobApi();
  clearAlertApi();
};

// Dashboard API (standalone function)
export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  const client = createApiClient(token);
  const response = await client.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
};
