import { apiClient } from '@/lib/api-client';
import type { PagedApiResponse, PagedRequest } from '@/types/api';

export interface PermissionDefinition {
  id: number;
  module: string;
  name: string;
  code: string;
  description: string;
}

export async function searchPermissionDefinitions(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<PermissionDefinition>>('/api/permission-definitions/search', request);
}
