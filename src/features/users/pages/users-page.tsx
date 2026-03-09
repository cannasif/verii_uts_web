import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersQuery } from '@/features/users/hooks/use-users-query';
import { CreateUserPanel } from '@/features/users/components/create-user-panel';
import type { UserListItem } from '@/features/users/api/users-api';

export function UsersPage() {
  const { t } = useTranslation(['user-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAtUtc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const defaultColumnOrder = ['fullName', 'email', 'roleName', 'createdAtUtc'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('users-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('users-grid', user?.id, {
      visibleKeys: visibleColumnKeys,
      order: columnOrder,
    });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const usersQuery = useUsersQuery({
    pageNumber,
    pageSize,
    search,
    sortBy,
    sortDirection,
    filters: rowsToBackendFilters(appliedFilterRows),
    filterLogic: 'and',
  });

  const columns = useMemo<DataGridColumn<UserListItem>[]>(() => [
    {
      key: 'fullName',
      label: t('fullName', { ns: 'common' }),
      sortable: true,
      render: (row) => <span className="font-medium text-slate-900">{row.firstName} {row.lastName}</span>,
      exportValue: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'email',
      label: t('email', { ns: 'common' }),
      sortable: true,
    },
    {
      key: 'roleName',
      label: t('role', { ns: 'common' }),
      sortable: true,
      render: (row) => <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{row.roleName}</span>,
    },
    {
      key: 'createdAtUtc',
      label: t('createdAt', { ns: 'common' }),
      sortable: true,
      render: (row) => formatDate(row.createdAtUtc),
      exportValue: (row) => formatDate(row.createdAtUtc),
    },
  ], [t]);

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (usersQuery.data?.data ?? []).map((userItem) => ({
      fullName: `${userItem.firstName} ${userItem.lastName}`,
      email: userItem.email,
      roleName: userItem.roleName,
      createdAtUtc: formatDate(userItem.createdAtUtc),
    }));
  }, [usersQuery.data?.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', { ns: 'user-management' })}
        description={t('description', { ns: 'user-management' })}
        action={
          <Button onClick={() => setIsPanelOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newUser', { ns: 'common' })}
          </Button>
        }
      />

      <AppDataGrid
        pageKey="users-grid"
        userId={user?.id}
        searchValue={search}
        onSearchValueChange={(value) => {
          setPageNumber(1);
          setSearch(value);
        }}
        searchPlaceholder={t('searchPlaceholder', { ns: 'user-management' })}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        columnOrder={columnOrder}
        onVisibleColumnKeysChange={setVisibleColumnKeys}
        onColumnOrderChange={setColumnOrder}
        rows={usersQuery.data?.data ?? []}
        rowKey={(row) => row.id}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setPageNumber(1);
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
        }}
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: usersQuery.data?.pagination.totalCount ?? 0,
          totalPages: usersQuery.data?.pagination.totalPages ?? 0,
          hasPreviousPage: usersQuery.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: usersQuery.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="users"
        exportRows={exportRows}
        filterColumns={[
          { value: 'firstName', label: t('firstName', { ns: 'common' }), type: 'string' },
          { value: 'lastName', label: t('lastName', { ns: 'common' }), type: 'string' },
          { value: 'email', label: t('email', { ns: 'common' }), type: 'string' },
          { value: 'roleName', label: t('role', { ns: 'common' }), type: 'string' },
        ]}
        defaultFilterColumn="email"
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
        headerAction={
          <Button onClick={() => setIsPanelOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newUser', { ns: 'common' })}
          </Button>
        }
      />

      <CreateUserPanel onClose={() => setIsPanelOpen(false)} open={isPanelOpen} />
    </div>
  );
}
