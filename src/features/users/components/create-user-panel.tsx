import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { VoiceSearchCombobox } from '@/components/shared/dropdown/voice-search-combobox';
import { DROPDOWN_MIN_CHARS, DROPDOWN_PAGE_SIZE } from '@/components/shared/dropdown/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import i18n from '@/lib/i18n';
import { createUser } from '@/features/users/api/users-api';
import { searchRoles } from '@/features/roles/api/roles-api';
import { searchPermissionGroups } from '@/features/permission-groups/api/permission-groups-api';
import { useDropdownInfiniteSearch } from '@/hooks/use-dropdown-infinite-search';
import { useUiStore } from '@/stores/ui-store';

const schema = z.object({
  firstName: z.string().min(1, i18n.t('validationFirstNameRequired', { ns: 'common' })),
  lastName: z.string().min(1, i18n.t('validationLastNameRequired', { ns: 'common' })),
  email: z.email(i18n.t('validationEmail', { ns: 'common' })),
  password: z.string().min(6, i18n.t('validationPasswordMin', { ns: 'common' })),
  roleId: z.number().min(1, i18n.t('validationRoleRequired', { ns: 'common' })),
  permissionGroupIds: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

interface CreateUserPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CreateUserPanel({ open, onClose }: CreateUserPanelProps) {
  const { t } = useTranslation(['user-management', 'common']);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const groupsQuery = useQuery({
    queryKey: ['permission-groups', 'lookup'],
    queryFn: () => searchPermissionGroups({ pageNumber: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' }),
    enabled: open,
  });
  const rolesDropdown = useDropdownInfiniteSearch({
    queryKey: ['roles', 'dropdown'],
    searchTerm: roleSearchTerm,
    enabled: open,
    minChars: DROPDOWN_MIN_CHARS,
    pageSize: DROPDOWN_PAGE_SIZE,
    sortBy: 'name',
    sortDirection: 'asc',
    fetchPage: searchRoles,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: 0,
      permissionGroupIds: [],
    },
  });

  const selectedPermissionGroupIds = watch('permissionGroupIds');
  const selectedRoleId = watch('roleId');

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const permissionGroups = useMemo(() => groupsQuery.data?.data ?? [], [groupsQuery.data]);
  const roleOptions = useMemo(() => {
    return rolesDropdown.items.map((role) => ({
      value: role.id,
      label: role.name,
      description: role.description,
      icon: <Shield className="size-4" />,
      keywords: [role.name, role.description],
    }));
  }, [rolesDropdown.items]);

  if (!open) return null;

  const requiredMark = <span className="ml-1 text-rose-500">*</span>;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 ${isLight ? 'bg-slate-950/30' : 'bg-[#04010a]/68 backdrop-blur-[3px]'}`}>
      <Card className={`custom-scrollbar w-full max-w-2xl overflow-y-auto p-5 sm:p-7 ${isLight ? 'max-h-[92vh]' : 'max-h-[90vh] border-white/12 bg-[#120b1f]/90 shadow-[0_28px_80px_rgba(2,4,14,0.6)] backdrop-blur-2xl'}`}>
          <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={`text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{t('newUser', { ns: 'common' })}</h2>
            <p className={`mt-1 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('createUserDescription', { ns: 'user-management' })}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>{t('close', { ns: 'common' })}</Button>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {t('firstName', { ns: 'common' })}{requiredMark}
              </label>
              <Input {...register('firstName')} />
              {errors.firstName && <p className="mt-2 text-sm text-rose-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {t('lastName', { ns: 'common' })}{requiredMark}
              </label>
              <Input {...register('lastName')} />
              {errors.lastName && <p className="mt-2 text-sm text-rose-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {t('email', { ns: 'common' })}{requiredMark}
            </label>
            <Input {...register('email')} />
            {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {t('password', { ns: 'common' })}{requiredMark}
            </label>
            <Input {...register('password')} type="password" />
            {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {t('role', { ns: 'common' })}{requiredMark}
            </label>
            <input type="hidden" {...register('roleId', { valueAsNumber: true })} />
            <VoiceSearchCombobox
              options={roleOptions}
              value={selectedRoleId > 0 ? selectedRoleId : null}
              placeholder={t('selectRole', { ns: 'common' })}
              searchPlaceholder={t('searchRole', { ns: 'user-management' })}
              isLoading={rolesDropdown.isLoading}
              isFetchingNextPage={rolesDropdown.isFetchingNextPage}
              hasNextPage={rolesDropdown.hasNextPage}
              onDebouncedSearchChange={setRoleSearchTerm}
              onFetchNextPage={() => {
                void rolesDropdown.fetchNextPage();
              }}
              onSelect={(nextValue) => {
                setValue('roleId', typeof nextValue === 'number' ? nextValue : 0, {
                  shouldDirty: true,
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
            />
            {errors.roleId && <p className="mt-2 text-sm text-rose-500">{errors.roleId.message}</p>}
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{t('permissionGroupsLabel', { ns: 'common' })}</label>
            <div className="grid gap-3">
              {permissionGroups.map((group) => {
                const checked = selectedPermissionGroupIds.includes(group.id);
                return (
                  <label
                    key={group.id}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${isLight ? 'border-fuchsia-200/70 bg-fuchsia-50/75' : 'border-white/12 bg-[#160f26]/78'}`}
                  >
                    <input
                      checked={checked}
                      type="checkbox"
                      className="modern-checkbox"
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...selectedPermissionGroupIds, group.id]
                          : selectedPermissionGroupIds.filter((value) => value !== group.id);
                        setValue('permissionGroupIds', next);
                      }}
                    />
                    <span>
                      <span className={`block text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{group.name}</span>
                      <span className={`mt-1 block text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{group.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button disabled={createMutation.isPending || !isValid} type="submit">
              {createMutation.isPending ? t('saving', { ns: 'common' }) : t('createUser', { ns: 'common' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
