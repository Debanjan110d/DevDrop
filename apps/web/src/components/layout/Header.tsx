import { useLocation } from 'react-router-dom';
import { useServerStore } from '../../stores/serverStore';
import { Zap } from 'lucide-react';
import { clsx } from 'clsx';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/send': 'Send Files',
  '/receive': 'Receive Files',
  '/text': 'Quick Text & Clipboard',
  '/devices': 'Devices',
  '/transfers': 'Transfer History',
  '/settings': 'Settings',
};

export function Header() {
  const { pathname } = useLocation();
  const isConnected = useServerStore((s) => s.isConnected);
  const status = useServerStore((s) => s.status);

  const title = pageTitles[pathname] ?? 'DevDrop';

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface/50 backdrop-blur-sm shrink-0">
      {/* Mobile logo + page title */}
      <div className="flex items-center gap-3">
        <div className="flex md:hidden items-center gap-2">
          <img src="/favicon.png" alt="DevDrop Logo" className="h-7 w-7 rounded-md object-contain" />
        </div>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
      </div>

      {/* Server status pill */}
      <div
        className={clsx(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
          isConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-700/50 text-slate-400 border-slate-600',
        )}
      >
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500',
          )}
        />
        {isConnected
          ? `Online · ${status?.connectedDevices ?? 0} device${(status?.connectedDevices ?? 0) !== 1 ? 's' : ''}`
          : 'Server offline'}
      </div>
    </header>
  );
}
