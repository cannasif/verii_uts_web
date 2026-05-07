import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMe, getMyPermissions, login, type LoginRequest } from '@/features/auth/api/auth-api';
import { ApiError } from '@/lib/api-client';
import i18n from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth-store';

function isInvalidLoginAttempt(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 400;
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    msg.includes('geçersiz') ||
    msg.includes('invalid') ||
    msg.includes('unauthorized') ||
    msg.includes('yanlış')
  );
}

export function useLoginMutation() {
  const setToken = useAuthStore((state) => state.setToken);
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      let authResult;
      try {
        authResult = await login(payload);
      } catch (error) {
        if (isInvalidLoginAttempt(error)) {
          throw new Error(i18n.t('invalidLoginCredentials', { ns: 'auth' }));
        }
        throw error;
      }
      const accessToken = authResult.data.token.accessToken;
      const rememberMe = payload.rememberMe ?? true;
      setToken(accessToken, rememberMe);

      const [meResult, permissionsResult] = await Promise.all([getMe(), getMyPermissions()]);

      setSession({
        token: accessToken,
        user: meResult.data,
        permissions: permissionsResult.data,
        branchId: payload.branchId,
        branchName: payload.branchName,
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
