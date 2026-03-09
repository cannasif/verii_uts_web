import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Globe, LogOut, Mail, Phone, ShieldCheck, UserCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VoiceSearchCombobox } from '@/components/shared/dropdown/voice-search-combobox';
import { Button } from '@/components/ui/button';
import { getMyProfile } from '@/features/profile/api/profile-api';
import { buildAssetUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  onOpenProfileDetails: () => void;
}

export function UserProfileModal({ open, onClose, onOpenProfileDetails }: UserProfileModalProps) {
  const { i18n, t } = useTranslation(['user-detail-management', 'common']);
  const logout = useAuthStore((state) => state.logout);
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

  if (!open) return null;

  const profile = profileQuery.data?.data;
  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}` || 'VU';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)] md:grid-cols-[320px_1fr]">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 z-10 rounded-2xl bg-slate-100 p-2 text-slate-400 transition hover:bg-rose-500 hover:text-white">
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
            <h2 className="text-3xl font-black">{profile?.firstName} {profile?.lastName}</h2>
            <p className="mt-2 inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-pink-300">
              {profile?.role ?? t('role', { ns: 'common' })}
            </p>
          </div>
          <div className="relative w-full space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
              <Mail className="size-4 text-pink-400" />
              <span className="truncate opacity-80">{profile?.email}</span>
            </div>
            {profile?.phoneNumber && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <Phone className="size-4 text-pink-400" />
                <span className="truncate opacity-80">{profile.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col p-6 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-linear-to-b from-pink-500 to-purple-600" />
            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">{t('settings', { ns: 'common' })}</h3>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-[1.6rem] border border-slate-100 bg-slate-50/80 px-5 py-5 transition hover:border-pink-200 hover:bg-white hover:shadow-xl"
              onClick={onOpenProfileDetails}
            >
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-purple-100 p-4 text-purple-600">
                  <UserCircle2 className="size-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-slate-900">{t('editProfileDetails', { ns: 'user-detail-management' })}</p>
                  <p className="text-xs text-slate-500">{t('editProfileDescription', { ns: 'user-detail-management' })}</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1" />
            </button>

            <div className="flex items-center justify-between rounded-[1.6rem] border border-slate-100 bg-slate-50/80 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{t('roleInformation', { ns: 'user-detail-management' })}</p>
                  <p className="text-xs text-slate-500">{profile?.role}</p>
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
