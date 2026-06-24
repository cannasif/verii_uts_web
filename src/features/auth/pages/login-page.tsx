import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Ban,
  Sparkles,
  Check,
  Languages,
  Phone,
  Globe,
  Mail,
  Send,
  Instagram,
  X,
  MessageCircle,
} from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginMutation } from '@/features/auth/hooks/use-login-mutation';
import { AuthBackground } from '@/features/auth/components/auth-background';
import i18n from '@/lib/i18n';
import { logoLuminanceMaskStyle } from '@/lib/logo-luminance-mask';
import { getDevLoginDefaultValues } from '@/lib/dev-login-defaults';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

// Static branch list - gerçek uygulamada API'dan gelecek
const BRANCHES = [
  { id: 1, name: 'V3RII.CO' },
];

export function LoginPage() {
  useTranslation(['auth', 'common']);
  return <LoginPageForm key={i18n.resolvedLanguage ?? i18n.language} />;
}

type LoginForm = {
  branchId: string;
  email: string;
  password: string;
  rememberMe: boolean;
};

function LoginPageForm() {
  const { t } = useTranslation(['auth', 'common']);
  const schema = useMemo(
    () =>
      z.object({
        branchId: z.string().min(1, i18n.t('branchRequired', { ns: 'auth' })),
        email: z.email(i18n.t('validationEmail', { ns: 'common' })),
        password: z.string().min(1, i18n.t('validationPasswordRequired', { ns: 'common' })),
        rememberMe: z.boolean(),
      }),
    [],
  );
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const setTheme = useUiStore((state) => state.setTheme);
  const loginMutation = useLoginMutation();
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: getDevLoginDefaultValues(),
  });

  const selectedBranchId = watch('branchId');
  const selectedBranch = BRANCHES.find((b) => b.id === Number(selectedBranchId));

  const languageOptions = [
    { value: 'tr', label: 'TR', description: 'Türkçe', icon: '🇹🇷' },
    { value: 'en', label: 'EN', description: 'English', icon: '🇬🇧' },
  ];

  const currentLanguage = (i18n.language ?? i18n.resolvedLanguage ?? 'tr').split('-')[0].toLowerCase();

  useLayoutEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangOpen]);

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
    await loginMutation.mutateAsync({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
      branchId: Number(values.branchId),
      branchName: selectedBranch?.name,
    });
    navigate('/', { replace: true });
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_120%_100%_at_50%_38%,#210b24_0%,#120a14_52%,#060208_100%)] px-3 py-6 text-white sm:px-4 sm:py-8">
      <AuthBackground isActive={showAnimation} />

      <div className="fixed z-20 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] sm:bottom-6 sm:right-6">
        <div className="relative flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setIsLangOpen((s) => !s)}
            className="flex min-h-10 items-center justify-center rounded-full border border-white/15 bg-[radial-gradient(ellipse_140%_120%_at_50%_50%,rgba(28,12,32,0.92)_0%,#1a0a1f_100%)] px-4 py-2.5 text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all hover:scale-[1.03]"
            title={currentLanguage === 'tr' ? 'Türkçe' : 'English'}
          >
            <Languages className="size-5 shrink-0" strokeWidth={1.5} />
          </button>

          {isLangOpen && (
            <div
              ref={languageDropdownRef}
              className="absolute -right-2 bottom-14 z-40 mt-3 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#12061d] shadow-[0_15px_45px_rgba(0,0,0,0.3)]"
              style={{ minWidth: '220px', maxWidth: '280px' }}
            >
              <div className="max-h-64 overflow-y-auto overscroll-contain">
                {languageOptions.map((language) => {
                  const selected = currentLanguage === language.value;
                  return (
                    <button
                      key={language.value}
                      type="button"
                      onClick={() => void (localStorage.setItem('verii_uts_lang', language.value), i18n.changeLanguage(language.value), setIsLangOpen(false))}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${selected ? 'bg-pink-500/10 text-pink-100' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1d142a] text-lg text-white">{language.icon}</span>
                        <div>
                          <p className="font-semibold leading-5">{language.description}</p>
                          <p className="text-[0.65rem] uppercase tracking-[0.2em] opacity-70">{language.label}</p>
                        </div>
                      </div>
                      {selected ? <Check className="size-4 text-emerald-400" /> : <div className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            {showAnimation ? <Sparkles className="size-5" /> : <Ban className="size-5" />}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <Card className="login-auth-card flex w-full max-w-md flex-col rounded-3xl p-8 sm:px-10 sm:py-9">
          <div className="relative mb-8 text-center">
            <div className="flex justify-center">
              <div
                role="img"
                aria-label="V3RII UTS"
                className="mx-auto h-32 w-80 bg-linear-to-r from-fuchsia-600 via-pink-500 to-orange-400 sm:h-36 sm:w-96"
                style={logoLuminanceMaskStyle('/v3rii-logo.png')}
              />
            </div>

            {/* Main Title */}
            <h2 className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              {t('loginMainTitle', { ns: 'auth' })}
            </h2>
          </div>

          <form className="mt-5 flex flex-1 flex-col" onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              {/* Branch Dropdown */}
              <div>
                <div className="relative">
                  <input type="hidden" {...register('branchId')} />
                  <button
                    type="button"
                    onClick={() => setIsBranchOpen(!isBranchOpen)}
                    className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                      errors.branchId
                        ? 'border-rose-500 bg-[#141018] text-white'
                        : 'login-auth-field border text-white hover:bg-[#16111a]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className={`size-4 shrink-0 ${errors.branchId ? 'text-rose-500' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className={!selectedBranch?.name ? 'text-slate-500' : ''}>
                        {selectedBranch?.name || t('branch', { ns: 'auth' })}
                      </span>
                    </span>
                    <ChevronDown className={`size-4 transition ${isBranchOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isBranchOpen && (
                    <div
                      className="login-auth-dropdown absolute top-full z-10 mt-2 w-full rounded-lg border bg-[#141018] shadow-lg"
                    >
                      {BRANCHES.map((branch) => (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => {
                            setValue('branchId', branch.id.toString(), { shouldValidate: true });
                            setIsBranchOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left transition hover:bg-opacity-70 ${
                            selectedBranchId === branch.id.toString()
                              ? 'bg-pink-500/20 text-pink-200'
                              : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {branch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.branchId && <p className="mt-2 text-sm text-rose-500">{errors.branchId.message}</p>}
              </div>

              {/* Email Input */}
              <div>
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <Input
                    {...register('email')}
                    className="login-auth-input border-[rgba(55,42,64,0.95)] bg-[#121018] pl-12 text-white placeholder:text-slate-500 focus:ring-0"
                    placeholder={t('corporateEmail', { ns: 'auth' })}
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <Input
                    {...register('password')}
                    className="login-auth-input border-[rgba(55,42,64,0.95)] bg-[#121018] pl-12 pr-12 text-white placeholder:text-slate-500 focus:ring-0"
                    placeholder={t('password', { ns: 'auth' })}
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
            </div>

            <div className="mt-8 space-y-4 sm:mt-9">
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm text-slate-400">
                <label className="flex items-center gap-2 transition hover:text-pink-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-pink-500"
                    {...register('rememberMe')}
                  />
                  {t('rememberMe', { ns: 'auth' })}
                </label>
                <button
                  type="button"
                  className="text-pink-400 transition hover:underline hover:text-pink-300"
                >
                  {t('forgotPassword', { ns: 'auth' })}
                </button>
              </div>

              {/* Login Button */}
              <Button
                className="h-12 w-full rounded-2xl text-sm font-extrabold uppercase tracking-wide create-action-button"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? t('signingIn', { ns: 'common' }) : t('login', { ns: 'auth' })}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center">
          <p className="text-[0.8rem] uppercase tracking-[0.38em] text-slate-300/80 sm:text-sm">
            <Trans
              i18nKey="loginSlogan"
              ns="auth"
              components={{ 1: <span className="font-semibold text-[#ff9b45]" /> }}
            />
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {[
              {
                icon: <Phone className="size-5" />,
                href: '#',
                label: 'Telefon',
                hover:
                  'hover:text-[#ffd0b6] hover:border-[rgba(255,159,100,0.45)] hover:shadow-[0_0_18px_rgba(255,159,90,0.28)]',
              },
              {
                icon: <Globe className="size-5" />,
                href: '#',
                label: 'Web',
                hover: 'hover:text-sky-200 hover:border-sky-300/70 hover:shadow-[0_0_18px_rgba(125,211,252,0.28)]',
              },
              {
                icon: <Mail className="size-5" />,
                href: '#',
                label: 'Mail',
                hover: 'hover:text-amber-200 hover:border-amber-300/70 hover:shadow-[0_0_18px_rgba(252,211,77,0.25)]',
              },
              {
                icon: <MessageCircle className="size-5" />,
                href: '#',
                label: 'WhatsApp',
                hover: 'hover:text-emerald-300 hover:border-emerald-300/70 hover:shadow-[0_0_18px_rgba(34,197,94,0.3)]',
              },
              {
                icon: <Send className="size-5" />,
                href: '#',
                label: 'Telegram',
                hover: 'hover:text-sky-300 hover:border-sky-300/70 hover:shadow-[0_0_18px_rgba(56,189,248,0.28)]',
              },
              {
                icon: <Instagram className="size-5" />,
                href: '#',
                label: 'Instagram',
                hover: 'hover:text-fuchsia-200 hover:border-fuchsia-300/70 hover:shadow-[0_0_18px_rgba(244,114,182,0.3)]',
              },
              {
                icon: <X className="size-5" />,
                href: '#',
                label: 'X',
                hover: 'hover:text-slate-100 hover:border-slate-200/70 hover:shadow-[0_0_18px_rgba(226,232,240,0.18)]',
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 ${item.hover}`}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
