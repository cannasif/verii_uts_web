import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { getMyProfile, updateMyProfile, uploadMyProfilePicture, type UpdateMyProfileRequest } from '@/features/profile/api/profile-api';
import { useUiStore } from '@/stores/ui-store';
import { buildAssetUrl } from '@/lib/utils';

export function ProfilePage() {
  const { t } = useTranslation(['user-detail-management', 'common']);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
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
      setLocalPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profileDetails', { ns: 'user-detail-management' })}
        description={t('profileDetailsDescription', { ns: 'user-detail-management' })}
      />

      <Card className={`p-4 sm:p-6 ${isLight ? 'border border-[rgba(255,138,42,0.14)] bg-linear-to-br from-white via-[#fffaf5] to-[#fff2e4] shadow-[0_18px_45px_rgba(255,159,42,0.08)]' : ''}`}>
        <div className={`mb-8 flex flex-col items-center gap-4 rounded-[2rem] p-6 ${isLight ? 'border border-[rgba(255,138,42,0.12)] bg-white/80 shadow-[0_18px_40px_rgba(255,159,42,0.08)]' : 'bg-[#120b1f]/70 border border-white/10'}`}>
          <div className={`flex size-28 items-center justify-center overflow-hidden rounded-[2rem] text-3xl font-black text-white ${isLight ? 'bg-linear-to-br from-[#ff8a2a] via-[#ff5f40] to-[#ffb347] shadow-[0_16px_38px_rgba(255,127,42,0.22)]' : 'bg-linear-to-br from-pink-500 via-purple-600 to-orange-500'}`}>
            {localPreviewUrl || profileQuery.data?.data.profilePictureUrl ? (
              <img
                alt="profile"
                className="h-full w-full object-cover"
                src={localPreviewUrl ?? buildAssetUrl(profileQuery.data?.data.profilePictureUrl) ?? ''}
              />
            ) : (
              `${profileQuery.data?.data.firstName?.[0] ?? ''}${profileQuery.data?.data.lastName?.[0] ?? ''}`
            )}
          </div>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${isLight ? 'border-[rgba(255,138,42,0.18)] bg-white text-[#2A2C31] shadow-[0_10px_24px_rgba(255,159,42,0.08)] hover:border-[rgba(255,138,42,0.32)] hover:text-[#ff5f40]' : 'border-white/12 bg-[#1a132b]/85 text-slate-200 hover:border-pink-400/50 hover:text-pink-300'}`}>
            <Camera className="size-4" />
            {t('uploadImage', { ns: 'common' })}
            <input
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setLocalPreviewUrl(URL.createObjectURL(file));
                  uploadMutation.mutate(file);
                }
              }}
            />
          </label>
        </div>

        <form
          className="grid gap-5 lg:grid-cols-2"
          onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
        >
          <div className={`rounded-[1.4rem] p-4 ${isLight ? 'border border-[rgba(255,138,42,0.32)] bg-[#fff7ed] ring-1 ring-[rgba(255,138,42,0.08)] shadow-[0_12px_26px_rgba(255,159,42,0.09)]' : ''}`}>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{t('phone', { ns: 'common' })}</label>
            <Input
              {...register('phoneNumber')}
              className={isLight ? 'border-[rgba(255,138,42,0.42)] bg-[#fffdf8] text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_8px_18px_rgba(255,159,42,0.08)] placeholder:text-slate-400 focus:border-[#ff9f2a] focus:bg-white' : undefined}
            />
          </div>
          <div className={`rounded-[1.4rem] p-4 ${isLight ? 'border border-[rgba(255,138,42,0.32)] bg-[#fff7ed] ring-1 ring-[rgba(255,138,42,0.08)] shadow-[0_12px_26px_rgba(255,159,42,0.09)]' : ''}`}>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{t('jobTitle', { ns: 'common' })}</label>
            <Input
              {...register('jobTitle')}
              className={isLight ? 'border-[rgba(255,138,42,0.42)] bg-[#fffdf8] text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_8px_18px_rgba(255,159,42,0.08)] placeholder:text-slate-400 focus:border-[#ff9f2a] focus:bg-white' : undefined}
            />
          </div>
          <div className={`rounded-[1.4rem] p-4 ${isLight ? 'border border-[rgba(255,138,42,0.32)] bg-[#fff7ed] ring-1 ring-[rgba(255,138,42,0.08)] shadow-[0_12px_26px_rgba(255,159,42,0.09)]' : ''}`}>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{t('department', { ns: 'common' })}</label>
            <Input
              {...register('department')}
              className={isLight ? 'border-[rgba(255,138,42,0.42)] bg-[#fffdf8] text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_8px_18px_rgba(255,159,42,0.08)] placeholder:text-slate-400 focus:border-[#ff9f2a] focus:bg-white' : undefined}
            />
          </div>
          <div className={`lg:col-span-2 rounded-[1.4rem] p-4 ${isLight ? 'border border-[rgba(255,138,42,0.32)] bg-[#fff7ed] ring-1 ring-[rgba(255,138,42,0.08)] shadow-[0_12px_26px_rgba(255,159,42,0.09)]' : ''}`}>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{t('bio', { ns: 'common' })}</label>
            <textarea
              className={`min-h-36 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${isLight ? 'border-[rgba(255,138,42,0.42)] bg-[#fffdf8] text-[#101828] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_10px_24px_rgba(255,159,42,0.08)] focus:border-[#ff9f2a] focus:ring-4 focus:ring-[rgba(255,159,42,0.16)]' : 'border-white/12 bg-[#120b1f]/82 text-slate-100 focus:border-pink-400/60 focus:ring-4 focus:ring-pink-500/20'}`}
              {...register('bio')}
            />
          </div>
          <div className="flex justify-end lg:col-span-2">
            <Button className="w-full sm:w-auto" disabled={updateMutation.isPending} type="submit">
              {updateMutation.isPending ? t('saving', { ns: 'common' }) : t('updateProfile', { ns: 'user-detail-management' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
