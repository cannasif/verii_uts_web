import { create } from 'zustand';

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
  setToken: (token: string, rememberMe: boolean) => void;
  setSession: (payload: { token: string; user: AuthUser; permissions: string[]; rememberMe: boolean }) => void;
  logout: () => void;
  hydrate: () => void;
  isAuthenticated: () => boolean;
}

const TOKEN_KEY = 'access_token';
const USER_KEY = 'verii_uts_user';
const PERMISSIONS_KEY = 'verii_uts_permissions';

function clearSessionStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
  sessionStorage.removeItem(PERMISSIONS_KEY);
}

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  permissions: [],
  setToken: (token, rememberMe) => {
    clearSessionStorage();
    getStorage(rememberMe).setItem(TOKEN_KEY, token);
    set({ token });
  },
  setSession: ({ token, user, permissions, rememberMe }) => {
    clearSessionStorage();
    const storage = getStorage(rememberMe);
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    storage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    set({ token, user, permissions });
  },
  logout: () => {
    clearSessionStorage();
    set({ token: null, user: null, permissions: [] });
  },
  hydrate: () => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    const rawPermissions = localStorage.getItem(PERMISSIONS_KEY) || sessionStorage.getItem(PERMISSIONS_KEY);

    if (!token || !rawUser) {
      return;
    }

    set({
      token,
      user: JSON.parse(rawUser) as AuthUser,
      permissions: rawPermissions ? (JSON.parse(rawPermissions) as string[]) : [],
    });
  },
  isAuthenticated: () => Boolean(get().token || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)),
}));
