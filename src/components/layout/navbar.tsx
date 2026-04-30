import { useEffect, useRef, useState } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/stores/ui-store';
import { UserProfileModal } from '@/features/profile/components/user-profile-modal';

export function Navbar() {
  const { t } = useTranslation(['common', 'dashboard', 'user-management', 'role-management', 'access-control', 'user-detail-management', 'uts-verme-list-management', 'uts-uretim-list-management', 'uts-tverme-list-management', 'uts-tuketici-verme-list-management', 'uts-ithalat-list-management', 'uts-imha-list-management', 'uts-ihracat-list-management', 'uts-alma-list-management']);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { searchQuery, setSearchQuery, setSidebarOpen, theme } = useUiStore();
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
      <header className={`sticky top-0 z-30 border-b border-transparent px-3 backdrop-blur-xl sm:px-4 lg:px-8 ${theme === 'light' ? 'bg-white/90' : 'bg-[#12061f]/86'} relative overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent`}>
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex w-full items-center gap-2 sm:gap-3">
          <div className="relative hidden w-[280px] lg:block xl:w-[340px]">
            <Search className={`pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 ${theme === 'light' ? 'text-[#5E626D]' : 'text-[#bba6c9]'}`} />
            <Input
              ref={searchRef}
              className={`h-11 rounded-2xl pl-11 pr-16 ${theme === 'light' ? 'border-[rgba(255,138,196,0.32)] bg-white/80 text-[#2A2C31] placeholder:text-[#5E626D] focus:border-[#ff8ac4]/70 focus:bg-white' : 'border-white/10 bg-white/5 text-[#f4effa] backdrop-blur-xl placeholder:text-[#9f8baa] focus:border-cyan-300/35 focus:bg-white/8 focus:ring-0'} `}
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
                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${theme === 'light' ? 'text-[#5E626D] hover:bg-[#ff8ac4]/12 hover:text-[#ff5f40]' : 'text-[#ab97ba] hover:bg-white/10 hover:text-[#ffd8c1]'}`}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button type="button" className={`hidden size-9 items-center justify-center rounded-full transition sm:flex ${theme === 'light' ? 'text-[#5E626D] hover:bg-[#ff8ac4]/12 hover:text-[#ff5f40]' : 'text-[#e7d4f4] hover:text-orange-400 hover:shadow-[0_0_16px_rgba(249,115,22,0.6)]'}`}>
            <Bell className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`group flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl border px-2.5 py-2 transition sm:gap-3 sm:px-4 sm:py-2.5 flex-row-reverse ${theme === 'light' ? 'border-[rgba(255,138,196,0.38)] bg-white/80 shadow-sm hover:bg-[rgba(255,90,99,0.06)]' : 'bg-transparent border-0 hover:bg-transparent'}`}
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:size-11 border-2 transition ${theme === 'light' ? 'border-[#ff3a9b] bg-transparent text-[#ff5f40] group-hover:shadow-[0_0_20px_rgba(255,90,99,0.35)]' : 'border-orange-500 bg-transparent text-orange-400 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]'}`}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden min-w-0 text-left lg:block">
              <p className={`text-sm font-semibold ${theme === 'light' ? 'text-[#2A2C31]' : 'text-white'}`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme === 'light' ? 'text-[#5E626D]' : 'text-slate-400'}`}>{user?.role}</p>
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
