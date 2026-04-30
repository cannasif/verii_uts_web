import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Activity, ArrowRight, Fingerprint, KeyRound, ShieldCheck, UserRound, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const permissionTone = permissions.length <= 5 ? 'warning' : 'success';
  const darkStatCardClass = 'dashboard-stat-card';

  return (
    <div className="space-y-8">
      <Card className={`p-4 sm:p-5 ${isLight ? 'bg-white/66' : ''}`}>
        <PageHeader
          title={t('title', { ns: 'dashboard' })}
          description={t('description', { ns: 'dashboard' })}
          titleClassName={`font-bold sm:text-[1.7rem] ${isLight ? 'tracking-[-0.03em]' : ''}`}
          descriptionClassName={`text-xs ${isLight ? 'text-[#5E626D]' : 'text-white/70'}`}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <UserRound className={`absolute right-4 top-4 size-5 ${isLight ? 'text-[#ff5f40]/90' : 'text-white/70'}`} />
          <p className={`text-sm ${isLight ? 'text-[#5E626D]' : 'text-slate-300/70'}`}>{t('activeUser', { ns: 'dashboard' })}</p>
          <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
            {user?.firstName} {user?.lastName}
          </p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <ShieldCheck className={`absolute right-4 top-4 size-5 ${isLight ? 'text-[#ff5f40]/85' : 'text-fuchsia-200/90'}`} />
          <p className={`text-sm ${isLight ? 'text-[#5E626D]' : 'text-white/70'}`}>{t('role', { ns: 'common' })}</p>
          <p className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-2xl font-semibold ${isLight ? 'border border-[rgba(255,138,196,0.28)] bg-linear-to-r from-[#ff8ac4]/14 via-[#ff5f40]/12 to-[#ff9f2a]/14 text-[#ff5f40]' : 'border-transparent bg-transparent text-white'}`}>{user?.role}</p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <KeyRound className={`absolute right-4 top-4 size-5 ${isLight ? 'text-[#ff9f2a]/90' : 'text-white/70'}`} />
          <p className={`text-sm ${isLight ? 'text-[#5E626D]' : 'text-white/70'}`}>{t('permissionCountLabel', { ns: 'dashboard' })}</p>
          <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{permissions.length}</p>
        </Card>
        <Card className={`relative p-4 transition-all duration-300 ${isLight ? 'bg-white/64 hover:bg-[rgba(255,90,99,0.06)]' : darkStatCardClass}`}>
          <Activity className={`absolute right-4 top-4 size-5 ${isLight ? 'text-[#ff5f40]/90' : 'text-white/70'}`} />
          <p className={`text-sm ${isLight ? 'text-[#5E626D]' : 'text-white/70'}`}>{t('apiStatus', { ns: 'dashboard' })}</p>
          <p className={`mt-2 text-2xl font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{t('connected', { ns: 'dashboard' })}</p>
        </Card>
      </div>

      <Card className="p-5 sm:p-7 lg:p-8">
        <h3 className={`text-lg font-semibold ${isLight ? 'text-[#2A2C31]' : 'text-slate-900'}`}>{t('initialConnections', { ns: 'dashboard' })}</h3>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className={`group rounded-3xl border p-3 transition-all duration-300 ${isLight ? 'border-white/65 bg-white/70 shadow-[0_16px_36px_rgba(255,90,99,0.08),inset_0_1px_0_rgba(255,255,255,0.65)] hover:border-[#ff8ac4]/60 hover:bg-[rgba(255,90,99,0.06)] hover:shadow-[0_20px_50px_rgba(255,90,99,0.18),0_0_50px_rgba(255,159,42,0.14),inset_0_1px_0_rgba(255,255,255,0.8)]' : 'border-fuchsia-300/28 ring-1 ring-inset ring-fuchsia-300/10 bg-[#211534]/84 hover:border-red-400/45 hover:bg-[#2a1632]/85 hover:shadow-[0_14px_32px_rgba(7,2,12,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]'}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-semibold ${isLight ? 'text-[#ff5f40]' : 'bg-linear-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent'}`}>{t('authCardTitle', { ns: 'dashboard' })}</p>
              <Fingerprint className={`size-4 shrink-0 transition group-hover:scale-110 ${isLight ? 'text-[#ff5f40]/85' : 'text-cyan-200/80'}`} />
            </div>
            <p className={`mt-2 text-sm ${isLight ? 'text-[#5E626D]' : 'text-slate-300'}`}>{t('authCardDescription', { ns: 'dashboard' })}</p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className={`mt-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${isLight ? 'border-[rgba(255,138,196,0.36)] bg-white/80 text-[#ff5f40] hover:bg-white hover:text-[#ff3a9b]' : 'border-cyan-300/35 bg-[#1a132b]/80 text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100'}`}
            >
              {t('detailAction', { ns: 'dashboard' })}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className={`group rounded-3xl border p-3 transition-all duration-300 ${isLight ? 'border-white/65 bg-white/70 shadow-[0_16px_36px_rgba(255,90,99,0.08),inset_0_1px_0_rgba(255,255,255,0.65)] hover:border-[#ff8ac4]/60 hover:bg-[rgba(255,90,99,0.06)] hover:shadow-[0_20px_50px_rgba(255,90,99,0.18),0_0_50px_rgba(255,159,42,0.14),inset_0_1px_0_rgba(255,255,255,0.8)]' : 'border-fuchsia-300/28 ring-1 ring-inset ring-fuchsia-300/10 bg-[#211534]/84 hover:border-red-400/45 hover:bg-[#2a1632]/85 hover:shadow-[0_14px_32px_rgba(7,2,12,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]'}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-semibold ${isLight ? 'text-[#ff5f40]' : 'bg-linear-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent'}`}>{t('usersCardTitle', { ns: 'dashboard' })}</p>
              <Users className={`size-4 shrink-0 transition group-hover:scale-110 ${isLight ? 'text-[#ff5f40]/85' : 'text-cyan-200/80'}`} />
            </div>
            <p className={`mt-2 text-sm ${isLight ? 'text-[#5E626D]' : 'text-slate-300'}`}>{t('usersCardDescription', { ns: 'dashboard' })}</p>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className={`mt-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${isLight ? 'border-[rgba(255,138,196,0.36)] bg-white/80 text-[#ff5f40] hover:bg-white hover:text-[#ff3a9b]' : 'border-cyan-300/35 bg-[#1a132b]/80 text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100'}`}
            >
              {t('detailAction', { ns: 'dashboard' })}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className={`group rounded-3xl border p-3 transition-all duration-300 ${isLight ? 'border-white/65 bg-white/70 shadow-[0_16px_36px_rgba(255,90,99,0.08),inset_0_1px_0_rgba(255,255,255,0.65)] hover:border-[#ff8ac4]/60 hover:bg-[rgba(255,90,99,0.06)] hover:shadow-[0_20px_50px_rgba(255,90,99,0.18),0_0_50px_rgba(255,159,42,0.14),inset_0_1px_0_rgba(255,255,255,0.8)]' : 'border-fuchsia-300/28 ring-1 ring-inset ring-fuchsia-300/10 bg-[#211534]/84 hover:border-red-400/45 hover:bg-[#2a1632]/85 hover:shadow-[0_14px_32px_rgba(7,2,12,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]'}`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-semibold ${isLight ? 'text-[#ff5f40]' : 'bg-linear-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent'}`}>{t('createUserCardTitle', { ns: 'dashboard' })}</p>
              <UserPlus className={`size-4 shrink-0 transition group-hover:scale-110 ${isLight ? 'text-[#ff5f40]/85' : 'text-cyan-200/80'}`} />
            </div>
            <p className={`mt-2 text-sm ${isLight ? 'text-[#5E626D]' : 'text-slate-300'}`}>{t('createUserCardDescription', { ns: 'dashboard' })}</p>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className={`mt-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${isLight ? 'border-[rgba(255,138,196,0.36)] bg-white/80 text-[#ff5f40] hover:bg-white hover:text-[#ff3a9b]' : 'border-cyan-300/35 bg-[#1a132b]/80 text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100'}`}
            >
              {t('detailAction', { ns: 'dashboard' })}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
