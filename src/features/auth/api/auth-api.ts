import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
  token: {
    accessToken: string;
    expiresAtUtc: string;
  };
}

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export async function login(request: LoginRequest) {
  return apiClient.post<never, ApiResponse<AuthResponse>>('/api/auth/login', request);
}

export async function register(request: RegisterRequest) {
  return apiClient.post<never, ApiResponse<AuthResponse>>('/api/auth/register', request);
}

export async function getMe() {
  return apiClient.get<never, ApiResponse<CurrentUser>>('/api/auth/me');
}

export async function getMyPermissions() {
  return apiClient.get<never, ApiResponse<string[]>>('/api/auth/my-permissions');
}
