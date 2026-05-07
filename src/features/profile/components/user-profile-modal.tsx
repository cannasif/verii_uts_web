import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronDown, Globe, LogOut, Mail, Moon, Phone, ShieldCheck, Sun, UserCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getMyProfile } from '@/features/profile/api/profile-api';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  onOpenProfileDetails: () => void;
}

export function UserProfileModal({ open, onClose, onOpenProfileDetails }: UserProfileModalProps) {
  const { i18n, t } = useTranslation(['user-detail-management', 'common']);
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);
  const branchName = useAuthStore((state) => state.branchName);
  const { theme, toggleTheme } = useUiStore();
  const isLight = theme === 'light';
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const animationDuration = 450;

  useEffect(() => {
    let frame1: number | undefined;
    let frame2: number | undefined;
    let timeout: number | undefined;

    if (open) {
      setIsRendered(true);
      setIsClosing(false);
      setIsVisible(false);
      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => setIsVisible(true));
      });
    } else if (isRendered) {
      setIsVisible(false);
      setIsClosing(true);
      timeout = window.setTimeout(() => setIsRendered(false), animationDuration);
    }

    return () => {
      if (frame1 !== undefined) window.cancelAnimationFrame(frame1);
      if (frame2 !== undefined) window.cancelAnimationFrame(frame2);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [open, isRendered]);

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    enabled: open,
  });
  const languageOptions = [
    {
      value: 'tr',
      label: 'TR',
      description: 'Türkçe',
      icon: '🇹🇷',
    },
    {
      value: 'en',
      label: 'EN',
      description: 'English',
      icon: '🇬🇧',
    },
  ];

  const currentLanguage = (i18n.language ?? i18n.resolvedLanguage ?? 'tr').split('-')[0].toLowerCase();
  const selectedLanguage = languageOptions.find((option) => option.value === currentLanguage) ?? languageOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLanguageOpen]);

  const handleLanguageChange = async (lang: string) => {
    localStorage.setItem('verii_uts_lang', lang);
    await i18n.changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  if (!isRendered) return null;

  const profile = profileQuery.data?.data;
  const firstName = profile?.firstName ?? authUser?.firstName ?? '';
  const lastName = profile?.lastName ?? authUser?.lastName ?? '';
  const email = profile?.email ?? authUser?.email ?? '—';
  const branch = branchName ?? t('branch', { ns: 'common' });
  const phoneNumber = profile?.phoneNumber ?? '';
  const avatarLetter = (firstName.trim().charAt(0) || lastName.trim().charAt(0) || 'U').toUpperCase();

  const closeWithAnimation = () => {
    setIsClosing(true);
    window.setTimeout(() => onClose(), animationDuration);
  };

  const shouldShow = isVisible && !isClosing;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ease-out ${shouldShow ? 'opacity-100' : 'opacity-0'} ${isLight ? 'bg-slate-950/40' : 'bg-[#05010b]/78 backdrop-blur-[3px]'}`}>
      <div className={`relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] shadow-[0_30px_100px_rgba(15,23,42,0.28)] md:grid-cols-[330px_1fr] transition-all duration-500 ease-out ${shouldShow ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-5'} ${isLight ? 'bg-white' : 'border border-white/10 bg-[#12071f] shadow-[0_36px_110px_rgba(0,0,0,0.58)]'}`}>
        <button
          type="button"
          onClick={closeWithAnimation}
          className={`absolute right-5 top-5 z-10 rounded-2xl p-2 transition ${isLight ? 'bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white' : 'bg-white/7 text-slate-400 hover:bg-white/14 hover:text-white'}`}
        >
          <X className="size-4" />
        </button>

        <div className={`relative flex flex-col items-center justify-center gap-5 px-8 py-10 ${isLight ? 'bg-linear-to-b from-fuchsia-50/90 via-white to-violet-50/80 text-[#1f2430]' : 'bg-linear-to-b from-[#181022] to-[#100a16] text-white'}`}>
          <div className={`absolute left-[-20%] top-[-20%] h-64 w-64 rounded-full blur-[80px] ${isLight ? 'bg-fuchsia-300/12' : 'bg-pink-500/10'}`} />
          <div className={`relative flex size-32 items-center justify-center rounded-[2rem] text-4xl font-black ${isLight ? 'bg-linear-to-br from-fuchsia-600 via-pink-600 to-violet-600 text-white shadow-[0_18px_40px_rgba(192,38,211,0.18)]' : 'bg-linear-to-br from-pink-500 via-purple-600 to-orange-500 text-white'}`}>
            {avatarLetter}
          </div>
          <div className="relative text-center">
            <h2 className={`text-3xl font-black ${isLight ? 'text-[#101828]' : 'text-white'}`}>{firstName} {lastName}</h2>
            <p className={`mt-2 inline-flex rounded-full border px-4 py-1 mt-1 mt-1 text-sm font-bold uppercase tracking-[0.2em] ${isLight ? 'border-fuchsia-200/60 bg-fuchsia-50/90 text-fuchsia-800' : 'border-pink-400/30 bg-pink-500/15 text-pink-200'}`}>
              {branch}
            </p>
          </div>
          <div className="relative w-full space-y-3">
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mt-1 text-sm ${isLight ? 'bg-white/80 text-[#1f2430] shadow-[0_10px_24px_rgba(15,23,42,0.06)]' : 'bg-white/5 text-white/90'}`}>
              <Mail className={`size-4 ${isLight ? 'text-fuchsia-600' : 'text-pink-400'}`} />
              <span className="truncate">{email}</span>
            </div>
            {phoneNumber && (
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mt-1 text-sm ${isLight ? 'bg-white/80 text-[#1f2430] shadow-[0_10px_24px_rgba(15,23,42,0.06)]' : 'bg-white/5 text-white/90'}`}>
                <Phone className={`size-4 ${isLight ? 'text-fuchsia-600' : 'text-pink-400'}`} />
                <span className="truncate">{phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`flex flex-col p-6 md:p-10 ${isLight ? 'bg-white' : 'bg-[#150a24] text-slate-100'}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-linear-to-b from-pink-500 to-purple-600" />
            <h3 className={`text-4xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings', { ns: 'common' })}</h3>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className={`group flex w-full items-center justify-between rounded-[1.6rem] border px-5 py-5 transition hover:shadow-xl ${isLight ? 'border-slate-200 bg-slate-50/80 hover:border-pink-300 hover:bg-white' : 'border-white/10 bg-[#221633]/72 hover:border-pink-400/35 hover:bg-[#291a3d]'}`}
              onClick={() => {
                setIsClosing(true);
                window.setTimeout(() => onOpenProfileDetails(), animationDuration);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-4 ${isLight ? 'bg-fuchsia-100/90 text-fuchsia-800' : 'bg-[#342247] text-purple-200'}`}>
                  <UserCircle2 className="size-5" />
                </div>
                <div className="text-left">
                  <p className={`text-[1rem] font-bold leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('editProfileDetails', { ns: 'user-detail-management' })}</p>
                  <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('editProfileDescription', { ns: 'user-detail-management' })}</p>
                </div>
              </div>
              <ArrowRight className={`size-4 transition group-hover:translate-x-1 ${isLight ? 'text-slate-400' : 'text-slate-300'}`} />
            </button>

            <div className={`relative rounded-[1.7rem] border p-5 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-[#221633]/72'} `} ref={languageDropdownRef}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-4 ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#23324a] text-sky-300'}`}>
                    <Globe className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-[1rem] font-bold leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('language', { ns: 'common' })}</p>
                    <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('chooseLanguage', { ns: 'common' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLanguageOpen((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${isLight ? 'border-fuchsia-200/50 bg-white text-[#2A2C31] shadow-sm hover:bg-fuchsia-50 hover:text-fuchsia-900' : 'border-white/8 bg-[#342f40] text-slate-100 hover:bg-[#3d374d]'}`}
                >
                  <span className="text-xs tracking-[0.08em]">{selectedLanguage.label}</span>
                  <ChevronDown className="size-4" />
                </button>
              </div>
              {isLanguageOpen && (
                <div className={`absolute right-0 top-full z-10 mt-3 overflow-hidden rounded-[1.4rem] border ${isLight ? 'border-[rgba(255,138,196,0.24)] bg-white shadow-xl' : 'border-white/10 bg-[#12061d] shadow-[0_15px_45px_rgba(0,0,0,0.3)]'}`} style={{ minWidth: '220px', maxWidth: '250px' }}>
                  <div className="max-h-64 overflow-y-auto overscroll-contain">
                    {languageOptions.map((language) => {
                      const selected = currentLanguage === language.value;
                      return (
                        <button
                          key={language.value}
                          type="button"
                          onClick={() => void handleLanguageChange(language.value)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${selected ? (isLight ? 'bg-fuchsia-50 font-medium text-fuchsia-900' : 'bg-pink-500/10 text-pink-100') : (isLight ? 'text-slate-700 hover:bg-fuchsia-50/80' : 'text-slate-300 hover:bg-white/5')}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1d142a] text-lg text-white">{language.icon}</span>
                            <div>
                              <p className="font-semibold leading-5">{language.description}</p>
                              <p className="text-[0.65rem] uppercase tracking-[0.2em] opacity-70">{language.label}</p>
                            </div>
                          </div>
                          {selected ? <Check className="size-4 text-emerald-400" /> : <div className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-[1.7rem] border p-5 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-[#221633]/72'} `}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-4 ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#3a2714] text-amber-300'}`}>
                    {isLight ? <Sun className="size-5" /> : <Moon className="size-5" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-[1rem] font-bold leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('appearance', { ns: 'common' })}</p>
                    <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('selectThemeMode', { ns: 'common' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isLight}
                  aria-label={t('appearance', { ns: 'common' })}
                  onClick={toggleTheme}
                  className={`inline-flex h-8 w-14 items-center rounded-full p-0.5 transition ${theme === 'dark' ? 'justify-end bg-linear-to-r from-[#ff4aa6] via-[#ff3f8c] to-[#ff5c8c]' : 'justify-start bg-slate-300/80'}`}
                >
                  <span className={`flex size-7 items-center justify-center rounded-full bg-white shadow-[0_3px_10px_rgba(15,23,42,0.18)] transition ${theme === 'dark' ? 'text-[#ff3f8c]' : 'text-fuchsia-600'}`}>
                    {theme === 'dark' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button className={`h-14 w-full rounded-[1.6rem] ${isLight ? '' : '!bg-linear-to-r !from-[#ff008f] !via-[#ff2f6f] !to-[#ff5a2d] !text-white shadow-[0_18px_30px_rgba(255,64,128,0.24)] hover:brightness-110'}`} onClick={logout}>
              <LogOut className="mr-2 size-4" />
              {t('logout', { ns: 'common' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
