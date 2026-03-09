import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PagedApiResponse, PagedRequest } from '@/types/api';

export interface StockListItem {
  id: number;
  erpStockCode: string;
  stockName: string;
  unit?: string | null;
  grupKodu?: string | null;
  grupAdi?: string | null;
  branchCode: number;
  createdAtUtc: string;
}

export interface StockSyncTriggerResponse {
  jobId: string;
  queue: string;
  enqueuedAtUtc: string;
}

export async function searchStocks(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<StockListItem>>('/api/stocks/search', request);
}

export async function triggerStockSync() {
  return apiClient.post<never, ApiResponse<StockSyncTriggerResponse>>('/api/stocks/sync');
}
