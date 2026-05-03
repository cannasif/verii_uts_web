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
import { cn } from '@/lib/utils';
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

const inputLight =
  'border-slate-300/45 bg-white/78 text-[#1a1525] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/11';

const inputDark =
  '!h-12 !rounded-xl !border-white/[0.07] !bg-[rgba(10,8,16,0.48)] !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 !shadow-none focus:!border-pink-400/32 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.1)] focus:!ring-0';

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

  const fieldLabel = isLight ? 'text-[#5E626D]' : 'text-slate-300';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6',
        isLight ? 'bg-slate-900/28 backdrop-blur-sm' : 'bg-[#06030f]/58 backdrop-blur-md',
      )}
      role="presentation"
    >
      <Card
        className={cn(
          'custom-scrollbar relative isolate w-full max-w-2xl overflow-y-auto rounded-[18px] p-5 sm:p-7 max-h-[92vh]',
          isLight
            ? 'border border-slate-200/22 bg-white/52 shadow-[0_20px_56px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-xl'
            : 'dashboard-section-panel border border-white/[0.06] shadow-[0_28px_72px_rgba(0,0,0,0.42)] backdrop-blur-xl',
        )}
      >
        {!isLight ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/[0.14] to-transparent"
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h2 className={cn('text-xl font-semibold', isLight ? 'text-slate-900' : 'text-slate-100')}>{t('newUser', { ns: 'common' })}</h2>
            <p className={cn('mt-1 text-sm', isLight ? 'text-slate-600' : 'text-slate-400')}>{t('createUserDescription', { ns: 'user-management' })}</p>
          </div>
          <Button
            variant="ghost"
            className={cn(
              'shrink-0 rounded-xl',
              isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
            )}
            onClick={onClose}
          >
            {t('close', { ns: 'common' })}
          </Button>
        </div>

        <form className="relative mt-6 space-y-5" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
                {t('firstName', { ns: 'common' })}
                {requiredMark}
              </label>
              <Input {...register('firstName')} className={isLight ? inputLight : inputDark} />
              {errors.firstName && <p className="mt-2 text-sm text-rose-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
                {t('lastName', { ns: 'common' })}
                {requiredMark}
              </label>
              <Input {...register('lastName')} className={isLight ? inputLight : inputDark} />
              {errors.lastName && <p className="mt-2 text-sm text-rose-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
              {t('email', { ns: 'common' })}
              {requiredMark}
            </label>
            <Input {...register('email')} className={isLight ? inputLight : inputDark} />
            {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
              {t('password', { ns: 'common' })}
              {requiredMark}
            </label>
            <Input {...register('password')} className={isLight ? inputLight : inputDark} type="password" />
            {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
              {t('role', { ns: 'common' })}
              {requiredMark}
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
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>{t('permissionGroupsLabel', { ns: 'common' })}</label>
            <div className="grid gap-3">
              {permissionGroups.map((group) => {
                const checked = selectedPermissionGroupIds.includes(group.id);
                return (
                  <label
                    key={group.id}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur-md transition-colors',
                      isLight
                        ? 'border-slate-300/35 bg-white/70 hover:border-fuchsia-300/40'
                        : 'border-white/[0.06] bg-[rgba(14,12,22,0.42)] hover:border-pink-400/22',
                    )}
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
                      <span className={cn('block text-sm font-semibold', isLight ? 'text-slate-800' : 'text-slate-100')}>{group.name}</span>
                      <span className={cn('mt-1 block text-xs', isLight ? 'text-slate-600' : 'text-slate-400')}>{group.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className={cn(isLight ? undefined : 'border-white/[0.08] bg-[rgba(10,8,16,0.45)] hover:bg-[rgba(22,18,34,0.55)]')}
              onClick={onClose}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              className={cn(isLight ? 'light-gradient-accent' : 'create-action-button')}
              disabled={createMutation.isPending || !isValid}
              type="submit"
            >
              {createMutation.isPending ? t('saving', { ns: 'common' }) : t('createUser', { ns: 'common' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
