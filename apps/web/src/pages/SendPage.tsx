import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Upload, X, Smartphone, Laptop, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { useDevices } from '../hooks/useDevices';
import { uploadFile } from '../services/api';
import { formatBytes } from '../utils/format';
import { CopyButton } from '../components/ui/CopyButton';

type UploadState = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  transferId?: string;
};

export function SendPage() {
  const location = useLocation();
  const { devices } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files passed via Router state (e.g. from Dashboard drag-and-drop)
  useEffect(() => {
    if (location.state?.files && Array.isArray(location.state.files)) {
      const incoming = (location.state.files as File[]).map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setUploads((prev) => [...prev, ...incoming]);
      // Clear location state so refreshes don't re-add
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-select first online device, or first device if none selected
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      const onlineDev = devices.find((d) => d.status === 'online');
      setSelectedDeviceId(onlineDev ? onlineDev.id : devices[0]!.id);
    }
  }, [devices, selectedDeviceId]);

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files);
    const newUploads: UploadState[] = list.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSend = useCallback(async () => {
    if (!selectedDeviceId) return;
    for (let i = 0; i < uploads.length; i++) {
      const item = uploads[i];
      if (!item || item.status !== 'pending') continue;

      setUploads((prev) =>
        prev.map((u, idx) => (idx === i ? { ...u, status: 'uploading', progress: 0 } : u)),
      );

      try {
        const transfer = await uploadFile(selectedDeviceId, item.file, (progress) => {
          setUploads((prev) =>
            prev.map((u, idx) => (idx === i ? { ...u, progress } : u)),
          );
        });

        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: 'done', progress: 100, transferId: transfer.id } : u,
          ),
        );
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i
              ? { ...u, status: 'error', error: err?.message || 'Upload failed' }
              : u,
          ),
        );
      }
    }
  }, [selectedDeviceId, uploads]);

  const removeUpload = useCallback((idx: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const targetDevice = devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="space-y-6">
      {/* Device selector */}
      <Card>
        <CardHeader>
          <Send className="h-4 w-4 text-slate-400" />
          <CardTitle>Select Destination Device</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-slate-500">
              No devices paired yet. Go to <span className="text-indigo-400 font-semibold">Devices</span> tab to pair a phone!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {devices.map((d) => {
                const isSelected = selectedDeviceId === d.id;
                const isOnline = d.status === 'online';

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeviceId(d.id)}
                    className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm'
                        : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {d.platform === 'android' || d.platform === 'ios' ? (
                      <Smartphone className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    ) : (
                      <Laptop className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    )}
                    <span>{d.name}</span>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File picker & Drag-and-Drop Area */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-400" />
            <CardTitle>Files to Send</CardTitle>
          </div>
          {uploads.length > 0 && (
            <button
              onClick={() => setUploads([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Clear All ({uploads.length})
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-700 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70'
            }`}
          >
            <Upload className={`h-10 w-10 mx-auto mb-2 transition-colors ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
            <p className="text-sm font-semibold text-slate-200">
              {isDragging ? 'Drop files here!' : 'Click to browse or drop files here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports any file type (photos, videos, documents, archives)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploads.length > 0 && (
            <ul className="space-y-2">
              {uploads.map((u, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{u.file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatBytes(u.file.size)}</p>

                    {u.status === 'uploading' && (
                      <Progress value={u.progress} size="sm" className="mt-2" />
                    )}

                    {u.status === 'error' && u.error && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {u.error}
                      </p>
                    )}
                  </div>

                  <Badge
                    variant={
                      u.status === 'done'
                        ? 'success'
                        : u.status === 'error'
                        ? 'error'
                        : u.status === 'uploading'
                        ? 'info'
                        : 'muted'
                    }
                  >
                    {u.status === 'uploading' ? `${u.progress}%` : u.status}
                  </Badge>

                  {u.status === 'done' && u.transferId && (
                    <CopyButton transferId={u.transferId} fileName={u.file.name} showLabel />
                  )}

                  {u.status === 'pending' && (
                    <button
                      onClick={() => removeUpload(i)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSend}
        disabled={!selectedDeviceId || uploads.filter((u) => u.status === 'pending').length === 0}
        className="w-full py-3 text-base font-semibold"
      >
        <Send className="h-4 w-4 mr-2" />
        Send {uploads.filter((u) => u.status === 'pending').length > 0 ? `${uploads.filter((u) => u.status === 'pending').length} ` : ''}File{uploads.filter((u) => u.status === 'pending').length !== 1 ? 's' : ''} to {targetDevice ? targetDevice.name : 'Selected Device'}
      </Button>
    </div>
  );
}
