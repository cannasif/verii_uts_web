import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { searchUtsVermeList, type UtsVermeListItem } from '@/features/uts-verme-list/api/uts-verme-list-api';
import { useAuthStore } from '@/stores/auth-store';

export function UtsVermeListPage() {
  const { t } = useTranslation(['uts-verme-list-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('chk');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const defaultColumnOrder = [
    'chk', 'siraNo', 'bno', 'sira', 'git', 'kun', 'uno', 'lsNo', 'adt', 'sinif', 'seriMiLotMu',
    'cariKodu', 'cariIsim', 'stokKodu', 'stokAdi', 'utsDurum', 'uretimLsNo', 'utrh', 'strh',
    'depoKod', 'olcuBr', 'stharGcMik', 'straInc', 'imalIthal', 'uretimBildirimi',
  ];
  const defaultVisibleColumns = ['chk', 'cariKodu', 'cariIsim', 'stokKodu', 'stokAdi', 'lsNo', 'adt', 'utsDurum', 'uretimBildirimi'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultVisibleColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('uts-verme-list-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys.length > 0 ? preferences.visibleKeys : defaultVisibleColumns);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('uts-verme-list-grid', user?.id, {
      visibleKeys: visibleColumnKeys,
      order: columnOrder,
    });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const utsVermeListQuery = useQuery({
    queryKey: ['uts-verme-list', pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows],
    queryFn: () => searchUtsVermeList({
      pageNumber,
      pageSize,
      search,
      sortBy,
      sortDirection,
      filters: rowsToBackendFilters(appliedFilterRows),
      filterLogic: 'and',
    }),
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

  const exportRows = useMemo<Record<string, unknown>[]>(() =>
    (utsVermeListQuery.data?.data ?? []).map((item) => ({
      chk: item.chk,
      siraNo: item.siraNo ?? '-',
      bno: item.bno ?? '-',
      sira: item.sira ?? '-',
      git: item.git ?? '-',
      kun: item.kun ?? '-',
      uno: item.uno ?? '-',
      lsNo: item.lsNo ?? '-',
      adt: item.adt ?? '-',
      sinif: item.sinif,
      seriMiLotMu: item.seriMiLotMu,
      cariKodu: item.cariKodu,
      cariIsim: item.cariIsim ?? '-',
      stokKodu: item.stokKodu,
      stokAdi: item.stokAdi ?? '-',
      utsDurum: item.utsDurum,
      uretimLsNo: item.uretimLsNo ?? '-',
      utrh: item.utrh ?? '-',
      strh: item.strh ?? '-',
      depoKod: item.depoKod ?? '-',
      olcuBr: item.olcuBr ?? '-',
      stharGcMik: item.stharGcMik ?? '-',
      straInc: item.straInc ?? '-',
      imalIthal: item.imalIthal ?? '-',
      uretimBildirimi: item.uretimBildirimi,
    })), [utsVermeListQuery.data?.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <AppDataGrid
        pageKey="uts-verme-list-grid"
        userId={user?.id}
        searchValue={search}
        onSearchValueChange={(value) => {
          setPageNumber(1);
          setSearch(value);
        }}
        searchPlaceholder={t('searchPlaceholder')}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        columnOrder={columnOrder}
        onVisibleColumnKeysChange={setVisibleColumnKeys}
        onColumnOrderChange={setColumnOrder}
        rows={utsVermeListQuery.data?.data ?? []}
        rowKey={(row) => `${row.chk}-${row.siraNo ?? 0}-${row.bno ?? 'bos'}-${row.lsNo ?? 'bos'}`}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setPageNumber(1);
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
        }}
        isLoading={utsVermeListQuery.isLoading}
        isError={utsVermeListQuery.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: utsVermeListQuery.data?.pagination.totalCount ?? 0,
          totalPages: utsVermeListQuery.data?.pagination.totalPages ?? 0,
          hasPreviousPage: utsVermeListQuery.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: utsVermeListQuery.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="uts-verme-list"
        exportRows={exportRows}
        filterColumns={[
          { value: 'chk', label: t('chk'), type: 'number' },
          { value: 'siraNo', label: t('siraNo'), type: 'number' },
          { value: 'bno', label: t('bno'), type: 'string' },
          { value: 'git', label: t('git'), type: 'string' },
          { value: 'kun', label: t('kun'), type: 'string' },
          { value: 'uno', label: t('uno'), type: 'string' },
          { value: 'lsNo', label: t('lsNo'), type: 'string' },
          { value: 'adt', label: t('adt'), type: 'number' },
          { value: 'sinif', label: t('sinif'), type: 'string' },
          { value: 'seriMiLotMu', label: t('seriMiLotMu'), type: 'string' },
          { value: 'cariKodu', label: t('cariKodu'), type: 'string' },
          { value: 'cariIsim', label: t('cariIsim'), type: 'string' },
          { value: 'stokKodu', label: t('stokKodu'), type: 'string' },
          { value: 'stokAdi', label: t('stokAdi'), type: 'string' },
          { value: 'utsDurum', label: t('utsDurum'), type: 'string' },
          { value: 'uretimLsNo', label: t('uretimLsNo'), type: 'string' },
          { value: 'utrh', label: t('utrh'), type: 'string' },
          { value: 'strh', label: t('strh'), type: 'string' },
          { value: 'depoKod', label: t('depoKod'), type: 'number' },
          { value: 'olcuBr', label: t('olcuBr'), type: 'number' },
          { value: 'stharGcMik', label: t('stharGcMik'), type: 'number' },
          { value: 'straInc', label: t('straInc'), type: 'number' },
          { value: 'imalIthal', label: t('imalIthal'), type: 'string' },
          { value: 'uretimBildirimi', label: t('uretimBildirimi'), type: 'string' },
        ]}
        defaultFilterColumn="stokKodu"
        draftFilterRows={draftFilterRows}
        onDraftFilterRowsChange={setDraftFilterRows}
        onApplyFilters={() => {
          setAppliedFilterRows(draftFilterRows);
          setPageNumber(1);
        }}
        onClearFilters={() => {
          setDraftFilterRows([]);
          setAppliedFilterRows([]);
          setPageNumber(1);
        }}
        appliedFilterCount={appliedFilterRows.length}
      />
    </div>
  );
}
