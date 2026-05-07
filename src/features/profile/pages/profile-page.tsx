import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BriefcaseBusiness, Building2, Camera, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { getMyProfile, updateMyProfile, uploadMyProfilePicture, type UpdateMyProfileRequest } from '@/features/profile/api/profile-api';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

/** İç paneller — kenar ve inset highlight daha düşük kontrast */
function profileInnerGlass(isLight: boolean) {
  return cn(
    'relative isolate overflow-hidden rounded-xl backdrop-blur-xl',
    isLight
      ? 'border border-slate-300/35 bg-white/72 shadow-[0_8px_26px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.42)]'
      : 'border border-white/[0.055] bg-[rgba(14,12,22,0.4)] shadow-[0_4px_22px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.022)]',
  );
}

/** Avatar bloğu — İlk Bağlantılar kartındaki glow ile aynı dil */
function ProfileGlassDecor({ isLight }: { isLight: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-55',
          isLight ? 'from-transparent via-slate-200/55 to-transparent' : 'from-transparent via-white/[0.14] to-transparent',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-4 -top-4 size-14 rounded-full blur-2xl',
          isLight ? 'bg-fuchsia-400/16 opacity-80' : 'bg-pink-500/10 opacity-45',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-6 -left-4 size-11 rounded-full blur-2xl',
          isLight ? 'bg-sky-400/14 opacity-55' : 'bg-violet-600/08 opacity-30',
        )}
      />
    </>
  );
}

/** Form alanı kartları — üst rim light yeterli */
function ProfileGlassTopLine({ isLight }: { isLight: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-55',
        isLight ? 'from-transparent via-slate-200/55 to-transparent' : 'from-transparent via-white/[0.14] to-transparent',
      )}
    />
  );
}

const profileInputLight =
  'border-slate-300/45 bg-white/78 text-[#1a1525] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/11';

const profileInputDark =
  '!h-12 !rounded-xl !border-white/[0.07] !bg-[rgba(10,8,16,0.48)] !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 !shadow-none focus:!border-pink-400/32 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.1)] focus:!ring-0';

export function ProfilePage() {
  const { t } = useTranslation(['user-detail-management', 'common']);
  const theme = useUiStore((state) => state.theme);
  const authUser = useAuthStore((state) => state.user);
  const branchName = useAuthStore((state) => state.branchName);
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const { register, handleSubmit, reset } = useForm<UpdateMyProfileRequest>({
    defaultValues: {
      phoneNumber: '',
      jobTitle: '',
      department: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (profileQuery.data?.data) {
      reset({
        phoneNumber: profileQuery.data.data.phoneNumber ?? '',
        jobTitle: profileQuery.data.data.jobTitle ?? '',
        department: profileQuery.data.data.department ?? '',
        bio: profileQuery.data.data.bio ?? '',
      });
    }
  }, [profileQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.setQueryData(['my-profile'], result);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadMyProfilePicture,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.setQueryData(['my-profile'], result);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const uploadLabelClass = cn(
    'relative z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-300',
    isLight
      ? 'border-[rgba(236,72,153,0.28)] bg-white/76 text-[#be185d] shadow-[0_2px_8px_rgba(219,39,119,0.05)] hover:border-[rgba(236,72,153,0.42)] hover:bg-white/88 hover:text-[#9d174d] hover:shadow-[0_6px_16px_rgba(219,39,119,0.09)]'
      : 'border-white/[0.07] bg-[rgba(12,10,20,0.52)] text-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.18)] hover:border-pink-400/28 hover:bg-[rgba(22,18,34,0.62)] hover:text-white',
  );

  const textareaClass = cn(
    'min-h-36 w-full rounded-xl border px-4 py-3 text-sm outline-none transition',
    isLight
      ? cn(
          'border-slate-300/45 bg-white/78 text-[#1a1525] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/11',
        )
      : cn(
          '!border-white/[0.07] !bg-[rgba(10,8,16,0.48)] !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 focus:!border-pink-400/32 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.1)] focus:!ring-0',
        ),
  );
  const firstName = profileQuery.data?.data.firstName ?? '';
  const lastName = profileQuery.data?.data.lastName ?? '';
  const email = profileQuery.data?.data.email ?? authUser?.email ?? '—';
  const role = profileQuery.data?.data.role ?? authUser?.role ?? '—';
  const branch = branchName ?? 'V3RII.CO';
  const avatarLetter = (firstName.trim().charAt(0) || lastName.trim().charAt(0) || 'U').toUpperCase();

  return (
    <div className="profile-details-glass-scope space-y-8">
      <PageHeader
        title={t('profileDetails', { ns: 'user-detail-management' })}
        description={t('profileDetailsDescription', { ns: 'user-detail-management' })}
        descriptionClassName={isLight ? undefined : '!bg-none !text-white/75'}
      />

      <Card className={cn('profile-shell-card p-4 sm:p-5 lg:p-6', !isLight && 'dashboard-section-panel')}>
        <div className={cn(profileInnerGlass(isLight), 'mb-8 flex flex-col gap-5 p-5 sm:p-6')}>
          <ProfileGlassDecor isLight={isLight} />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div
              className={cn(
                'group relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-3xl font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]',
                isLight
                  ? 'bg-linear-to-br from-fuchsia-600 via-pink-600 to-violet-600 ring-1 ring-white/18'
                  : 'bg-linear-to-br from-[#ff2f92] via-[#ff5a63] to-[#ff7f2a] ring-1 ring-white/10',
              )}
            >
              {avatarLetter}
              <label
                className={cn(
                  'absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100',
                  'md:text-xs text-[11px] font-semibold',
                )}
              >
                <Camera className="size-5" strokeWidth={1.9} />
                {t('uploadImage', { ns: 'common' })}
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadMutation.mutate(file);
                    }
                  }}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h3 className={cn('text-3xl font-black leading-tight', isLight ? 'text-[#1f2430]' : 'text-white')}>
                {firstName} {lastName}
              </h3>
              <div className={cn('mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm', isLight ? 'text-[#5E626D]' : 'text-slate-300')}>
                <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{email}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" />{branch}</span>
                <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-3.5" />{role}</span>
              </div>
            </div>
          </div>
        </div>

        <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
          <div className={cn(profileInnerGlass(isLight), 'p-4')}>
            <ProfileGlassTopLine isLight={isLight} />
            <label className={cn('relative z-10 mb-2 block text-sm font-medium', isLight ? 'text-[#5E626D]' : 'text-slate-300')}>
              {t('phone', { ns: 'common' })}
            </label>
            <Input
              {...register('phoneNumber')}
              placeholder={t('profilePhonePlaceholder', { ns: 'user-detail-management' })}
              className={cn(isLight ? profileInputLight : profileInputDark, 'relative z-10')}
            />
          </div>
          <div className={cn(profileInnerGlass(isLight), 'p-4')}>
            <ProfileGlassTopLine isLight={isLight} />
            <label className={cn('relative z-10 mb-2 block text-sm font-medium', isLight ? 'text-[#5E626D]' : 'text-slate-300')}>
              {t('jobTitle', { ns: 'common' })}
            </label>
            <Input {...register('jobTitle')} className={cn(isLight ? profileInputLight : profileInputDark, 'relative z-10')} />
          </div>
          <div className={cn(profileInnerGlass(isLight), 'p-4')}>
            <ProfileGlassTopLine isLight={isLight} />
            <label className={cn('relative z-10 mb-2 block text-sm font-medium', isLight ? 'text-[#5E626D]' : 'text-slate-300')}>
              {t('department', { ns: 'common' })}
            </label>
            <Input
              {...register('department')}
              placeholder={t('profileDepartmentPlaceholder', { ns: 'user-detail-management' })}
              className={cn(isLight ? profileInputLight : profileInputDark, 'relative z-10')}
            />
          </div>
          <div className={cn(profileInnerGlass(isLight), 'lg:col-span-2', 'p-4')}>
            <ProfileGlassTopLine isLight={isLight} />
            <label className={cn('relative z-10 mb-2 block text-sm font-medium', isLight ? 'text-[#5E626D]' : 'text-slate-300')}>
              {t('bio', { ns: 'common' })}
            </label>
            <textarea
              className={cn(textareaClass, 'relative z-10')}
              placeholder={t('profileBioPlaceholder', { ns: 'user-detail-management' })}
              {...register('bio')}
            />
          </div>
          <div className="flex justify-end lg:col-span-2">
            <Button
              className={cn('w-full sm:w-auto', isLight ? 'light-gradient-accent' : 'create-action-button')}
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? t('saving', { ns: 'common' }) : t('updateProfile', { ns: 'user-detail-management' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
