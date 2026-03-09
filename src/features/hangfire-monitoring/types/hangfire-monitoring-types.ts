export interface HangfireStatsDto {
  enqueued: number;
  processing: number;
  scheduled: number;
  succeeded: number;
  failed: number;
  deleted: number;
  servers: number;
  queues: number;
  timestamp: string;
}

export interface HangfireJobItemDto {
  jobId: string;
  jobName: string;
  state: string;
  failedAt?: string;
  enqueuedAt?: string;
  reason?: string;
  exceptionType?: string;
  retryCount: number;
  queue?: string;
}

export interface HangfireFailedResponseDto {
  items: HangfireJobItemDto[];
  total: number;
  timestamp: string;
}

export interface HangfireDeadLetterResponseDto {
  queue: string;
  enqueued: number;
  items: HangfireJobItemDto[];
  timestamp: string;
}
