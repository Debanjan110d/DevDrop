import { useEffect, useState } from 'react';
import { Settings, Folder, Shield, Network, Server, HardDrive, Info, Clock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { getServerInfo, getServerStatus, updateStorageDir } from '../services/api';
import { formatBytes } from '../utils/format';

interface ServerInfoData {
  name: string;
  version: string;
  port: number;
  localAddress: string;
  networkAddress: string;
  lanAddresses: string[];
  storageDir: string;
  maxFileSize: number;
  maxConcurrentTransfers: number;
}

export function SettingsPage() {
  const [info, setInfo] = useState<ServerInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customDir, setCustomDir] = useState('');
  const [isSavingDir, setIsSavingDir] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getServerInfo();
        setInfo(data);
        if (data?.storageDir) setCustomDir(data.storageDir);
      } catch (err) {
        console.error('Failed to load server info:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveDir = async () => {
    if (!customDir.trim()) return;
    try {
      setIsSavingDir(true);
      setSaveError(null);
      const res = await updateStorageDir(customDir.trim());
      setInfo((prev) => (prev ? { ...prev, storageDir: res.storageDir } : null));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update storage directory');
    } finally {
      setIsSavingDir(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Server Settings & Info</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configuration parameters, storage paths, and network discovery details.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : info ? (
        <div className="grid gap-4">
          {/* Storage configuration */}
          <Card>
            <CardHeader>
              <Folder className="h-5 w-5 text-indigo-400" />
              <CardTitle>Storage Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Dedicated Transfer Directory
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDir}
                    onChange={(e) => setCustomDir(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg font-mono text-xs text-slate-200 outline-none transition-colors"
                    placeholder="e.g. D:\DevDrop\Files or C:\Users\name\Downloads"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveDir}
                    disabled={isSavingDir || customDir === info.storageDir}
                  >
                    {isSavingDir ? (
                      <Spinner size="sm" />
                    ) : saveSuccess ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="h-4 w-4" /> Saved
                      </span>
                    ) : (
                      'Save Folder'
                    )}
                  </Button>
                </div>
                {saveSuccess && (
                  <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Storage directory updated successfully!
                  </p>
                )}
                {saveError && (
                  <p className="text-xs text-rose-400 mt-1.5">
                    {saveError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 text-xs text-slate-400">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block mb-0.5">From-Mobile</span>
                  Received files sent from phone
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block mb-0.5">From-PC</span>
                  Files staged for mobile download
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-300 block mb-0.5">Temporary</span>
                  In-flight chunk streams
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Details */}
          <Card>
            <CardHeader>
              <Network className="h-5 w-5 text-indigo-400" />
              <CardTitle>Network & Connectivity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Local Address
                  </label>
                  <div className="mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-indigo-300">
                    {info.localAddress}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    LAN Address (For Mobile)
                  </label>
                  <div className="mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300">
                    {info.networkAddress}
                  </div>
                </div>
              </div>

              {info.lanAddresses.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-slate-400">
                    Detected LAN IPs: <span className="font-mono text-slate-300">{info.lanAddresses.join(', ')}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer & Security Policy */}
          <Card>
            <CardHeader>
              <Shield className="h-5 w-5 text-indigo-400" />
              <CardTitle>Transfer Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Max File Size</label>
                  <span className="text-base font-bold text-slate-100">{formatBytes(info.maxFileSize)}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Initial policy limit</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Max Concurrent</label>
                  <span className="text-base font-bold text-slate-100">{info.maxConcurrentTransfers} transfers</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Parallel file streams</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Pairing Timeout</label>
                  <span className="text-base font-bold text-slate-100">120 seconds</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Short-lived QR tokens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="bg-slate-900/40 border-slate-800/60">
            <CardContent className="p-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>DevDrop v{info.version} — Local Network Personal Device Bridge</span>
              </div>
              <span>Web Client (PWA ready)</span>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
