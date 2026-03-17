import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppDataGrid, type DataGridColumn, type DataGridSortDirection } from '@/components/shared/data-grid';
import { Button } from '@/components/ui/button';
import { loadColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences';

interface UtsViewGridProps<TRow> {
  pageKey: string;
  userId?: number;
  rows: TRow[];
  columns: DataGridColumn<TRow>[];
  rowKey: (row: TRow) => string | number;
  exportFileName: string;
  searchPlaceholder: string;
  headerAction?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
}

function getComparableValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  return String(value).toLowerCase();
}

export function UtsViewGrid<TRow>({
  pageKey,
  userId,
  rows,
  columns,
  rowKey,
  exportFileName,
  searchPlaceholder,
  headerAction,
  isLoading = false,
  isError = false,
}: UtsViewGridProps<TRow>) {
  const { t } = useTranslation('common');
  const defaultColumnOrder = useMemo(() => columns.map((column) => column.key), [columns]);
  const defaultVisibleColumns = useMemo(() => columns.map((column) => column.key), [columns]);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState(columns[0]?.key);
  const [sortDirection, setSortDirection] = useState<DataGridSortDirection>('asc');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(defaultVisibleColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  useEffect(() => {
    setVisibleColumnKeys(defaultVisibleColumns);
    setColumnOrder(defaultColumnOrder);
  }, [defaultColumnOrder, defaultVisibleColumns]);

  useEffect(() => {
    const preferences = loadColumnPreferences(pageKey, userId, defaultColumnOrder);
    setVisibleColumnKeys(preferences.visibleKeys.length > 0 ? preferences.visibleKeys : defaultVisibleColumns);
    setColumnOrder(preferences.order);
  }, [defaultColumnOrder, defaultVisibleColumns, pageKey, userId]);

  useEffect(() => {
    saveColumnPreferences(pageKey, userId, {
      visibleKeys: visibleColumnKeys,
      order: columnOrder,
    });
  }, [columnOrder, pageKey, userId, visibleColumnKeys]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (!normalizedSearch) return true;
        return columns.some((column) => {
          const rawValue = column.exportValue
            ? column.exportValue(row)
            : (row as Record<string, unknown>)[column.key];
          return String(rawValue ?? '').toLowerCase().includes(normalizedSearch);
        });
      })
      .sort((leftRow, rightRow) => {
        if (!sortBy) return 0;

        const leftValue = getComparableValue((leftRow as Record<string, unknown>)[sortBy]);
        const rightValue = getComparableValue((rightRow as Record<string, unknown>)[sortBy]);
        const comparison = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [columns, rows, searchValue, sortBy, sortDirection]);

  const exportRows = useMemo<Record<string, unknown>[]>(() =>
    filteredRows.map((row) => {
      const record: Record<string, unknown> = {};
      columns.forEach((column) => {
        record[column.key] = column.exportValue ? column.exportValue(row) : (row as Record<string, unknown>)[column.key];
      });
      return record;
    }), [columns, filteredRows]);

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedRowIds.includes(String(rowKey(row)))),
    [filteredRows, rowKey, selectedRowIds],
  );

  const handleUtsNotify = () => {
    if (selectedRowIds.length === 0) return;
    toast.success(t('utsNotifySuccess'));
    setSelectedRowIds([]);
  };

  return (
    <AppDataGrid
      pageKey={pageKey}
      userId={userId}
      searchValue={searchValue}
      onSearchValueChange={setSearchValue}
      searchPlaceholder={searchPlaceholder}
      columns={columns}
      visibleColumnKeys={visibleColumnKeys}
      columnOrder={columnOrder}
      onVisibleColumnKeysChange={setVisibleColumnKeys}
      onColumnOrderChange={setColumnOrder}
      rows={filteredRows}
      rowKey={rowKey}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={(columnKey) => {
        setSortDirection((current) => (sortBy === columnKey ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
        setSortBy(columnKey);
      }}
      hidePagination
      isLoading={isLoading}
      isError={isError}
      exportFileName={exportFileName}
      exportRows={exportRows}
      selectableRows
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={setSelectedRowIds}
      headerAction={
        <div className="flex items-center gap-2">
          {headerAction}
          <Button type="button" disabled={selectedRows.length === 0} onClick={handleUtsNotify}>
            {t('utsNotify')}
          </Button>
        </div>
      }
    />
  );
}
