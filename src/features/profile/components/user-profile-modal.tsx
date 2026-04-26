import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Globe, LogOut, Mail, Phone, ShieldCheck, UserCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VoiceSearchCombobox } from '@/components/shared/dropdown/voice-search-combobox';
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
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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
      description: t('turkish', { ns: 'common' }),
      icon: <Globe className="size-4" />,
      keywords: ['tr', 'turkce', 'turkish'],
    },
    {
      value: 'en',
      label: 'EN',
      description: t('english', { ns: 'common' }),
      icon: <Globe className="size-4" />,
      keywords: ['en', 'ingilizce', 'english'],
    },
  ];

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

        <div className="relative flex flex-col items-center justify-center gap-5 bg-linear-to-b from-[#1a1025] to-[#120c18] px-8 py-10 text-white">
          <div className="absolute left-[-20%] top-[-20%] h-64 w-64 rounded-full bg-pink-500/10 blur-[80px]" />
          <div className="relative flex size-32 items-center justify-center rounded-[2rem] bg-linear-to-br from-pink-500 via-purple-600 to-orange-500 text-4xl font-black">
            {profile?.profilePictureUrl ? (
              <img alt="profile" className="h-full w-full rounded-[2rem] object-cover" src={buildAssetUrl(profile.profilePictureUrl) || ''} />
            ) : (
              initials
            )}
          </div>
          <div className="relative text-center">
            <h2 className="text-3xl font-black">{firstName} {lastName}</h2>
            <p className="mt-2 inline-flex rounded-full border border-pink-400/30 bg-pink-500/15 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-pink-200">
              {role}
            </p>
          </div>
          <div className="relative w-full space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90">
              <Mail className="size-4 text-pink-400" />
              <span className="truncate">{email}</span>
            </div>
            {phoneNumber && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90">
                <Phone className="size-4 text-pink-400" />
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
                <div className={`rounded-2xl p-4 ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/15 text-purple-200'}`}>
                  <UserCircle2 className="size-5" />
                </div>
                <div className="text-left">
                  <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('editProfileDetails', { ns: 'user-detail-management' })}</p>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{t('editProfileDescription', { ns: 'user-detail-management' })}</p>
                </div>
              </div>
              <ArrowRight className={`size-4 transition group-hover:translate-x-1 ${isLight ? 'text-slate-400' : 'text-slate-300'}`} />
            </button>

            <div className={`flex items-center justify-between rounded-[1.6rem] border px-5 py-5 ${isLight ? 'border-slate-100 bg-slate-50/80' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-4 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-300'}`}>
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('roleInformation', { ns: 'user-detail-management' })}</p>
                  <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${isLight ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-fuchsia-500/15 text-fuchsia-200'}`}>{role}</p>
                </div>
              </div>
              <div className="w-40">
                <VoiceSearchCombobox
                  options={languageOptions}
                  value={i18n.language}
                  placeholder={t('language', { ns: 'common' })}
                  searchPlaceholder={t('searchLanguage', { ns: 'common' })}
                  onSelect={(nextValue) => {
                    if (!nextValue) {
                      return;
                    }

                    localStorage.setItem('verii_uts_lang', nextValue);
                    void i18n.changeLanguage(nextValue);
                  }}
                />
              </div>
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
