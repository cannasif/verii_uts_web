const COLUMN_STORAGE_PREFIX = 'uts-grid-columns';

export interface ColumnPreferences {
  visibleKeys: string[];
  order: string[];
}

function getStorageKey(pageKey: string, userId?: number) {
  return `${COLUMN_STORAGE_PREFIX}:${pageKey}:${userId ?? 'anonymous'}`;
}

export function loadColumnPreferences(
  pageKey: string,
  userId: number | undefined,
  defaultOrder: string[],
) {
  try {
    const raw = localStorage.getItem(getStorageKey(pageKey, userId));
    if (!raw) {
      return {
        visibleKeys: [...defaultOrder],
        order: [...defaultOrder],
      } satisfies ColumnPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<ColumnPreferences>;
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((key) => defaultOrder.includes(key))
      : [];
    const visibleKeys = Array.isArray(parsed.visibleKeys)
      ? parsed.visibleKeys.filter((key) => defaultOrder.includes(key))
      : [];

    return {
      order: order.length > 0 ? [...order, ...defaultOrder.filter((key) => !order.includes(key))] : [...defaultOrder],
      visibleKeys: visibleKeys.length > 0 ? visibleKeys : [...defaultOrder],
    } satisfies ColumnPreferences;
  } catch {
    return {
      visibleKeys: [...defaultOrder],
      order: [...defaultOrder],
    } satisfies ColumnPreferences;
  }
}

export function saveColumnPreferences(pageKey: string, userId: number | undefined, preferences: ColumnPreferences) {
  try {
    localStorage.setItem(getStorageKey(pageKey, userId), JSON.stringify(preferences));
  } catch {
    // Ignore storage failures.
  }
}
