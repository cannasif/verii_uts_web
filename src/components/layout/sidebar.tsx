import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Factory, FileStack, LayoutDashboard, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

interface NavItem {
  title: string;
  href?: string;
  icon?: typeof LayoutDashboard;
  children?: NavItem[];
}

const items: NavItem[] = [
  {
    title: 'general',
    icon: LayoutDashboard,
    children: [{ title: 'dashboard', href: '/' }],
  },
  {
    title: 'accessManagement',
    icon: Shield,
    children: [
      { title: 'users', href: '/users' },
      { title: 'roles', href: '/roles' },
      { title: 'permissionGroups', href: '/permission-groups' },
    ],
  },
  {
    title: 'system',
    icon: FileStack,
    children: [
      { title: 'customers', href: '/customers', icon: Building2 },
      { title: 'stocks', href: '/stocks' },
      { title: 'hangfireMonitoring', href: '/hangfire-monitoring' },
      { title: 'authInfrastructure' },
      { title: 'utsModulesPreparation' },
    ],
  },
  {
    title: 'utsModules',
    icon: Factory,
    children: [
      { title: 'utsUretimList', href: '/uts-uretim-list' },
      { title: 'utsVermeList', href: '/uts-verme-list' },
      { title: 'utsTVermeList', href: '/uts-tverme-list' },
      { title: 'utsTuketiciVermeList', href: '/uts-tuketici-verme-list' },
      { title: 'utsIthalatList', href: '/uts-ithalat-list' },
      { title: 'utsImhaList', href: '/uts-imha-list' },
      { title: 'utsIhracatList', href: '/uts-ihracat-list' },
      { title: 'utsAlmaList', href: '/uts-alma-list' },
    ],
  },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

export function Sidebar() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, theme, isSidebarCollapsed } = useUiStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['general', 'accessManagement']));

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    setExpandedGroups(
      new Set(
        items
          .filter((item) =>
            item.children?.some((child) => normalizeText(t(child.title)).includes(normalizeText(searchQuery))),
          )
          .map((item) => item.title),
      ),
    );
  }, [searchQuery, t]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = normalizeText(searchQuery);
    return items
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => normalizeText(t(child.title)).includes(query)),
      }))
      .filter((item) => item.children && item.children.length > 0);
  }, [searchQuery, t]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="sidebar-overlay"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          `fixed left-0 top-0 z-40 flex h-screen max-w-[88vw] flex-col overflow-hidden border-transparent shadow-2xl backdrop-blur-xl transition-all duration-300 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-linear-to-b after:from-transparent after:via-white/10 after:to-transparent ${theme === 'light' ? 'bg-white/95 shadow-purple-500/5' : 'bg-[#11061d]/90'}`,
          isSidebarOpen ? 'w-[18rem] translate-x-0' : '-translate-x-full lg:translate-x-0',
          isSidebarCollapsed && 'lg:w-20',
        )}
      >
        <div
          className={`relative flex h-24 items-center border-transparent px-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent ${theme === 'light' ? 'bg-white/50' : 'bg-[#11061d]/88'} ${isSidebarCollapsed ? 'lg:justify-center' : 'justify-start'}`}
        >
          <Link to="/" className="flex items-center gap-3">
            <div className={`flex size-11 items-center justify-center rounded-2xl text-lg font-bold text-white flex-shrink-0 ${theme === 'light' ? 'bg-linear-to-r from-fuchsia-600 via-pink-600 to-violet-600' : 'bg-linear-to-r from-[#ff2f92] via-[#ff5a63] to-[#ff7f2a]'}`}>V</div>
            {!isSidebarCollapsed && (
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme === 'light' ? 'bg-linear-to-r from-fuchsia-700 via-pink-600 to-violet-600 bg-clip-text text-transparent' : 'bg-linear-to-r from-[#ff8ac4] to-[#ffb067] bg-clip-text text-transparent'}`}>Verii</p>
                <p className={`text-base font-semibold ${theme === 'light' ? 'bg-linear-to-r from-fuchsia-700 via-pink-600 to-violet-700 bg-clip-text text-transparent' : 'bg-linear-to-r from-[#ffc4de] via-[#ff9f9f] to-[#ffc58e] bg-clip-text text-transparent'}`}>{t('utsPanel')}</p>
              </div>
            )}
          </Link>
        </div>

        <nav className={`custom-scrollbar flex-1 overflow-y-auto px-3 py-6`}>
          {filteredItems.map((item) => {
            const Icon = item.icon ?? LayoutDashboard;
            const isExpanded = expandedGroups.has(item.title);
            const hasActiveChild = item.children?.some((child) => child.href === location.pathname);

            return (
              <div key={item.title} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.title)}
                  className={cn(
                    'flex w-full items-center rounded-xl transition-colors',
                    isSidebarCollapsed ? 'lg:justify-center' : 'gap-3',
                    'px-3 py-2',
                    hasActiveChild
                      ? theme === 'light'
                        ? 'bg-linear-to-r from-fuchsia-500/12 via-pink-500/10 to-violet-500/12'
                        : 'bg-pink-500/15'
                      : theme === 'light'
                        ? 'hover:bg-fuchsia-500/[0.06]'
                        : 'hover:bg-white/5',
                  )}
                  title={isSidebarCollapsed ? t(item.title) : undefined}
                >
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      hasActiveChild
                        ? theme === 'light'
                          ? 'bg-linear-to-br from-fuchsia-500/18 to-violet-500/18 text-fuchsia-800'
                          : 'bg-pink-500/20 text-pink-300'
                        : theme === 'light'
                          ? 'border border-fuchsia-200/60 bg-white/60 text-fuchsia-800'
                          : 'border border-[#ff7a55]/14 bg-[#1a0d2a]/68 text-[#d7c5e5]',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isSidebarCollapsed ? 'hidden' : 'flex-1',
                      hasActiveChild
                        ? theme === 'light'
                          ? 'text-fuchsia-800'
                          : 'text-[#ff5f40]'
                        : theme === 'light'
                          ? 'text-[#2A2C31]'
                          : 'text-[#d9c9e8]',
                    )}
                  >
                    {t(item.title)}
                  </span>
                  {!isSidebarCollapsed && (
                    <>
                      {isExpanded ? (
                        <ChevronDown className={`size-4 ${theme === 'light' ? 'text-[#5E626D]' : 'text-[#c8b5d8]'}`} />
                      ) : (
                        <ChevronRight className={`size-4 ${theme === 'light' ? 'text-[#5E626D]' : 'text-[#c8b5d8]'}`} />
                      )}
                    </>
                  )}
                </button>

                {isExpanded && !isSidebarCollapsed && (
                  <div className={`ml-12 mt-2 space-y-1 border-l pl-3 ${theme === 'light' ? 'border-[rgba(255,138,196,0.28)]' : 'border-white/10'}`}>
                    {item.children?.map((child) =>
                      child.href ? (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                            location.pathname === child.href
                              ? theme === 'light'
                                ? 'bg-linear-to-r from-fuchsia-500/14 via-pink-500/12 to-violet-500/14 font-semibold text-fuchsia-900'
                                : 'bg-pink-500/15 bg-linear-to-r from-[#ff8bc7] to-[#ffb16b] bg-clip-text font-semibold text-transparent'
                              : theme === 'light'
                                ? 'text-[#2A2C31] hover:bg-fuchsia-500/[0.06] hover:text-fuchsia-900'
                                  : 'text-[#cfbfde] hover:bg-white/6 hover:text-[#ffd2bb]',
                          )}
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              setSearchQuery('');
                              setSidebarOpen(false);
                            }
                          }}
                        >
                          <span>
                            {child.href === '/'
                              ? t('dashboard')
                              : child.href === '/users'
                                ? t('users')
                              : child.href === '/roles'
                                ? t('roles')
                                : child.href === '/permission-groups'
                                  ? t('permissionGroups')
                                : child.href === '/customers'
                                  ? t('customers')
                                : child.href === '/stocks'
                                    ? t('stocks')
                                  : child.href === '/uts-uretim-list'
                                    ? t('utsUretimList')
                                  : child.href === '/uts-verme-list'
                                    ? t('utsVermeList')
                                  : child.href === '/uts-tverme-list'
                                    ? t('utsTVermeList')
                                  : child.href === '/uts-tuketici-verme-list'
                                    ? t('utsTuketiciVermeList')
                                  : child.href === '/uts-ithalat-list'
                                    ? t('utsIthalatList')
                                  : child.href === '/uts-imha-list'
                                    ? t('utsImhaList')
                                  : child.href === '/uts-ihracat-list'
                                    ? t('utsIhracatList')
                                  : child.href === '/uts-alma-list'
                                    ? t('utsAlmaList')
                                  : child.href === '/hangfire-monitoring'
                                    ? t('hangfireMonitoring')
                                    : t(child.title)}
                          </span>
                          {location.pathname === child.href && (
                            <span
                              className={`h-2 w-2 rounded-full ${theme === 'light' ? 'bg-fuchsia-500' : 'bg-[#ff8a3d]'}`}
                            />
                          )}
                        </Link>
                      ) : (
                        <div key={child.title} className={`rounded-lg px-3 py-2 text-sm font-medium ${theme === 'light' ? 'text-[#5E626D]/80' : 'text-[#bfaed0]'}`}>
                          {t(child.title)}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
