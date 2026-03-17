import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type DataGridColumn } from '@/components/shared/data-grid';
import { UtsViewGrid } from '@/components/shared/uts-view-grid';
import { PageHeader } from '@/components/ui/page-header';
import { getAllUtsVermeList, type UtsVermeListItem } from '@/features/uts-verme-list/api/uts-verme-list-api';
import { useAuthStore } from '@/stores/auth-store';

export function UtsVermeListPage() {
  const { t } = useTranslation(['uts-verme-list-management', 'common']);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['uts-verme-list'],
    queryFn: getAllUtsVermeList,
  });

  const columns = useMemo<DataGridColumn<UtsVermeListItem>[]>(() => [
    { key: 'chk', label: t('chk'), sortable: true },
    { key: 'siraNo', label: t('siraNo'), sortable: true },
    { key: 'bno', label: t('bno'), sortable: true },
    { key: 'sira', label: t('sira'), sortable: true },
    { key: 'git', label: t('git'), sortable: true },
    { key: 'kun', label: t('kun'), sortable: true },
    { key: 'uno', label: t('uno'), sortable: true },
    { key: 'lsNo', label: t('lsNo'), sortable: true },
    { key: 'adt', label: t('adt'), sortable: true },
    { key: 'sinif', label: t('sinif'), sortable: true },
    { key: 'seriMiLotMu', label: t('seriMiLotMu'), sortable: true },
    { key: 'cariKodu', label: t('cariKodu'), sortable: true },
    { key: 'cariIsim', label: t('cariIsim'), sortable: true },
    { key: 'stokKodu', label: t('stokKodu'), sortable: true },
    { key: 'stokAdi', label: t('stokAdi'), sortable: true },
    { key: 'utsDurum', label: t('utsDurum'), sortable: true },
    { key: 'uretimLsNo', label: t('uretimLsNo'), sortable: true },
    { key: 'utrh', label: t('utrh'), sortable: true },
    { key: 'strh', label: t('strh'), sortable: true },
    { key: 'depoKod', label: t('depoKod'), sortable: true },
    { key: 'olcuBr', label: t('olcuBr'), sortable: true },
    { key: 'stharGcMik', label: t('stharGcMik'), sortable: true },
    { key: 'straInc', label: t('straInc'), sortable: true },
    { key: 'imalIthal', label: t('imalIthal'), sortable: true },
    { key: 'uretimBildirimi', label: t('uretimBildirimi'), sortable: true },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <UtsViewGrid
        pageKey="uts-verme-list-grid"
        userId={user?.id}
        rows={query.data?.data ?? []}
        columns={columns}
        rowKey={(row) => `${row.chk}-${row.siraNo ?? 0}-${row.bno ?? 'bos'}-${row.lsNo ?? 'bos'}`}
        exportFileName="uts-verme-list"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </div>
  );
}
