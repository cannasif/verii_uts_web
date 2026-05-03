import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Moon,
  Ban,
  Sun,
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
import { useUiStore } from '@/stores/ui-store';

const schema = z.object({
  branchId: z.string().min(1, 'Lütfen şube seçiniz'),
  email: z.email(i18n.t('validationEmail', { ns: 'common' })),
  password: z.string().min(1, i18n.t('validationPasswordRequired', { ns: 'common' })),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof schema>;

// Static branch list - gerçek uygulamada API'dan gelecek
const BRANCHES = [
  { id: 1, name: 'V3RII.CO' },
];

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const theme = useUiStore((state) => state.theme);
  const loginMutation = useLoginMutation();
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      branchId: '',
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const selectedBranchId = watch('branchId');
  const selectedBranch = BRANCHES.find((b) => b.id === Number(selectedBranchId));
  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLanguage);
  };

  const languageOptions = [
    { value: 'tr', label: 'TR', description: 'Türkçe', icon: '🇹🇷' },
    { value: 'en', label: 'EN', description: 'English', icon: '🇬🇧' },
  ];

  const currentLanguage = (i18n.language ?? i18n.resolvedLanguage ?? 'tr').split('-')[0].toLowerCase();

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
    <div
      className={`relative min-h-screen overflow-hidden px-3 py-6 sm:px-4 sm:py-8 ${
        theme === 'light'
          ? 'bg-[#f4ebff] text-slate-900'
          : 'bg-[radial-gradient(ellipse_120%_100%_at_50%_38%,#210b24_0%,#120a14_52%,#060208_100%)] text-white'
      }`}
    >
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${theme === 'dark' ? 'hidden' : ''} ${showAnimation ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute right-[-10%] top-[-10%] h-[60vw] w-[60vw] rounded-full blur-[120px] bg-pink-400/30" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full blur-[120px] bg-cyan-400/25" />
      </div>

      <AuthBackground isActive={showAnimation} />

      <div className="fixed z-20 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] sm:bottom-6 sm:right-6">
        <div className="relative flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setIsLangOpen((s) => !s)}
            className={`flex min-h-10 items-center justify-center rounded-full border px-4 py-2.5 backdrop-blur-xl transition-all hover:scale-[1.03] ${
              theme === 'light'
                ? 'border-[rgba(236,72,153,0.35)] bg-white/95 text-fuchsia-600 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'border-white/15 bg-[radial-gradient(ellipse_140%_120%_at_50%_50%,rgba(28,12,32,0.92)_0%,#1a0a1f_100%)] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
            }`}
            title={currentLanguage === 'tr' ? 'Türkçe' : 'English'}
          >
            <Languages className="size-5 shrink-0" strokeWidth={1.5} />
          </button>

          {isLangOpen && (
            <div ref={languageDropdownRef} className={`absolute -right-2 bottom-14 z-40 mt-3 overflow-hidden rounded-[1.4rem] border ${theme === 'light' ? 'border-[rgba(255,138,196,0.24)] bg-white shadow-xl' : 'border-white/10 bg-[#12061d] shadow-[0_15px_45px_rgba(0,0,0,0.3)]'}`} style={{ minWidth: '220px', maxWidth: '280px' }}>
              <div className="max-h-64 overflow-y-auto overscroll-contain">
                {languageOptions.map((language) => {
                  const selected = currentLanguage === language.value;
                  return (
                    <button
                      key={language.value}
                      type="button"
                      onClick={() => void (localStorage.setItem('verii_uts_lang', language.value), i18n.changeLanguage(language.value), setIsLangOpen(false))}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${selected ? (theme === 'light' ? 'bg-fuchsia-50 font-medium text-fuchsia-900' : 'bg-pink-500/10 text-pink-100') : (theme === 'light' ? 'text-slate-700 hover:bg-fuchsia-50/80' : 'text-slate-300 hover:bg-white/5')}`}
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
                : theme === 'light'
                  ? 'border-fuchsia-300/70 bg-white/95 text-fuchsia-600'
                  : 'border-white/20 bg-zinc-900/80 text-slate-200'
            }`}
            title={showAnimation ? t('animationOff', { ns: 'auth' }) : t('animationOn', { ns: 'auth' })}
          >
            {showAnimation ? <Sparkles className="size-5" /> : <Ban className="size-5" />}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <Card className="login-auth-card flex w-full max-w-md flex-col rounded-[30px] p-8 sm:min-h-[620px] sm:px-10 sm:py-9">
          <div className="relative text-center">
            {/* Logo */}
            <div
              className={`pointer-events-none absolute left-1/2 top-8 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-2xl text-4xl font-black text-white shadow-lg sm:top-10 ${
                theme === 'light'
                  ? 'bg-linear-to-br from-fuchsia-600 via-pink-600 to-violet-600'
                  : 'bg-linear-to-br from-pink-600 via-orange-500 to-yellow-400'
              }`}
            >
              V
            </div>

            <div className="h-[8.5rem] sm:h-[9.5rem]" />

            {/* V3RII UTS Text */}
            <h1 className={`text-xl font-bold tracking-wider ${theme === 'light' ? 'bg-linear-to-r from-fuchsia-600 via-pink-600 to-violet-600 bg-clip-text text-transparent' : 'bg-linear-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent'}`}>
              V3RII UTS
            </h1>

            {/* Main Title */}
            <h2 className={`mt-2 text-sm font-semibold uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {t('loginMainTitle', { ns: 'auth' })}
            </h2>
          </div>

          <form className="mt-5 flex flex-1 flex-col" onSubmit={onSubmit}>
            <div className="grid grid-rows-3 gap-y-6">
              {/* Branch Dropdown */}
              <div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBranchOpen(!isBranchOpen)}
                    className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                      theme === 'light'
                        ? 'border-fuchsia-200/70 bg-white/70 text-slate-800 hover:bg-white'
                        : 'login-auth-field border text-white hover:bg-[#16111a]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className={!selectedBranch?.name ? (theme === 'light' ? 'text-slate-400' : 'text-slate-500') : ''}>
                        {selectedBranch?.name || t('branch', { ns: 'auth' })}
                      </span>
                    </span>
                    <ChevronDown className={`size-4 transition ${isBranchOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isBranchOpen && (
                    <div
                      className={`absolute top-full mt-2 w-full rounded-lg border shadow-lg z-10 ${
                        theme === 'light'
                          ? 'border-fuchsia-200/70 bg-white'
                          : 'login-auth-dropdown border bg-[#141018]'
                      }`}
                    >
                      {BRANCHES.map((branch) => (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => {
                            setValue('branchId', branch.id.toString());
                            setIsBranchOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-opacity-70 transition ${
                            selectedBranchId === branch.id.toString()
                              ? theme === 'light'
                                ? 'bg-fuchsia-100 text-fuchsia-900'
                                : 'bg-pink-500/20 text-pink-200'
                              : theme === 'light'
                                ? 'text-slate-700 hover:bg-slate-100'
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
                    className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}
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
                    className={`login-auth-input pl-12 ${theme === 'light' ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'} focus:ring-0`}
                    placeholder={t('corporateEmail', { ns: 'auth' })}
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p>}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <svg
                    className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}
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
                    className={`login-auth-input pl-12 pr-12 ${theme === 'light' ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'} focus:ring-0`}
                    placeholder={t('password', { ns: 'auth' })}
                    type={isPasswordVisible ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${theme === 'light' ? 'text-slate-500 hover:text-fuchsia-600' : 'text-slate-400 hover:text-white'}`}
                  >
                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p>}
              </div>
            </div>

            <div className="mt-12 space-y-4 pt-6">
              {/* Remember Me & Forgot Password */}
              <div className={`flex items-center justify-between text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                <label className={`flex items-center gap-2 transition ${theme === 'light' ? 'hover:text-fuchsia-600' : 'hover:text-pink-400'}`}>
                  <input
                    type="checkbox"
                    className={`h-4 w-4 rounded ${theme === 'light' ? 'accent-fuchsia-500' : 'accent-pink-500'}`}
                    {...register('rememberMe')}
                  />
                  {t('rememberMe', { ns: 'auth' })}
                </label>
                <button
                  type="button"
                  className={`transition hover:underline ${theme === 'light' ? 'text-fuchsia-600 hover:text-fuchsia-700' : 'text-pink-400 hover:text-pink-300'}`}
                >
                  {t('forgotPassword', { ns: 'auth' })}
                </button>
              </div>

              {/* Login Button */}
              <Button
                className="h-12 w-full rounded-2xl text-sm font-extrabold uppercase tracking-wide create-action-button"
                disabled={loginMutation.isPending || !isValid}
                type="submit"
              >
                {loginMutation.isPending ? t('signingIn', { ns: 'common' }) : t('login', { ns: 'auth' })}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center">
          <p
            className={`text-[0.8rem] uppercase tracking-[0.38em] sm:text-sm ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300/80'
            }`}
          >
            &quot;İŞİNİZİ TAHMİNLERLE DEĞİL,{' '}
            <span className={`font-semibold ${theme === 'light' ? 'text-fuchsia-700' : 'text-[#ff9b45]'}`}>V3RII</span>
            &#39;YLE YÖNETİN.&quot;
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {(
              theme === 'light'
                ? [
                    {
                      icon: <Phone className="size-5" />,
                      href: '#',
                      label: 'Telefon',
                      hover:
                        'hover:text-fuchsia-800 hover:border-fuchsia-300/80 hover:shadow-[0_0_18px_rgba(192,38,211,0.2)]',
                    },
                    {
                      icon: <Globe className="size-5" />,
                      href: '#',
                      label: 'Web',
                      hover: 'hover:text-sky-700 hover:border-sky-400/80 hover:shadow-[0_0_18px_rgba(14,165,233,0.2)]',
                    },
                    {
                      icon: <Mail className="size-5" />,
                      href: '#',
                      label: 'Mail',
                      hover: 'hover:text-violet-800 hover:border-violet-300/80 hover:shadow-[0_0_18px_rgba(139,92,246,0.18)]',
                    },
                    {
                      icon: <MessageCircle className="size-5" />,
                      href: '#',
                      label: 'WhatsApp',
                      hover: 'hover:text-emerald-700 hover:border-emerald-400/80 hover:shadow-[0_0_18px_rgba(16,185,129,0.22)]',
                    },
                    {
                      icon: <Send className="size-5" />,
                      href: '#',
                      label: 'Telegram',
                      hover: 'hover:text-sky-700 hover:border-sky-400/80 hover:shadow-[0_0_18px_rgba(14,165,233,0.2)]',
                    },
                    {
                      icon: <Instagram className="size-5" />,
                      href: '#',
                      label: 'Instagram',
                      hover: 'hover:text-fuchsia-800 hover:border-fuchsia-300/80 hover:shadow-[0_0_18px_rgba(192,38,211,0.2)]',
                    },
                    {
                      icon: <X className="size-5" />,
                      href: '#',
                      label: 'X',
                      hover: 'hover:text-slate-900 hover:border-slate-400/80 hover:shadow-[0_0_18px_rgba(15,23,42,0.12)]',
                    },
                  ]
                : [
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
                  ]
            ).map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${item.hover} ${
                  theme === 'light'
                    ? 'border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm'
                    : 'border border-white/10 bg-white/5 text-slate-200'
                }`}
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
