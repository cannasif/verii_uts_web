import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type DataGridColumn } from '@/components/shared/data-grid';
import { UtsViewGrid } from '@/components/shared/uts-view-grid';
import { PageHeader } from '@/components/ui/page-header';
import { getAllUtsUretimList, type UtsUretimListItem } from '@/features/uts-uretim-list/api/uts-uretim-list-api';
import { useAuthStore } from '@/stores/auth-store';

export function UtsUretimListPage() {
  const { t } = useTranslation(['uts-uretim-list-management', 'common']);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['uts-uretim-list'],
    queryFn: getAllUtsUretimList,
  });

  const columns = useMemo<DataGridColumn<UtsUretimListItem>[]>(() => [
    { key: 'chk', label: t('chk'), sortable: true },
    { key: 'siraNo', label: t('siraNo'), sortable: true },
    { key: 'bno', label: t('bno'), sortable: true },
    { key: 'sira', label: t('sira'), sortable: true },
    { key: 'git', label: t('git'), sortable: true },
    { key: 'uno', label: t('uno'), sortable: true },
    { key: 'lsNo', label: t('lsNo'), sortable: true },
    { key: 'adt', label: t('adt'), sortable: true },
    { key: 'sinif', label: t('sinif'), sortable: true },
    { key: 'seriMiLotMu', label: t('seriMiLotMu'), sortable: true },
    { key: 'stokKodu', label: t('stokKodu'), sortable: true },
    { key: 'stokAdi', label: t('stokAdi'), sortable: true },
    { key: 'urt', label: t('urt'), sortable: true },
    { key: 'skt', label: t('skt'), sortable: true },
    { key: 'utsDurum', label: t('utsDurum'), sortable: true },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <UtsViewGrid
        pageKey="uts-uretim-list-grid"
        userId={user?.id}
        rows={query.data?.data ?? []}
        columns={columns}
        rowKey={(row) => `${row.chk}-${row.siraNo}-${row.sira}-${row.lsNo}`}
        exportFileName="uts-uretim-list"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </div>
  );
}
