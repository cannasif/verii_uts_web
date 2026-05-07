import { create } from 'zustand';
import { useUiStore } from '@/stores/ui-store';

interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  permissions: string[];
  branchId: number | null;
  branchName: string | null;
  setToken: (token: string, rememberMe: boolean) => void;
  setSession: (payload: { token: string; user: AuthUser; permissions: string[]; branchId?: number; branchName?: string; rememberMe: boolean }) => void;
  logout: () => void;
  hydrate: () => void;
  isAuthenticated: () => boolean;
}

const TOKEN_KEY = 'access_token';
const USER_KEY = 'verii_uts_user';
const PERMISSIONS_KEY = 'verii_uts_permissions';
const BRANCH_ID_KEY = 'verii_uts_branch_id';
const BRANCH_NAME_KEY = 'verii_uts_branch_name';

function clearSessionStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
  sessionStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(BRANCH_ID_KEY);
  sessionStorage.removeItem(BRANCH_ID_KEY);
  localStorage.removeItem(BRANCH_NAME_KEY);
  sessionStorage.removeItem(BRANCH_NAME_KEY);
}

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  permissions: [],
  branchId: null,
  branchName: null,
  setToken: (token, rememberMe) => {
    clearSessionStorage();
    getStorage(rememberMe).setItem(TOKEN_KEY, token);
    set({ token });
  },
  setSession: ({ token, user, permissions, branchId, branchName, rememberMe }) => {
    clearSessionStorage();
    const storage = getStorage(rememberMe);
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    storage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    if (branchId != null) {
      storage.setItem(BRANCH_ID_KEY, String(branchId));
    }
    if (branchName) {
      storage.setItem(BRANCH_NAME_KEY, branchName);
    }
    set({ token, user, permissions, branchId: branchId ?? null, branchName: branchName ?? null });
  },
  logout: () => {
    clearSessionStorage();
    useUiStore.getState().setTheme('dark');
    set({ token: null, user: null, permissions: [], branchId: null, branchName: null });
  },
  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    const rawPermissions = localStorage.getItem(PERMISSIONS_KEY) || sessionStorage.getItem(PERMISSIONS_KEY);
    const rawBranchId = localStorage.getItem(BRANCH_ID_KEY) || sessionStorage.getItem(BRANCH_ID_KEY);
    const branchName = localStorage.getItem(BRANCH_NAME_KEY) || sessionStorage.getItem(BRANCH_NAME_KEY);

    if (!token || !rawUser) {
      return;
    }

    set({
      token,
      user: JSON.parse(rawUser) as AuthUser,
      permissions: rawPermissions ? (JSON.parse(rawPermissions) as string[]) : [],
      branchId: rawBranchId ? Number(rawBranchId) : null,
      branchName: branchName ?? null,
    });
  },
  isAuthenticated: () => Boolean(get().token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)),
}));
