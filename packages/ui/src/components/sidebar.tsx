import * as React from 'react';
import { cn } from '../utils.js';

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'flex h-full w-64 flex-col border-r bg-card',
        className,
      )}
    >
      {children}
    </nav>
  );
}

export type SidebarItemProps = {
  href: string;
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  className?: string;
};

export function SidebarItem({ href, icon, label, active, className }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
