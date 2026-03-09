import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { searchCustomers, triggerCustomerSync, type CustomerListItem } from '@/features/customers/api/customers-api';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export function CustomersPage() {
  const { t } = useTranslation(['customer-management', 'common']);
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
  const defaultColumnOrder = ['customerCode', 'customerName', 'taxNumber', 'phone', 'city', 'branchCode', 'lastSyncDateUtc'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('customers-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('customers-grid', user?.id, {
      visibleKeys: visibleColumnKeys,
      order: columnOrder,
    });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const customersQuery = useQuery({
    queryKey: ['customers', pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows],
    queryFn: () => searchCustomers({
      pageNumber,
      pageSize,
      search,
      sortBy,
      sortDirection,
      filters: rowsToBackendFilters(appliedFilterRows),
      filterLogic: 'and',
    }),
  });

  const columns = useMemo<DataGridColumn<CustomerListItem>[]>(() => [
    { key: 'customerCode', label: t('customerCode'), sortable: true, render: (row) => <span className="font-mono text-xs text-slate-700">{row.customerCode}</span> },
    { key: 'customerName', label: t('customerName'), sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.customerName}</span> },
    { key: 'taxNumber', label: t('taxNumber'), sortable: true, render: (row) => row.taxNumber || '-' },
    { key: 'phone', label: t('phone', { ns: 'common' }), sortable: true, render: (row) => row.phone || '-' },
    { key: 'city', label: t('city'), sortable: true, render: (row) => row.city || '-' },
    { key: 'branchCode', label: t('branchCode'), sortable: true },
    {
      key: 'lastSyncDateUtc',
      label: t('lastSyncDateUtc'),
      sortable: true,
      render: (row) => row.lastSyncDateUtc ? formatDate(row.lastSyncDateUtc) : '-',
      exportValue: (row) => row.lastSyncDateUtc ? formatDate(row.lastSyncDateUtc) : '-',
    },
  ], [t]);

  const exportRows = useMemo<Record<string, unknown>[]>(() =>
    (customersQuery.data?.data ?? []).map((customer) => ({
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      taxNumber: customer.taxNumber || '-',
      phone: customer.phone || '-',
      city: customer.city || '-',
      branchCode: customer.branchCode,
      lastSyncDateUtc: customer.lastSyncDateUtc ? formatDate(customer.lastSyncDateUtc) : '-',
    })), [customersQuery.data?.data]);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const response = await triggerCustomerSync();
      toast.success(response.message || t('syncQueued'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hangfire-monitoring'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ]);
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
        pageKey="customers-grid"
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
        rows={customersQuery.data?.data ?? []}
        rowKey={(row) => row.id}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setPageNumber(1);
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
        }}
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: customersQuery.data?.pagination.totalCount ?? 0,
          totalPages: customersQuery.data?.pagination.totalPages ?? 0,
          hasPreviousPage: customersQuery.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: customersQuery.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="customers"
        exportRows={exportRows}
        filterColumns={[
          { value: 'customerCode', label: t('customerCode'), type: 'string' },
          { value: 'customerName', label: t('customerName'), type: 'string' },
          { value: 'taxNumber', label: t('taxNumber'), type: 'string' },
          { value: 'email', label: t('email', { ns: 'common' }), type: 'string' },
          { value: 'phone', label: t('phone', { ns: 'common' }), type: 'string' },
          { value: 'city', label: t('city'), type: 'string' },
          { value: 'branchCode', label: t('branchCode'), type: 'number' },
          { value: 'isErpIntegrated', label: t('isErpIntegrated'), type: 'boolean' },
        ]}
        defaultFilterColumn="customerName"
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
