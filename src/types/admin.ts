// Admin User Types

export interface AdminUser {
  id: string;
  email: string;
  nickname?: string;
  is_active: boolean;
  last_login_at?: string;
  roles?: AdminRole[];
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions?: AdminPermission[];
}

export interface AdminPermission {
  id: string;
  key: string;
  name: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: AdminUser;
  permissions: string[];
}

export interface AuthState {
  token: string | null;
  user: AdminUser | null;
  permissions: string[];
  isAuthenticated: boolean;
}
