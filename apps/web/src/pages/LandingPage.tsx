import { useState } from 'react';
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
  Radio,
  FolderDown,
  RefreshCw,
  Eye,
  Check,
  Server,
  Terminal,
  Calendar,
  Layers,
  ArrowUpRight,
  Cpu,
  Lock,
} from 'lucide-react';

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'p2p' | 'text' | 'storage' | 'updates'>('p2p');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [testTextCopied, setTestTextCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-center text-xs text-indigo-300 font-medium">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          DevDrop 1.2 is here: Autonomous LAN P2P, Dedicated Public Storage & In-App APK Updates.
        </span>
        <Link to="/dashboard" className="ml-2 underline font-semibold hover:text-indigo-200">
          Open Web App →
        </Link>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="DevDrop Logo"
              className="h-9 w-9 rounded-xl shadow-md object-contain"
            />
            <div>
              <span className="font-bold text-lg tracking-tight text-white">DevDrop</span>
              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.2 P2P
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Autonomous P2P
            </a>
            <a href="#storage" className="hover:text-white transition-colors">
              Storage & Media
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Safety & Privacy
            </a>
            <a href="#specs" className="hover:text-white transition-colors">
              Protocol Specs
            </a>
            <a href="#downloads" className="hover:text-white transition-colors">
              Downloads
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Debanjan110d/DevDrop"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
            >
              <span>Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <a
              href="/devdrop.apk"
              download="devdrop.apk"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Get APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Transfer files & clipboard text at{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
              raw local network speed.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            DevDrop transfers files, folders, and clipboard snippets directly between your Android phone, Windows PC, and Chrome browser over Wi-Fi. No cloud relays, no file size caps, and fully autonomous peer-to-peer transfers that work even when your PC is offline.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href="/devdrop.apk"
              download="devdrop.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              <Download className="h-4 w-4" />
              <span>Download Android APK (56 MB)</span>
            </a>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
            >
              <span>Launch Web Dashboard</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <a
              href="/devdrop-extension.zip"
              download="devdrop-extension.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 font-semibold text-sm transition-all"
            >
              <Puzzle className="h-4 w-4 text-sky-400" />
              <span>Chrome Extension (.zip)</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-3">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Android 10+ Compatible
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Chrome / Edge / Brave
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> 100% Open Source (MIT)
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Zero Internet Usage
            </span>
          </div>
        </div>

        {/* Real-time Feature Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
          <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 p-4 text-left">
            <div className="text-2xl font-bold font-mono text-indigo-400">0 KB</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Cloud Data Used</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Strictly private subnet transfers</div>
          </div>

          <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 p-4 text-left">
            <div className="text-2xl font-bold font-mono text-emerald-400">:4545</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Native Micro-Server</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Embedded Kotlin HTTP engine</div>
          </div>

          <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 p-4 text-left">
            <div className="text-2xl font-bold font-mono text-sky-400">Downloads</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">DevDrop Public Folder</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Auto-indexed in Android Gallery</div>
          </div>

          <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 p-4 text-left">
            <div className="text-2xl font-bold font-mono text-violet-400">1-Tap</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Direct APK Updates</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In-app FileProvider installer</div>
          </div>
        </div>
      </section>

      {/* Interactive Architecture & Feature Tabs */}
      <section id="architecture" className="border-t border-slate-800/80 bg-slate-900/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
              System Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for resilient local connectivity.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Most local share tools fail the moment a central PC host is turned off. DevDrop features an autonomous peer-to-peer mesh architecture where each client operates as both a streaming client and an embedded HTTP server.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('p2p')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'p2p'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Autonomous P2P</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>Quick Text & Clipboard</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FolderDown className="h-4 w-4" />
              <span>Public Storage & Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('updates')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'updates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>In-App APK Updates</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {activeTab === 'p2p' && (
              <>
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                    Kotlin java.net.ServerSocket
                  </div>
                  <h3 className="text-xl font-bold text-white">Direct Phone-to-Phone Transfers</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Even when the PC laptop server is switched off, mobile devices running DevDrop start their own lightweight native Kotlin micro-server on port 4545.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Automatic subnet scan sweeps <code className="text-slate-300 font-mono">192.168.x.1..254</code> to discover active DevDrop nodes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Direct binary chunk streaming over <code className="text-slate-300 font-mono">POST /api/transfers/direct-drop</code> with zero Base64 conversion overhead.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Non-blocking multi-threaded request processing handles concurrent device streams cleanly.</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto shadow-xl">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Terminal className="h-3.5 w-3.5 text-indigo-400" /> DevDropEmbeddedServer.kt (Port 4545)
                    </span>
                    <button
                      onClick={() => copyCode('http://192.168.1.50:4545/api/health')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedSnippet ? 'Copied!' : 'Copy Endpoint'}
                    </button>
                  </div>
                  <pre className="text-slate-300 leading-relaxed">
                    {`// Native Non-Blocking Micro-Server running directly inside Android APK
val serverSocket = ServerSocket(4545)
val threadPool = Executors.newCachedThreadPool()

while (isRunning) {
  val clientSocket = serverSocket.accept()
  threadPool.execute {
    handleIncomingHttpRequest(clientSocket)
    // Routes:
    // GET  /api/health               -> Heartbeat & Peer Discovery
    // GET  /api/devices              -> Local Device Metadata & Capabilities
    // POST /api/text/direct-drop     -> Instant Clipboard Drop
    // POST /api/transfers/direct-drop -> Binary File Streaming to /Download/DevDrop
  }
}`}
                  </pre>
                </div>
              </>
            )}

            {activeTab === 'text' && (
              <>
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-mono">
                    Bidirectional Quick Text
                  </div>
                  <h3 className="text-xl font-bold text-white">Instant Clipboard Drop</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Instantly send links, tokens, terminal commands, or multi-line notes between PC and Android without emailing yourself or using insecure cloud messengers.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>One-click copy to native Android or Windows clipboard.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Real-time toast notification on incoming text across Web, Extension, and Android.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Complete local history log with timestamp and sender identification.</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/text"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Open Quick Text in Web App</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">Interactive Clipboard Drop Preview</span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Live Test
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 space-y-1">
                    <div className="text-[11px] text-slate-400"># Direct Wi-Fi payload</div>
                    <div>https://github.com/deban/DevDrop</div>
                    <div className="text-slate-400">git clone https://github.com/deban/DevDrop.git</div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://github.com/deban/DevDrop');
                        setTestTextCopied(true);
                        setTimeout(() => setTestTextCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                    >
                      {testTextCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{testTextCopied ? 'Copied to Clipboard!' : 'Simulate Copy to Clipboard'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'storage' && (
              <>
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                    /storage/emulated/0/Download/DevDrop
                  </div>
                  <h3 className="text-xl font-bold text-white">Public Storage & Smart Timeline</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Files aren't locked inside hidden app sandboxes. Received files save directly into your device's public Downloads directory and trigger Android MediaScanner immediately.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Photos and videos immediately appear in Google Photos, Gallery, and VLC.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Tap-to-Open:</strong> Clicking any received file automatically invokes the native Android system viewer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Date-Wise Filtering:</strong> Timeline grouping sorts transfers by Today, Yesterday, and Previous Dates.</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-indigo-400" /> Received Files Timeline View
                    </span>
                    <span className="text-[11px] text-slate-400">Tap to open with system handler</span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider pt-1">
                      Today
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <FileCode className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">release-build-v1.2.apk</div>
                          <div className="text-[11px] text-slate-400">56.3 MB • 2 minutes ago</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Downloaded
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider pt-2">
                      Yesterday
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                          <HardDrive className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">project-architecture.pdf</div>
                          <div className="text-[11px] text-slate-400">4.2 MB • Saved in /Download/DevDrop</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        Tap to View
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'updates' && (
              <>
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 text-xs font-mono">
                    Android FileProvider + Intent.ACTION_VIEW
                  </div>
                  <h3 className="text-xl font-bold text-white">In-App Native Updates</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Never worry about manually hunting for APK links. DevDrop checks for updates on launch and downloads releases directly within the mobile app.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Automatic version check against GitHub releases and local server metadata.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Seamless download stream with real-time percentage progress bar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>One-tap package installation launches the native Android installer dialog safely via secure FileProvider authority.</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-emerald-400" /> In-App Update Banner Simulation
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Status: Ready</span>
                  </div>

                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white">DevDrop Update Available</div>
                      <span className="text-[10px] font-mono bg-indigo-600 text-white px-2 py-0.5 rounded">
                        v1.2.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Autonomous LAN P2P Engine, Dedicated Public Storage, Tap-to-Open files, and Quick Text synchronization.
                    </p>
                    <div className="pt-2 flex gap-2">
                      <a
                        href="/devdrop.apk"
                        download="devdrop.apk"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download & Install APK</span>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive (Asymmetrical 3-Card Grid) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Designed for developers, built for everyone.
          </h2>
          <p className="text-sm text-slate-400">
            Engineered from first principles to be reliable, transparent, and completely free of cloud subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Zero Cloud Latency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Files stream straight over your local 802.11ac/ax Wi-Fi adapter. Gigabytes of raw 4K video, ROMs, or datasets move in seconds without touching your ISP's upload bandwidth.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Absolute Data Privacy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No tracking pixels, no telemetry, no third-party cloud database. Paired devices generate cryptographic tokens locally and communicate strictly within RFC 1918 private subnets.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Puzzle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Chrome Native Messaging</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The Chrome/Edge extension talks directly to the local Windows host process via Chrome Native Messaging. Start the daemon on demand, monitor connections, and stop it when done.
            </p>
          </div>
        </div>
      </section>

      {/* Protocol Specifications Matrix */}
      <section id="specs" className="border-t border-slate-800/80 bg-slate-900/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
              Technical Specifications
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Under the hood.
            </h2>
            <p className="text-sm text-slate-400">
              Full transparency on ports, storage directories, transport protocols, and runtime dependencies.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300 font-semibold">
                <tr>
                  <th className="py-3 px-4">Component</th>
                  <th className="py-3 px-4">Technology Stack</th>
                  <th className="py-3 px-4">Default Port / Path</th>
                  <th className="py-3 px-4">Transfer Protocol</th>
                  <th className="py-3 px-4">Discovery Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-400 font-mono">
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">Android Client</td>
                  <td className="py-3 px-4">React Native (Expo 58) + Kotlin</td>
                  <td className="py-3 px-4 text-emerald-400">Port 4545 (Embedded)</td>
                  <td className="py-3 px-4">Binary HTTP/1.1 Streaming</td>
                  <td className="py-3 px-4">Subnet Sweep + QR Pairing</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">Windows Host</td>
                  <td className="py-3 px-4">Node.js + Express + SQLite</td>
                  <td className="py-3 px-4 text-indigo-400">Port 5000</td>
                  <td className="py-3 px-4">HTTP Streaming + Socket.IO</td>
                  <td className="py-3 px-4">Local IP + Dynamic QR Code</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">Browser Extension</td>
                  <td className="py-3 px-4">Manifest V3 + React</td>
                  <td className="py-3 px-4 text-sky-400">Chrome Native Host Bridge</td>
                  <td className="py-3 px-4">Native Stdio JSON-RPC</td>
                  <td className="py-3 px-4">Localhost Host Process</td>
                </tr>
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">Web Dashboard</td>
                  <td className="py-3 px-4">Vite + React 18 + Tailwind</td>
                  <td className="py-3 px-4 text-violet-400">Port 5173 / Vercel Host</td>
                  <td className="py-3 px-4">Direct Browser REST + WS</td>
                  <td className="py-3 px-4">Server IP Config / Pair QR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="downloads" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            Releases & Downloads
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Get DevDrop for your devices.
          </h2>
          <p className="text-sm text-slate-400">
            All binaries are standalone and compiled directly from source.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Android Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  v1.2.0 APK
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Android Client</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Native APK featuring Autonomous LAN server, QR camera scanner, Download/DevDrop storage, and tap-to-open viewer.
                </p>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
                <div>Size: ~56 MB</div>
                <div>Requires: Android 10+ (API 29+)</div>
                <div>Status: Release signed</div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="/devdrop.apk"
                download="devdrop.apk"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download devdrop.apk</span>
              </a>
              <a
                href="https://github.com/Debanjan110d/DevDrop/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-[11px] font-medium transition-colors"
              >
                <span>Automated CI Builds & Actions</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Extension Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Puzzle className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  Manifest V3
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Browser Extension</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Chrome, Edge, and Brave extension with Native Messaging host support to auto-launch the server and drop clipboard items.
                </p>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
                <div>Format: Unpacked ZIP bundle</div>
                <div>Browser: Chromium 100+</div>
                <div>Status: Ready for Developer Mode</div>
              </div>
            </div>

            <a
              href="/devdrop-extension.zip"
              download="devdrop-extension.zip"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Extension (.zip)</span>
            </a>
          </div>

          {/* Web App / Portable Host Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Laptop className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Web & Windows
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Web App & Host</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Access the full web dashboard directly in your browser or run the lightweight Windows portable server with one double-click.
                </p>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
                <div>Host script: DevDrop.bat</div>
                <div>Vercel: Compatible static portal</div>
                <div>License: MIT Open Source</div>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Open Web Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started in 3 Steps */}
      <section className="border-t border-slate-800/80 bg-slate-900/20 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Getting Started in 3 Steps</h2>
            <p className="text-sm text-slate-400">
              Connect your devices and start transferring in under one minute.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
                1
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">Install the Android App</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download <code className="text-slate-300 font-mono">devdrop.apk</code> directly on your phone and tap Install. The app creates the <code className="text-slate-300 font-mono">/Download/DevDrop</code> folder and starts listening on port 4545 automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
                2
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">Open Dashboard or Start Server</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Open the Web Dashboard on your PC or double-click <code className="text-slate-300 font-mono">DevDrop.bat</code>. Scan the QR code with your phone to pair in one second.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">
                3
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">Send Files & Instant Quick Text</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drop batches of photos, videos, or documents, or paste quick text. Files stream at raw Wi-Fi throughput and are ready to open immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Privacy Transparency */}
      <section id="security" className="border-t border-slate-800/80 bg-slate-900/40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Safety & Non-Malicious Transparency
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              100% Private, Safe & Verified Open Source.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              DevDrop is built strictly for direct communication on your personal Wi-Fi network. It contains zero spyware, zero analytics beacons, zero remote command execution, and zero third-party cloud data transmission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Lock className="h-4 w-4" />
                <span>Strict RFC 1918 Scope</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Network traffic only routes across private addresses (<code className="font-mono text-slate-300">192.168.x.x</code> / <code className="font-mono text-slate-300">10.x.x.x</code>). No packets leave your home or office router.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Transparent Permissions</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Camera access is used solely for QR decoding. Storage access is restricted to the user-visible <code className="font-mono text-slate-300">Downloads/DevDrop</code> directory.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <Terminal className="h-4 w-4" />
                <span>Independent Network Audits</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verify packets with Wireshark or tcpdump anytime. Review the complete source code or audit reproduction instructions on GitHub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="DevDrop Logo"
                className="h-7 w-7 rounded-lg object-contain shadow-sm"
              />
              <span className="font-bold text-slate-200 text-sm">DevDrop</span>
              <span className="text-slate-400 text-xs">— Your devices. Your network. Your files.</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-400">
              <Link to="/dashboard" className="hover:text-slate-200 transition-colors">Dashboard</Link>
              <Link to="/send" className="hover:text-slate-200 transition-colors">Send</Link>
              <Link to="/receive" className="hover:text-slate-200 transition-colors">Receive</Link>
              <Link to="/text" className="hover:text-slate-200 transition-colors">Quick Text</Link>
              <Link to="/devices" className="hover:text-slate-200 transition-colors">Devices</Link>
              <Link to="/settings" className="hover:text-slate-200 transition-colors">Settings</Link>
              <a href="/devdrop.apk" download="devdrop.apk" className="hover:text-slate-200 transition-colors">Download APK</a>
              <a href="/devdrop-extension.zip" download="devdrop-extension.zip" className="hover:text-slate-200 transition-colors">Extension</a>
              <a
                href="https://github.com/Debanjan110d/DevDrop"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-200 transition-colors inline-flex items-center gap-1 text-indigo-400 font-medium"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p>
              © 2026 DevDrop. Created & maintained by{' '}
              <a
                href="https://github.com/Debanjan110d"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 underline hover:text-white"
              >
                Debanjan (@Debanjan110d)
              </a>
              . Open-source under MIT License.
            </p>
            <p className="text-[11px] text-slate-400">
              Engineered with React Native, Node.js, Express, Kotlin & Vite.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
