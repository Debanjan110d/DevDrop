import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SendPage } from './pages/SendPage';
import { ReceivePage } from './pages/ReceivePage';
import { TextPage } from './pages/TextPage';
import { DevicesPage } from './pages/DevicesPage';
import { TransfersPage } from './pages/TransfersPage';
import { SettingsPage } from './pages/SettingsPage';
import { getSocket } from './services/socket';
import { Copy, Check, X, MessageSquare } from 'lucide-react';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [incomingText, setIncomingText] = useState<{ text: string; senderName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Global socket listener for incoming text drops
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleIncomingText = (data: any) => {
      if (data?.text) {
        setIncomingText({
          text: data.text,
          senderName: data.senderName || 'Device',
        });
        setCopied(false);
      }
    };
    (socket as any).on('text:received', handleIncomingText);
    return () => {
      (socket as any).off('text:received', handleIncomingText);
    };
  }, []);

  const copyIncomingText = async () => {
    if (!incomingText) return;
    try {
      await navigator.clipboard.writeText(incomingText.text);
      setCopied(true);
      setTimeout(() => {
        setIncomingText(null);
        setCopied(false);
      }, 2000);
    } catch {
      // Ignore
    }
  };

  // If at root path "/", show the standalone Product Landing Page (great for Vercel & portfolio)
  if (location.pathname === '/') {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen bg-background text-slate-200 overflow-hidden relative">
      {/* Real-time Incoming Text Toast Banner */}
      {incomingText && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-slate-900 border border-indigo-500/50 shadow-2xl rounded-xl p-4 animate-in slide-in-from-top-4 duration-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Incoming Text from {incomingText.senderName}
            </span>
            <button
              onClick={() => setIncomingText(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg line-clamp-3 select-all">
            {incomingText.text}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setIncomingText(null);
                navigate('/text');
              }}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              View in Quick Text
            </button>
            <button
              onClick={copyIncomingText}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/receive" element={<ReceivePage />} />
            <Route path="/text" element={<TextPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
