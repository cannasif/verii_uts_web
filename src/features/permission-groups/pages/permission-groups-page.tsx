import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { PermissionGroup } from '@/features/permission-groups/api/permission-groups-api';
import { deletePermissionGroup, searchPermissionGroups } from '@/features/permission-groups/api/permission-groups-api';
import { CreatePermissionGroupPanel } from '@/features/permission-groups/components/create-permission-group-panel';

export function PermissionGroupsPage() {
  const { t } = useTranslation(['access-control', 'common']);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const defaultColumnOrder = ['name', 'description', 'permissionCount', 'isSystem'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('permission-groups-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('permission-groups-grid', user?.id, { visibleKeys: visibleColumnKeys, order: columnOrder });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  const query = useQuery({
    queryKey: ['permission-groups', pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows],
    queryFn: () =>
      searchPermissionGroups({
        pageNumber,
        pageSize,
        search,
        sortBy,
        sortDirection,
        filters: rowsToBackendFilters(appliedFilterRows),
        filterLogic: 'and',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const columns = useMemo<DataGridColumn<PermissionGroup>[]>(() => [
    { key: 'name', label: t('groupName', { ns: 'access-control' }), sortable: true, render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'description', label: t('descriptionColumn', { ns: 'access-control' }), sortable: true },
    {
      key: 'permissionCount',
      label: t('permissionCount', { ns: 'common' }),
      sortable: true,
      render: (row) => <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{row.permissionCount}</span>,
    },
    {
      key: 'isSystem',
      label: t('systemColumn', { ns: 'access-control' }),
      sortable: true,
      render: (row) => (row.isSystem ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })),
      exportValue: (row) => (row.isSystem ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })),
    },
    {
      key: 'actions',
      label: t('actions', { ns: 'access-control' }),
      render: (row) => {
        const disabled = row.isSystem || row.assignedUserCount > 0 || deleteMutation.isPending;
        return (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={disabled}
              onClick={() => {
                if (!window.confirm(t('deletePermissionGroupConfirm', { ns: 'access-control', name: row.name }))) {
                  return;
                }

                deleteMutation.mutate(row.id);
              }}
              title={
                row.isSystem
                  ? t('systemPermissionGroupDeleteBlocked', { ns: 'access-control' })
                  : row.assignedUserCount > 0
                    ? t('permissionGroupInUseDeleteBlocked', { ns: 'access-control' })
                    : t('delete', { ns: 'access-control' })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
      exportValue: () => '',
      className: 'w-20 text-right',
    },
  ], [deleteMutation.isPending, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissionGroupsTitle', { ns: 'access-control' })}
        description={t('permissionGroupsDescription', { ns: 'access-control' })}
        action={
          <Button onClick={() => setIsCreatePanelOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newPermissionGroup', { ns: 'access-control' })}
          </Button>
        }
      />
      <AppDataGrid
        pageKey="permission-groups-grid"
        userId={user?.id}
        searchValue={search}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPageNumber(1);
        }}
        searchPlaceholder={t('searchPlaceholder', { ns: 'access-control' })}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        columnOrder={columnOrder}
        onVisibleColumnKeysChange={setVisibleColumnKeys}
        onColumnOrderChange={setColumnOrder}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(columnKey) => {
          setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
          setSortBy(columnKey);
          setPageNumber(1);
        }}
        isLoading={query.isLoading}
        isError={query.isError}
        pagination={{
          pageNumber,
          pageSize,
          totalCount: query.data?.pagination.totalCount ?? 0,
          totalPages: query.data?.pagination.totalPages ?? 0,
          hasPreviousPage: query.data?.pagination.hasPreviousPage ?? false,
          hasNextPage: query.data?.pagination.hasNextPage ?? false,
        }}
        onPageNumberChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageNumber(1);
        }}
        exportFileName="permission-groups"
        exportRows={(query.data?.data ?? []).map((group) => ({
          name: group.name,
          description: group.description,
          permissionCount: group.permissionCount,
          assignedUserCount: group.assignedUserCount,
          isSystem: group.isSystem ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' }),
        }))}
        filterColumns={[
          { value: 'name', label: t('groupName', { ns: 'access-control' }), type: 'string' },
          { value: 'description', label: t('descriptionColumn', { ns: 'access-control' }), type: 'string' },
          { value: 'permissionCount', label: t('permissionCount', { ns: 'common' }), type: 'number' },
          { value: 'assignedUserCount', label: t('assignedUserCount', { ns: 'access-control' }), type: 'number' },
          { value: 'isSystem', label: t('systemColumn', { ns: 'access-control' }), type: 'boolean' },
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
      <CreatePermissionGroupPanel open={isCreatePanelOpen} onClose={() => setIsCreatePanelOpen(false)} />
    </div>
  );
}
