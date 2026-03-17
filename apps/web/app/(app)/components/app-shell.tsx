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
  LogOut,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  mobile?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, mobile: true },
  { href: '/briefings', label: 'Briefings', icon: <Newspaper className="h-5 w-5" />, mobile: true },
  { href: '/alerts', label: 'Alerts', icon: <Bell className="h-5 w-5" />, mobile: true },
  { href: '/research', label: 'Research', icon: <Search className="h-5 w-5" />, mobile: true },
  { href: '/watchlists', label: 'Watchlists', icon: <List className="h-5 w-5" /> },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings/profile', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
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
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold tracking-tight">MarketBrain</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
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
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </a>
          )}
          {bottomNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
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
          <span className="text-lg font-bold tracking-tight">MarketBrain</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Mobile Bottom Nav */}
        <nav className="flex border-t bg-card md:hidden">
          {navItems
            .filter((item) => item.mobile)
            .map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
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
