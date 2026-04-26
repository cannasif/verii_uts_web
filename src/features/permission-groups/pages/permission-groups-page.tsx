import { useEffect, useMemo, useState } from 'react';
import { Crown, Eye, KeyRound, LockKeyhole, Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import type { PermissionGroup } from '@/features/permission-groups/api/permission-groups-api';
import { deletePermissionGroup, searchPermissionGroups } from '@/features/permission-groups/api/permission-groups-api';
import { CreatePermissionGroupPanel } from '@/features/permission-groups/components/create-permission-group-panel';
import { searchPermissionDefinitions } from '@/features/permission-definitions/api/permission-definitions-api';

function renderSystemStatus(isSystem: boolean, t: (key: string, options?: Record<string, unknown>) => string, isLight: boolean) {
  if (isSystem) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/70 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_16px_rgba(233,93,132,0.18)]">
        <LockKeyhole className="size-3.5 text-white" />
        {t('yes', { ns: 'common' })}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/80">
          {t('systemRoleLabel', { ns: 'access-control' })}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isLight
          ? 'border-fuchsia-300/70 bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_14px_rgba(219,39,119,0.14)]'
          : 'border-fuchsia-300/50 bg-[#22092f]/90 text-fuchsia-200 shadow-[0_0_18px_rgba(15,23,42,0.35)]'
      }`}
    >
      <Pencil className={`size-3.5 ${isLight ? 'text-fuchsia-500' : 'text-fuchsia-200'}`} />
      {t('no', { ns: 'common' })}
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
          isLight ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-[#3f0b3f] text-fuchsia-100'
        }`}
      >
        {t('editableRoleLabel', { ns: 'access-control' })}
      </span>
    </span>
  );
}

function renderPermissionCount(permissionCount: number, totalPermissionCount: number) {
  const fillPercent = totalPermissionCount > 0 ? Math.min(100, (permissionCount / totalPermissionCount) * 100) : 0;
  const isHighPrivilege = totalPermissionCount > 0 && fillPercent >= 70;

  return (
    <div className="flex min-w-[120px] flex-col items-start gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tabular-nums transition-shadow ${
          isHighPrivilege
            ? 'bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_16px_rgba(219,39,119,0.24),0_0_28px_rgba(249,115,22,0.16)]'
            : 'bg-fuchsia-50 text-fuchsia-600 shadow-[0_0_12px_rgba(219,39,119,0.12)]'
        }`}
      >
        {permissionCount}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isHighPrivilege ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500' : 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-orange-400'
          }`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

function getGroupNameIcon(groupName: string, isLight: boolean) {
  const normalizedName = groupName.toLowerCase();

  if (normalizedName.includes('admin')) {
    return {
      Icon: Crown,
      iconClassName: isLight ? 'text-fuchsia-600' : 'text-fuchsia-200',
      badgeClassName: isLight ? 'border-fuchsia-300/60 bg-fuchsia-100 text-fuchsia-700' : 'border-white/16 bg-white/8 text-fuchsia-200',
    };
  }

  if (normalizedName.includes('system')) {
    return {
      Icon: ShieldCheck,
      iconClassName: isLight ? 'text-sky-600' : 'text-sky-200',
      badgeClassName: isLight ? 'border-sky-300/60 bg-sky-100 text-sky-700' : 'border-white/16 bg-white/8 text-sky-200',
    };
  }

  if (normalizedName.includes('user') || normalizedName.includes('kullan')) {
    return {
      Icon: Users,
      iconClassName: isLight ? 'text-emerald-600' : 'text-emerald-200',
      badgeClassName: isLight ? 'border-emerald-300/60 bg-emerald-100 text-emerald-700' : 'border-white/16 bg-white/8 text-emerald-200',
    };
  }

  return {
    Icon: KeyRound,
    iconClassName: isLight ? 'text-indigo-600' : 'text-indigo-200',
    badgeClassName: isLight ? 'border-indigo-300/60 bg-indigo-100 text-indigo-700' : 'border-white/16 bg-white/7 text-indigo-200',
  };
}

function SummaryCard({
  title,
  value,
  description,
  accentClassName,
  isLight,
}: {
  title: string;
  value: string;
  description: string;
  accentClassName: string;
  isLight: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ring-1 ring-inset ${isLight ? 'p-4' : 'p-3.5'} ${accentClassName}`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent ${isLight ? 'via-white/30' : 'via-white/14'} to-transparent`} />
      <p className={`font-semibold uppercase tracking-[0.16em] ${isLight ? 'text-xs text-slate-700/90' : 'text-[10px] text-slate-300/72'}`}>{title}</p>
      <p
        className={`mt-3 text-2xl font-bold ${
          isLight ? 'text-slate-900 drop-shadow-[0_0_8px_rgba(99,102,241,0.12)]' : 'text-[1.35rem] text-white/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.04)]'
        }`}
      >
        {value}
      </p>
      <p className={`mt-1.5 text-sm ${isLight ? 'text-slate-700/80' : 'text-[13px] text-slate-300/66'}`}>{description}</p>
    </Card>
  );
}

export function PermissionGroupsPage() {
  const { t } = useTranslation(['access-control', 'common']);
  const user = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
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

  const permissionDefinitionsQuery = useQuery({
    queryKey: ['permission-definitions-total-count'],
    queryFn: () =>
      searchPermissionDefinitions({
        pageNumber: 1,
        pageSize: 1,
        search: '',
        sortBy: 'name',
        sortDirection: 'asc',
      }),
  });

  const totalPermissionCount = permissionDefinitionsQuery.data?.pagination.totalCount ?? 0;

  const summaryCountQuery = useQuery({
    queryKey: ['permission-groups-summary-count'],
    queryFn: () =>
      searchPermissionGroups({
        pageNumber: 1,
        pageSize: 1,
        search: '',
        sortBy: 'name',
        sortDirection: 'asc',
        filters: [],
        filterLogic: 'and',
      }),
  });

  const summaryGroupCount = summaryCountQuery.data?.pagination.totalCount ?? 0;

  const allPermissionGroupsQuery = useQuery({
    queryKey: ['permission-groups-summary', summaryGroupCount],
    queryFn: () =>
      searchPermissionGroups({
        pageNumber: 1,
        pageSize: Math.max(summaryGroupCount, 1),
        search: '',
        sortBy: 'permissionCount',
        sortDirection: 'desc',
        filters: [],
        filterLogic: 'and',
      }),
    enabled: summaryGroupCount > 0,
  });

  const allPermissionGroups = allPermissionGroupsQuery.data?.data ?? [];
  const topPermissionGroup = allPermissionGroups[0];
  const systemCriticalRoleCount = allPermissionGroups.filter((group) => group.isSystem).length;

  const columns = useMemo<DataGridColumn<PermissionGroup>[]>(
    () => [
      {
        key: 'name',
        label: t('groupName', { ns: 'access-control' }),
        sortable: true,
        render: (row) => {
          const { Icon, badgeClassName, iconClassName } = getGroupNameIcon(row.name, isLight);

          return (
            <span className="inline-flex items-center gap-2">
              <span className={`inline-flex size-7 items-center justify-center rounded-full border ${badgeClassName}`}>
                <Icon className={`size-3.5 ${iconClassName}`} />
              </span>
              <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{row.name}</span>
            </span>
          );
        },
      },
      { key: 'description', label: t('descriptionColumn', { ns: 'access-control' }), sortable: true },
      {
        key: 'permissionCount',
        label: t('permissionCount', { ns: 'common' }),
        sortable: true,
        render: (row) => renderPermissionCount(row.permissionCount, totalPermissionCount),
        className: 'min-w-[140px]',
      },
      {
        key: 'isSystem',
        label: t('systemColumn', { ns: 'access-control' }),
        sortable: true,
        render: (row) => renderSystemStatus(row.isSystem, t, isLight),
        exportValue: (row) => (row.isSystem ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })),
        className: 'min-w-[220px]',
      },
      {
        key: 'actions',
        label: t('actions', { ns: 'access-control' }),
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              className="size-9 text-slate-300 hover:bg-slate-500/10 hover:text-slate-100"
              onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
              title={t('comingSoon', { ns: 'common' })}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="size-9 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-100"
              onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
              title={t('comingSoon', { ns: 'common' })}
            >
              <Pencil className="size-4" />
            </Button>
            {!row.isSystem && (
              <Button
                type="button"
                variant="ghost"
                className="size-9 text-slate-300 hover:bg-rose-500/10 hover:text-rose-500"
                disabled={row.assignedUserCount > 0 || deleteMutation.isPending}
                onClick={() => {
                  if (row.assignedUserCount > 0) {
                    toast.info(t('permissionGroupInUseDeleteBlocked', { ns: 'access-control' }));
                    return;
                  }

                  if (!window.confirm(t('deletePermissionGroupConfirm', { ns: 'access-control', name: row.name }))) {
                    return;
                  }

                  deleteMutation.mutate(row.id);
                }}
                title={
                  row.assignedUserCount > 0
                    ? t('permissionGroupInUseDeleteBlocked', { ns: 'access-control' })
                    : t('delete', { ns: 'access-control' })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
        exportValue: () => '',
        className: 'w-28 text-right',
      },
    ],
    [deleteMutation.isPending, isLight, t, totalPermissionCount],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permissionGroupsTitle', { ns: 'access-control' })}
        description={t('permissionGroupsDescription', { ns: 'access-control' })}
        action={
          <Button className={isLight ? undefined : 'create-action-button'} onClick={() => setIsCreatePanelOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newPermissionGroup', { ns: 'access-control' })}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t('totalPermissionGroupLabel', { ns: 'access-control' })}
          value={String(summaryGroupCount)}
          description={t('totalPermissionGroupDescription', { ns: 'access-control' })}
          accentClassName={isLight ? 'border border-white/10 bg-white/10 shadow-none backdrop-blur-sm transition hover:bg-red-500/10 hover:shadow-[0_0_24px_rgba(239,68,68,0.08)]' : 'management-stat-card'}
          isLight={isLight}
        />
        <SummaryCard
          title={t('mostPermissionGroupLabel', { ns: 'access-control' })}
          value={topPermissionGroup ? topPermissionGroup.name : t('loading', { ns: 'common' })}
          description={
            topPermissionGroup
              ? t('mostPermissionGroupDescription', {
                  ns: 'access-control',
                  count: topPermissionGroup.permissionCount,
                })
              : t('summaryLoadingDescription', { ns: 'access-control' })
          }
          accentClassName={isLight ? 'border border-white/10 bg-white/10 shadow-none backdrop-blur-sm transition hover:bg-red-500/10 hover:shadow-[0_0_24px_rgba(239,68,68,0.08)]' : 'management-stat-card'}
          isLight={isLight}
        />
        <SummaryCard
          title={t('systemCriticalRolesLabel', { ns: 'access-control' })}
          value={String(systemCriticalRoleCount)}
          description={t('systemCriticalRolesDescription', { ns: 'access-control' })}
          accentClassName={
            isLight
              ? 'border-sky-200/80 bg-linear-to-br from-sky-50 via-white to-cyan-50 shadow-[0_12px_28px_rgba(14,165,233,0.12)]'
              : 'management-stat-card'
          }
          isLight={isLight}
        />
      </div>

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
        compactFooterControls
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