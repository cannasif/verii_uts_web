import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { formatDate } from '@/lib/utils';
import { searchStocks, triggerStockSync, type StockListItem } from '@/features/stocks/api/stocks-api';
import { useAuthStore } from '@/stores/auth-store';

export function StocksPage() {
  const { t } = useTranslation(['stock-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAtUtc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const defaultColumnOrder = ['erpStockCode', 'stockName', 'unit', 'grupAdi', 'branchCode', 'createdAtUtc'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('stocks-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('stocks-grid', user?.id, {
      visibleKeys: visibleColumnKeys,
      order: columnOrder,
    });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const stocksQuery = useQuery({
    queryKey: ['stocks', pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows],
    queryFn: () => searchStocks({
      pageNumber,
      pageSize,
      search,
      sortBy,
      sortDirection,
      filters: rowsToBackendFilters(appliedFilterRows),
      filterLogic: 'and',
    }),
  });

  const columns = useMemo<DataGridColumn<StockListItem>[]>(() => [
    { key: 'erpStockCode', label: t('erpStockCode'), sortable: true, render: (row) => <span className="font-mono text-xs text-slate-700">{row.erpStockCode}</span> },
    { key: 'stockName', label: t('stockName'), sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.stockName}</span> },
    { key: 'unit', label: t('unit'), sortable: true, render: (row) => row.unit || '-' },
    { key: 'grupAdi', label: t('groupName'), sortable: true, render: (row) => row.grupAdi || '-' },
    { key: 'branchCode', label: t('branchCode'), sortable: true },
    { key: 'createdAtUtc', label: t('createdAt', { ns: 'common' }), sortable: true, render: (row) => formatDate(row.createdAtUtc), exportValue: (row) => formatDate(row.createdAtUtc) },
  ], [t]);

  const exportRows = useMemo<Record<string, unknown>[]>(() =>
    (stocksQuery.data?.data ?? []).map((stock) => ({
      erpStockCode: stock.erpStockCode,
      stockName: stock.stockName,
      unit: stock.unit || '-',
      grupAdi: stock.grupAdi || '-',
      branchCode: stock.branchCode,
      createdAtUtc: formatDate(stock.createdAtUtc),
    })), [stocksQuery.data?.data]);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const response = await triggerStockSync();
      toast.success(response.message || t('syncQueued'));
      await queryClient.invalidateQueries({ queryKey: ['hangfire-monitoring'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        action={
          <Button onClick={handleManualSync} disabled={isSyncing}>
            <RefreshCw className={`mr-2 size-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('syncing') : t('manualSync')}
          </Button>
        }
      />

      <AppDataGrid
        pageKey="stocks-grid"
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
        rows={stocksQuery.data?.data ?? []}
        rowKey={(row) => row.id}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setPageNumber(1);
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
        }}
        isLoading={stocksQuery.isLoading}
        isError={stocksQuery.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: stocksQuery.data?.pagination.totalCount ?? 0,
          totalPages: stocksQuery.data?.pagination.totalPages ?? 0,
          hasPreviousPage: stocksQuery.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: stocksQuery.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="stocks"
        exportRows={exportRows}
        filterColumns={[
          { value: 'erpStockCode', label: t('erpStockCode'), type: 'string' },
          { value: 'stockName', label: t('stockName'), type: 'string' },
          { value: 'unit', label: t('unit'), type: 'string' },
          { value: 'grupKodu', label: t('groupCode'), type: 'string' },
          { value: 'grupAdi', label: t('groupName'), type: 'string' },
          { value: 'branchCode', label: t('branchCode'), type: 'number' },
        ]}
        defaultFilterColumn="stockName"
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
