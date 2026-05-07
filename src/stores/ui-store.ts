import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'verii_uts_theme';

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}

function getStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') {
    return 'dark';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

interface UiState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  searchQuery: string;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  initializeTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  searchQuery: '',
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }
      applyThemeToDocument(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    applyThemeToDocument(theme);
    set({ theme });
  },
  initializeTheme: () => {
    const initialTheme = getStoredTheme();
    applyThemeToDocument(initialTheme);
    set({ theme: initialTheme });
  },
}));
