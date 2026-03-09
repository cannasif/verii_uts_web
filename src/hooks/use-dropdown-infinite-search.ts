import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PagedApiResponse, PagedRequest } from '@/types/api';

interface UseDropdownInfiniteSearchOptions<TItem> {
  queryKey: readonly unknown[];
  searchTerm: string;
  enabled?: boolean;
  minChars: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  fetchPage: (request: PagedRequest) => Promise<PagedApiResponse<TItem>>;
}

export function useDropdownInfiniteSearch<TItem>({
  queryKey,
  searchTerm,
  enabled = true,
  minChars,
  pageSize,
  sortBy,
  sortDirection,
  fetchPage,
}: UseDropdownInfiniteSearchOptions<TItem>) {
  const normalizedSearchTerm = searchTerm.trim();
  const isBrowseMode = normalizedSearchTerm.length === 0;
  const isSearchMode = normalizedSearchTerm.length >= minChars;
  const isThresholdMode = !isBrowseMode && !isSearchMode;
  const effectiveSearchTerm = isSearchMode ? normalizedSearchTerm : undefined;

  const query = useInfiniteQuery({
    queryKey: [...queryKey, effectiveSearchTerm ?? '', pageSize, sortBy ?? '', sortDirection ?? ''],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPage({
        pageNumber: pageParam,
        pageSize,
        search: effectiveSearchTerm,
        sortBy,
        sortDirection,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.pageNumber + 1 : undefined;
    },
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) ?? [];
  }, [query.data]);

  return {
    items,
    isBrowseMode,
    isSearchMode,
    isThresholdMode,
    hasNextPage: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
