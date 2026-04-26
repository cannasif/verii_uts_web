import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, CheckCircle2, ChevronsUpDown, FilterX, PieChart, Pencil, SearchX, TrendingDown, TrendingUp, Trash2, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppDataGrid, type DataGridColumn } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { FilterRow } from '@/lib/advanced-filter';
import { rowsToBackendFilters } from '@/lib/advanced-filter';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersQuery } from '@/features/users/hooks/use-users-query';
import { CreateUserPanel } from '@/features/users/components/create-user-panel';
import { deleteUser } from '@/features/users/api/users-api';
import type { UserListItem } from '@/features/users/api/users-api';
import { useUiStore } from '@/stores/ui-store';

export function UsersPage() {
  const { t } = useTranslation(['user-management', 'common']);
  const user = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAtUtc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedFilterRows, setAppliedFilterRows] = useState<FilterRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
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

  useEffect(() => {
    setSelectedRowIds([]);
  }, [pageNumber, pageSize, search, sortBy, sortDirection, appliedFilterRows]);

  const queryClient = useQueryClient();

  const usersQuery = useUsersQuery({
    pageNumber,
    pageSize,
    search,
    sortBy,
    sortDirection,
    filters: rowsToBackendFilters(appliedFilterRows),
    filterLogic: 'and',
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success(t('deleteSuccess', { ns: 'user-management' }));
      setSelectedRowIds([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) {
      return;
    }

    if (!window.confirm(t('bulkDeleteConfirm', { ns: 'user-management', count: selectedRowIds.length }))) {
      return;
    }

    try {
      await Promise.all(selectedRowIds.map((id) => deleteUser(Number(id))));
      toast.success(t('bulkDeleteSuccess', { ns: 'user-management', count: selectedRowIds.length }));
      setSelectedRowIds([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const columns = useMemo<DataGridColumn<UserListItem>[]>(() => [
    {
      key: 'fullName',
      label: t('fullName', { ns: 'common' }),
      sortable: true,
      render: (row) => {
        const initials = `${row.firstName?.[0] ?? ''}${row.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
        return (
          <div className="flex items-center gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-white ${isLight ? 'border-fuchsia-300/60 bg-linear-to-br from-fuchsia-500 via-pink-500 to-orange-500 shadow-[0_8px_18px_rgba(233,93,132,0.24)]' : 'border-fuchsia-300/45 bg-linear-to-br from-fuchsia-500 via-pink-500 to-orange-500 shadow-[0_0_14px_rgba(233,93,132,0.35)]'}`}>
              {initials}
            </div>
            <span className={`font-medium ${isLight ? 'text-[#1E293B]' : 'text-slate-100'}`}>{row.firstName} {row.lastName}</span>
          </div>
        );
      },
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
      render: (row) => (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLight ? 'border border-fuchsia-300/40 bg-fuchsia-50 text-fuchsia-700' : 'border border-transparent bg-linear-to-br from-fuchsia-500 via-pink-500 to-orange-500 text-white shadow-[0_0_18px_rgba(233,93,132,0.25)]'}`}>
          {row.roleName}
        </span>
      ),
    },
    {
      key: 'createdAtUtc',
      label: t('createdAt', { ns: 'common' }),
      sortable: true,
      render: (row) => formatDate(row.createdAtUtc),
      exportValue: (row) => formatDate(row.createdAtUtc),
    },
    {
      key: 'actions',
      label: t('actions', { ns: 'common' }),
      className: 'w-[96px] text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            className={`rounded-lg border p-1.5 transition ${isLight ? 'border-indigo-200/70 bg-white/70 text-indigo-700 hover:bg-indigo-50' : 'border-cyan-300/30 bg-[#1a132b]/70 text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100'}`}
            title={t('edit', { ns: 'common' })}
            onClick={() => toast.info(`${row.firstName} ${row.lastName} - ${t('comingSoon', { ns: 'common' })}`)}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            className={`rounded-lg border p-1.5 transition ${isLight ? 'border-rose-200/80 bg-white/70 text-rose-700 hover:bg-rose-50' : 'border-rose-300/35 bg-[#2a1222]/70 text-rose-200 hover:border-rose-300/65 hover:text-rose-100'}`}
            title={t('delete', { ns: 'common' })}
            onClick={() => {
              if (!window.confirm(t('deleteUserConfirm', { ns: 'user-management', name: `${row.firstName} ${row.lastName}` }))) {
                return;
              }
              deleteMutation.mutate(row.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
      exportValue: () => '',
    },
  ], [isLight, t]);

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (usersQuery.data?.data ?? []).map((userItem) => ({
      fullName: `${userItem.firstName} ${userItem.lastName}`,
      email: userItem.email,
      roleName: userItem.roleName,
      createdAtUtc: formatDate(userItem.createdAtUtc),
    }));
  }, [usersQuery.data?.data]);

  const visibleRows = usersQuery.data?.data ?? [];
  const totalUsers = usersQuery.data?.pagination.totalCount ?? 0;
  const activeUsersOnPage = visibleRows.length;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const newUsersInLast7Days = useMemo(
    () => visibleRows.filter((item) => new Date(item.createdAtUtc).getTime() >= sevenDaysAgo).length,
    [visibleRows, sevenDaysAgo],
  );

  const previous7DaysCount = useMemo(
    () =>
      visibleRows.filter((item) => {
        const created = new Date(item.createdAtUtc).getTime();
        return created < sevenDaysAgo && created >= fourteenDaysAgo;
      }).length,
    [visibleRows, fourteenDaysAgo, sevenDaysAgo],
  );

  const trendDelta = newUsersInLast7Days - previous7DaysCount;

  const roleStats = useMemo(() => {
    const counts = new Map<string, number>();
    visibleRows.forEach((item) => {
      counts.set(item.roleName, (counts.get(item.roleName) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([roleName, count]) => ({ roleName, count }))
      .sort((a, b) => b.count - a.count);
  }, [visibleRows]);

  const rolePieGradient = useMemo(() => {
    if (roleStats.length === 0) return 'conic-gradient(#334155 0deg 360deg)';
    const palette = ['#22d3ee', '#a855f7', '#f97316', '#10b981', '#f43f5e'];
    let start = 0;
    const segments = roleStats.map((entry, index) => {
      const sweep = (entry.count / Math.max(activeUsersOnPage, 1)) * 360;
      const end = start + sweep;
      const segment = `${palette[index % palette.length]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
      start = end;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [roleStats, activeUsersOnPage]);

  const filterColumnLabels = useMemo(
    () =>
      new Map([
        ['firstName', t('firstName', { ns: 'common' })],
        ['lastName', t('lastName', { ns: 'common' })],
        ['email', t('email', { ns: 'common' })],
        ['roleName', t('role', { ns: 'common' })],
      ]),
    [t],
  );

  const appliedFilterChips = useMemo(() => {
    return appliedFilterRows
      .map((row) => ({
        ...row,
        label: filterColumnLabels.get(row.column) ?? row.column,
      }))
      .filter((row) => row.value.trim().length > 0);
  }, [appliedFilterRows, filterColumnLabels]);

  const selectedCount = selectedRowIds.length;

  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCount > 0 ? (
        <>
          <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium ${isLight ? 'border-emerald-300/55 bg-emerald-50 text-emerald-700' : 'border-emerald-300/35 bg-[#1a132b]/80 text-emerald-200'}`}>
            <CheckCircle2 className="size-4" />
            {selectedCount} {t('selectedCount', { ns: 'user-management' })}
          </div>
          <Button
            type="button"
            variant="secondary"
            className={isLight ? 'border-rose-300/55 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-rose-300/35 bg-[#2a1222]/80 text-rose-200 hover:bg-[#361426]'}
            onClick={handleBulkDelete}
            disabled={selectedCount === 0}
          >
            <Trash2 className="mr-2 size-4" />
            {t('bulkDelete', { ns: 'user-management' })}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={isLight ? 'border-cyan-300/55 bg-cyan-50 text-cyan-700 hover:bg-cyan-100' : 'border-cyan-300/35 bg-[#132131]/80 text-cyan-200 hover:bg-[#16253a]'}
            onClick={() => toast.info(t('bulkRoleChangeSoon', { ns: 'user-management' }))}
          >
            <ChevronsUpDown className="mr-2 size-4" />
            {t('bulkChangeRole', { ns: 'user-management' })}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setSelectedRowIds([])}>
            {t('clearSelection', { ns: 'user-management' })}
          </Button>
        </>
      ) : null}
      <Button className={isLight ? 'light-gradient-accent' : 'create-action-button'} onClick={() => setIsPanelOpen(true)}>
        <UserPlus className="mr-2 size-4" />
        {t('newUser', { ns: 'common' })}
      </Button>
    </div>
  );

  const subheaderContent = appliedFilterChips.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2 pb-1 pt-1">
      <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        {t('activeFilters', { ns: 'user-management' })}
      </span>
      {appliedFilterChips.map((filterRow) => (
        <span
          key={filterRow.id}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isLight ? 'border-cyan-300/50 bg-cyan-50 text-cyan-700' : 'border-cyan-300/25 bg-[#132131]/80 text-cyan-200'}`}
        >
          <span className="font-semibold">{filterRow.label}:</span>
          <span>{filterRow.value}</span>
          <button
            type="button"
            className={`rounded-full p-0.5 transition ${isLight ? 'hover:bg-cyan-100' : 'hover:bg-white/10'}`}
            onClick={() => {
              const nextApplied = appliedFilterRows.filter((item) => item.id !== filterRow.id);
              setAppliedFilterRows(nextApplied);
              setDraftFilterRows(nextApplied);
              setPageNumber(1);
            }}
            aria-label={`${filterRow.label} filter remove`}
          >
            <FilterX className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  ) : null;

  const emptyStateContent = (
    <div className={`mx-auto flex max-w-xl flex-col items-center justify-center rounded-[1.75rem] border px-6 py-10 text-center ${isLight ? 'border-cyan-200/70 bg-white/70 shadow-[0_18px_50px_rgba(56,189,248,0.08)]' : 'border-white/10 bg-[#120b1f]/80 shadow-[0_18px_50px_rgba(2,4,14,0.45)]'}`}>
      <div className={`mb-4 grid size-16 place-items-center rounded-full border ${isLight ? 'border-cyan-200/70 bg-cyan-50 text-cyan-600' : 'border-cyan-300/20 bg-cyan-500/10 text-cyan-200'}`}>
        <SearchX className="size-7" />
      </div>
      <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{t('usersEmptyTitle', { ns: 'user-management' })}</h3>
      <p className={`mt-2 max-w-md text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
        {t('usersEmptyDescription', { ns: 'user-management' })}
      </p>
      <Button className={isLight ? 'mt-5 light-gradient-accent' : 'mt-5 create-action-button'} onClick={() => setIsPanelOpen(true)}>
        <UserPlus className="mr-2 size-4" />
        {t('addNewUser', { ns: 'user-management' })}
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('title', { ns: 'user-management' })}
        description={t('description', { ns: 'user-management' })}
        descriptionClassName={isLight ? undefined : '!bg-none !text-white'}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className={`p-3.5 ${isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.12em] ${isLight ? 'text-[#64748B]' : 'text-[11px] text-white/65'}`}>{t('statsTotalUsers', { ns: 'user-management' })}</p>
              <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-[1.35rem] text-white/95'}`}>{totalUsers}</p>
            </div>
            <Users className={`size-5 [stroke-width:1.5] ${isLight ? 'text-indigo-700' : 'text-cyan-300'}`} />
          </div>
        </Card>

        <Card className={`p-3.5 ${isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.12em] ${isLight ? 'text-[#64748B]' : 'text-[11px] text-white/65'}`}>{t('statsActiveUsers', { ns: 'user-management' })}</p>
              <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-emerald-700' : 'text-[1.35rem] text-white/95'}`}>{activeUsersOnPage}</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-400">
              <span className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
              <Activity className="size-4 [stroke-width:1.5]" />
            </span>
          </div>
        </Card>

        <Card className={`p-3.5 ${isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.12em] ${isLight ? 'text-[#64748B]' : 'text-[11px] text-white/65'}`}>{t('statsNewUsers7Days', { ns: 'user-management' })}</p>
              <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-[1.35rem] text-white/95'}`}>{newUsersInLast7Days}</p>
              <p className={`mt-1 inline-flex items-center gap-1 text-xs ${trendDelta >= 0 ? isLight ? 'text-emerald-700' : 'text-emerald-300' : isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                {trendDelta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {trendDelta >= 0 ? '+' : ''}{trendDelta}
              </p>
            </div>
            {trendDelta >= 0 ? (
              <TrendingUp className={`size-5 [stroke-width:1.5] ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`} />
            ) : (
              <TrendingDown className={`size-5 [stroke-width:1.5] ${isLight ? 'text-rose-600' : 'text-rose-300'}`} />
            )}
          </div>
        </Card>

        <Card className={`p-3.5 ${isLight ? 'border border-slate-200/30 bg-white/80 shadow-none transition hover:bg-red-50' : 'management-stat-card'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs uppercase tracking-[0.12em] ${isLight ? 'text-[#64748B]' : 'text-[11px] text-fuchsia-200/72'}`}>{t('statsRoleDistribution', { ns: 'user-management' })}</p>
            </div>
            <div className="relative grid place-items-center">
              <div
                className="size-14 rounded-full border border-white/15"
                style={{ background: rolePieGradient }}
                aria-label="role-distribution-chart"
              />
              <div className={`absolute size-6 rounded-full ${isLight ? 'bg-white/95' : 'bg-[#120b1f]/90'}`} />
            </div>
            <PieChart className={`size-5 [stroke-width:1.5] ${isLight ? 'text-indigo-700' : 'text-fuchsia-300'}`} />
          </div>
        </Card>
      </div>

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
        selectableRows
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={setSelectedRowIds}
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
        compactFooterControls
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
        headerAction={headerAction}
        subheaderContent={subheaderContent}
        emptyStateContent={emptyStateContent}
      />

      <CreateUserPanel onClose={() => setIsPanelOpen(false)} open={isPanelOpen} />
    </div>
  );
}
