import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import i18n from '@/lib/i18n';
import { searchPermissionDefinitions } from '@/features/permission-definitions/api/permission-definitions-api';
import { createPermissionGroup, updatePermissionGroupPermissions } from '@/features/permission-groups/api/permission-groups-api';

const schema = z.object({
  name: z.string().min(1, i18n.t('validationPermissionGroupNameRequired', { ns: 'common' })),
  description: z.string().max(500, i18n.t('validationMaxLength', { ns: 'access-control', count: 500 })),
  permissionDefinitionIds: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

const inputLight =
  'border-slate-300/45 bg-white/78 text-[#1a1525] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/11';

const inputDark =
  '!h-12 !rounded-xl !border-white/[0.07] !bg-[rgba(10,8,16,0.48)] !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 !shadow-none focus:!border-pink-400/32 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.1)] focus:!ring-0';

interface CreatePermissionGroupPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePermissionGroupPanel({ open, onClose }: CreatePermissionGroupPanelProps) {
  const { t } = useTranslation(['access-control', 'common']);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      permissionDefinitionIds: [],
    },
  });
  const selectedPermissionDefinitionIds = watch('permissionDefinitionIds');
  const permissionDefinitionsQuery = useQuery({
    queryKey: ['permission-definitions', 'lookup'],
    queryFn: () =>
      searchPermissionDefinitions({
        pageNumber: 1,
        pageSize: 200,
        sortBy: 'module',
        sortDirection: 'asc',
      }),
    enabled: open,
  });
  const permissionGroupsByModule = useMemo(() => {
    const items = permissionDefinitionsQuery.data?.data ?? [];
    return items.reduce<Record<string, typeof items>>((accumulator, item) => {
      accumulator[item.module] ??= [];
      accumulator[item.module].push(item);
      return accumulator;
    }, {});
  }, [permissionDefinitionsQuery.data?.data]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const created = await createPermissionGroup({
        name: values.name,
        description: values.description,
      });

      if (values.permissionDefinitionIds.length > 0) {
        await updatePermissionGroupPermissions(created.data.id, values.permissionDefinitionIds);
      }

      return created;
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-definitions'] });
      reset();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!open) return null;

  const requiredMark = <span className="ml-1 text-rose-500">*</span>;

  const fieldLabel = isLight ? 'text-[#5E626D]' : 'text-slate-300';

  const textareaClass = cn(
    'min-h-32 w-full rounded-xl border px-4 py-3 text-sm outline-none transition',
    isLight
      ? 'border-slate-300/45 bg-white/78 text-[#1a1525] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/11'
      : '!border-white/[0.07] !bg-[rgba(10,8,16,0.48)] !text-slate-100 !backdrop-blur-xl placeholder:!text-slate-500 focus:!border-pink-400/32 focus:!shadow-[0_0_0_1px_rgba(236,72,153,0.1)] focus:!ring-0',
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6',
        isLight ? 'bg-slate-950/42 backdrop-blur-[2px]' : 'bg-[#06030f]/58 backdrop-blur-md',
      )}
      role="presentation"
    >
      <Card
        className={cn(
          'custom-scrollbar relative isolate w-full max-w-3xl overflow-y-auto rounded-[18px] p-6 sm:p-7 max-h-[92vh]',
          isLight
            ? 'border border-slate-200/85 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]'
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
            <h2 className={cn('text-xl font-semibold', isLight ? 'text-slate-900' : 'text-slate-100')}>{t('newPermissionGroup', { ns: 'access-control' })}</h2>
            <p className={cn('mt-1 text-sm', isLight ? 'text-slate-600' : 'text-slate-400')}>{t('createPermissionGroupDescription', { ns: 'access-control' })}</p>
          </div>
          <Button
            variant="ghost"
            className={cn(
              'size-9 shrink-0 rounded-xl p-0',
              isLight
                ? '!border-white/80 !bg-transparent !text-slate-500 hover:!bg-rose-100 hover:!text-rose-700'
                : '!border-white/35 !bg-transparent !text-slate-300 hover:!bg-rose-500/20 hover:!text-rose-300',
            )}
            onClick={onClose}
            aria-label={t('close', { ns: 'common' })}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form className="relative mt-6 space-y-5" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <div>
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>
              {t('groupName', { ns: 'access-control' })}
              {requiredMark}
            </label>
            <Input {...register('name')} className={isLight ? inputLight : inputDark} />
            {errors.name ? <p className="mt-2 text-sm text-rose-500">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className={cn('mb-2 block text-sm font-medium', fieldLabel)}>{t('descriptionColumn', { ns: 'access-control' })}</label>
            <textarea {...register('description')} className={textareaClass} />
            {errors.description ? <p className="mt-2 text-sm text-rose-500">{errors.description.message}</p> : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className={cn('block text-sm font-medium', fieldLabel)}>
                {t('permissionDefinitionsTitle', { ns: 'access-control' })}
                {requiredMark}
              </label>
              <span className={cn('text-xs font-medium', isLight ? 'text-slate-500' : 'text-slate-400')}>
                {selectedPermissionDefinitionIds.length} {t('permissionSelectedCount', { ns: 'access-control' })}
              </span>
            </div>

            <div className="space-y-4">
              {permissionDefinitionsQuery.isLoading ? (
                <div
                  className={cn(
                    'rounded-xl border px-4 py-6 text-sm backdrop-blur-md',
                    isLight ? 'border-slate-200 bg-white text-slate-600' : 'border-white/[0.06] bg-[rgba(14,12,22,0.38)] text-slate-400',
                  )}
                >
                  {t('loading', { ns: 'common' })}
                </div>
              ) : Object.keys(permissionGroupsByModule).length === 0 ? (
                <div
                  className={cn(
                    'rounded-xl border border-dashed px-4 py-6 text-sm',
                    isLight ? 'border-slate-300/45 text-slate-500' : 'border-white/[0.08] bg-[rgba(10,8,16,0.35)] text-slate-400',
                  )}
                >
                  {t('noPermissionDefinitionsFound', { ns: 'access-control' })}
                </div>
              ) : (
                Object.entries(permissionGroupsByModule).map(([module, definitions]) => {
                  const modulePermissionIds = definitions.map((item) => item.id);
                  const selectedCount = modulePermissionIds.filter((id) => selectedPermissionDefinitionIds.includes(id)).length;
                  const allSelected = selectedCount === modulePermissionIds.length && modulePermissionIds.length > 0;

                  return (
                    <div
                      key={module}
                      className={cn(
                        'rounded-xl border p-4 backdrop-blur-md',
                        isLight
                          ? 'border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]'
                          : 'border-white/[0.06] bg-[rgba(14,12,22,0.38)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
                      )}
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className={cn('text-sm font-semibold uppercase tracking-[0.18em]', isLight ? 'text-slate-800' : 'text-slate-200')}>{module}</h3>
                          <p className={cn('mt-1 text-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>
                            {selectedCount}/{modulePermissionIds.length} {t('permissionSelectedCount', { ns: 'access-control' })}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className={cn(
                            'h-8 text-xs',
                            isLight ? undefined : 'border-white/[0.08] bg-[rgba(10,8,16,0.45)] hover:bg-[rgba(22,18,34,0.55)]',
                          )}
                          onClick={() => {
                            const nextIds = allSelected
                              ? selectedPermissionDefinitionIds.filter((id) => !modulePermissionIds.includes(id))
                              : Array.from(new Set([...selectedPermissionDefinitionIds, ...modulePermissionIds]));

                            setValue('permissionDefinitionIds', nextIds, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }}
                        >
                          {allSelected ? t('clearModulePermissions', { ns: 'access-control' }) : t('selectModulePermissions', { ns: 'access-control' })}
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {definitions.map((definition) => {
                          const checked = selectedPermissionDefinitionIds.includes(definition.id);

                          return (
                            <label
                              key={definition.id}
                              className={cn(
                                'flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur-md transition-colors',
                                isLight
                                  ? 'border-slate-200 bg-white hover:border-fuchsia-300/45'
                                  : 'border-white/[0.06] bg-[rgba(10,8,16,0.42)] hover:border-pink-400/22',
                              )}
                            >
                              <input
                                checked={checked}
                                type="checkbox"
                                className="modern-checkbox"
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...selectedPermissionDefinitionIds, definition.id]
                                    : selectedPermissionDefinitionIds.filter((value) => value !== definition.id);

                                  setValue('permissionDefinitionIds', next, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  });
                                }}
                              />
                              <span>
                                <span className={cn('block text-sm font-semibold', isLight ? 'text-slate-900' : 'text-slate-100')}>{definition.name}</span>
                                <span className={cn('mt-1 block text-xs font-medium', isLight ? 'text-fuchsia-700/90' : 'text-pink-300/90')}>{definition.code}</span>
                                <span className={cn('mt-1 block text-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>{definition.description}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
              {createMutation.isPending ? t('saving', { ns: 'common' }) : t('createPermissionGroup', { ns: 'access-control' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
