import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Download,
  Smartphone,
  ArrowLeftRight,
  Settings,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BuyMeAChai } from '../ui/BuyMeAChai';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Send', path: '/send', Icon: Send },
  { label: 'Receive', path: '/receive', Icon: Download },
  { label: 'Quick Text', path: '/text', Icon: MessageSquare },
  { label: 'Devices', path: '/devices', Icon: Smartphone },
  { label: 'Transfers', path: '/transfers', Icon: ArrowLeftRight },
  { label: 'Settings', path: '/settings', Icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-surface border-r border-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <img src="/favicon.png" alt="DevDrop Logo" className="h-8 w-8 rounded-lg shadow-md object-contain" />
        <span className="font-bold text-slate-100 text-lg tracking-tight">DevDrop</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map(({ label, path, Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / Product Page shortcut & GitHub */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-surface-elevated transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Product Website</span>
        </Link>
        <div className="py-1">
          <BuyMeAChai variant="pill" size="sm" className="w-full justify-center" />
        </div>
        <a
          href="https://github.com/Debanjan110d/DevDrop"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
        >
          <span>GitHub</span>
          <span className="text-[10px] text-slate-500 font-mono">@Debanjan110d</span>
        </a>
      </div>
    </aside>
  );
}
