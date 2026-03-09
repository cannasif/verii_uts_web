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
import { buildAssetUrl } from '@/lib/utils';

export function ProfilePage() {
  const { t } = useTranslation(['user-detail-management', 'common']);
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

      <Card className="p-4 sm:p-6">
        <div className="mb-8 flex flex-col items-center gap-4 rounded-[2rem] bg-slate-50 p-6">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-[2rem] bg-linear-to-br from-pink-500 via-purple-600 to-orange-500 text-3xl font-black text-white">
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
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-200 hover:text-pink-500">
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
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('phone', { ns: 'common' })}</label>
            <Input {...register('phoneNumber')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('jobTitle', { ns: 'common' })}</label>
            <Input {...register('jobTitle')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('department', { ns: 'common' })}</label>
            <Input {...register('department')} />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('bio', { ns: 'common' })}</label>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
