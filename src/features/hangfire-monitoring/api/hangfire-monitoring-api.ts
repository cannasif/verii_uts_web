import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  HangfireDeadLetterResponseDto,
  HangfireFailedResponseDto,
  HangfireStatsDto,
} from '@/features/hangfire-monitoring/types/hangfire-monitoring-types';

export async function getHangfireStats() {
  return apiClient.get<never, ApiResponse<HangfireStatsDto>>('/api/hangfire/stats');
}

export async function getHangfireFailedJobs(from = 0, count = 20) {
  return apiClient.get<never, ApiResponse<HangfireFailedResponseDto>>(`/api/hangfire/failures-from-db?from=${from}&count=${count}`);
}

export async function getHangfireDeadLetterJobs(from = 0, count = 20) {
  return apiClient.get<never, ApiResponse<HangfireDeadLetterResponseDto>>(`/api/hangfire/dead-letter?from=${from}&count=${count}`);
}
