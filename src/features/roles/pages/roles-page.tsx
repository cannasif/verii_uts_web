import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/features/roles/api/roles-api';
import { searchRoles } from '@/features/roles/api/roles-api';
import { useQuery } from '@tanstack/react-query';

export function RolesPage() {
  const { t } = useTranslation(['role-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const defaultColumnOrder = ['name', 'description'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('roles-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('roles-grid', user?.id, { visibleKeys: visibleColumnKeys, order: columnOrder });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const rolesQuery = useQuery({
    queryKey: ['roles', pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows],
    queryFn: () =>
      searchRoles({
        pageNumber,
        pageSize,
        search,
        sortBy,
        sortDirection,
        filters: rowsToBackendFilters(appliedFilterRows),
        filterLogic: 'and',
      }),
  });

  const columns = useMemo<DataGridColumn<Role>[]>(() => [
    { key: 'name', label: t('role', { ns: 'common' }), sortable: true, render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'description', label: t('descriptionColumn', { ns: 'role-management' }), sortable: true },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', { ns: 'role-management' })}
        description={t('description', { ns: 'role-management' })}
      />
      <AppDataGrid
        pageKey="roles-grid"
        userId={user?.id}
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPageNumber(1);
        }}
        searchPlaceholder={t('searchPlaceholder', { ns: 'role-management' })}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        columnOrder={columnOrder}
        onVisibleColumnKeysChange={setVisibleColumnKeys}
        onColumnOrderChange={setColumnOrder}
        rows={rolesQuery.data?.data ?? []}
        rowKey={(row) => row.id}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
          setPageNumber(1);
        }}
        isLoading={rolesQuery.isLoading}
        isError={rolesQuery.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: rolesQuery.data?.pagination.totalCount ?? 0,
          totalPages: rolesQuery.data?.pagination.totalPages ?? 0,
          hasPreviousPage: rolesQuery.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: rolesQuery.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="roles"
        exportRows={(rolesQuery.data?.data ?? []).map((role) => ({ name: role.name, description: role.description }))}
        filterColumns={[
          { value: 'name', label: t('role', { ns: 'common' }), type: 'string' },
          { value: 'description', label: t('descriptionColumn', { ns: 'role-management' }), type: 'string' },
        ]}
        defaultFilterColumn="name"
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
