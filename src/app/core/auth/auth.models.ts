export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  is_system: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  dni?: string | null;
  is_active: boolean;
  must_change_password: boolean;
  role?: Role | null;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserProfileUpdate {
  full_name: string;
}
