import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PagedApiResponse, PagedRequest } from '@/types/api';

export interface CustomerListItem {
  id: number;
  customerCode: string;
  customerName: string;
  taxNumber?: string | null;
  tcknNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  branchCode: number;
  isErpIntegrated: boolean;
  lastSyncDateUtc?: string | null;
  createdAtUtc: string;
}

export interface CustomerSyncTriggerResponse {
  jobId: string;
  queue: string;
  enqueuedAtUtc: string;
}

export async function searchCustomers(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<CustomerListItem>>('/api/customers/search', request);
}

export async function triggerCustomerSync() {
  return apiClient.post<never, ApiResponse<CustomerSyncTriggerResponse>>('/api/customers/sync');
}
