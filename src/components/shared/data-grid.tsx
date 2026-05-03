import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileType,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter';
import { createFilterRow, getDefaultOperatorForColumn, getOperatorsForColumn } from '@/lib/advanced-filter';
import { exportGridToExcel, exportGridToPdf, type GridExportColumn } from '@/lib/grid-export';

export type DataGridSortDirection = 'asc' | 'desc';

export interface DataGridColumn<TRow> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: TRow) => ReactNode;
  exportValue?: (row: TRow) => unknown;
  className?: string;
}

interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type AppDataGridTableSurface = 'default' | 'glass';

/** Dark + glass: `airy` ana paneldeki gibi daha şeffaf, ince kenarlı kabuk. */
export type AppDataGridSurfaceTone = 'default' | 'airy';

export type AppDataGridRowDensity = 'default' | 'compact';

/** Üst araç çubuğu + alt sayfalama: dashboard İlk Bağlantılar kartlarıyla aynı cam şerit (yalnızca istenen sayfada). */
export type AppDataGridControlChrome = 'default' | 'connection-glass';

interface AppDataGridProps<TRow> {
  pageKey: string;
  userId?: number;
  title?: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchPlaceholder: string;
  columns: DataGridColumn<TRow>[];
  visibleColumnKeys: string[];
  columnOrder: string[];
  onVisibleColumnKeysChange: (keys: string[]) => void;
  onColumnOrderChange: (keys: string[]) => void;
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  sortBy?: string;
  sortDirection?: DataGridSortDirection;
  onSort?: (columnKey: string) => void;
  selectableRows?: boolean;
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  emptyText?: string;
  pagination?: PaginationState;
  onPageNumberChange?: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  hidePagination?: boolean;
  exportFileName: string;
  exportColumns?: GridExportColumn[];
  exportRows?: Record<string, unknown>[];
  filterColumns?: readonly FilterColumnConfig[];
  defaultFilterColumn?: string;
  draftFilterRows?: FilterRow[];
  onDraftFilterRowsChange?: (rows: FilterRow[]) => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  appliedFilterCount?: number;
  headerAction?: ReactNode;
  subheaderContent?: ReactNode;
  emptyStateContent?: ReactNode;
  compactFooterControls?: boolean;
  /** Premium glass-style table shell (dark purple panel, bordered rows, magenta hover accent). Use sparingly per page. */
  tableSurface?: AppDataGridTableSurface;
  /** Koyu temada cam yüzeyi hafifletir (dashboard ile uyumlu). */
  surfaceTone?: AppDataGridSurfaceTone;
  /** Satır yüksekliği (ör. Roller sayfası). */
  rowDensity?: AppDataGridRowDensity;
  controlChrome?: AppDataGridControlChrome;
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return ref;
}

export function AppDataGrid<TRow>({
  pageKey: _pageKey,
  userId: _userId,
  title,
  searchValue,
  onSearchValueChange,
  searchPlaceholder,
  columns,
  visibleColumnKeys,
  columnOrder,
  onVisibleColumnKeysChange,
  onColumnOrderChange,
  rows,
  rowKey,
  sortBy,
  sortDirection,
  onSort,
  selectableRows = false,
  selectedRowIds,
  onSelectedRowIdsChange,
  isLoading = false,
  isError = false,
  errorText,
  emptyText,
  pagination,
  onPageNumberChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  hidePagination = false,
  exportFileName,
  exportColumns,
  exportRows,
  filterColumns = [],
  defaultFilterColumn,
  draftFilterRows = [],
  onDraftFilterRowsChange,
  onApplyFilters,
  onClearFilters,
  appliedFilterCount = 0,
  headerAction,
  subheaderContent,
  emptyStateContent,
  compactFooterControls = false,
  tableSurface = 'default',
  surfaceTone = 'default',
  rowDensity = 'default',
  controlChrome = 'default',
}: AppDataGridProps<TRow>) {
  const { t } = useTranslation('common');
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const glassSurface = tableSurface === 'glass';
  const glassDark = glassSurface && !isLight;
  const glassLight = glassSurface && isLight;
  const airyDark = glassSurface && !isLight && surfaceTone === 'airy';
  const compactRows = rowDensity === 'compact';
  const connectionGlassChrome = controlChrome === 'connection-glass';
  /** Filtre / Sütun / Dışa aktar */
  const toolbarSecondaryBtn = 'h-7 min-h-7 rounded-md px-2.5 text-[11px] font-medium leading-none gap-1';
  /** headerAction: Yeni kullanıcı vb. birincil — araç çubuğundan belirgin, tam varsayılandan hafif küçük */
  const headerPrimaryCompactClass =
    '[&_button.cyber-btn-primary]:!h-9 [&_button.cyber-btn-primary]:!min-h-9 [&_button.cyber-btn-primary]:!rounded-xl [&_button.cyber-btn-primary]:!px-3.5 [&_button.cyber-btn-primary]:!py-0 [&_button.cyber-btn-primary]:!text-[13px] [&_button.cyber-btn-primary]:!font-semibold [&_button.cyber-btn-primary]:!leading-tight [&_button.cyber-btn-primary]:[&_svg]:!size-4 [&_button.create-action-button]:!h-9 [&_button.create-action-button]:!min-h-9 [&_button.create-action-button]:!rounded-xl [&_button.create-action-button]:!px-3.5 [&_button.create-action-button]:!py-0 [&_button.create-action-button]:!text-[13px] [&_button.create-action-button]:!font-semibold [&_button.create-action-button]:!leading-tight [&_button.create-action-button]:[&_svg]:!size-4 [&_button.light-gradient-accent]:!h-9 [&_button.light-gradient-accent]:!min-h-9 [&_button.light-gradient-accent]:!rounded-xl [&_button.light-gradient-accent]:!px-3.5 [&_button.light-gradient-accent]:!py-0 [&_button.light-gradient-accent]:!text-[13px] [&_button.light-gradient-accent]:!font-semibold [&_button.light-gradient-accent]:!leading-tight [&_button.light-gradient-accent]:[&_svg]:!size-4';
  const glassToolbarSecondaryClass = cn(
    glassDark &&
      !airyDark &&
      !connectionGlassChrome &&
      '!border-[#2d2438]/80 !bg-[#120c1b]/72 !text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_4px_16px_rgba(0,0,0,0.22)] hover:!border-pink-500/38 hover:!bg-[#221a34]/92 hover:!text-white',
    airyDark &&
      !connectionGlassChrome &&
      '!border-white/12 !bg-[rgba(18,16,26,0.52)] !text-slate-200 shadow-none hover:!border-pink-400/28 hover:!bg-[rgba(26,22,38,0.62)] hover:!text-white',
    connectionGlassChrome &&
      glassDark &&
      '!border-white/[0.08] !bg-[rgba(10,8,16,0.5)] !text-slate-200 !shadow-[0_2px_12px_rgba(0,0,0,0.14)] backdrop-blur-md hover:!border-pink-400/25 hover:!bg-[rgba(22,18,34,0.58)] hover:!text-white',
    glassLight &&
      '!border-purple-200/72 !bg-white/96 !text-slate-800 shadow-[0_2px_12px_rgba(88,28,135,0.06)] hover:!border-fuchsia-400/48 hover:!bg-fuchsia-50/70',
  );
  const glassFilterActiveToolbarClass = cn(
    glassDark &&
      !airyDark &&
      '!border-pink-500/48 !bg-[#2a1428]/58 !text-pink-100 hover:!border-pink-400/55 hover:!bg-[#321828]/75',
    airyDark && '!border-pink-400/30 !bg-pink-500/10 !text-pink-100 hover:!border-pink-400/40 hover:!bg-pink-500/14',
    glassLight && '!border-fuchsia-400/58 !bg-fuchsia-50 !text-fuchsia-900 hover:!bg-fuchsia-100/90',
  );
  const footerCondensed = compactFooterControls;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);

  const filtersRef = useOutsideClose<HTMLDivElement>(() => setFiltersOpen(false));
  const columnsRef = useOutsideClose<HTMLDivElement>(() => setColumnsOpen(false));
  const exportRef = useOutsideClose<HTMLDivElement>(() => setExportOpen(false));

  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((key) => columns.find((column) => column.key === key))
      .filter((column): column is DataGridColumn<TRow> => Boolean(column));
  }, [columnOrder, columns]);

  const visibleColumns = useMemo(() => {
    return orderedColumns.filter((column) => visibleColumnKeys.includes(column.key));
  }, [orderedColumns, visibleColumnKeys]);

  const resolvedExportColumns = exportColumns ?? visibleColumns.map((column) => ({ key: column.key, label: column.label }));
  const resolvedExportRows =
    exportRows ??
    rows.map((row) => {
      const record: Record<string, unknown> = {};
      columns.forEach((column) => {
        record[column.key] = column.exportValue ? column.exportValue(row) : column.render ? undefined : (row as Record<string, unknown>)[column.key];
      });
      return record;
    });

  const toggleColumn = (key: string) => {
    if (visibleColumnKeys.includes(key)) {
      onVisibleColumnKeysChange(visibleColumnKeys.filter((item) => item !== key));
      return;
    }

    const nextVisible = [...visibleColumnKeys, key].sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b));
    onVisibleColumnKeysChange(nextVisible);
  };

  const moveColumn = (key: string, direction: 'up' | 'down') => {
    const currentIndex = columnOrder.indexOf(key);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;
    const nextOrder = [...columnOrder];
    [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
    onColumnOrderChange(nextOrder);
  };

  const swapColumns = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;

    const sourceIndex = columnOrder.indexOf(sourceKey);
    const targetIndex = columnOrder.indexOf(targetKey);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextOrder = [...columnOrder];
    [nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]];
    onColumnOrderChange(nextOrder);
  };

  const operatorLabelMap: Record<string, string> = {
    contains: t('operatorContains'),
    startsWith: t('operatorStartsWith'),
    endsWith: t('operatorEndsWith'),
    eq: t('operatorEquals'),
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
  };

  return (
    <Card
      className={cn(
        isLight
          ? cn(
              'cyber-grid overflow-visible border backdrop-blur-2xl',
              'border-slate-200/70 bg-white/85 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-4',
              glassLight && 'border-purple-200/55 shadow-[0_18px_42px_rgba(88,28,135,0.09)]',
            )
          : airyDark && connectionGlassChrome
            ? /* Ana panel “İlk Bağlantılar” dış çerçevesi ile aynı cam kabuk (dashboard-section-panel) */
              cn('cyber-grid overflow-visible dashboard-section-panel p-4 sm:p-5 lg:p-6')
            : cn(
                'cyber-grid overflow-visible border backdrop-blur-2xl',
                'border-transparent bg-[#120b1f]/50 p-2.5 shadow-[0_14px_34px_rgba(2,4,14,0.26)] sm:p-3',
                glassDark &&
                  !airyDark &&
                  'border-[#2d2438]/65 bg-[#1b1424]/92 p-3 shadow-[0_28px_64px_rgba(8,4,18,0.52),inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-4',
                airyDark &&
                  'border border-white/[0.07] bg-[rgba(14,12,22,0.38)] p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-3.5',
              ),
      )}
    >
      <div
        className={cn(
          'flex flex-col',
          isLight ? 'gap-4' : 'gap-3',
          airyDark && 'gap-2.5',
          connectionGlassChrome && 'gap-2.5',
        )}
      >
        <div
          className={cn(
            'relative z-30 flex flex-col xl:flex-row xl:items-center xl:justify-between',
            isLight ? 'gap-4' : 'gap-3',
            airyDark && 'gap-2.5',
            connectionGlassChrome &&
              cn(
                /* overflow-visible: filtre / sütun / export panelleri şerit dışına taşabilsin; isolate kaldırıldı (dropdown üstte kalsın) */
                'relative overflow-visible rounded-xl p-3 backdrop-blur-xl',
                isLight
                  ? 'border border-slate-200/60 bg-white/86 shadow-[0_8px_26px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.92)]'
                  : connectionGlassChrome
                    ? 'border border-white/[0.05] bg-[rgba(10,8,16,0.38)] shadow-[0_6px_26px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-[18px]'
                    : 'border border-white/[0.07] bg-[rgba(14,12,22,0.42)] shadow-[0_4px_22px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]',
              ),
          )}
        >
          {connectionGlassChrome && !isLight ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/[0.14] to-transparent"
            />
          ) : null}
          <div className={cn('flex flex-1 flex-col gap-3 sm:flex-row sm:items-center', airyDark && 'gap-2.5')}>
            <div className={cn('relative w-full max-w-xl', glassSurface && 'rounded-2xl')}>
              <Search
                className={cn(
                  'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-slate-400',
                  glassSurface ? (airyDark ? 'left-3.5' : 'left-4') : 'left-3.5 size-3.5',
                  glassDark && !airyDark && 'text-pink-400/65',
                  airyDark && 'text-slate-500',
                  glassLight && 'text-fuchsia-600/75',
                )}
              />
              <Input
                className={cn(
                  'w-full text-sm transition-colors',
                  glassSurface
                    ? cn(
                        airyDark ? '!h-10 !rounded-xl !py-0 !pr-3.5 !pl-10' : '!h-11 !rounded-2xl !py-0 !pr-4 !pl-11',
                        glassDark &&
                          !airyDark &&
                          // Override global .cyber-input (theme rules win otherwise — match glass table shell)
                          '!border-[#2d2438]/82 !bg-[#161024]/96 !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 !shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_3px_14px_rgba(0,0,0,0.28)] focus:!border-pink-500/48 focus:!shadow-[0_0_0_2px_rgba(219,39,119,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] focus:!ring-0 focus-visible:!ring-0',
                        airyDark &&
                          cn(
                            '!border-white/10 !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 !shadow-none focus:!border-pink-400/35 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.15)] focus:!ring-0 focus-visible:!ring-0',
                            connectionGlassChrome
                              ? '!bg-[rgba(10,8,16,0.52)] !border-white/[0.09]'
                              : '!bg-[rgba(18,16,26,0.48)]',
                          ),
                        glassLight &&
                          '!border-purple-200/78 !bg-white !text-[#1a1525] placeholder:!text-slate-500 !shadow-[inset_0_1px_0_rgba(255,255,255,1),0_3px_14px_rgba(88,28,135,0.07)] focus:!border-fuchsia-400/65 focus:!shadow-[0_0_0_2px_rgba(192,38,211,0.16)] focus:!ring-0 focus-visible:!ring-0',
                      )
                    : 'h-10 rounded-xl pl-10',
                )}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
              />
            </div>
            {title ? (
              <p
                className={cn(
                  'bg-linear-to-r bg-clip-text text-sm font-medium text-transparent',
                  isLight ? 'from-fuchsia-600 via-pink-500 to-violet-600' : 'from-[#ffb1d8] to-[#ffc58e]',
                )}
              >
                {title}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
            {filterColumns.length > 0 && onDraftFilterRowsChange && onApplyFilters && onClearFilters ? (
              <div ref={filtersRef} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    toolbarSecondaryBtn,
                    'shadow-none',
                    glassSurface && glassToolbarSecondaryClass,
                    appliedFilterCount > 0 &&
                      (glassSurface ? glassFilterActiveToolbarClass : 'border border-indigo-200 bg-indigo-50 text-indigo-700'),
                  )}
                  onClick={() => {
                    setFiltersOpen((current) => !current);
                    setColumnsOpen(false);
                    setExportOpen(false);
                  }}
                >
                  <Filter className="mr-1 size-3 shrink-0" />
                  {t('filters')}
                  {appliedFilterCount > 0 ? (
                    <span
                      className={cn(
                        'ml-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1 py-px text-[9px] font-bold leading-none text-white',
                        glassDark && !airyDark && 'bg-pink-600 shadow-[0_0_14px_rgba(219,39,119,0.45)]',
                        airyDark && 'bg-pink-500/85 shadow-none',
                        glassLight && 'bg-fuchsia-600 shadow-[0_0_12px_rgba(192,38,211,0.25)]',
                        !glassSurface && 'bg-indigo-600',
                      )}
                    >
                      {appliedFilterCount}
                    </span>
                  ) : null}
                </Button>

                {filtersOpen ? (
                  <div className={cn(
                    'absolute right-0 z-50 mt-2 w-[min(680px,92vw)] max-sm:left-0 max-sm:right-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl',
                    isLight
                      ? cn(
                          'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]',
                          glassLight &&
                            'border-purple-200/65 bg-[#faf9fc]/98 shadow-[0_24px_52px_rgba(88,28,135,0.11)]',
                        )
                      : cn(
                          'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                          glassDark &&
                            !airyDark &&
                            'border-[#2d2438]/78 bg-[#120c1b]/94 shadow-[0_28px_64px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.055)]',
                          airyDark &&
                            'border-white/[0.08] bg-[rgba(14,12,22,0.45)] shadow-[0_12px_36px_rgba(0,0,0,0.28)]',
                        ),
                  )}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3
                        className={cn(
                          'bg-linear-to-r bg-clip-text text-sm font-semibold text-transparent',
                          isLight ? 'from-fuchsia-600 via-pink-500 to-violet-600' : 'from-[#ffb1d8] to-[#ffc58e]',
                        )}
                      >
                        {t('advancedFilterTitle')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className={cn(toolbarSecondaryBtn, 'shadow-none', glassSurface && glassToolbarSecondaryClass)}
                          onClick={() =>
                            onDraftFilterRowsChange([
                              ...draftFilterRows,
                              createFilterRow(defaultFilterColumn ?? filterColumns[0].value, filterColumns),
                            ])
                          }
                        >
                          <Plus className="mr-1 size-3 shrink-0" />
                          {t('addFilter')}
                        </Button>
                        <Button type="button" variant="secondary" className={cn(toolbarSecondaryBtn, 'shadow-none', glassSurface && glassToolbarSecondaryClass)} onClick={onClearFilters}>
                          {t('clear')}
                        </Button>
                        <Button
                          type="button"
                          className={cn(
                            'h-7 min-h-7 rounded-md px-3 text-[11px] font-semibold leading-none shadow-[0_6px_14px_rgba(255,95,119,0.16)]',
                            glassDark && !airyDark && 'shadow-[0_8px_22px_rgba(219,39,119,0.38)]',
                            airyDark && 'shadow-[0_4px_16px_rgba(219,39,119,0.18)]',
                            glassLight && 'shadow-[0_8px_22px_rgba(192,38,211,0.22)]',
                          )}
                          onClick={() => {
                            onApplyFilters();
                            setFiltersOpen(false);
                          }}
                        >
                          {t('applyFilters')}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {draftFilterRows.length === 0 ? (
                        <div className={cn(
                          'rounded-2xl border border-dashed px-4 py-6 text-center text-sm backdrop-blur-xl',
                          isLight
                            ? cn('border-slate-300/70 bg-slate-50/85 text-slate-600', glassLight && 'border-purple-200/65 bg-white/80 text-slate-600')
                            : cn(
                                'border-white/25 bg-[#120b1f]/38 text-slate-300',
                                glassDark && 'border-[#2d2438]/65 bg-[#0f0a15]/72 text-slate-400',
                              ),
                        )}>
                          {t('noFiltersAdded')}
                        </div>
                      ) : null}

                      {draftFilterRows.map((row) => {
                        const operators = getOperatorsForColumn(row.column, filterColumns);
                        const config = filterColumns.find((item) => item.value === row.column);
                        const inputType = config?.type === 'number' ? 'number' : config?.type === 'date' ? 'date' : 'text';

                        return (
                          <div className={cn(
                            'grid gap-3 rounded-2xl border p-3 backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr_1fr_auto]',
                            isLight
                              ? cn(
                                  'border-slate-200/80 bg-white/90 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]',
                                  glassLight && 'border-purple-200/60 bg-white/95 shadow-[inset_0_1px_0_rgba(250,232,255,0.5)]',
                                )
                              : cn(
                                  'border-white/14 bg-[#120b1f]/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
                                  glassDark &&
                                    'border-[#2d2438]/68 bg-[#0f0a15]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                                ),
                          )} key={row.id}>
                            <select
                              className={cn(
                                'h-12 rounded-2xl border px-4 text-sm outline-none backdrop-blur-xl',
                                isLight
                                  ? cn('border-slate-200 bg-white text-slate-700', glassLight && 'border-purple-200/65')
                                  : cn(
                                      'border-white/14 bg-[#181029]/82 text-slate-100',
                                      glassDark && 'border-[#2d2438]/72 bg-[#120c1b]/85 text-slate-100',
                                    ),
                              )}
                              value={row.column}
                              onChange={(event) => {
                                const nextColumn = event.target.value;
                                const nextOperator = getDefaultOperatorForColumn(nextColumn, filterColumns);
                                onDraftFilterRowsChange(
                                  draftFilterRows.map((item) =>
                                    item.id === row.id ? { ...item, column: nextColumn, operator: nextOperator } : item,
                                  ),
                                );
                              }}
                            >
                              {filterColumns.map((column) => (
                                <option key={column.value} value={column.value}>
                                  {column.label}
                                </option>
                              ))}
                            </select>

                            <select
                              className={cn(
                                'h-12 rounded-2xl border px-4 text-sm outline-none backdrop-blur-xl',
                                isLight
                                  ? cn('border-slate-200 bg-white text-slate-700', glassLight && 'border-purple-200/65')
                                  : cn(
                                      'border-white/14 bg-[#181029]/82 text-slate-100',
                                      glassDark && 'border-[#2d2438]/72 bg-[#120c1b]/85 text-slate-100',
                                    ),
                              )}
                              value={row.operator}
                              onChange={(event) =>
                                onDraftFilterRowsChange(
                                  draftFilterRows.map((item) =>
                                    item.id === row.id ? { ...item, operator: event.target.value } : item,
                                  ),
                                )
                              }
                            >
                              {operators.map((operator) => (
                                <option key={operator} value={operator}>
                                  {operatorLabelMap[operator] ?? operator}
                                </option>
                              ))}
                            </select>

                            {config?.type === 'boolean' ? (
                              <select
                                className={cn(
                                  'h-12 rounded-2xl border px-4 text-sm outline-none backdrop-blur-xl',
                                  isLight
                                    ? cn('border-slate-200 bg-white text-slate-700', glassLight && 'border-purple-200/65')
                                    : cn(
                                        'border-white/14 bg-[#181029]/82 text-slate-100',
                                        glassDark && 'border-[#2d2438]/72 bg-[#120c1b]/85 text-slate-100',
                                      ),
                                )}
                                value={row.value}
                                onChange={(event) =>
                                  onDraftFilterRowsChange(
                                    draftFilterRows.map((item) =>
                                      item.id === row.id ? { ...item, value: event.target.value } : item,
                                    ),
                                  )
                                }
                              >
                                <option value="">{t('select')}</option>
                                <option value="true">{t('yes')}</option>
                                <option value="false">{t('no')}</option>
                              </select>
                            ) : (
                              <Input
                                type={inputType}
                                value={row.value}
                                placeholder={t('value')}
                                className={cn(
                                  glassDark &&
                                    'border-[#2d2438]/72 bg-[#120c1b]/85 text-slate-100 placeholder:text-slate-500',
                                  glassLight && 'border-purple-200/65',
                                )}
                                onChange={(event) =>
                                  onDraftFilterRowsChange(
                                    draftFilterRows.map((item) =>
                                      item.id === row.id ? { ...item, value: event.target.value } : item,
                                    ),
                                  )
                                }
                              />
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              className={cn(
                                'h-7 min-h-7 rounded-md px-2 shadow-none',
                                glassDark && '!border-[#2d2438]/55 !bg-[#120c1b]/45 hover:!bg-[#1e1630]/80 hover:!border-pink-500/25',
                                glassLight && 'hover:!bg-fuchsia-50/80',
                              )}
                              onClick={() => onDraftFilterRowsChange(draftFilterRows.filter((item) => item.id !== row.id))}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div ref={columnsRef} className="relative">
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  toolbarSecondaryBtn,
                  'whitespace-nowrap shadow-none sm:min-w-[136px]',
                  glassSurface && glassToolbarSecondaryClass,
                )}
                onClick={() => {
                  setColumnsOpen((current) => !current);
                  setFiltersOpen(false);
                  setExportOpen(false);
                }}
              >
                <Columns3 className="mr-1 size-3 shrink-0" />
                {t('columns')}
              </Button>

              {columnsOpen ? (
                <div className={cn(
                  'absolute right-0 z-50 mt-2 w-80 max-w-[92vw] rounded-2xl border p-3 shadow-2xl backdrop-blur-2xl',
                  isLight
                    ? cn(
                        'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]',
                        glassLight &&
                          'border-purple-200/65 bg-[#faf9fc]/98 shadow-[0_24px_52px_rgba(88,28,135,0.11)]',
                      )
                    : cn(
                        'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                        glassDark &&
                          'border-[#2d2438]/78 bg-[#120c1b]/94 shadow-[0_28px_64px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.055)]',
                      ),
                )}>
                  <div className={cn(
                    'mb-2 text-xs font-semibold uppercase tracking-[0.18em]',
                    isLight ? cn('text-slate-600', glassLight && 'text-fuchsia-800/85') : cn('text-sky-300', glassDark && 'text-pink-400/90'),
                  )}>
                    {t('visibleColumns')}
                  </div>
                  <div className="space-y-1">
                    {orderedColumns.map((column, index) => {
                      const isVisible = visibleColumnKeys.includes(column.key);
                      return (
                        <div key={column.key} className={cn(
                          'flex items-center gap-2 rounded-2xl px-2 py-2',
                          isLight
                            ? cn('hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-50/70')
                            : cn('hover:bg-white/10', glassDark && 'hover:bg-pink-500/8 hover:shadow-[inset_3px_0_0_0_rgba(219,39,119,0.45)]'),
                        )}>
                          <div className="flex flex-1 items-center gap-2">
                            <button type="button" className={cn(
                              'rounded-lg p-1 transition hover:brightness-110',
                              isLight ? cn('hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-100/80') : cn('hover:bg-white/10', glassDark && 'hover:bg-pink-500/15'),
                            )} onClick={() => moveColumn(column.key, 'up')} disabled={index === 0}>
                              <ArrowUp className={cn('size-3.5', isLight ? 'text-slate-500' : 'text-slate-300', glassDark && 'text-pink-300/75')} />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                'rounded-lg p-1 transition hover:brightness-110',
                                isLight ? cn('hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-100/80') : cn('hover:bg-white/10', glassDark && 'hover:bg-pink-500/15'),
                              )}
                              onClick={() => moveColumn(column.key, 'down')}
                              disabled={index === orderedColumns.length - 1}
                            >
                              <ArrowDown className={cn('size-3.5', isLight ? 'text-slate-500' : 'text-slate-300', glassDark && 'text-pink-300/75')} />
                            </button>
                            <span className={cn('truncate text-sm', isLight ? 'text-slate-700' : 'text-slate-200')}>{column.label}</span>
                          </div>
                          <button type="button" className={cn(
                            'rounded-lg p-1 transition hover:brightness-110',
                            isLight ? cn('hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-100/80') : cn('hover:bg-white/10', glassDark && 'hover:bg-pink-500/15'),
                          )} onClick={() => toggleColumn(column.key)}>
                            {isVisible ? <EyeOff className={cn('size-4', isLight ? 'text-slate-500' : 'text-slate-300')} /> : <Eye className={cn('size-4', isLight ? 'text-slate-500' : 'text-slate-300')} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={exportRef} className="relative">
              <Button
                type="button"
                variant="secondary"
                className={cn(toolbarSecondaryBtn, 'shadow-none', glassSurface && glassToolbarSecondaryClass)}
                onClick={() => {
                  setExportOpen((current) => !current);
                  setColumnsOpen(false);
                  setFiltersOpen(false);
                }}
              >
                <Download className="mr-1 size-3 shrink-0" />
                {t('export')}
              </Button>

              {exportOpen ? (
                <div className={cn(
                  'absolute right-0 z-50 mt-2 w-48 max-w-[92vw] rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl',
                  isLight
                    ? cn(
                        'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]',
                        glassLight &&
                          'border-purple-200/65 bg-[#faf9fc]/98 shadow-[0_24px_52px_rgba(88,28,135,0.11)]',
                      )
                    : cn(
                        'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                        glassDark &&
                          !airyDark &&
                          'border-[#2d2438]/78 bg-[#120c1b]/94 shadow-[0_28px_64px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.055)]',
                        airyDark &&
                          'border-white/[0.08] bg-[rgba(14,12,22,0.52)] shadow-[0_12px_32px_rgba(0,0,0,0.26)]',
                      ),
                )}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition disabled:opacity-50 hover:brightness-105',
                      isLight
                        ? cn('text-slate-700 hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-50/85')
                        : cn(
                            'text-slate-200 hover:bg-white/8',
                            glassDark && !airyDark && 'hover:bg-pink-500/12 hover:text-white',
                            airyDark && 'hover:bg-white/[0.06] hover:text-white',
                          ),
                    )}
                    disabled={resolvedExportRows.length === 0}
                    onClick={() => {
                      void exportGridToExcel({
                        fileName: exportFileName,
                        columns: resolvedExportColumns,
                        rows: resolvedExportRows,
                      });
                      setExportOpen(false);
                    }}
                  >
                    <FileSpreadsheet className="size-4 text-emerald-600" />
                    <span>{t('exportExcel')}</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition disabled:opacity-50 hover:brightness-105',
                      isLight
                        ? cn('text-slate-700 hover:bg-slate-100', glassLight && 'hover:bg-fuchsia-50/85')
                        : cn(
                            'text-slate-200 hover:bg-white/8',
                            glassDark && !airyDark && 'hover:bg-pink-500/12 hover:text-white',
                            airyDark && 'hover:bg-white/[0.06] hover:text-white',
                          ),
                    )}
                    disabled={resolvedExportRows.length === 0}
                    onClick={() => {
                      void exportGridToPdf({
                        fileName: exportFileName,
                        columns: resolvedExportColumns,
                        rows: resolvedExportRows,
                      });
                      setExportOpen(false);
                    }}
                  >
                    <FileType className="size-4 text-rose-600" />
                    <span>{t('exportPdf')}</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                'flex flex-wrap items-center gap-2',
                headerPrimaryCompactClass,
                glassDark &&
                  !airyDark &&
                  !connectionGlassChrome &&
                  '[&_button.cyber-btn-secondary]:!border-[#2d2438]/80 [&_button.cyber-btn-secondary]:!bg-[#120c1b]/72 [&_button.cyber-btn-secondary]:!text-slate-100 [&_button.cyber-btn-secondary]:shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] [&_button.cyber-btn-secondary]:hover:!border-pink-500/38 [&_button.cyber-btn-secondary]:hover:!bg-[#221a34]/92 [&_button.cyber-btn-secondary]:hover:!text-white [&_button.cyber-btn-ghost]:!border-[#2d2438]/50 [&_button.cyber-btn-ghost]:!bg-[#120c1b]/35 [&_button.cyber-btn-ghost]:hover:!border-pink-500/28 [&_button.cyber-btn-ghost]:hover:!bg-[#1e1630]/75',
                airyDark &&
                  !connectionGlassChrome &&
                  '[&_button.cyber-btn-secondary]:!border-white/12 [&_button.cyber-btn-secondary]:!bg-[rgba(18,16,26,0.5)] [&_button.cyber-btn-secondary]:!text-slate-200 [&_button.cyber-btn-secondary]:shadow-none [&_button.cyber-btn-secondary]:hover:!border-pink-400/30 [&_button.cyber-btn-secondary]:hover:!bg-[rgba(26,22,38,0.6)] [&_button.cyber-btn-secondary]:hover:!text-white [&_button.cyber-btn-ghost]:hover:!bg-white/[0.06]',
                connectionGlassChrome &&
                  glassDark &&
                  '[&_button.cyber-btn-secondary]:!border-white/[0.08] [&_button.cyber-btn-secondary]:!bg-[rgba(10,8,16,0.48)] [&_button.cyber-btn-secondary]:!text-slate-200 [&_button.cyber-btn-secondary]:!shadow-[0_2px_12px_rgba(0,0,0,0.14)] [&_button.cyber-btn-secondary]:backdrop-blur-md [&_button.cyber-btn-secondary]:hover:!border-pink-400/28 [&_button.cyber-btn-secondary]:hover:!bg-[rgba(22,18,34,0.55)] [&_button.cyber-btn-secondary]:hover:!text-white [&_button.cyber-btn-ghost]:!border-white/[0.08] [&_button.cyber-btn-ghost]:!bg-[rgba(10,8,16,0.4)] [&_button.cyber-btn-ghost]:hover:!border-pink-400/22 [&_button.cyber-btn-ghost]:hover:!bg-[rgba(22,18,34,0.48)]',
                glassLight &&
                  '[&_button.cyber-btn-secondary]:!border-purple-200/72 [&_button.cyber-btn-secondary]:!bg-white/96 [&_button.cyber-btn-secondary]:hover:!border-fuchsia-400/48 [&_button.cyber-btn-secondary]:hover:!bg-fuchsia-50/75 [&_button.cyber-btn-ghost]:hover:!bg-fuchsia-50/65',
              )}
            >
              {headerAction}
            </div>
          </div>
        </div>

        {subheaderContent ? <div className="-mt-1">{subheaderContent}</div> : null}

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className={cn(
              'rounded-[1.5rem] border px-4 py-10 text-center backdrop-blur-xl',
              isLight
                ? 'border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                : 'border-white/14 bg-[#140d24]/52 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            )}>
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t('loading')}
              </span>
            </div>
          ) : isError ? (
            <div className={cn(
              'rounded-[1.5rem] border px-4 py-10 text-center backdrop-blur-xl',
              isLight
                ? 'border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-[inset_0_1px_0_rgba(251,113,133,0.15)]'
                : 'border-white/14 bg-[#140d24]/52 text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            )}>
              {errorText ?? t('gridLoadError')}
            </div>
          ) : rows.length === 0 ? (
            emptyStateContent ? (
              <div className={cn(
                'rounded-[1.5rem] border p-4 backdrop-blur-xl',
                isLight
                  ? 'border-slate-200/80 bg-slate-50/90 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                  : 'border-white/14 bg-[#140d24]/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
              )}>
                {emptyStateContent}
              </div>
            ) : (
              <div className={cn(
                'rounded-[1.5rem] border px-4 py-10 text-center backdrop-blur-xl',
                isLight
                  ? 'border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                  : 'border-white/14 bg-[#140d24]/52 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
              )}>
                {emptyText ?? t('gridEmpty')}
              </div>
            )
          ) : (
            rows.map((row, rowIndex) => {
              const baseKey = rowKey(row);
              const selectionId = String(baseKey);
              const rowId = typeof baseKey === 'number' ? `${rowIndex}-${baseKey}` : `${rowIndex}-${baseKey}`;
              const isSelected = selectedRowIds?.includes(selectionId) ?? false;
              return (
                <div className={cn(
                  'group border backdrop-blur-xl transition-all duration-200',
                  isLight
                    ? cn(
                        'rounded-[1.5rem] border-slate-200/80 bg-white/95 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(148,163,184,0.12)] hover:border-slate-300 hover:bg-white',
                        glassLight &&
                          'rounded-2xl border-purple-200/55 hover:border-fuchsia-300/50 hover:bg-fuchsia-50/35 hover:shadow-[inset_4px_0_0_0_rgba(217,70,239,0.45)]',
                      )
                    : cn(
                        'rounded-[1.25rem] border-white/14 bg-[#140d24]/55 p-3 shadow-[0_14px_34px_rgba(2,4,14,0.38),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-pink-300/35 hover:bg-[#181029]/72 hover:shadow-[0_18px_42px_rgba(2,4,14,0.48)]',
                        glassDark &&
                          !airyDark &&
                          'rounded-2xl border-[#2d2438]/75 bg-[#120c1b]/72 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-pink-500/35 hover:bg-[#231d38]/88 hover:shadow-[inset_4px_0_0_0_rgba(219,39,119,0.65),0_18px_44px_rgba(0,0,0,0.38)]',
                        airyDark &&
                          cn(
                            connectionGlassChrome
                              ? 'rounded-2xl border-white/[0.05] bg-[rgba(10,8,16,0.35)] p-3.5 shadow-[0_6px_22px_rgba(0,0,0,0.2)] hover:border-pink-400/20 hover:bg-[rgba(16,14,24,0.45)] hover:shadow-[inset_3px_0_0_0_rgba(219,39,119,0.3)]'
                              : 'rounded-2xl border-white/[0.08] bg-[rgba(14,12,22,0.42)] p-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.22)] hover:border-pink-400/25 hover:bg-[rgba(20,17,32,0.52)] hover:shadow-[inset_3px_0_0_0_rgba(219,39,119,0.35)]',
                          ),
                      ),
                )} key={rowId}>
                  <div className="space-y-3">
                    {selectableRows ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (!onSelectedRowIdsChange) return;
                            const current = new Set(selectedRowIds ?? []);
                            if (current.has(selectionId)) current.delete(selectionId);
                            else current.add(selectionId);
                            onSelectedRowIdsChange(Array.from(current));
                          }}
                        />
                        <span className={cn('text-xs', isLight ? 'text-slate-600' : 'text-slate-300')}>{t('select')}</span>
                      </div>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <div key={`${rowId}-${column.key}`} className="flex flex-col gap-1">
                        <span
                          className={cn(
                            'text-[11px] font-semibold tracking-[0.18em]',
                            isLight ? 'text-slate-500' : 'text-sky-300',
                            glassDark && !airyDark && 'text-pink-400/95',
                            airyDark && 'text-slate-500',
                            glassLight && 'text-fuchsia-600/90',
                          )}
                        >
                          {column.label}
                        </span>
                        <div className={cn('text-sm break-words', isLight ? 'text-slate-700' : 'text-slate-200', column.className)}>
                          {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={cn(
          'relative z-0 hidden min-w-0 w-full overflow-x-auto border backdrop-blur-2xl md:block',
          isLight
            ? cn(
                'rounded-[1.75rem] border-slate-200/70 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.08)]',
                glassLight &&
                  'rounded-2xl border-purple-200/60 bg-white/93 shadow-[0_16px_44px_rgba(88,28,135,0.075)]',
              )
            : cn(
                'rounded-[1.25rem] border-transparent bg-[#140d24]/38 shadow-[0_12px_30px_rgba(2,4,14,0.24)]',
                glassDark &&
                  !airyDark &&
                  'rounded-2xl border border-[#2d2438]/75 bg-[#120c1b]/45 shadow-[0_18px_52px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.055)]',
                airyDark &&
                  (connectionGlassChrome
                    ? 'rounded-2xl border border-white/[0.045] bg-[rgba(8,6,14,0.28)] shadow-[0_10px_32px_rgba(0,0,0,0.22)] backdrop-blur-[18px]'
                    : 'rounded-2xl border border-white/[0.07] bg-[rgba(14,12,22,0.35)] shadow-[0_8px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]'),
              ),
        )}>
          <table
            className={cn(
              'min-w-full text-left',
              isLight ? 'text-sm' : airyDark ? (compactRows ? 'text-[12px] leading-tight' : 'text-[12.5px] leading-snug') : compactRows ? 'text-[12.5px] leading-snug' : 'text-[13px]',
            )}
          >
            <thead className={cn(
              'backdrop-blur-xl',
              isLight
                ? cn('bg-slate-100/90', glassLight && 'bg-slate-50/98')
                : cn(
                    'bg-[#1f1432]/42',
                    glassDark && !airyDark && 'bg-[#0f0a18]/96',
                    airyDark && (connectionGlassChrome ? 'bg-[rgba(14,12,22,0.36)] backdrop-blur-md' : 'bg-[rgba(18,16,26,0.55)]'),
                  ),
            )}>
                <tr className={cn(
                  'border-b',
                  isLight
                    ? cn('border-slate-200 text-slate-600', glassLight && 'border-purple-200/65 text-slate-700')
                    : cn(
                        'border-white/8 text-sky-200',
                        glassDark && !airyDark && 'border-[#2d2438] text-white',
                        airyDark &&
                          (connectionGlassChrome ? 'border-white/[0.04] text-slate-500' : 'border-white/[0.06] text-slate-400'),
                      ),
                )}>
                {selectableRows ? (
                  <th className={cn(
                    'w-10',
                    isLight ? (compactRows ? 'px-4 py-2' : 'px-4 py-3') : compactRows ? 'px-3 py-1.5' : 'px-3 py-2',
                    glassDark && !airyDark && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                    airyDark && (compactRows ? 'px-3 py-1.5' : 'px-3.5 py-2.5'),
                    glassLight && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                  )}>
                    <input
                      type="checkbox"
                      className="modern-checkbox"
                      aria-label="select-all-rows"
                      checked={
                        rows.length > 0 &&
                        rows.every((row) => selectedRowIds?.includes(String(rowKey(row))))
                      }
                      onChange={(event) => {
                        if (!onSelectedRowIdsChange) return;
                        if (event.target.checked) {
                          const allIds = rows.map((row) => String(rowKey(row)));
                          onSelectedRowIdsChange(allIds);
                        } else {
                          onSelectedRowIdsChange([]);
                        }
                      }}
                    />
                  </th>
                ) : null}
                {visibleColumns.map((column) => {
                  const isActiveSort = sortBy === column.key;
                  const isDragging = draggedColumnKey === column.key;
                  const isDropTarget = dragOverColumnKey === column.key && draggedColumnKey !== column.key;
                  return (
                    <th
                      key={column.key}
                      className={cn(
                        'select-none transition-colors',
                        glassDark || glassLight ? 'font-semibold tracking-[0.12em]' : 'font-medium',
                        isLight ? (compactRows ? 'px-4 py-2' : 'px-4 py-2.5') : compactRows ? 'px-3 py-1.5' : 'px-3 py-2',
                        glassDark && !airyDark && (compactRows ? 'px-4 py-2.5 text-[11px]' : 'px-4 py-3.5 text-[11px]'),
                        airyDark && (compactRows ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2.5 text-[11px]'),
                        glassLight && (compactRows ? 'px-4 py-2.5 text-[11px]' : 'px-4 py-3.5 text-[11px]'),
                        isDragging && 'opacity-60',
                        isDropTarget &&
                          (glassDark ? (airyDark ? 'bg-pink-500/8' : 'bg-pink-500/12') : isLight ? 'bg-sky-50/80' : 'bg-white/8'),
                      )}
                    >
                      {column.sortable && onSort ? (
                        <button
                          type="button"
                          draggable
                          className={cn(
                            'group inline-flex cursor-grab items-center rounded-full transition-all duration-200 active:cursor-grabbing',
                            airyDark
                              ? compactRows
                                ? 'gap-1 px-1.5 py-px'
                                : 'gap-1.5 px-2 py-0.5'
                              : compactRows
                                ? 'gap-1.5 px-2 py-0.5'
                                : 'gap-2 px-2.5 py-1',
                            glassDark
                              ? cn(
                                  airyDark
                                    ? 'hover:bg-pink-500/8 hover:text-white'
                                    : 'hover:bg-pink-500/15 hover:text-white',
                                  isActiveSort &&
                                    (airyDark
                                      ? connectionGlassChrome
                                        ? 'bg-pink-500/6 text-white shadow-[0_0_0_1px_rgba(236,72,153,0.12)]'
                                        : 'bg-pink-500/8 text-white shadow-[0_0_0_1px_rgba(236,72,153,0.22)]'
                                      : 'bg-pink-500/12 text-white shadow-[0_0_0_1px_rgba(236,72,153,0.35)]'),
                                )
                              : glassLight
                                ? cn(
                                    'hover:bg-fuchsia-100/80 hover:text-fuchsia-900',
                                    isActiveSort &&
                                      'bg-fuchsia-100/90 text-fuchsia-900 shadow-[0_0_0_1px_rgba(192,38,211,0.35)]',
                                  )
                                : cn(
                                    'hover:bg-white/8 hover:text-sky-100',
                                    isActiveSort &&
                                      'bg-white/8 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]',
                                  ),
                          )}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', column.key);
                            setDraggedColumnKey(column.key);
                            setDragOverColumnKey(column.key);
                          }}
                          onDragOver={(event) => {
                            if (!draggedColumnKey || draggedColumnKey === column.key) return;
                            event.preventDefault();
                            setDragOverColumnKey(column.key);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceKey = event.dataTransfer.getData('text/plain') || draggedColumnKey;
                            if (!sourceKey || sourceKey === column.key) return;
                            swapColumns(sourceKey, column.key);
                            setDraggedColumnKey(null);
                            setDragOverColumnKey(null);
                          }}
                          onDragEnd={() => {
                            setDraggedColumnKey(null);
                            setDragOverColumnKey(null);
                          }}
                          onClick={() => onSort(column.key)}
                        >
                          <span>{column.label}</span>
                          {isActiveSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className={cn('transition-transform duration-200 group-hover:-translate-y-0.5', airyDark ? 'size-3.5' : 'size-4')} />
                            ) : (
                              <ArrowDown className={cn('transition-transform duration-200 group-hover:translate-y-0.5', airyDark ? 'size-3.5' : 'size-4')} />
                            )
                          ) : (
                            <ChevronDown className={cn('opacity-45 transition-all duration-200 group-hover:opacity-90 group-hover:translate-y-0.5', airyDark ? 'size-3.5' : 'size-4')} />
                          )}
                        </button>
                      ) : (
                        <span
                          draggable
                          className={cn(
                            'inline-flex cursor-grab items-center rounded-full active:cursor-grabbing',
                            compactRows ? 'px-1 py-0.5' : 'px-1.5 py-1',
                            isDropTarget &&
                              (glassDark ? (airyDark ? 'bg-pink-500/8' : 'bg-pink-500/12') : isLight ? 'bg-sky-50/80' : 'bg-white/8'),
                          )}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', column.key);
                            setDraggedColumnKey(column.key);
                            setDragOverColumnKey(column.key);
                          }}
                          onDragOver={(event) => {
                            if (!draggedColumnKey || draggedColumnKey === column.key) return;
                            event.preventDefault();
                            setDragOverColumnKey(column.key);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceKey = event.dataTransfer.getData('text/plain') || draggedColumnKey;
                            if (!sourceKey || sourceKey === column.key) return;
                            swapColumns(sourceKey, column.key);
                            setDraggedColumnKey(null);
                            setDragOverColumnKey(null);
                          }}
                          onDragEnd={() => {
                            setDraggedColumnKey(null);
                            setDragOverColumnKey(null);
                          }}
                        >
                          {column.label}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className={cn('px-4 py-10 text-center', isLight ? 'text-slate-600' : 'text-slate-300')}>
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('loading')}
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className={cn('px-4 py-10 text-center', isLight ? 'text-rose-700' : 'text-rose-300')}>
                    {errorText ?? t('gridLoadError')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="px-4 py-8">
                    {emptyStateContent ? (
                      <div className={cn(
                        'rounded-[1.5rem] border p-4 backdrop-blur-xl',
                        isLight
                          ? 'border-slate-200/80 bg-slate-50/90 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                          : 'border-white/14 bg-[#140d24]/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                      )}>{emptyStateContent}</div>
                    ) : (
                      <div className={cn(
                        'rounded-[1.5rem] border px-4 py-10 text-center backdrop-blur-xl',
                        isLight
                          ? 'border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                          : 'border-white/14 bg-[#140d24]/52 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                      )}>
                        {emptyText ?? t('gridEmpty')}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const baseKey = rowKey(row);
                  const selectionId = String(baseKey);
                  const rowId = typeof baseKey === 'number' ? `${rowIndex}-${baseKey}` : `${rowIndex}-${baseKey}`;
                  const isSelected = selectedRowIds?.includes(selectionId) ?? false;
                  return (
                    <tr className={cn(
                      'group border-b transition-colors duration-200 last:border-b-0',
                      isLight
                        ? cn(
                            'border-slate-200 hover:bg-slate-50',
                            glassLight &&
                              'border-purple-100/90 hover:bg-fuchsia-50/45 hover:shadow-[inset_4px_0_0_0_rgba(217,70,239,0.55)]',
                          )
                        : cn(
                            'border-white/8 hover:bg-white/6 hover:shadow-[inset_0_0_0_1px_rgba(125,211,252,0.1)]',
                            glassDark &&
                              !airyDark &&
                              'border-[#2d2438]/50 hover:bg-[#231d38]/88 hover:shadow-[inset_4px_0_0_0_rgba(219,39,119,0.72)]',
                            airyDark &&
                              (connectionGlassChrome
                                ? 'border-white/[0.03] hover:bg-white/[0.03] hover:shadow-[inset_3px_0_0_0_rgba(219,39,119,0.2)]'
                                : 'border-white/[0.05] hover:bg-white/[0.04] hover:shadow-[inset_3px_0_0_0_rgba(219,39,119,0.35)]'),
                          ),
                    )} key={rowId}>
                      {selectableRows ? (
                        <td className={cn(
                          isLight ? (compactRows ? 'px-4 py-2' : 'px-4 py-3') : compactRows ? 'px-3 py-1.5' : 'px-3 py-2',
                          glassDark && !airyDark && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                          airyDark && (compactRows ? 'px-3 py-1.5' : 'px-3.5 py-2.5'),
                          glassLight && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                        )}>
                          <input
                            type="checkbox"
                            className="modern-checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (!onSelectedRowIdsChange) return;
                              const current = new Set(selectedRowIds ?? []);
                              if (current.has(selectionId)) current.delete(selectionId);
                              else current.add(selectionId);
                              onSelectedRowIdsChange(Array.from(current));
                            }}
                          />
                        </td>
                      ) : null}
                      {visibleColumns.map((column) => (
                        <td key={`${rowId}-${column.key}`} className={cn(
                          isLight
                            ? cn('transition-colors duration-200', compactRows ? 'px-4 py-2' : 'px-4 py-3')
                            : cn('transition-colors duration-200', compactRows ? 'px-3 py-1.5' : 'px-3 py-2'),
                          glassDark && !airyDark && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                          airyDark && (compactRows ? 'px-3 py-1.5' : 'px-3.5 py-2.5'),
                          glassLight && (compactRows ? 'px-4 py-2.5' : 'px-4 py-3.5'),
                          isLight ? 'text-slate-700 group-hover:text-slate-800' : 'text-slate-200 group-hover:text-slate-100',
                          column.className,
                        )}>
                          {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!hidePagination && pagination && onPageNumberChange && onPageSizeChange ? (
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-center lg:justify-between',
            connectionGlassChrome
              ? cn(
                  'relative isolate gap-2 overflow-hidden rounded-xl px-3 py-2.5 backdrop-blur-xl',
                  isLight
                    ? 'border border-slate-200/60 bg-white/86 shadow-[0_8px_26px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.92)]'
                    : 'border border-white/[0.05] bg-[rgba(10,8,16,0.38)] shadow-[0_8px_28px_rgba(0,0,0,0.2)] backdrop-blur-[18px]',
                )
              : cn(
                  'border-t',
                  airyDark ? 'gap-2.5 pt-3' : 'gap-3 pt-4',
                  isLight
                    ? cn('border-slate-200/80', glassLight && 'border-purple-200/55')
                    : cn('border-white/14', glassDark && !airyDark && 'border-[#2d2438]/55', airyDark && 'border-white/[0.06]'),
                ),
          )}
        >
          {connectionGlassChrome && !isLight ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/[0.14] to-transparent"
            />
          ) : null}
          <div
            className={cn(
              'flex flex-wrap items-center',
              airyDark ? 'gap-2.5' : 'gap-3',
              footerCondensed ? 'text-xs' : 'text-sm',
              isLight ? 'text-slate-600' : connectionGlassChrome ? 'text-slate-500' : 'text-slate-300',
            )}
          >
            <span>
              {t('totalRecords')}:{' '}
              <span className={cn('font-semibold', isLight ? 'text-slate-900' : connectionGlassChrome ? 'text-slate-200' : 'text-sky-100')}>
                {pagination.totalCount}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span>{t('pageSize')}</span>
              <select
                className={cn(
                  'h-8 rounded-lg border px-2.5 text-xs outline-none backdrop-blur-xl',
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700'
                    : connectionGlassChrome
                      ? 'border-white/[0.07] bg-[rgba(10,8,16,0.48)] text-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.16)] backdrop-blur-md'
                      : 'border-white/14 bg-[#120b1f]/58 text-slate-100',
                )}
                value={pagination.pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={cn('flex items-center justify-between', footerCondensed ? 'gap-1.5' : 'gap-2', 'sm:justify-end')}>
            <Button
              type="button"
              variant="secondary"
              className={cn(
                'h-7 min-h-7 rounded-md px-2 text-[11px] font-medium leading-none',
                connectionGlassChrome &&
                  glassDark &&
                  '!border-white/[0.08] !bg-[rgba(10,8,16,0.48)] !shadow-[0_2px_12px_rgba(0,0,0,0.16)] backdrop-blur-md hover:!border-pink-400/28 hover:!bg-[rgba(22,18,34,0.55)] hover:!text-white',
                'max-sm:flex-1',
              )}
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageNumberChange(Math.max(1, pagination.pageNumber - 1))}
            >
              <ChevronLeft className="mr-0.5 size-2.5 shrink-0" />
              {t('previous')}
            </Button>
            <div className={cn(
              'rounded-lg border px-2.5 py-1 text-center text-xs font-semibold backdrop-blur-xl sm:px-3',
              isLight
                ? 'border-slate-200 bg-white text-slate-800 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                : connectionGlassChrome
                  ? 'border-white/[0.08] bg-[rgba(10,8,16,0.48)] text-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.16)] backdrop-blur-md'
                  : 'border-white/14 bg-[#120b1f]/58 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            )}>
              {pagination.pageNumber} / {Math.max(pagination.totalPages, 1)}
            </div>
            <Button
              type="button"
              variant="secondary"
              className={cn(
                'h-7 min-h-7 rounded-md px-2 text-[11px] font-medium leading-none',
                connectionGlassChrome &&
                  glassDark &&
                  '!border-white/[0.08] !bg-[rgba(10,8,16,0.48)] !shadow-[0_2px_12px_rgba(0,0,0,0.16)] backdrop-blur-md hover:!border-pink-400/28 hover:!bg-[rgba(22,18,34,0.55)] hover:!text-white',
                'max-sm:flex-1',
              )}
              disabled={!pagination.hasNextPage}
              onClick={() => onPageNumberChange(pagination.pageNumber + 1)}
            >
              {t('next')}
              <ChevronRight className="ml-0.5 size-2.5 shrink-0" />
            </Button>
          </div>
        </div>
        ) : null}
      </div>
    </Card>
  );
}
