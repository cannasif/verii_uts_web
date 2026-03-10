import { useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useHangfireDeadLetterQuery, useHangfireFailedJobsQuery, useHangfireStatsQuery } from '@/features/hangfire-monitoring/hooks/use-hangfire-monitoring';

const PAGE_SIZE = 20;

function formatDate(value?: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
}

function StatCard({ title, value, tone = 'default' }: { title: string; value: number; tone?: 'default' | 'success' | 'danger' }) {
  const colorClassName =
    tone === 'danger' ? 'text-rose-600' : tone === 'success' ? 'text-emerald-600' : 'text-slate-900';

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 text-3xl font-semibold ${colorClassName}`}>{value}</p>
    </Card>
  );
}

export function HangfireMonitoringPage() {
  const { t } = useTranslation(['hangfire-monitoring', 'common']);
  const [failedPage, setFailedPage] = useState(1);
  const [deadLetterPage, setDeadLetterPage] = useState(1);

  const failedFrom = (failedPage - 1) * PAGE_SIZE;
  const deadLetterFrom = (deadLetterPage - 1) * PAGE_SIZE;

  const statsQuery = useHangfireStatsQuery();
  const failedQuery = useHangfireFailedJobsQuery(failedFrom, PAGE_SIZE);
  const deadLetterQuery = useHangfireDeadLetterQuery(deadLetterFrom, PAGE_SIZE);

  const isLoading = statsQuery.isLoading || failedQuery.isLoading || deadLetterQuery.isLoading;
  const isRefreshing = statsQuery.isRefetching || failedQuery.isRefetching || deadLetterQuery.isRefetching;

  const failedTotalPages = useMemo(() => {
    const total = failedQuery.data?.data.total ?? 0;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [failedQuery.data?.data.total]);

  const deadLetterHasNext = (deadLetterQuery.data?.data.items.length ?? 0) === PAGE_SIZE;

  const refreshAll = async () => {
    await Promise.all([statsQuery.refetch(), failedQuery.refetch(), deadLetterQuery.refetch()]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        action={
          <Button variant="secondary" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        }
      />

      {isLoading ? (
        <Card className="flex min-h-[360px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="size-10 animate-spin" />
            <span>{t('common:loading')}</span>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title={t('stats.enqueued')} value={statsQuery.data?.data.enqueued ?? 0} />
            <StatCard title={t('stats.processing')} value={statsQuery.data?.data.processing ?? 0} />
            <StatCard title={t('stats.succeeded')} value={statsQuery.data?.data.succeeded ?? 0} tone="success" />
            <StatCard title={t('stats.failed')} value={statsQuery.data?.data.failed ?? 0} tone="danger" />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('failed.title')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('failed.description')}</p>
              </div>
              <span className="text-sm text-slate-500">
                {t('failed.total')}: {failedQuery.data?.data.total ?? 0}
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.jobId')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.jobName')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.state')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.time')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(failedQuery.data?.data.items ?? []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                          {t('failed.empty')}
                        </td>
                      </tr>
                    ) : (
                      (failedQuery.data?.data.items ?? []).map((item) => (
                        <tr key={`${item.jobId}-${item.failedAt ?? item.enqueuedAt ?? 'failed'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.jobId}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.jobName}</td>
                          <td className="px-4 py-3 text-sm text-rose-600">{item.state || t('table.failedState')}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.failedAt)}</td>
                          <td className="max-w-[360px] truncate px-4 py-3 text-sm text-slate-600" title={item.reason}>
                            {item.reason || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" disabled={failedPage <= 1} onClick={() => setFailedPage((page) => Math.max(1, page - 1))}>
                {t('common:previous')}
              </Button>
              <Button variant="secondary" disabled={failedPage >= failedTotalPages} onClick={() => setFailedPage((page) => Math.min(failedTotalPages, page + 1))}>
                {t('common:next')}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('deadLetter.title')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('deadLetter.description')}</p>
              </div>
              <span className="text-sm text-slate-500">
                {t('deadLetter.enqueued')}: {deadLetterQuery.data?.data.enqueued ?? 0}
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.jobId')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.jobName')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.state')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.time')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('table.reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(deadLetterQuery.data?.data.items ?? []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                          {t('deadLetter.empty')}
                        </td>
                      </tr>
                    ) : (
                      (deadLetterQuery.data?.data.items ?? []).map((item) => (
                        <tr key={`${item.jobId}-${item.enqueuedAt ?? 'dead-letter'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.jobId}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.jobName}</td>
                          <td className="px-4 py-3 text-sm text-amber-600">{item.state || t('table.enqueuedState')}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.enqueuedAt)}</td>
                          <td className="max-w-[360px] truncate px-4 py-3 text-sm text-slate-600" title={item.reason}>
                            {item.reason || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" disabled={deadLetterPage <= 1} onClick={() => setDeadLetterPage((page) => Math.max(1, page - 1))}>
                {t('common:previous')}
              </Button>
              <Button variant="secondary" disabled={!deadLetterHasNext} onClick={() => setDeadLetterPage((page) => page + 1)}>
                {t('common:next')}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
