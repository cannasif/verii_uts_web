import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Globe, Moon, Search, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { UserProfileModal } from '@/features/profile/components/user-profile-modal';
import { loadLanguage } from '@/lib/i18n';

export function Navbar() {
  const { t, i18n } = useTranslation(['common', 'dashboard', 'user-management', 'role-management', 'access-control', 'user-detail-management', 'uts-verme-list-management', 'uts-uretim-list-management', 'uts-tverme-list-management', 'uts-tuketici-verme-list-management', 'uts-ithalat-list-management', 'uts-imha-list-management', 'uts-ihracat-list-management', 'uts-alma-list-management']);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { toggleSidebar, searchQuery, setSearchQuery, setSidebarOpen, theme, toggleTheme, isSidebarCollapsed } = useUiStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language).split('-')[0];
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLanguageOpen]);

  const handleLanguageChange = async (lang: string) => {
    await loadLanguage(lang);
    await i18n.changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-30 border-b px-3 backdrop-blur-xl sm:px-4 lg:px-8 ${theme === 'light' ? 'border-purple-200/30 bg-white/90' : 'border-[#ff7a55]/20 bg-[#12061f]/86'}`}>
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex w-full items-center gap-2 sm:gap-3">
          <div className="relative hidden w-[280px] lg:block xl:w-[340px]">
            <Search className={`pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 ${theme === 'light' ? 'text-[#5E626D]' : 'text-[#bba6c9]'}`} />
            <Input
              ref={searchRef}
              className={`h-11 rounded-2xl pl-11 pr-16 ${theme === 'light' ? 'border-purple-200/50 bg-white/80 text-[#2A2C31] placeholder:text-[#5E626D] focus:border-purple-300/70 focus:bg-white' : 'border-white/10 bg-white/5 text-[#f4effa] backdrop-blur-xl placeholder:text-[#9f8baa] focus:border-cyan-300/35 focus:bg-white/8 focus:ring-0'} `}
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
                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${theme === 'light' ? 'text-[#5E626D] hover:bg-purple-100/60 hover:text-[#7C3AED]' : 'text-[#ab97ba] hover:bg-white/10 hover:text-[#ffd8c1]'}`}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button type="button" className={`hidden size-12 items-center justify-center rounded-2xl border sm:flex ${theme === 'light' ? 'border-purple-200/40 bg-white/70 text-[#5E626D] shadow-sm hover:bg-purple-50/50' : 'border-[#ff7a55]/16 bg-[#1a0d2a]/75 text-[#e7d4f4] hover:border-[#ff8a60]/36 hover:text-[#ffd5bf]'}`}>
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex size-12 items-center justify-center rounded-2xl border transition ${theme === 'light' ? 'border-purple-200/50 bg-white/80 text-[#7C3AED] shadow-sm hover:bg-purple-50/60' : 'border-white/10 bg-white/5 text-pink-200 backdrop-blur-xl hover:border-white/20 hover:text-pink-100'}`}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
          <div className="relative" ref={languageRef}>
            <button
              type="button"
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className={`flex size-12 items-center justify-center rounded-2xl border transition ${theme === 'light' ? 'border-purple-200/50 bg-white/80 text-[#5E626D] shadow-sm hover:bg-purple-50/60' : 'border-white/10 bg-white/5 text-pink-200 backdrop-blur-xl hover:border-white/20 hover:text-pink-100'}`}
              title="Change Language"
            >
              <Globe className="size-5" />
            </button>
            {isLanguageOpen && (
              <div
                className={`absolute right-0 top-full mt-2 rounded-2xl border shadow-lg ${theme === 'light' ? 'border-purple-200/50 bg-white/98' : 'border-white/10 bg-[#160f26]/95 backdrop-blur-xl'}`}
              >
                <button
                  type="button"
                  onClick={() => handleLanguageChange('tr')}
                  className={`block w-full px-4 py-2 text-left text-sm transition ${
                    currentLanguage === 'tr'
                      ? theme === 'light'
                        ? 'bg-purple-100/70 text-[#7C3AED] font-semibold'
                        : 'bg-pink-500/20 text-pink-200 font-semibold'
                      : theme === 'light'
                        ? 'text-[#2A2C31] hover:bg-purple-50/50'
                        : 'text-slate-300 hover:bg-white/10'
                  } first:rounded-t-xl`}
                >
                  Türkçe
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`block w-full px-4 py-2 text-left text-sm transition ${
                    currentLanguage === 'en'
                      ? theme === 'light'
                        ? 'bg-purple-100/70 text-[#7C3AED] font-semibold'
                        : 'bg-pink-500/20 text-pink-200 font-semibold'
                      : theme === 'light'
                        ? 'text-[#2A2C31] hover:bg-purple-50/50'
                        : 'text-slate-300 hover:bg-white/10'
                  } last:rounded-b-xl`}
                >
                  English
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2 transition sm:gap-3 sm:px-4 sm:py-2.5 ${theme === 'light' ? 'border-purple-200/50 bg-white/80 shadow-sm hover:bg-purple-50/40' : 'border-[#ff7a55]/16 bg-[#1a0d2a]/72 hover:border-[#ff5f77]/50 hover:bg-[#2a1233]/82'}`}
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white sm:size-11 ${theme === 'light' ? 'bg-linear-to-r from-purple-600 to-purple-500' : 'bg-linear-to-r from-[#ff2f92] via-[#ff5a63] to-[#ff7f2a]'}`}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden min-w-0 text-left lg:block">
              <p className={`text-sm font-semibold ${theme === 'light' ? 'text-[#2A2C31]' : 'bg-linear-to-r from-[#ff8bc7] via-[#ff9f9f] to-[#ffc58e] bg-clip-text text-transparent'}`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${theme === 'light' ? 'text-[#5E626D]' : 'bg-linear-to-r from-[#ff8ac4] to-[#ffb067] bg-clip-text text-transparent'}`}>{user?.role}</p>
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
