import type { FilterRule } from '@/types/api';

export type FilterRow = {
  id: string;
  column: string;
  operator: string;
  value: string;
};

export type FilterColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface FilterColumnConfig {
  value: string;
  label: string;
  type: FilterColumnType;
}

export const STRING_OPERATORS = ['contains', 'startsWith', 'endsWith', 'eq'] as const;
export const NUMERIC_DATE_OPERATORS = ['eq', 'gt', 'gte', 'lt', 'lte'] as const;

export function createFilterRow(defaultColumn: string, columns: readonly FilterColumnConfig[]): FilterRow {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    column: defaultColumn,
    operator: getDefaultOperatorForColumn(defaultColumn, columns),
    value: '',
  };
}

export function getOperatorsForColumn(
  column: string,
  columns: readonly FilterColumnConfig[],
): readonly string[] {
  const config = columns.find((item) => item.value === column);
  if (!config) {
    return STRING_OPERATORS;
  }

  if (config.type === 'string') {
    return STRING_OPERATORS;
  }

  if (config.type === 'boolean') {
    return ['eq'] as const;
  }

  return NUMERIC_DATE_OPERATORS;
}

export function getDefaultOperatorForColumn(
  column: string,
  columns: readonly FilterColumnConfig[],
): string {
  const config = columns.find((item) => item.value === column);
  if (!config || config.type === 'string') {
    return 'contains';
  }

  return 'eq';
}

export function rowsToBackendFilters(rows: FilterRow[]): FilterRule[] {
  return rows
    .filter((row) => row.value.trim().length > 0)
    .map((row) => ({
      column: row.column,
      operator: row.operator,
      value: row.value.trim(),
    }));
}
