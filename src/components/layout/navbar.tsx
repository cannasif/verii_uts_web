import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Menu, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { UserProfileModal } from '@/features/profile/components/user-profile-modal';

const titles: Record<string, { eyebrow: string; title: string; titleNs?: string }> = {
  '/': { eyebrow: 'general', title: 'title', titleNs: 'dashboard' },
  '/users': { eyebrow: 'accessManagement', title: 'title', titleNs: 'user-management' },
  '/roles': { eyebrow: 'accessManagement', title: 'title', titleNs: 'role-management' },
  '/permission-groups': { eyebrow: 'accessManagement', title: 'permissionGroupsTitle', titleNs: 'access-control' },
  '/customers': { eyebrow: 'system', title: 'title', titleNs: 'customer-management' },
  '/stocks': { eyebrow: 'system', title: 'title', titleNs: 'stock-management' },
  '/uts-verme-list': { eyebrow: 'system', title: 'title', titleNs: 'uts-verme-list-management' },
  '/hangfire-monitoring': { eyebrow: 'system', title: 'title', titleNs: 'hangfire-monitoring' },
  '/profile': { eyebrow: 'general', title: 'profileDetails', titleNs: 'user-detail-management' },
};

export function Navbar() {
  const { t } = useTranslation(['common', 'dashboard', 'user-management', 'role-management', 'access-control', 'user-detail-management', 'uts-verme-list-management']);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { toggleSidebar, searchQuery, setSearchQuery, setSidebarOpen } = useUiStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const currentTitle = useMemo(() => titles[location.pathname] ?? { eyebrow: 'logoName', title: 'panel', titleNs: 'common' }, [location.pathname]);

  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname, setSearchQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-3 backdrop-blur-xl dark:border-white/5 dark:bg-[#0c0516]/80 sm:px-4 lg:px-8">
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-pink-500/10 hover:text-pink-500"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500 md:hidden">{t(currentTitle.eyebrow, { ns: 'common' })}</p>
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white md:hidden">{t(currentTitle.title, { ns: currentTitle.titleNs ?? 'common' })}</h2>
          <div className="hidden md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">{t(currentTitle.eyebrow, { ns: 'common' })}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{t(currentTitle.title, { ns: currentTitle.titleNs ?? 'common' })}</h2>
          </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <div className="relative hidden w-[280px] lg:block xl:w-[340px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              className="h-11 rounded-2xl border-slate-200 bg-slate-100/70 pl-11 pr-16 focus:bg-white"
              placeholder={t('menuSearch', { ns: 'common' })}
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (event.target.value.trim()) {
                  setSidebarOpen(true);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button type="button" className="hidden size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 sm:flex">
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 transition hover:border-pink-200 hover:bg-pink-50/40 sm:gap-3 sm:px-4 sm:py-2.5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r from-indigo-600 to-fuchsia-600 text-sm font-bold text-white sm:size-11">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden min-w-0 text-left lg:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </button>
        </div>
        </div>
      </header>
      <UserProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenProfileDetails={() => {
          setIsProfileModalOpen(false);
          navigate('/profile');
        }}
      />
    </>
  );
}
