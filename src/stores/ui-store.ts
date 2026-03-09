import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  searchQuery: string;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  searchQuery: '',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
  setSearchQuery: (value) => set({ searchQuery: value }),
}));
