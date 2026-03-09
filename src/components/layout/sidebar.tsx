import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronRight, FileStack, LayoutDashboard, Menu, Shield, Users, X } from 'lucide-react';
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
  const { isSidebarOpen, toggleSidebar, setSidebarOpen, searchQuery, setSearchQuery } = useUiStore();
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
          'fixed left-0 top-0 z-40 flex h-screen w-[18rem] max-w-[88vw] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-white/5 dark:bg-[#130822]/90',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-24 items-center justify-between border-b border-slate-100 px-4 dark:border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-r from-indigo-600 to-fuchsia-600 text-lg font-bold text-white">V</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Verii</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{t('utsPanel')}</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-slate-500 lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-6">
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
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                    hasActiveChild ? 'bg-purple-50' : 'hover:bg-slate-100 dark:hover:bg-white/5',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      hasActiveChild
                        ? 'bg-purple-100 text-purple-700 dark:bg-pink-500/20 dark:text-pink-400'
                        : 'border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      'flex-1 text-sm font-medium',
                      hasActiveChild ? 'text-purple-900 dark:text-white' : 'text-slate-700 dark:text-slate-300',
                    )}
                  >
                    {t(item.title)}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="size-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-12 mt-2 space-y-1 border-l border-slate-200 pl-3 dark:border-white/10">
                    {item.children?.map((child) =>
                      child.href ? (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                            location.pathname === child.href
                              ? 'bg-purple-50 font-semibold text-purple-700 dark:bg-white/10 dark:text-white'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5',
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
                                  : child.href === '/hangfire-monitoring'
                                    ? t('hangfireMonitoring')
                                    : t(child.title)}
                          </span>
                          {location.pathname === child.href && (
                            <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-pink-500" />
                          )}
                        </Link>
                      ) : (
                        <div key={child.title} className="rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
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
