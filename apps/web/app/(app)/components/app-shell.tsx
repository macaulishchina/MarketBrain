'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  Search,
  List,
  Newspaper,
  Settings,
  Shield,
} from 'lucide-react';
import { t } from '../../../lib/i18n';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  mobile?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="h-5 w-5" />, mobile: true },
  { href: '/briefings', label: t.nav.briefings, icon: <Newspaper className="h-5 w-5" />, mobile: true },
  { href: '/alerts', label: t.nav.alerts, icon: <Bell className="h-5 w-5" />, mobile: true },
  { href: '/research', label: t.nav.research, icon: <Search className="h-5 w-5" />, mobile: true },
  { href: '/watchlists', label: t.nav.watchlists, icon: <List className="h-5 w-5" /> },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings/profile', label: t.nav.settings, icon: <Settings className="h-5 w-5" /> },
];

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role?: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Skip to main content link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t.nav.skipToMain}
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex" role="navigation" aria-label="Main navigation">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold tracking-tight">{t.brand}</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="border-t px-3 py-4 space-y-1">
          {user.role === 'admin' && (
            <a
              href="/admin/sources"
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>{t.nav.admin}</span>
            </a>
          )}
          {bottomNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground" aria-hidden="true">
              {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <span className="text-lg font-bold tracking-tight">{t.brand}</span>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto" role="main">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="flex border-t bg-card md:hidden safe-area-bottom" aria-label="Mobile navigation">
          {navItems
            .filter((item) => item.mobile)
            .map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs min-h-[48px] justify-center ${
                  pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
        </nav>
      </div>
    </div>
  );
}
