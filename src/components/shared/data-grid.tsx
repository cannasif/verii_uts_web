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
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  emptyText?: string;
  pagination: PaginationState;
  onPageNumberChange: (pageNumber: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
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
  isLoading = false,
  isError = false,
  errorText,
  emptyText,
  pagination,
  onPageNumberChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
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
}: AppDataGridProps<TRow>) {
  const { t } = useTranslation('common');
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
    <Card className="overflow-hidden p-3 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-11"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
              />
            </div>
            {title ? <p className="text-sm font-medium text-slate-500">{title}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
            {filterColumns.length > 0 && onDraftFilterRowsChange && onApplyFilters && onClearFilters ? (
              <div ref={filtersRef} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(appliedFilterCount > 0 && 'border border-indigo-200 bg-indigo-50 text-indigo-700')}
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
                <div className="absolute right-0 z-40 mt-2 w-[min(680px,92vw)] max-sm:left-0 max-sm:right-auto rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">{t('advancedFilterTitle')}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
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
                        <Button type="button" variant="secondary" onClick={onClearFilters}>
                          {t('clear')}
                        </Button>
                        <Button
                          type="button"
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
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                          {t('noFiltersAdded')}
                        </div>
                      ) : null}

                      {draftFilterRows.map((row) => {
                        const operators = getOperatorsForColumn(row.column, filterColumns);
                        const config = filterColumns.find((item) => item.value === row.column);
                        const inputType = config?.type === 'number' ? 'number' : config?.type === 'date' ? 'date' : 'text';

                        return (
                          <div key={row.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 lg:grid-cols-[1.2fr_0.8fr_1fr_auto]">
                            <select
                              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none"
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
                              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none"
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
                                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none"
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
                              className="h-12"
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
                <div className="absolute right-0 z-40 mt-2 w-80 max-w-[92vw] rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('visibleColumns')}</div>
                  <div className="space-y-1">
                    {orderedColumns.map((column, index) => {
                      const isVisible = visibleColumnKeys.includes(column.key);
                      return (
                        <div key={column.key} className="flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-slate-50">
                          <div className="flex flex-1 items-center gap-2">
                            <button type="button" className="rounded-lg p-1 hover:bg-slate-100" onClick={() => moveColumn(column.key, 'up')} disabled={index === 0}>
                              <ArrowUp className="size-3.5 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-1 hover:bg-slate-100"
                              onClick={() => moveColumn(column.key, 'down')}
                              disabled={index === orderedColumns.length - 1}
                            >
                              <ArrowDown className="size-3.5 text-slate-500" />
                            </button>
                            <span className="truncate text-sm text-slate-700">{column.label}</span>
                          </div>
                          <button type="button" className="rounded-lg p-1 hover:bg-slate-100" onClick={() => toggleColumn(column.key)}>
                            {isVisible ? <EyeOff className="size-4 text-slate-500" /> : <Eye className="size-4 text-slate-500" />}
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
                <div className="absolute right-0 z-40 mt-2 w-48 max-w-[92vw] rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-100 px-4 py-10 text-center text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t('loading')}
              </span>
            </div>
          ) : isError ? (
            <div className="rounded-[1.5rem] border border-slate-100 px-4 py-10 text-center text-rose-500">
              {errorText ?? t('gridLoadError')}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-100 px-4 py-10 text-center text-slate-500">
              {emptyText ?? t('gridEmpty')}
            </div>
          ) : (
            rows.map((row) => (
              <div key={rowKey(row)} className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  {visibleColumns.map((column) => (
                    <div key={`${rowKey(row)}-${column.key}`} className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{column.label}</span>
                      <div className={cn('text-sm text-slate-700 break-words', column.className)}>
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-[1.75rem] border border-slate-100 md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/90">
              <tr className="border-b border-slate-200 text-slate-500">
                {visibleColumns.map((column) => {
                  const isActiveSort = sortBy === column.key;
                  return (
                    <th key={column.key} className="px-4 py-3 font-medium">
                      {column.sortable && onSort ? (
                        <button type="button" className="inline-flex items-center gap-2" onClick={() => onSort(column.key)}>
                          <span>{column.label}</span>
                          {isActiveSort ? (
                            sortDirection === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5 opacity-40" />
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
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="px-4 py-10 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('loading')}
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="px-4 py-10 text-center text-rose-500">
                    {errorText ?? t('gridLoadError')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="px-4 py-10 text-center text-slate-500">
                    {emptyText ?? t('gridEmpty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={rowKey(row)} className="border-b border-slate-100 last:border-b-0">
                    {visibleColumns.map((column) => (
                      <td key={`${rowKey(row)}-${column.key}`} className={cn('px-4 py-4 text-slate-700', column.className)}>
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              {t('totalRecords')}: <span className="font-semibold text-slate-900">{pagination.totalCount}</span>
            </span>
            <div className="flex items-center gap-2">
              <span>{t('pageSize')}</span>
              <select
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
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

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button type="button" variant="secondary" className="max-sm:flex-1" disabled={!pagination.hasPreviousPage} onClick={() => onPageNumberChange(Math.max(1, pagination.pageNumber - 1))}>
              <ChevronLeft className="mr-1 size-4" />
              {t('previous')}
            </Button>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 sm:px-4">
              {pagination.pageNumber} / {Math.max(pagination.totalPages, 1)}
            </div>
            <Button type="button" variant="secondary" className="max-sm:flex-1" disabled={!pagination.hasNextPage} onClick={() => onPageNumberChange(pagination.pageNumber + 1)}>
              {t('next')}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
