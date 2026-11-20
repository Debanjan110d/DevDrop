import { Link } from 'react-router-dom';
import {
  Download,
  Shield,
  Zap,
  Smartphone,
  Laptop,
  ArrowRight,
  Wifi,
  HardDrive,
  Copy,
  Puzzle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  FileCode,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-full bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="border-b border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-center text-xs text-indigo-300 font-medium">
        <span>DevDrop 1.0 Native Android & Chrome Extension are now live!</span>
        <Link to="/dashboard" className="ml-2 underline font-semibold hover:text-indigo-200">
          Open Dashboard →
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            100% Local Network File Sharing
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Your devices. Your network.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-sky-400">
              Your files.
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Blazing fast, zero-cloud file and clipboard sharing between your Windows PC, Android phones, and tablets over Wi-Fi. No internet upload caps. No external servers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Launch Web Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="/devdrop.apk"
              download="devdrop.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download Android APK (56 MB)</span>
            </a>

            <a
              href="/devdrop-extension.zip"
              download="devdrop-extension.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 font-semibold text-sm transition-all"
            >
              <Puzzle className="h-4 w-4 text-sky-400" />
              <span>Download Extension (.zip)</span>
            </a>
          </div>

          <p className="text-xs text-slate-500 pt-1">
            Compatible with Android 10+ (Compile SDK 37) & Chromium browsers (Chrome, Edge, Brave).
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Local Wi-Fi Speeds</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Files stream directly over your local wireless network. Zero buffering in memory, zero Base64 overhead, and gigabyte-scale throughput.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">100% Private & Local</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your data never touches a 3rd-party cloud or company server. Secured with local SQLite storage, cryptographic token pairing, and full user ownership.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Copy className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Instant Clipboard Drop</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Push text notes, code snippets, or URLs from your phone to PC and paste with one click. Copied images write directly to your OS clipboard.
            </p>
          </div>
        </div>
      </section>

      {/* Ecosystem Architecture */}
      <section className="border-t border-slate-800/80 bg-slate-900/20 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">The DevDrop Ecosystem</h2>
            <p className="text-sm text-slate-400">
              Designed as a unified, zero-dependency local sharing platform across all your devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Laptop className="h-6 w-6 text-indigo-400" />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Node.js + Express
                </span>
              </div>
              <h4 className="font-semibold text-slate-200">Host Server</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lightweight Node.js daemon with SQLite persistence, streaming chunk endpoints, and real-time Socket.IO synchronization.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Smartphone className="h-6 w-6 text-emerald-400" />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Expo SDK 58
                </span>
              </div>
              <h4 className="font-semibold text-slate-200">Android Client</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native React Native app with QR camera pairing, multi-file batch picker, phone-to-phone QR exchange, and media gallery export.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Puzzle className="h-6 w-6 text-sky-400" />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  Manifest V3
                </span>
              </div>
              <h4 className="font-semibold text-slate-200">Browser Extension</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chrome / Edge extension with Chrome Native Messaging to auto-start the server on demand, 1-click stop, and context menus.
              </p>
            </div>

            <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <HardDrive className="h-6 w-6 text-violet-400" />
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                  Dynamic Path
                </span>
              </div>
              <h4 className="font-semibold text-slate-200">Dynamic Storage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set and switch transfer directories on the fly from the Web settings UI. Files are organized by origin with zero lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 max-w-4xl mx-auto px-4 md:px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-white">How It Works in 3 Steps</h2>
          <p className="text-sm text-slate-400">
            Get your devices connected and transferring in less than 30 seconds.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              1
            </span>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-200">Start DevDrop or Open Extension</h4>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Click the DevDrop extension in Chrome (which boots the server on demand) or double-click <code>DevDrop.bat</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              2
            </span>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-200">Scan QR Code from Android App</h4>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Open the DevDrop app on your Android phone and scan the QR code displayed on the Web Dashboard to establish secure cryptographic pairing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
              3
            </span>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-200">Drop Files & Instant Clipboard</h4>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Select batches of files or drop text. Files stream immediately over local Wi-Fi with instant clipboard copy on completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-xs text-slate-600 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <Link to="/dashboard" className="hover:text-slate-200">Dashboard</Link>
          <Link to="/send" className="hover:text-slate-200">Send</Link>
          <Link to="/text" className="hover:text-slate-200">Quick Text</Link>
          <Link to="/devices" className="hover:text-slate-200">Devices</Link>
          <a href="/devdrop.apk" download="devdrop.apk" className="hover:text-slate-200">Download APK</a>
          <a href="/devdrop-extension.zip" download="devdrop-extension.zip" className="hover:text-slate-200">Download Extension</a>
        </div>
        <p>© 2026 DevDrop. Open-source under MIT License. Your devices. Your network. Your files.</p>
      </footer>
    </div>
  );
}

