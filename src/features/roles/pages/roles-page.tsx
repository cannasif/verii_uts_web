import { useEffect, useMemo, useState } from 'react';
import { Crown, KeyRound, Pencil, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import type { Role } from '@/features/roles/api/roles-api';
import { searchRoles } from '@/features/roles/api/roles-api';
import type { UserListItem } from '@/features/users/api/users-api';
import { searchUsers } from '@/features/users/api/users-api';

function getRoleBadgeMeta(roleName: string, isLight: boolean) {
  const normalized = roleName.trim().toLowerCase();

  if (normalized === 'admin') {
    return {
      Icon: Crown,
      badgeClassName: isLight
        ? 'border-fuchsia-300/60 bg-fuchsia-100/80 text-fuchsia-700 shadow-[0_0_18px_rgba(219,39,119,0.18)]'
        : 'border-white/16 bg-white/8 text-fuchsia-200 shadow-[0_8px_22px_rgba(2,4,14,0.24)]',
      iconClassName: isLight ? 'text-fuchsia-600' : 'text-fuchsia-200',
    };
  }

  if (normalized === 'user') {
    return {
      Icon: UserRound,
      badgeClassName: isLight
        ? 'border-violet-300/60 bg-violet-100/90 text-violet-800 shadow-[0_0_14px_rgba(139,92,246,0.14)]'
        : 'border-white/16 bg-white/6 text-sky-200 shadow-[0_8px_22px_rgba(2,4,14,0.22)]',
      iconClassName: isLight ? 'text-violet-600' : 'text-sky-200',
    };
  }

  if (normalized.includes('editor') || normalized.includes('manager')) {
    return {
      Icon: ShieldCheck,
      badgeClassName: isLight
        ? 'border-fuchsia-300/55 bg-fuchsia-100/75 text-fuchsia-700 shadow-[0_0_14px_rgba(236,72,153,0.12)]'
        : 'border-white/16 bg-white/7 text-indigo-200 shadow-[0_8px_22px_rgba(2,4,14,0.22)]',
      iconClassName: isLight ? 'text-fuchsia-600' : 'text-indigo-200',
    };
  }

  return {
    Icon: KeyRound,
    badgeClassName: isLight
      ? 'border-slate-300/60 bg-slate-100/80 text-slate-700 shadow-[0_0_12px_rgba(148,163,184,0.12)]'
      : 'border-white/16 bg-white/6 text-slate-200 shadow-[0_8px_20px_rgba(2,4,14,0.2)]',
    iconClassName: isLight ? 'text-slate-600' : 'text-slate-200',
  };
}

function getAvatarPalette(index: number, isLight: boolean) {
  if (!isLight) {
    const darkPalettes = [
      'border-white/16 bg-white/10 text-fuchsia-200',
      'border-white/16 bg-white/8 text-sky-200',
      'border-white/16 bg-white/8 text-emerald-200',
      'border-white/16 bg-white/9 text-indigo-200',
    ];

    return darkPalettes[index % darkPalettes.length];
  }

  const palettes = [
    'border-fuchsia-300/60 bg-fuchsia-100 text-fuchsia-700',
    'border-indigo-300/60 bg-indigo-100 text-indigo-800',
    'border-cyan-300/60 bg-cyan-100 text-cyan-800',
    'border-violet-300/60 bg-violet-100 text-violet-800',
  ];

  return palettes[index % palettes.length];
}

function getRolePermissionKeys(roleName: string): Array<'read' | 'write' | 'delete'> {
  const normalized = roleName.trim().toLowerCase();

  if (normalized === 'admin') return ['read', 'write', 'delete'];
  if (normalized === 'user') return ['read'];
  if (normalized.includes('editor')) return ['read', 'write'];
  if (normalized.includes('manager')) return ['read', 'write', 'delete'];

  return ['read'];
}

function getPermissionChipClass(permission: 'read' | 'write' | 'delete', isLight: boolean) {
  if (isLight) {
    if (permission === 'delete') return 'border-rose-300/60 bg-rose-100 text-rose-700';
    if (permission === 'write') return 'border-sky-300/60 bg-sky-100 text-sky-800';
    return 'border-emerald-300/60 bg-emerald-100 text-emerald-700';
  }

  if (permission === 'delete') return 'border-white/16 bg-rose-500/16 text-rose-200';
  if (permission === 'write') return 'border-white/16 bg-amber-500/14 text-amber-200';
  return 'border-white/16 bg-emerald-500/14 text-emerald-200';
}

export function RolesPage() {
  const { t } = useTranslation(['role-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const defaultColumnOrder = ['name', 'memberCount', 'description', 'actions'];
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const querySortBy = sortBy === 'memberCount' ? 'name' : sortBy;

  useEffect(() => {
    const preferences = loadColumnPreferences('roles-grid', user?.id, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys);
    setColumnOrder(preferences.order);
  }, [user?.id]);

  useEffect(() => {
    saveColumnPreferences('roles-grid', user?.id, { visibleKeys: visibleColumnKeys, order: columnOrder });
  }, [columnOrder, user?.id, visibleColumnKeys]);

  useEffect(() => {
    if (!columnOrder.includes('memberCount') || !columnOrder.includes('actions')) {
      setColumnOrder((current) => {
        const next = [...current];
        const descriptionIndex = next.indexOf('description');
        if (descriptionIndex >= 0) {
          next.splice(descriptionIndex, 0, 'memberCount');
          next.splice(descriptionIndex + 1, 0, 'actions');
        } else {
          next.push('memberCount');
          next.push('actions');
        }
        return next;
      });
    }

    if (!visibleColumnKeys.includes('memberCount') || !visibleColumnKeys.includes('actions')) {
      setVisibleColumnKeys((current) => {
        const next = [...current];
        if (!next.includes('memberCount')) next.push('memberCount');
        if (!next.includes('actions')) next.push('actions');
        return next;
      });
    }
  }, [columnOrder, visibleColumnKeys]);

  const rolesQuery = useQuery({
    queryKey: ['roles', pageNumber, pageSize, search, querySortBy, sortDirection, appliedFilterRows],
    queryFn: () =>
      searchRoles({
        pageNumber,
        pageSize,
        search,
        sortBy: querySortBy,
        sortDirection,
        filters: rowsToBackendFilters(appliedFilterRows),
        filterLogic: 'and',
      }),
  });

  const usersForRoleCountsQuery = useQuery({
    queryKey: ['roles-user-counts'],
    queryFn: () =>
      searchUsers({
        pageNumber: 1,
        pageSize: 5000,
        search: '',
        sortBy: 'createdAtUtc',
        sortDirection: 'desc',
        filters: [],
        filterLogic: 'and',
      }),
  });

  const roleMemberMap = useMemo(() => {
    const map = new Map<string, UserListItem[]>();
    (usersForRoleCountsQuery.data?.data ?? []).forEach((item) => {
      const key = item.roleName.trim().toLowerCase();
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, item]);
    });
    return map;
  }, [usersForRoleCountsQuery.data?.data]);

  const rolesWithMemberCount = useMemo(() => {
    return (rolesQuery.data?.data ?? []).map((role) => ({
      ...role,
      memberCount: roleMemberMap.get(role.name.trim().toLowerCase())?.length ?? 0,
    }));
  }, [roleMemberMap, rolesQuery.data?.data]);

  const columns = useMemo<DataGridColumn<Role & { memberCount: number }>[]>(() => [
    {
      key: 'name',
      label: t('role', { ns: 'common' }),
      sortable: true,
      render: (row) => {
        const { Icon, badgeClassName, iconClassName } = getRoleBadgeMeta(row.name, isLight);

        return (
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${badgeClassName}`}>
              <Icon className={`size-5 ${iconClassName}`} />
            </div>
            <div className="min-w-0">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold tracking-[0.02em] ${badgeClassName}`}>
                {row.name}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'memberCount',
      label: t('memberCount', { ns: 'role-management' }),
      sortable: true,
      render: (row) => {
        const members = roleMemberMap.get(row.name.trim().toLowerCase()) ?? [];
        const previewMembers = members.slice(0, 4);
        const extraCount = Math.max(members.length - previewMembers.length, 0);

        return (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {previewMembers.length > 0 ? (
                previewMembers.map((member, index) => {
                  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
                  return (
                    <div
                      key={`${row.id}-${member.id}`}
                      className={`grid place-items-center rounded-full border font-bold shadow-[0_0_12px_rgba(15,23,42,0.12)] ${isLight ? 'size-8 text-[10px]' : 'size-7 text-[9px]'} ${getAvatarPalette(index, isLight)}`}
                      title={`${member.firstName} ${member.lastName}`}
                    >
                      {initials}
                    </div>
                  );
                })
              ) : (
                <div className={`grid place-items-center rounded-full border border-slate-300/60 bg-slate-100 font-bold text-slate-500 ${isLight ? 'size-8 text-[10px]' : 'size-7 text-[9px]'}`}>
                  0
                </div>
              )}
            </div>
            <span className={`rounded-full border font-semibold ${isLight ? 'px-3 py-1 text-sm border-slate-200/80 bg-white/72 text-[#1E293B]' : 'px-2.5 py-0.5 text-xs border-white/12 bg-[#1a132b]/80 text-slate-100'}`}>
              {members.length}
              {extraCount > 0 ? <span className={`ml-1 ${isLight ? 'text-[#64748B]' : 'text-slate-400'}`}>+{extraCount}</span> : null}
            </span>
          </div>
        );
      },
      exportValue: (row) => row.memberCount,
    },
    {
      key: 'description',
      label: t('descriptionColumn', { ns: 'role-management' }),
      sortable: true,
      render: (row) => {
        const permissionKeys = getRolePermissionKeys(row.name);

        return (
          <div className="space-y-2">
            <p className={`max-w-2xl ${isLight ? 'text-[#64748B]' : 'text-xs text-slate-200'}`}>{row.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              {permissionKeys.map((permission) => (
                <span
                  key={`${row.id}-${permission}`}
                  className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.14em] ${isLight ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'} ${getPermissionChipClass(permission, isLight)}`}
                >
                  {t(permission, { ns: 'common' })}
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: t('actions', { ns: 'common' }),
      className: isLight ? 'w-[112px] text-right' : 'w-[96px] text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className={`rounded-lg border transition ${isLight ? 'p-1.5 border-indigo-200/80 bg-white/70 text-indigo-700 hover:bg-indigo-50' : 'p-1 border-cyan-300/30 bg-[#1a132b]/70 text-cyan-200 hover:border-red-300/50 hover:bg-red-500/10 hover:text-white'}`}
            title={t('edit', { ns: 'common' })}
            onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
          >
            <Pencil className={isLight ? 'size-3.5' : 'size-3'} />
          </button>
          <button
            type="button"
            className={`rounded-lg border transition ${isLight ? 'p-1.5 border-violet-200/80 bg-white/70 text-violet-700 hover:bg-violet-50' : 'p-1 border-fuchsia-300/30 bg-[#23163a]/70 text-fuchsia-200 hover:border-red-300/50 hover:bg-red-500/10 hover:text-white'}`}
            title={t('managePermissions', { ns: 'role-management' })}
            onClick={() => toast.info(`${row.name} - ${t('comingSoon', { ns: 'common' })}`)}
          >
            <ShieldCheck className={isLight ? 'size-3.5' : 'size-3'} />
          </button>
        </div>
      ),
    },
  ], [isLight, roleMemberMap, t]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('title', { ns: 'role-management' })}
        description={t('description', { ns: 'role-management' })}
      />
      <AppDataGrid
        pageKey="roles-grid"
        tableSurface="glass"
        surfaceTone="airy"
        rowDensity="compact"
        controlChrome="connection-glass"
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
        rows={rolesWithMemberCount}
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
        compactFooterControls
        exportFileName="roles"
        exportRows={rolesWithMemberCount.map((role) => ({ name: role.name, memberCount: role.memberCount, description: role.description }))}
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
        headerAction={
          <Button
            type="button"
            onClick={() => toast.info(t('createRoleSoon', { ns: 'role-management' }))}
            className={isLight ? 'light-gradient-accent' : 'create-action-button'}
          >
            <Plus className="mr-2 size-4" />
            {t('createRole', { ns: 'role-management' })}
          </Button>
        }
      />
    </div>
  );
}
