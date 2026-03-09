import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PagedApiResponse, PagedRequest } from '@/types/api';

export interface PermissionGroup {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissionCount: number;
  assignedUserCount: number;
}

export interface CreatePermissionGroupRequest {
  name: string;
  description: string;
}

export async function searchPermissionGroups(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<PermissionGroup>>('/api/permission-groups/search', request);
}

export async function createPermissionGroup(request: CreatePermissionGroupRequest) {
  return apiClient.post<never, ApiResponse<PermissionGroup>>('/api/permission-groups', request);
}

export async function updatePermissionGroupPermissions(id: number, permissionDefinitionIds: number[]) {
  return apiClient.put<never, ApiResponse<PermissionGroup>>(`/api/permission-groups/${id}/permissions`, {
    permissionDefinitionIds,
  });
}

export async function deletePermissionGroup(id: number) {
  return apiClient.delete<never, ApiResponse<null>>(`/api/permission-groups/${id}`);
}
