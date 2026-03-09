import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginMutation } from '@/features/auth/hooks/use-login-mutation';
import { AuthBackground } from '@/features/auth/components/auth-background';
import i18n from '@/lib/i18n';

const schema = z.object({
  email: z.email(i18n.t('validationEmail', { ns: 'common' })),
  password: z.string().min(1, i18n.t('validationPasswordRequired', { ns: 'common' })),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const loginMutation = useLoginMutation();
  const [showAnimation, setShowAnimation] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email: 'admin@verii.local',
      password: 'Admin123!',
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('sessionExpired') === 'true') {
      toast.warning(t('sessionExpired', { ns: 'common' }));
    }
  }, [location.search, t]);

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
    navigate('/', { replace: true });
  });

  const requiredMark = <span className="ml-1 text-rose-400">*</span>;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0518] px-3 py-6 text-white sm:px-4 sm:py-8">
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${showAnimation ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute right-[-10%] top-[-10%] h-[60vw] w-[60vw] rounded-full bg-pink-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-orange-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#0f0518]/50 to-[#0f0518]" />
      </div>

      <AuthBackground isActive={showAnimation} />

      <div className="fixed bottom-6 right-6 z-20">
        <button
          type="button"
          onClick={() => setShowAnimation((current) => !current)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-xl transition-all hover:scale-110 ${
            showAnimation
              ? 'border-pink-500/50 bg-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.35)]'
              : 'border-white/20 bg-zinc-900/80 text-slate-200'
          }`}
          title={showAnimation ? t('animationOff', { ns: 'auth' }) : t('animationOn', { ns: 'auth' })}
        >
          {showAnimation ? <Sparkles className="size-5" /> : <WifiOff className="size-5" />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-between">
        <div className="flex flex-1 items-center justify-center py-6 sm:py-8">
          <Card className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#140a1e]/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-xl sm:p-8 md:p-10">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-linear-to-br from-pink-600 via-orange-500 to-yellow-400 text-3xl font-black text-white shadow-[0_20px_40px_rgba(236,72,153,0.25)]">
                V
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{t('logoName', { ns: 'common' })}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{t('loginTitle', { ns: 'auth' })}</h2>
              <p className="mt-3 text-sm text-slate-400">
                {t('loginSubtitle', { ns: 'auth' })}
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  {t('email', { ns: 'common' })}{requiredMark}
                </label>
                <Input
                  {...register('email')}
                  className="border-white/10 bg-black/30 text-white placeholder:text-slate-500 focus:border-pink-500 focus:bg-black/50 focus:ring-0"
                  placeholder={t('exampleEmail', { ns: 'auth' })}
                />
                {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  {t('password', { ns: 'common' })}{requiredMark}
                </label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    className="border-white/10 bg-black/30 pr-12 text-white placeholder:text-slate-500 focus:border-pink-500 focus:bg-black/50 focus:ring-0"
                    placeholder="••••••••"
                    type={isPasswordVisible ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  >
                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between px-1 text-sm text-slate-400">
                <label className="flex items-center gap-2 transition hover:text-pink-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-pink-500"
                    {...register('rememberMe')}
                  />
                  {t('rememberMe', { ns: 'common' })}
                </label>
                <span className="text-xs text-slate-500">{t('shortcutHint', { ns: 'common' })}</span>
              </div>

              <Button
                className="mt-6 h-12 w-full rounded-xl bg-linear-to-r from-pink-600 via-orange-500 to-yellow-500 text-sm font-bold uppercase tracking-wide hover:from-pink-500 hover:via-orange-400 hover:to-yellow-400"
                disabled={loginMutation.isPending || !isValid}
                type="submit"
              >
                {loginMutation.isPending ? t('signingIn', { ns: 'common' }) : t('login', { ns: 'common' })}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>

            <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-slate-500">
              {t('loginFooter', { ns: 'auth' })}
            </p>
          </Card>
        </div>

        <div className="w-full max-w-4xl pb-6 pt-4">
          <div className="flex flex-wrap items-center justify-center gap-4 px-4">
            <a
              href="tel:+905070123018"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-lime-500/30 hover:bg-zinc-800 hover:text-lime-400 hover:shadow-[0_0_15px_rgba(132,204,22,0.3)]"
            >
              <Phone className="size-5" />
            </a>
            <a
              href="https://v3rii.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-pink-500/30 hover:bg-zinc-800 hover:text-pink-400 hover:shadow-[0_0_15px_rgba(244,114,182,0.3)]"
            >
              <Globe className="size-5" />
            </a>
            <a
              href="mailto:info@v3rii.com"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-orange-500/30 hover:bg-zinc-800 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)]"
            >
              <Mail className="size-5" />
            </a>
            <a
              href="https://wa.me/905070123018"
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-emerald-500/30 hover:bg-zinc-800 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              <MessageCircle className="size-5" />
            </a>
            <button
              type="button"
              onClick={() => toast.info(t('comingSoon', { ns: 'common' }))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-sky-500/30 hover:bg-zinc-800 hover:text-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
            >
              <SendIconFallback />
            </button>
            <button
              type="button"
              onClick={() => toast.info(t('comingSoon', { ns: 'common' }))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-slate-200 shadow-lg transition-all duration-300 hover:scale-110 hover:border-fuchsia-500/30 hover:bg-zinc-800 hover:text-fuchsia-400 hover:shadow-[0_0_15px_rgba(232,121,249,0.3)]"
            >
              <Instagram className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendIconFallback() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}
