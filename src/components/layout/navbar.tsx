import { useEffect, useRef, useState } from 'react';
import { Bell, Menu, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { UserProfileModal } from '@/features/profile/components/user-profile-modal';

export function Navbar() {
  const { t } = useTranslation(['common', 'dashboard', 'user-management', 'role-management', 'access-control', 'user-detail-management', 'uts-verme-list-management', 'uts-uretim-list-management', 'uts-tverme-list-management', 'uts-tuketici-verme-list-management', 'uts-ithalat-list-management', 'uts-imha-list-management', 'uts-ihracat-list-management', 'uts-alma-list-management']);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { searchQuery, setSearchQuery, setSidebarOpen, theme, toggleSidebar, toggleSidebarCollapsed } = useUiStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
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
      <header
        className={`sticky top-0 z-30 border-b border-transparent px-3 backdrop-blur-xl sm:px-4 lg:px-8 ${theme === 'light' ? 'bg-white/95 shadow-purple-500/5' : 'bg-[#11061d]/90'} relative overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent`}
      >
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex w-full items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar();
                return;
              }
              toggleSidebarCollapsed();
            }}
            className={`flex-shrink-0 rounded-xl p-2 transition-colors ${theme === 'light' ? 'text-[#5E626D] hover:bg-fuchsia-500/10 hover:text-fuchsia-700' : 'text-[#c8b5d8] hover:bg-white/6 hover:text-[#ffd5bf]'}`}
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" />
          </button>
          <div className="relative hidden w-[280px] lg:block xl:w-[340px]">
            <Search
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 z-20 size-4 -translate-y-1/2',
                theme === 'light' ? 'text-[#5E626D]' : 'text-[#bba6c9]',
              )}
              aria-hidden
            />
            <Input
              ref={searchRef}
              className={cn(
                'relative z-10 h-11 rounded-2xl pl-11 pr-16',
                theme === 'light'
                  ? 'border-2 border-fuchsia-500/80 ring-2 ring-fuchsia-300/45 bg-white text-[#2A2C31] placeholder:text-[#5E626D] shadow-[inset_0_1px_0_rgba(255,255,255,0.98)] focus:border-fuchsia-600 focus:ring-fuchsia-400/55 focus:bg-white focus:shadow-[0_0_0_3px_rgba(217,70,239,0.18)]'
                  : 'border-white/10 bg-white/5 text-[#f4effa] backdrop-blur-xl placeholder:text-[#9f8baa] focus:border-cyan-300/35 focus:bg-white/8 focus:ring-0',
              )}
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
                className={cn(
                  'absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 transition',
                  theme === 'light' ? 'text-[#5E626D] hover:bg-fuchsia-100/80 hover:text-fuchsia-700' : 'text-[#ab97ba] hover:bg-white/10 hover:text-[#ffd8c1]',
                )}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={t('notifications', { ns: 'common' })}
            className={cn(
              'hidden size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-[0.98] sm:flex',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
              theme === 'light'
                ? cn(
                    'border border-[rgba(255,138,196,0.32)] bg-white/80 text-[#5E626D] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm',
                    'hover:border-fuchsia-300/50 hover:bg-white hover:text-fuchsia-800 hover:shadow-[0_4px_16px_rgba(192,38,211,0.1)]',
                    'focus-visible:ring-[rgba(236,72,153,0.35)]',
                  )
                : cn(
                    'border border-white/[0.08] bg-white/[0.04] text-[#bba6c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md',
                    'hover:border-pink-400/25 hover:bg-pink-500/[0.1] hover:text-[#fce7f3] hover:shadow-[0_0_28px_-6px_rgba(236,72,153,0.45)]',
                    'focus-visible:ring-pink-400/35',
                  ),
            )}
          >
            <Bell className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={cn(
              'group flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl border px-2.5 py-2 transition flex-row-reverse sm:gap-3 sm:px-4 sm:py-2.5',
              theme === 'light'
                ? 'border-[rgba(255,138,196,0.38)] bg-white/80 shadow-sm hover:bg-[rgba(255,90,99,0.06)] sm:gap-2 sm:px-3 sm:py-1.5'
                : 'border-0 bg-transparent hover:bg-transparent',
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full border-2 font-bold transition',
                theme === 'light'
                  ? 'size-8 text-[11px] border-fuchsia-500 bg-transparent text-fuchsia-800 group-hover:shadow-[0_0_16px_rgba(192,38,211,0.2)] sm:size-9 sm:text-xs'
                  : 'size-10 text-sm sm:size-11 border-orange-500 bg-transparent text-orange-400 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]',
              )}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden min-w-0 text-left lg:block">
              <p
                className={cn(
                  'font-semibold',
                  theme === 'light' ? 'text-[11px] leading-tight text-[#2A2C31] sm:text-xs' : 'text-sm text-white',
                )}
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p
                className={cn(
                  'font-semibold uppercase tracking-[0.08em]',
                  theme === 'light' ? 'text-[9px] leading-tight text-[#5E626D] sm:text-[10px]' : 'text-xs text-slate-400',
                )}
              >
                {user?.role}
              </p>
            </div>
          </button>
          </div>
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
