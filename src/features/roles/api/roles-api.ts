import { apiClient } from '@/lib/api-client';
import type { PagedApiResponse, PagedRequest } from '@/types/api';

export interface Role {
  id: number;
  name: string;
  description: string;
}

export async function searchRoles(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<Role>>('/api/roles/search', request);
}
