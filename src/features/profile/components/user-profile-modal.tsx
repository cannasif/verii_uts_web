import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronDown, Globe, LogOut, Mail, Moon, Phone, ShieldCheck, Sun, UserCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getMyProfile } from '@/features/profile/api/profile-api';
import { buildAssetUrl } from '@/lib/utils';
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
  const role = profile?.role ?? authUser?.role ?? t('role', { ns: 'common' });
  const phoneNumber = profile?.phoneNumber ?? '';
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}` || 'VU';

  const closeWithAnimation = () => {
    setIsClosing(true);
    window.setTimeout(() => onClose(), animationDuration);
  };

  const shouldShow = isVisible && !isClosing;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ease-out ${shouldShow ? 'opacity-100' : 'opacity-0'} ${isLight ? 'bg-slate-950/40' : 'bg-[#05010b]/72 backdrop-blur-[2px]'}`}>
      <div className={`relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] shadow-[0_30px_100px_rgba(15,23,42,0.28)] md:grid-cols-[320px_1fr] transition-all duration-500 ease-out ${shouldShow ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-5'} ${isLight ? 'bg-white' : 'border border-white/10 bg-[#12071f] shadow-[0_30px_100px_rgba(0,0,0,0.55)]'}`}>
        <button
          type="button"
          onClick={closeWithAnimation}
          className={`absolute right-5 top-5 z-10 rounded-2xl p-2 transition ${isLight ? 'bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white' : 'bg-white/8 text-slate-300 hover:bg-rose-500/90 hover:text-white'}`}
        >
          <X className="size-4" />
        </button>

        <div className={`relative flex flex-col items-center justify-center gap-5 px-8 py-10 ${isLight ? 'bg-linear-to-b from-[#fff8f1] via-[#fffdfb] to-[#fff2e4] text-[#1f2430]' : 'bg-linear-to-b from-[#1a1025] to-[#120c18] text-white'}`}>
          <div className={`absolute left-[-20%] top-[-20%] h-64 w-64 rounded-full blur-[80px] ${isLight ? 'bg-[#ff9f2a]/10' : 'bg-pink-500/10'}`} />
          <div className={`relative flex size-32 items-center justify-center rounded-[2rem] text-4xl font-black ${isLight ? 'bg-linear-to-br from-[#ff8a2a] via-[#ff5f40] to-[#ffb347] text-white shadow-[0_18px_40px_rgba(255,127,42,0.2)]' : 'bg-linear-to-br from-pink-500 via-purple-600 to-orange-500 text-white'}`}>
            {profile?.profilePictureUrl ? (
              <img alt="profile" className="h-full w-full rounded-[2rem] object-cover" src={buildAssetUrl(profile.profilePictureUrl) || ''} />
            ) : (
              initials
            )}
          </div>
          <div className="relative text-center">
            <h2 className={`text-3xl font-black ${isLight ? 'text-[#101828]' : 'text-white'}`}>{firstName} {lastName}</h2>
            <p className={`mt-2 inline-flex rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] ${isLight ? 'border-[rgba(255,138,196,0.38)] bg-linear-to-r from-[#ff8ac4]/14 via-[#ff5f40]/12 to-[#ff9f2a]/14 text-[#ff5f40]' : 'border-pink-400/30 bg-pink-500/15 text-pink-200'}`}>
              {role}
            </p>
          </div>
          <div className="relative w-full space-y-3">
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${isLight ? 'bg-white/80 text-[#1f2430] shadow-[0_10px_24px_rgba(255,159,42,0.08)]' : 'bg-white/5 text-white/90'}`}>
              <Mail className={`size-4 ${isLight ? 'text-[#ff5f40]' : 'text-pink-400'}`} />
              <span className="truncate">{email}</span>
            </div>
            {phoneNumber && (
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${isLight ? 'bg-white/80 text-[#1f2430] shadow-[0_10px_24px_rgba(255,159,42,0.08)]' : 'bg-white/5 text-white/90'}`}>
                <Phone className={`size-4 ${isLight ? 'text-[#ff5f40]' : 'text-pink-400'}`} />
                <span className="truncate">{phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`flex flex-col p-6 md:p-10 ${isLight ? 'bg-white' : 'bg-[#160a25] text-slate-100'}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-linear-to-b from-pink-500 to-purple-600" />
            <h3 className={`text-3xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('settings', { ns: 'common' })}</h3>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className={`group flex w-full items-center justify-between rounded-[1.6rem] border px-5 py-5 transition hover:shadow-xl ${isLight ? 'border-slate-100 bg-slate-50/80 hover:border-pink-200 hover:bg-white' : 'border-white/10 bg-white/5 hover:border-pink-400/30 hover:bg-white/10'}`}
              onClick={() => {
                setIsClosing(true);
                window.setTimeout(() => onOpenProfileDetails(), animationDuration);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-4 ${isLight ? 'bg-linear-to-br from-[#ff8ac4]/14 to-[#ff9f2a]/14 text-[#ff5f40]' : 'bg-purple-500/15 text-purple-200'}`}>
                  <UserCircle2 className="size-5" />
                </div>
                <div className="text-left">
                  <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('editProfileDetails', { ns: 'user-detail-management' })}</p>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{t('editProfileDescription', { ns: 'user-detail-management' })}</p>
                </div>
              </div>
              <ArrowRight className={`size-4 transition group-hover:translate-x-1 ${isLight ? 'text-slate-400' : 'text-slate-300'}`} />
            </button>

            <div className={`rounded-[1.6rem] border p-5 ${isLight ? 'border-slate-100 bg-slate-50/80' : 'border-white/10 bg-white/5'} `}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-4 ${isLight ? 'bg-linear-to-br from-[#ff8ac4]/12 to-[#ff9f2a]/12 text-[#ff5f40]' : 'bg-white/10 text-slate-100'}`}>
                    {isLight ? <Sun className="size-5" /> : <Moon className="size-5" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('appearance', { ns: 'common' })}</p>
                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{t('selectThemeMode', { ns: 'common' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isLight ? 'border-[rgba(255,138,196,0.36)] bg-linear-to-r from-[#ff3a9b] via-[#ff5f40] to-[#ff9f2a] text-white hover:brightness-105' : 'border-white/10 bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  {isLight ? t('darkMode', { ns: 'common' }) : t('lightMode', { ns: 'common' })}
                </button>
              </div>
            </div>

            <div className={`relative rounded-[1.6rem] border p-5 ${isLight ? 'border-slate-100 bg-slate-50/80' : 'border-white/10 bg-white/5'} `} ref={languageDropdownRef}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-4 ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-100'}`}>
                    <Globe className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('language', { ns: 'common' })}</p>
                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{t('chooseLanguage', { ns: 'common' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLanguageOpen((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${isLight ? 'border-[rgba(255,138,196,0.28)] bg-white text-[#2A2C31] shadow-sm hover:bg-[rgba(255,90,99,0.06)] hover:text-[#ff5f40]' : 'border-white/10 bg-[#110717] text-white shadow-sm hover:bg-white/10'}`}
                >
                  <span className="text-[0.85rem]">{selectedLanguage.label}</span>
                  <ChevronDown className="size-4" />
                </button>
              </div>

              {isLanguageOpen && (
                <div className={`absolute right-0 top-full z-10 mt-3 overflow-hidden rounded-[1.4rem] border ${isLight ? 'border-[rgba(255,138,196,0.24)] bg-white shadow-xl' : 'border-white/10 bg-[#12061d] shadow-[0_15px_45px_rgba(0,0,0,0.3)]'}`} style={{ minWidth: '200px', maxWidth: '240px' }}>
                  <div className="max-h-64 overflow-y-auto overscroll-contain">
                    {languageOptions.map((language) => {
                      const selected = currentLanguage === language.value;
                      return (
                        <button
                          key={language.value}
                          type="button"
                          onClick={() => void handleLanguageChange(language.value)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${selected ? (isLight ? 'bg-linear-to-r from-[#ff8ac4]/14 via-[#ff5f40]/12 to-[#ff9f2a]/14 text-[#ff5f40]' : 'bg-pink-500/10 text-pink-100') : (isLight ? 'text-slate-700 hover:bg-[rgba(255,90,99,0.06)]' : 'text-slate-300 hover:bg-white/5')}`}
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
          </div>

          <div className="mt-auto pt-8">
            <Button className="h-14 w-full rounded-[1.6rem]" onClick={logout}>
              <LogOut className="mr-2 size-4" />
              {t('logout', { ns: 'common' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
