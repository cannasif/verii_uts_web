import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/features/users/api/users-api';
import type { PagedRequest } from '@/types/api';

export function useUsersQuery(request: PagedRequest) {
  return useQuery({
    queryKey: ['users', request],
    queryFn: () => searchUsers(request),
  });
}
