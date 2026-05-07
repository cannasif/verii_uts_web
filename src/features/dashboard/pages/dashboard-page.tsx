import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Activity, ArrowRight, Fingerprint, KeyRound, ShieldCheck, UserRound, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

function dashboardConnectionShell(isLight: boolean) {
  return cn(
    'group relative isolate overflow-hidden rounded-xl p-3 transition-all duration-300 ease-out',
    'hover:-translate-y-px motion-reduce:hover:translate-y-0',
    isLight
      ? cn(
          'border border-slate-200/60 bg-white/86 backdrop-blur-xl shadow-[0_8px_26px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.92)]',
          'hover:border-fuchsia-300/55 hover:shadow-[0_12px_34px_rgba(88,28,135,0.11),inset_0_1px_0_rgba(255,255,255,1)]',
        )
      : cn(
          'border border-white/[0.07] bg-[rgba(14,12,22,0.42)] backdrop-blur-xl',
          'shadow-[0_4px_22px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]',
          'hover:border-pink-400/25 hover:bg-[rgba(20,17,32,0.5)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.26)]',
        ),
  );
}

function DashboardConnectionGlow({ isLight }: { isLight: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-5 -top-5 size-14 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100',
          isLight ? 'bg-fuchsia-400/26 opacity-90' : 'bg-pink-500/12 opacity-50 group-hover:opacity-70',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-6 -left-4 size-11 rounded-full blur-2xl',
          isLight ? 'opacity-65 bg-sky-400/20' : 'opacity-35 bg-violet-600/10',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-70',
          isLight ? 'from-transparent via-white to-transparent' : 'from-transparent via-white/35 to-transparent',
        )}
      />
    </>
  );
}

function DashboardConnectionIcon({ icon: Icon, isLight }: { icon: LucideIcon; isLight: boolean }) {
  return (
    <div
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg border transition-all duration-300',
        isLight
          ? 'border-fuchsia-200/55 bg-white/95 text-fuchsia-600 shadow-[0_3px_10px_rgba(192,38,211,0.1)] group-hover:border-fuchsia-300/75 group-hover:shadow-[0_5px_16px_rgba(192,38,211,0.14)]'
          : 'border-white/10 bg-white/[0.05] text-slate-200 shadow-none group-hover:border-pink-400/28 group-hover:bg-pink-500/10 group-hover:text-white',
      )}
    >
      <Icon className="size-[14px] transition-transform duration-300 group-hover:scale-105" strokeWidth={1.65} />
    </div>
  );
}

function dashboardConnectionDetailBtn(isLight: boolean) {
  return cn(
    'relative z-10 mt-3 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold leading-none backdrop-blur-md transition-all duration-300',
    isLight
      ? 'border-[rgba(236,72,153,0.38)] bg-white/92 text-[#e11d48] shadow-[0_2px_8px_rgba(219,39,119,0.07)] hover:border-[rgba(236,72,153,0.52)] hover:bg-white hover:text-[#be185d] hover:shadow-[0_6px_16px_rgba(219,39,119,0.11)]'
      : 'border-white/10 bg-[rgba(12,10,20,0.55)] text-slate-200 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.18)] hover:border-pink-400/35 hover:bg-[rgba(22,18,34,0.65)] hover:text-white',
  );
}

interface DashboardConnectionCardProps {
  isLight: boolean;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  onNavigate: () => void;
  detailLabel: string;
}

function DashboardConnectionCard({
  isLight,
  titleKey,
  descriptionKey,
  icon,
  onNavigate,
  detailLabel,
}: DashboardConnectionCardProps) {
  const { t } = useTranslation(['dashboard']);

  return (
    <div className={dashboardConnectionShell(isLight)}>
      <DashboardConnectionGlow isLight={isLight} />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-xs font-semibold tracking-tight',
            isLight ? 'text-[#c0265c]' : 'bg-linear-to-r from-pink-400 via-pink-300 to-amber-200/95 bg-clip-text text-transparent',
          )}
        >
          {t(titleKey, { ns: 'dashboard' })}
        </p>
        <DashboardConnectionIcon icon={icon} isLight={isLight} />
      </div>
      <p className={cn('relative z-10 mt-1.5 text-xs leading-snug', isLight ? 'text-[#5E626D]' : 'text-slate-300/95')}>
        {t(descriptionKey, { ns: 'dashboard' })}
      </p>
      <button type="button" onClick={onNavigate} className={dashboardConnectionDetailBtn(isLight)}>
        {detailLabel}
        <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const darkStatCardClass = 'dashboard-stat-card';
  const darkSectionPanelClass = 'dashboard-section-panel';

  return (
    <div className="space-y-8">
      <Card className={`p-4 sm:p-5 ${isLight ? 'bg-white/66' : darkSectionPanelClass}`}>
        <PageHeader
          title={t('title', { ns: 'dashboard' })}
          description={t('description', { ns: 'dashboard' })}
          titleClassName={`font-bold sm:text-[1.7rem] ${isLight ? 'tracking-[-0.03em]' : ''}`}
          descriptionClassName={`text-xs ${isLight ? 'text-[#5E626D]' : 'text-white/70'}`}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLight ? 'text-[#5E626D]' : 'text-slate-400'}`}>{t('activeUser', { ns: 'dashboard' })}</p>
            <div
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${isLight ? 'border-sky-200/60 bg-sky-50 text-sky-600' : 'border-white/10 bg-sky-500/15 text-sky-300'}`}
            >
              <UserRound className="size-4" strokeWidth={1.75} />
            </div>
          </div>
          <div
            className={cn(
              'mt-2.5 h-px w-full bg-linear-to-r',
              isLight ? 'from-transparent via-slate-200/90 to-transparent' : 'from-transparent via-white/18 to-transparent',
            )}
            aria-hidden
          />
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
            {user?.firstName} {user?.lastName}
          </p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLight ? 'text-[#5E626D]' : 'text-slate-400'}`}>{t('role', { ns: 'common' })}</p>
            <div
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${isLight ? 'border-fuchsia-200/60 bg-fuchsia-50 text-fuchsia-600' : 'border-white/10 bg-emerald-500/12 text-emerald-300'}`}
            >
              <ShieldCheck className="size-4" strokeWidth={1.75} />
            </div>
          </div>
          <div
            className={cn(
              'mt-2.5 h-px w-full bg-linear-to-r',
              isLight ? 'from-transparent via-slate-200/90 to-transparent' : 'from-transparent via-white/18 to-transparent',
            )}
            aria-hidden
          />
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>{user?.role}</p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLight ? 'text-[#5E626D]' : 'text-slate-400'}`}>{t('permissionCountLabel', { ns: 'dashboard' })}</p>
            <div
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${isLight ? 'border-sky-200/70 bg-sky-50 text-sky-700' : 'border-white/10 bg-amber-500/12 text-amber-200'}`}
            >
              <KeyRound className="size-4" strokeWidth={1.75} />
            </div>
          </div>
          <div
            className={cn(
              'mt-2.5 h-px w-full bg-linear-to-r',
              isLight ? 'from-transparent via-slate-200/90 to-transparent' : 'from-transparent via-white/18 to-transparent',
            )}
            aria-hidden
          />
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>{permissions.length}</p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLight ? 'text-[#5E626D]' : 'text-slate-400'}`}>{t('apiStatus', { ns: 'dashboard' })}</p>
            <div
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${isLight ? 'border-violet-200/70 bg-violet-50 text-violet-700' : 'border-white/10 bg-orange-500/12 text-orange-300'}`}
            >
              <Activity className="size-4" strokeWidth={1.75} />
            </div>
          </div>
          <div
            className={cn(
              'mt-2.5 h-px w-full bg-linear-to-r',
              isLight ? 'from-transparent via-slate-200/90 to-transparent' : 'from-transparent via-white/18 to-transparent',
            )}
            aria-hidden
          />
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>{t('connected', { ns: 'dashboard' })}</p>
        </Card>
      </div>

      <Card className={`p-4 sm:p-5 lg:p-6 ${!isLight ? darkSectionPanelClass : ''}`}>
        <h3 className={`text-base font-semibold ${isLight ? 'text-[#2A2C31]' : 'text-slate-100'}`}>{t('initialConnections', { ns: 'dashboard' })}</h3>
        <div className="mt-4 grid gap-3.5 md:grid-cols-3 md:gap-4">
          <DashboardConnectionCard
            isLight={isLight}
            titleKey="authCardTitle"
            descriptionKey="authCardDescription"
            icon={Fingerprint}
            onNavigate={() => navigate('/profile')}
            detailLabel={t('detailAction', { ns: 'dashboard' })}
          />
          <DashboardConnectionCard
            isLight={isLight}
            titleKey="usersCardTitle"
            descriptionKey="usersCardDescription"
            icon={Users}
            onNavigate={() => navigate('/users')}
            detailLabel={t('detailAction', { ns: 'dashboard' })}
          />
          <DashboardConnectionCard
            isLight={isLight}
            titleKey="createUserCardTitle"
            descriptionKey="createUserCardDescription"
            icon={UserPlus}
            onNavigate={() => navigate('/users')}
            detailLabel={t('detailAction', { ns: 'dashboard' })}
          />
        </div>
      </Card>
    </div>
  );
}
