import { useQuery } from '@tanstack/react-query';
import { getHangfireDeadLetterJobs, getHangfireFailedJobs, getHangfireStats } from '@/features/hangfire-monitoring/api/hangfire-monitoring-api';

const REFRESH_INTERVAL_MS = 60_000;

export function useHangfireStatsQuery() {
  return useQuery({
    queryKey: ['hangfire-monitoring', 'stats'],
    queryFn: getHangfireStats,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireFailedJobsQuery(from: number, count: number) {
  return useQuery({
    queryKey: ['hangfire-monitoring', 'failed', from, count],
    queryFn: () => getHangfireFailedJobs(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useHangfireDeadLetterQuery(from: number, count: number) {
  return useQuery({
    queryKey: ['hangfire-monitoring', 'dead-letter', from, count],
    queryFn: () => getHangfireDeadLetterJobs(from, count),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
