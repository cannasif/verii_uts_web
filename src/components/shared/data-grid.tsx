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
}: AppDataGridProps<TRow>) {
  const { t } = useTranslation('common');
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const footerCondensed = compactFooterControls;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
        'cyber-grid overflow-hidden border backdrop-blur-2xl',
        isLight
          ? 'border-slate-200/70 bg-white/85 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-4'
          : 'border-transparent bg-[#120b1f]/50 p-2.5 shadow-[0_14px_34px_rgba(2,4,14,0.26)] sm:p-3',
      )}
    >
      <div className={cn('flex flex-col', isLight ? 'gap-4' : 'gap-3')}>
        <div className={cn('flex flex-col xl:flex-row xl:items-center xl:justify-between', isLight ? 'gap-4' : 'gap-3')}>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 rounded-xl pl-10 text-sm"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
              />
            </div>
            {title ? <p className="bg-linear-to-r from-[#ffb1d8] to-[#ffc58e] bg-clip-text text-sm font-medium text-transparent">{title}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
            {filterColumns.length > 0 && onDraftFilterRowsChange && onApplyFilters && onClearFilters ? (
              <div ref={filtersRef} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn('h-9 rounded-[10px] px-4 text-sm shadow-none', appliedFilterCount > 0 && 'border border-indigo-200 bg-indigo-50 text-indigo-700')}
                  onClick={() => {
                    setFiltersOpen((current) => !current);
                    setColumnsOpen(false);
                    setExportOpen(false);
                  }}
                >
                  <Filter className="mr-2 size-4" />
                  {t('filters')}
                  {appliedFilterCount > 0 ? (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {appliedFilterCount}
                    </span>
                  ) : null}
                </Button>

                {filtersOpen ? (
                  <div className={cn(
                    'absolute right-0 z-40 mt-2 w-[min(680px,92vw)] max-sm:left-0 max-sm:right-auto rounded-[1.75rem] border p-4 backdrop-blur-2xl',
                    isLight
                      ? 'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]'
                      : 'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                  )}>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="bg-linear-to-r from-[#ffb1d8] to-[#ffc58e] bg-clip-text text-sm font-semibold text-transparent">{t('advancedFilterTitle')}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 rounded-[10px] px-4 text-xs shadow-none"
                          onClick={() =>
                            onDraftFilterRowsChange([
                              ...draftFilterRows,
                              createFilterRow(defaultFilterColumn ?? filterColumns[0].value, filterColumns),
                            ])
                          }
                        >
                          <Plus className="mr-2 size-4" />
                          {t('addFilter')}
                        </Button>
                        <Button type="button" variant="secondary" className="h-9 rounded-[10px] px-4 text-xs shadow-none" onClick={onClearFilters}>
                          {t('clear')}
                        </Button>
                        <Button
                          type="button"
                          className="h-9 rounded-[10px] px-4 text-xs shadow-[0_6px_14px_rgba(255,95,119,0.16)]"
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
                            ? 'border-slate-300/70 bg-slate-50/85 text-slate-600'
                            : 'border-white/25 bg-[#120b1f]/38 text-slate-300',
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
                              ? 'border-slate-200/80 bg-white/90 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                              : 'border-white/14 bg-[#120b1f]/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
                          )} key={row.id}>
                            <select
                              className={cn(
                                'h-12 rounded-2xl border px-4 text-sm outline-none backdrop-blur-xl',
                                isLight
                                  ? 'border-slate-200 bg-white text-slate-700'
                                  : 'border-white/14 bg-[#181029]/82 text-slate-100',
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
                                  ? 'border-slate-200 bg-white text-slate-700'
                                  : 'border-white/14 bg-[#181029]/82 text-slate-100',
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
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-white/14 bg-[#181029]/82 text-slate-100',
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
                              className="h-9 rounded-[10px] px-3 shadow-none"
                              onClick={() => onDraftFilterRowsChange(draftFilterRows.filter((item) => item.id !== row.id))}
                            >
                              <Trash2 className="size-4" />
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
                className="h-9 rounded-[10px] px-4 text-sm shadow-none"
                onClick={() => {
                  setColumnsOpen((current) => !current);
                  setFiltersOpen(false);
                  setExportOpen(false);
                }}
              >
                <Columns3 className="mr-2 size-4" />
                {t('columns')}
              </Button>

              {columnsOpen ? (
                <div className={cn(
                  'absolute right-0 z-40 mt-2 w-80 max-w-[92vw] rounded-[1.5rem] border p-3 backdrop-blur-2xl',
                  isLight
                    ? 'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]'
                    : 'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                )}>
                  <div className={cn('mb-2 text-xs font-semibold uppercase tracking-[0.18em]', isLight ? 'text-slate-600' : 'text-sky-300')}>{t('visibleColumns')}</div>
                  <div className="space-y-1">
                    {orderedColumns.map((column, index) => {
                      const isVisible = visibleColumnKeys.includes(column.key);
                      return (
                        <div key={column.key} className={cn('flex items-center gap-2 rounded-2xl px-2 py-2', isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10')}>
                          <div className="flex flex-1 items-center gap-2">
                            <button type="button" className={cn('rounded-lg p-1 transition hover:brightness-110', isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10')} onClick={() => moveColumn(column.key, 'up')} disabled={index === 0}>
                              <ArrowUp className={cn('size-3.5', isLight ? 'text-slate-500' : 'text-slate-300')} />
                            </button>
                            <button
                              type="button"
                              className={cn('rounded-lg p-1 transition hover:brightness-110', isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10')}
                              onClick={() => moveColumn(column.key, 'down')}
                              disabled={index === orderedColumns.length - 1}
                            >
                              <ArrowDown className={cn('size-3.5', isLight ? 'text-slate-500' : 'text-slate-300')} />
                            </button>
                            <span className={cn('truncate text-sm', isLight ? 'text-slate-700' : 'text-slate-200')}>{column.label}</span>
                          </div>
                          <button type="button" className={cn('rounded-lg p-1 transition hover:brightness-110', isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10')} onClick={() => toggleColumn(column.key)}>
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
                className="h-9 rounded-[10px] px-4 text-sm shadow-none"
                onClick={() => {
                  setExportOpen((current) => !current);
                  setColumnsOpen(false);
                  setFiltersOpen(false);
                }}
              >
                <Download className="mr-2 size-4" />
                {t('export')}
              </Button>

              {exportOpen ? (
                <div className={cn(
                  'absolute right-0 z-40 mt-2 w-48 max-w-[92vw] rounded-[1.5rem] border p-2 backdrop-blur-2xl',
                  isLight
                    ? 'border-slate-200/75 bg-white/95 shadow-[0_20px_45px_rgba(15,23,42,0.14)]'
                    : 'border-white/14 bg-[#160f26]/72 shadow-[0_30px_70px_rgba(2,4,14,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
                )}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm transition disabled:opacity-50 hover:brightness-105',
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-200 hover:bg-white/8',
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
                      'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm transition disabled:opacity-50 hover:brightness-105',
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-200 hover:bg-white/8',
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

            {headerAction}
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
                    ? 'rounded-[1.5rem] border-slate-200/80 bg-white/95 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(148,163,184,0.12)] hover:border-slate-300 hover:bg-white'
                    : 'rounded-[1.25rem] border-white/14 bg-[#140d24]/55 p-3 shadow-[0_14px_34px_rgba(2,4,14,0.38),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-pink-300/35 hover:bg-[#181029]/72 hover:shadow-[0_18px_42px_rgba(2,4,14,0.48)]',
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
                        <span className={cn('text-[11px] font-semibold uppercase tracking-[0.18em]', isLight ? 'text-slate-500' : 'text-sky-300')}>{column.label}</span>
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
          'hidden overflow-x-auto border backdrop-blur-2xl md:block',
          isLight
            ? 'rounded-[1.75rem] border-slate-200/70 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.08)]'
            : 'rounded-[1.25rem] border-transparent bg-[#140d24]/38 shadow-[0_12px_30px_rgba(2,4,14,0.24)]',
        )}>
          <table className={cn('min-w-full text-left', isLight ? 'text-sm' : 'text-[13px]')}>
            <thead className={cn('backdrop-blur-xl', isLight ? 'bg-slate-100/90' : 'bg-[#1f1432]/42')}>
                <tr className={cn('border-b', isLight ? 'border-slate-200 text-slate-600' : 'border-white/8 text-sky-200')}>
                {selectableRows ? (
                  <th className={cn('w-10', isLight ? 'px-4 py-3' : 'px-3 py-2')}>
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
                  return (
                    <th key={column.key} className={cn('font-medium', isLight ? 'px-4 py-2.5' : 'px-3 py-2')}>
                      {column.sortable && onSort ? (
                        <button
                          type="button"
                          className={cn(
                            'group inline-flex items-center gap-2 rounded-full px-2.5 py-1 transition-all duration-200 hover:bg-white/8 hover:text-sky-100',
                            isActiveSort && 'bg-white/8 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]',
                          )}
                          onClick={() => onSort(column.key)}
                        >
                          <span>{column.label}</span>
                          {isActiveSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                            ) : (
                              <ArrowDown className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                            )
                          ) : (
                            <ChevronDown className="size-4 opacity-45 transition-all duration-200 group-hover:opacity-90 group-hover:translate-y-0.5" />
                          )}
                        </button>
                      ) : (
                        column.label
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
                        ? 'border-slate-200 hover:bg-slate-50'
                        : 'border-white/8 hover:bg-white/6 hover:shadow-[inset_0_0_0_1px_rgba(125,211,252,0.1)]',
                    )} key={rowId}>
                      {selectableRows ? (
                        <td className={cn(isLight ? 'px-4 py-3' : 'px-3 py-2')}>
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
                        <td key={`${rowId}-${column.key}`} className={cn(isLight ? 'px-4 py-3 transition-colors duration-200' : 'px-3 py-2 transition-colors duration-200', isLight ? 'text-slate-700 group-hover:text-slate-800' : 'text-slate-200 group-hover:text-slate-100', column.className)}>
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
        <div className={cn('flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between', isLight ? 'border-slate-200/80' : 'border-white/14')}>
          <div className={cn('flex flex-wrap items-center gap-3', footerCondensed ? 'text-xs' : 'text-sm', isLight ? 'text-slate-600' : 'text-slate-300')}>
            <span>
              {t('totalRecords')}: <span className={cn('font-semibold', isLight ? 'text-slate-900' : 'text-sky-100')}>{pagination.totalCount}</span>
            </span>
            <div className="flex items-center gap-2">
              <span>{t('pageSize')}</span>
              <select
                className={cn(
                  footerCondensed ? 'h-8 rounded-xl border px-2.5 text-xs' : 'h-9 rounded-xl border px-3 text-sm',
                  'outline-none backdrop-blur-xl',
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700'
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
                footerCondensed ? 'h-8 rounded-xl px-2.5 text-xs' : 'h-10 rounded-xl px-3 text-sm',
                'max-sm:flex-1',
              )}
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageNumberChange(Math.max(1, pagination.pageNumber - 1))}
            >
              <ChevronLeft className={cn('mr-1', footerCondensed ? 'size-3' : 'size-4')} />
              {t('previous')}
            </Button>
            <div className={cn(
              footerCondensed ? 'rounded-xl border px-2.5 py-1 text-center text-xs font-semibold backdrop-blur-xl sm:px-2.5' : 'rounded-xl border px-3 py-1.5 text-center text-sm font-semibold backdrop-blur-xl sm:px-3.5',
              isLight
                ? 'border-slate-200 bg-white text-slate-800 shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]'
                : 'border-white/14 bg-[#120b1f]/58 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            )}>
              {pagination.pageNumber} / {Math.max(pagination.totalPages, 1)}
            </div>
            <Button
              type="button"
              variant="secondary"
              className={cn(
                footerCondensed ? 'h-8 rounded-xl px-2.5 text-xs' : 'h-10 rounded-xl px-3 text-sm',
                'max-sm:flex-1',
              )}
              disabled={!pagination.hasNextPage}
              onClick={() => onPageNumberChange(pagination.pageNumber + 1)}
            >
              {t('next')}
              <ChevronRight className={cn('ml-1', footerCondensed ? 'size-3' : 'size-4')} />
            </Button>
          </div>
        </div>
        ) : null}
      </div>
    </Card>
  );
}
