import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type DataGridColumn } from '@/components/shared/data-grid';
import { UtsViewGrid } from '@/components/shared/uts-view-grid';
import { PageHeader } from '@/components/ui/page-header';
import { getAllUtsIthalatList, type UtsIthalatListItem } from '@/features/uts-ithalat-list/api/uts-ithalat-list-api';
import { useAuthStore } from '@/stores/auth-store';

export function UtsIthalatListPage() {
  const { t } = useTranslation(['uts-ithalat-list-management', 'common']);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['uts-ithalat-list'],
    queryFn: getAllUtsIthalatList,
  });

  const columns = useMemo<DataGridColumn<UtsIthalatListItem>[]>(() => [
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
    { key: 'urt', label: t('urt'), sortable: true },
    { key: 'skt', label: t('skt'), sortable: true },
    { key: 'depoKod', label: t('depoKod'), sortable: true },
    { key: 'olcuBr', label: t('olcuBr'), sortable: true },
    { key: 'stharGcMik', label: t('stharGcMik'), sortable: true },
    { key: 'straInc', label: t('straInc'), sortable: true },
    { key: 'imalIthal', label: t('imalIthal'), sortable: true },
    { key: 'gbn', label: t('gbn'), sortable: true },
    { key: 'ieu', label: t('ieu'), sortable: true },
    { key: 'meu', label: t('meu'), sortable: true },
    { key: 'udi', label: t('udi'), sortable: true },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <UtsViewGrid
        pageKey="uts-ithalat-list-grid"
        userId={user?.id}
        rows={query.data?.data ?? []}
        columns={columns}
        rowKey={(row) => `${row.chk}-${row.siraNo}-${row.sira ?? 0}-${row.lsNo}`}
        exportFileName="uts-ithalat-list"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </div>
  );
}
