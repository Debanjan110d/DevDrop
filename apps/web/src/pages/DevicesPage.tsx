import { useState, useEffect, useRef } from 'react';
import { Smartphone, QrCode, Trash2, Edit2, Check, X, Clock, RefreshCw, Camera, Key, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useDevices } from '../hooks/useDevices';
import { formatRelativeTime } from '../utils/format';
import { createPairingSession, revokeDevice, updateDevice, completePairing } from '../services/api';
import type { PairingSession } from '../types';

export function DevicesPage() {
  const { devices, isLoading, refetch } = useDevices();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [pairingSession, setPairingSession] = useState<PairingSession | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);

  // Mobile pairing state
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pairingStatus, setPairingStatus] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Video scanner ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Detect PWA installability
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Auto-pair if ?pair=TOKEN is in URL (from scanning QR code with phone camera)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pairToken = urlParams.get('pair');

    if (pairToken) {
      handlePairWithToken(pairToken);
      // Clean query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handlePairWithToken = async (token: string) => {
    try {
      setPairingStatus('Pairing device with PC...');
      const userAgent = navigator.userAgent;
      let platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web' = 'android';
      if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'ios';
      else if (/Windows/i.test(userAgent)) platform = 'windows';
      else if (/Macintosh/i.test(userAgent)) platform = 'macos';
      else if (/Linux/i.test(userAgent)) platform = 'linux';

      const deviceName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`;
      const result = await completePairing(token.trim(), deviceName, platform);

      localStorage.setItem('devdrop_device_token', result.deviceToken);
      localStorage.setItem('devdrop_device_id', result.deviceId);
      setPairingSuccess(`Paired successfully as "${result.deviceName}"!`);
      refetch();
    } catch (err: any) {
      setPairingStatus(null);
      alert(err.message || 'Pairing failed. The token may be invalid or expired.');
    } finally {
      setPairingStatus(null);
      setIsScanOpen(false);
    }
  };

  const handleStartPairing = async () => {
    try {
      setIsPairingOpen(true);
      setPairingLoading(true);
      const session = await createPairingSession();
      setPairingSession(session);
      setCountdown(120);
    } catch (err) {
      console.error('Failed to create pairing session:', err);
    } finally {
      setPairingLoading(false);
    }
  };

  useEffect(() => {
    if (!isPairingOpen || !pairingSession) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPairingOpen, pairingSession]);

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDevice(id, { name: editName.trim() });
      setEditingId(null);
      refetch();
    } catch (err) {
      console.error('Failed to rename device:', err);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (confirm(`Revoke device "${name}"? It will lose file-sharing access immediately.`)) {
      try {
        await revokeDevice(id);
        refetch();
      } catch (err) {
        console.error('Failed to revoke device:', err);
      }
    }
  };

  // Camera scanner handling
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // If browser supports native BarcodeDetector API
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const scanLoop = async () => {
          if (!videoRef.current || !isCameraActive) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawVal = barcodes[0].rawValue;
              stopCamera();
              // Parse token or URL
              if (rawVal.includes('pair=')) {
                const token = new URL(rawVal).searchParams.get('pair');
                if (token) handlePairWithToken(token);
              } else {
                handlePairWithToken(rawVal);
              }
              return;
            }
          } catch (e) {}
          requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      alert('Camera access denied or unavailable. You can enter the pairing code manually below.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Success banner */}
      {pairingSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>{pairingSuccess}</span>
          </div>
          <button onClick={() => setPairingSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      {installPrompt && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Install DevDrop App</p>
              <p className="text-xs text-slate-400">Install as a standalone PWA on this device for quick access.</p>
            </div>
          </div>
          <Button size="sm" onClick={handleInstallPWA} className="gap-2">
            Install
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Paired Devices</h1>
          <p className="text-sm text-slate-400 mt-1">
            Authorize and manage phones and PCs exchanging files over Wi-Fi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* On mobile: Scan or Enter Code */}
          <Button variant="secondary" size="sm" onClick={() => setIsScanOpen(true)} className="gap-2">
            <Camera className="h-4 w-4" />
            Scan / Enter Code
          </Button>

          {/* On PC: Generate QR Code */}
          <Button size="sm" onClick={handleStartPairing} className="gap-2">
            <QrCode className="h-4 w-4" />
            Show QR Code
          </Button>
        </div>
      </div>

      {isLoading || pairingStatus ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <Spinner size="lg" />
          {pairingStatus && <p className="text-sm text-slate-400">{pairingStatus}</p>}
        </div>
      ) : devices.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Smartphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No devices paired yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
              Show the QR code on your PC and scan it with your phone, or enter the pairing code directly.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleStartPairing} className="gap-2">
                <QrCode className="h-4 w-4" />
                Show QR Code
              </Button>
              <Button variant="secondary" onClick={() => setIsScanOpen(true)} className="gap-2">
                <Camera className="h-4 w-4" />
                Scan with Phone
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {devices.map((device) => {
            const isEditing = editingId === device.id;
            const isOnline = device.status === 'online';

            return (
              <Card key={device.id} className="transition-colors hover:border-slate-700">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSaveRename(device.id)}>
                            <Check className="h-4 w-4 text-emerald-400" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">{device.name}</p>
                          <button
                            onClick={() => {
                              setEditingId(device.id);
                              setEditName(device.name);
                            }}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="capitalize">{device.platform}</span>
                        <span>·</span>
                        <span>Paired {formatRelativeTime(device.pairedAt)}</span>
                        <span>·</span>
                        <span>Last seen {formatRelativeTime(device.lastSeenAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={isOnline ? 'success' : 'muted'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(device.id, device.name)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PC: Show QR Code Modal */}
      {isPairingOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-400" />
                Pair Mobile Device
              </h2>
              <button onClick={() => setIsPairingOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {pairingLoading ? (
              <div className="flex justify-center p-12">
                <Spinner size="lg" />
              </div>
            ) : pairingSession ? (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                  <img
                    src={pairingSession.qrCodeDataUrl}
                    alt="DevDrop Pairing QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    Expires in <strong className="text-slate-200">{countdown}s</strong>
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-left">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Or enter code manually:</span>
                  <p className="font-mono text-xs text-indigo-300 break-all select-all mt-0.5">{pairingSession.pairingToken}</p>
                </div>

                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan this code with your phone camera or QR scanner while connected to the same Wi-Fi.
                </p>

                {countdown === 0 && (
                  <Button onClick={handleStartPairing} className="w-full gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Generate New QR Code
                  </Button>
                )}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Mobile: Scan or Enter Code Modal */}
      {isScanOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Camera className="h-5 w-5 text-indigo-400" />
                Connect to PC
              </h2>
              <button
                onClick={() => {
                  stopCamera();
                  setIsScanOpen(false);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Camera Preview */}
              {isCameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-indigo-500/50 m-6 rounded-lg pointer-events-none animate-pulse" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-black/60 text-white"
                  >
                    Stop Camera
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={startCamera} className="w-full gap-2">
                  <Camera className="h-4 w-4" />
                  Open Camera Scanner
                </Button>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase">Or Enter Code Manually</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Manual input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Pairing Code from PC</label>
                <input
                  type="text"
                  placeholder="Paste 64-character token here..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <Button
                onClick={() => handlePairWithToken(manualCode)}
                disabled={!manualCode.trim()}
                className="w-full gap-2"
              >
                <Key className="h-4 w-4" />
                Connect Device
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
