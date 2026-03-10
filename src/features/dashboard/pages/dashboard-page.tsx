import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', { ns: 'dashboard' })}
        description={t('description', { ns: 'dashboard' })}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('activeUser', { ns: 'dashboard' })}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {user?.firstName} {user?.lastName}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('role', { ns: 'common' })}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{user?.role}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('permissionCountLabel', { ns: 'dashboard' })}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{permissions.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t('apiStatus', { ns: 'dashboard' })}</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">{t('connected', { ns: 'dashboard' })}</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">{t('initialConnections', { ns: 'dashboard' })}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">{t('authCardTitle', { ns: 'dashboard' })}</p>
            <p className="mt-2 text-sm text-slate-600">{t('authCardDescription', { ns: 'dashboard' })}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">{t('usersCardTitle', { ns: 'dashboard' })}</p>
            <p className="mt-2 text-sm text-slate-600">{t('usersCardDescription', { ns: 'dashboard' })}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">{t('createUserCardTitle', { ns: 'dashboard' })}</p>
            <p className="mt-2 text-sm text-slate-600">{t('createUserCardDescription', { ns: 'dashboard' })}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
