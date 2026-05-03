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
      <span
        className={`inline-flex max-w-full items-center gap-1 rounded-full border border-fuchsia-300/70 px-2 py-0.5 text-[11px] font-semibold leading-tight text-white shadow-[0_0_12px_rgba(233,93,132,0.14)] ${
          isLight ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-violet-600' : 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500'
        }`}
      >
        <LockKeyhole className="size-3 shrink-0 text-white" />
        {t('yes', { ns: 'common' })}
        <span className="rounded-full bg-white/10 px-1.5 py-px text-[9px] uppercase tracking-[0.14em] text-white/85">
          {t('systemRoleLabel', { ns: 'access-control' })}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-tight ${
        isLight
          ? 'border-fuchsia-300/70 bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_10px_rgba(219,39,119,0.12)]'
          : 'border-fuchsia-300/45 bg-[#1c1428]/95 text-fuchsia-200/95 shadow-none'
      }`}
    >
      <Pencil className={`size-3 shrink-0 ${isLight ? 'text-fuchsia-500' : 'text-fuchsia-300/90'}`} />
      {t('no', { ns: 'common' })}
      <span
        className={`rounded-full px-1.5 py-px text-[9px] uppercase tracking-[0.14em] ${
          isLight ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-fuchsia-950/80 text-fuchsia-100/90'
        }`}
      >
        {t('editableRoleLabel', { ns: 'access-control' })}
      </span>
    </span>
  );
}

function renderPermissionCount(permissionCount: number, totalPermissionCount: number, isLight: boolean) {
  const fillPercent = totalPermissionCount > 0 ? Math.min(100, (permissionCount / totalPermissionCount) * 100) : 0;
  const isHighPrivilege = totalPermissionCount > 0 && fillPercent >= 70;

  const countClass = isLight
    ? isHighPrivilege
      ? 'bg-fuchsia-50 text-fuchsia-700 shadow-[0_0_10px_rgba(219,39,119,0.18)]'
      : 'bg-fuchsia-50 text-fuchsia-600 shadow-[0_0_8px_rgba(219,39,119,0.1)]'
    : isHighPrivilege
      ? 'border border-fuchsia-500/25 bg-fuchsia-500/12 text-fuchsia-100 shadow-[0_0_12px_rgba(219,39,119,0.15)]'
      : 'border border-white/[0.06] bg-white/[0.06] text-fuchsia-100/95';

  const trackClass = isLight ? 'bg-slate-200/85' : 'bg-white/[0.08]';

  return (
    <div className="flex min-w-[96px] max-w-[112px] flex-col items-stretch gap-1">
      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none transition-shadow ${countClass}`}>
        {permissionCount}
      </span>
      <div className={`h-1 w-full overflow-hidden rounded-full ${trackClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isLight
              ? isHighPrivilege
                ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-violet-600'
                : 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500'
              : isHighPrivilege
                ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500'
                : 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-orange-400'
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
    <Card className={`relative overflow-hidden ${isLight ? 'p-3.5' : 'p-3.5'} ${accentClassName}`}>
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
  const defaultColumnOrder = ['name', 'description', 'permissionCount', 'isSystem', 'actions'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    const preferences = loadColumnPreferences('permission-groups-grid', user?.id, defaultColumnOrder);
    const order = preferences.order.includes('actions') ? preferences.order : [...preferences.order, 'actions'];
    const visible = preferences.visibleKeys.includes('actions') ? preferences.visibleKeys : [...preferences.visibleKeys, 'actions'];
    setVisibleColumnKeys(visible);
    setColumnOrder(order);
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
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border ${badgeClassName}`}>
                <Icon className={`size-3 ${iconClassName}`} />
              </span>
              <span className={`text-[13px] font-medium leading-snug ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{row.name}</span>
            </span>
          );
        },
      },
      { key: 'description', label: t('descriptionColumn', { ns: 'access-control' }), sortable: true },
      {
        key: 'permissionCount',
        label: t('permissionCount', { ns: 'common' }),
        sortable: true,
        render: (row) => renderPermissionCount(row.permissionCount, totalPermissionCount, isLight),
        className: 'min-w-[108px]',
      },
      {
        key: 'isSystem',
        label: t('systemColumn', { ns: 'access-control' }),
        sortable: true,
        render: (row) => renderSystemStatus(row.isSystem, t, isLight),
        exportValue: (row) => (row.isSystem ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })),
        className: 'min-w-[168px]',
      },
      {
        key: 'actions',
        label: t('actions', { ns: 'common' }),
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              className={`rounded-lg border transition ${isLight ? 'p-1.5 border-indigo-200/80 bg-white/70 text-indigo-700 hover:bg-indigo-50' : 'p-1 border-cyan-300/30 bg-[#1a132b]/70 text-cyan-200 hover:border-red-300/50 hover:bg-red-500/10 hover:text-white'}`}
              onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
              title={t('comingSoon', { ns: 'common' })}
            >
              <Eye className={isLight ? 'size-3.5' : 'size-3'} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`rounded-lg border transition ${isLight ? 'p-1.5 border-violet-200/80 bg-white/70 text-violet-700 hover:bg-violet-50' : 'p-1 border-cyan-300/30 bg-[#1a132b]/70 text-cyan-200 hover:border-red-300/50 hover:bg-red-500/10 hover:text-white'}`}
              onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
              title={t('edit', { ns: 'common' })}
            >
              <Pencil className={isLight ? 'size-3.5' : 'size-3'} />
            </Button>
            {!row.isSystem && (
              <Button
                type="button"
                variant="ghost"
                className={`rounded-lg border transition ${isLight ? 'p-1.5 border-rose-200/80 bg-white/70 text-rose-700 hover:bg-rose-50' : 'p-1 border-fuchsia-300/30 bg-[#23163a]/70 text-fuchsia-200 hover:border-red-300/50 hover:bg-red-500/10 hover:text-white'}`}
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
                <Trash2 className={isLight ? 'size-3.5' : 'size-3'} />
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
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t('totalPermissionGroupLabel', { ns: 'access-control' })}
          value={String(summaryGroupCount)}
          description={t('totalPermissionGroupDescription', { ns: 'access-control' })}
          accentClassName={isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}
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
          accentClassName={isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}
          isLight={isLight}
        />
        <SummaryCard
          title={t('systemCriticalRolesLabel', { ns: 'access-control' })}
          value={String(systemCriticalRoleCount)}
          description={t('systemCriticalRolesDescription', { ns: 'access-control' })}
          accentClassName={isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}
          isLight={isLight}
        />
      </div>

      <AppDataGrid
        pageKey="permission-groups-grid"
        tableSurface="glass"
        surfaceTone="airy"
        controlChrome="connection-glass"
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
        headerAction={
          <Button className={isLight ? undefined : 'create-action-button'} onClick={() => setIsCreatePanelOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newPermissionGroup', { ns: 'access-control' })}
          </Button>
        }
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