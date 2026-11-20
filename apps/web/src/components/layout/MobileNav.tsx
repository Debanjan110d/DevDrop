import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Download,
  MessageSquare,
  Smartphone,
  ArrowLeftRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { label: 'Home', path: '/dashboard', Icon: LayoutDashboard },
  { label: 'Send', path: '/send', Icon: Send },
  { label: 'Receive', path: '/receive', Icon: Download },
  { label: 'Text', path: '/text', Icon: MessageSquare },
  { label: 'Devices', path: '/devices', Icon: Smartphone },
  { label: 'Transfers', path: '/transfers', Icon: ArrowLeftRight },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-border bg-surface">
      {navItems.map(({ label, path, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center flex-1 gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
