import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMe, getMyPermissions, login, type LoginRequest } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export function useLoginMutation() {
  const setToken = useAuthStore((state) => state.setToken);
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const authResult = await login(payload);
      const accessToken = authResult.data.token.accessToken;
      const rememberMe = payload.rememberMe ?? true;
      setToken(accessToken, rememberMe);

      const [meResult, permissionsResult] = await Promise.all([getMe(), getMyPermissions()]);

      setSession({
        token: accessToken,
        user: meResult.data,
        permissions: permissionsResult.data,
        rememberMe,
      });

      return authResult;
    },
    onSuccess: (result) => {
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
