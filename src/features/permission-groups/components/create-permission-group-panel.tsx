import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import i18n from '@/lib/i18n';
import { searchPermissionDefinitions } from '@/features/permission-definitions/api/permission-definitions-api';
import { createPermissionGroup, updatePermissionGroupPermissions } from '@/features/permission-groups/api/permission-groups-api';

const schema = z.object({
  name: z.string().min(1, i18n.t('validationPermissionGroupNameRequired', { ns: 'common' })),
  description: z.string().max(500, i18n.t('validationMaxLength', { ns: 'access-control', count: 500 })),
  permissionDefinitionIds: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

interface CreatePermissionGroupPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePermissionGroupPanel({ open, onClose }: CreatePermissionGroupPanelProps) {
  const { t } = useTranslation(['access-control', 'common']);
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 p-2 sm:p-4">
      <Card className="custom-scrollbar h-full w-full max-w-xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t('newPermissionGroup', { ns: 'access-control' })}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('createPermissionGroupDescription', { ns: 'access-control' })}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>{t('close', { ns: 'common' })}</Button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('groupName', { ns: 'access-control' })}{requiredMark}
            </label>
            <Input {...register('name')} />
            {errors.name ? <p className="mt-2 text-sm text-rose-500">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t('descriptionColumn', { ns: 'access-control' })}
            </label>
            <textarea
              {...register('description')}
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            {errors.description ? <p className="mt-2 text-sm text-rose-500">{errors.description.message}</p> : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-700">
                {t('permissionDefinitionsTitle', { ns: 'access-control' })}{requiredMark}
              </label>
              <span className="text-xs font-medium text-slate-500">
                {selectedPermissionDefinitionIds.length} {t('permissionSelectedCount', { ns: 'access-control' })}
              </span>
            </div>

            <div className="space-y-4">
              {permissionDefinitionsQuery.isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  {t('loading', { ns: 'common' })}
                </div>
              ) : Object.keys(permissionGroupsByModule).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  {t('noPermissionDefinitionsFound', { ns: 'access-control' })}
                </div>
              ) : (
                Object.entries(permissionGroupsByModule).map(([module, definitions]) => {
                  const modulePermissionIds = definitions.map((item) => item.id);
                  const selectedCount = modulePermissionIds.filter((id) => selectedPermissionDefinitionIds.includes(id)).length;
                  const allSelected = selectedCount === modulePermissionIds.length && modulePermissionIds.length > 0;

                  return (
                    <div key={module} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">{module}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedCount}/{modulePermissionIds.length} {t('permissionSelectedCount', { ns: 'access-control' })}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
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
                            <label key={definition.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <input
                                checked={checked}
                                type="checkbox"
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
                                <span className="block text-sm font-semibold text-slate-900">{definition.name}</span>
                                <span className="mt-1 block text-xs font-medium text-indigo-600">{definition.code}</span>
                                <span className="mt-1 block text-xs text-slate-500">{definition.description}</span>
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
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button disabled={createMutation.isPending || !isValid} type="submit">
              {createMutation.isPending ? t('saving', { ns: 'common' }) : t('createPermissionGroup', { ns: 'access-control' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
