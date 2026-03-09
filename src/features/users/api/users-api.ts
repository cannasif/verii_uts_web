import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PagedApiResponse, PagedRequest } from '@/types/api';

export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  createdAtUtc: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  permissionGroupIds: number[];
}

export interface UserDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
  permissionGroupIds: number[];
}

export async function searchUsers(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<UserListItem>>('/api/users/search', request);
}

export async function createUser(request: CreateUserRequest) {
  return apiClient.post<never, ApiResponse<UserDetail>>('/api/users', request);
}
