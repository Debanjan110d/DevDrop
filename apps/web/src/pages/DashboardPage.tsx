import { useCallback, useState, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Send, PlusCircle, History, Wifi, Smartphone, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge, statusToBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Spinner } from '../components/ui/Spinner';
import { useServerStatus } from '../hooks/useServerStatus';
import { useTransfers } from '../hooks/useTransfers';
import { useDevices } from '../hooks/useDevices';
import { useSocket } from '../hooks/useSocket';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { CopyButton } from '../components/ui/CopyButton';
import { clsx } from 'clsx';

export function DashboardPage() {
  const navigate = useNavigate();
  const { status, isConnected, isLoading: serverLoading } = useServerStatus();
  const { transfers, isLoading: transfersLoading } = useTransfers({ limit: 5 });
  const { devices } = useDevices();
  useSocket();

  const [dropState, setDropState] = useState<'idle' | 'hovering'>('idle');

  const onlineDevices = devices.filter((d) => d.status === 'online');
  const activeTransfers = transfers.filter((t) =>
    ['uploading', 'downloading', 'pending'].includes(t.status),
  );
  const recentTransfers = transfers.slice(0, 5);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropState('hovering');
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropState('idle');
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropState('idle');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      navigate('/send', { state: { files: Array.from(e.dataTransfer.files) } });
    } else {
      navigate('/send');
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Server status */}
        <Card>
          <CardHeader>
            <Wifi className="h-4 w-4 text-slate-400" />
            <CardTitle>Server</CardTitle>
          </CardHeader>
          <CardContent>
            {serverLoading ? (
              <Spinner size="sm" />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'h-2.5 w-2.5 rounded-full',
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500',
                  )}
                />
                <span className={clsx('text-sm font-semibold', isConnected ? 'text-emerald-400' : 'text-slate-400')}>
                  {isConnected ? 'Running' : 'Offline'}
                </span>
              </div>
            )}
            {status && (
              <p className="text-xs text-slate-500 mt-1">{status.host}:{status.port}</p>
            )}
          </CardContent>
        </Card>

        {/* Connected devices */}
        <Card>
          <CardHeader>
            <Smartphone className="h-4 w-4 text-slate-400" />
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">{onlineDevices.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {devices.length} paired · {onlineDevices.length} online
            </p>
          </CardContent>
        </Card>

        {/* Active transfers */}
        <Card>
          <CardHeader>
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">{activeTransfers.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">transfers in progress</p>
          </CardContent>
        </Card>

        {/* Total transfers */}
        <Card>
          <CardHeader>
            <History className="h-4 w-4 text-slate-400" />
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-100">{transfers.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">all time transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate('/send')} size="sm">
          <Send className="h-4 w-4 mr-2" /> Send File
        </Button>
        <Button onClick={() => navigate('/devices')} variant="secondary" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Device
        </Button>
        <Button onClick={() => navigate('/transfers')} variant="secondary" size="sm">
          <History className="h-4 w-4 mr-2" /> View History
        </Button>
      </div>

      {/* Dropzone */}
      <Card>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => navigate('/send')}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
            dropState === 'hovering'
              ? 'border-primary bg-primary/10'
              : 'border-slate-600 hover:border-primary/50 hover:bg-surface-elevated',
          )}
        >
          <Upload
            className={clsx(
              'h-10 w-10 transition-colors',
              dropState === 'hovering' ? 'text-primary' : 'text-slate-500',
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">Drop files or click to select</p>
            <p className="text-xs text-slate-500 mt-1">Send files to your connected devices</p>
          </div>
        </div>
      </Card>

      {/* Recent transfers */}
      <Card>
        <CardHeader>
          <History className="h-4 w-4 text-slate-400" />
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : recentTransfers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No transfers yet</p>
          ) : (
            <ul className="space-y-2">
              {recentTransfers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(t.fileSize)} · {formatRelativeTime(t.createdAt)}
                    </p>
                    {['uploading', 'downloading'].includes(t.status) && (
                      <Progress
                        value={t.bytesTransferred}
                        max={t.fileSize}
                        size="sm"
                        className="mt-1"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusToBadgeVariant(t.status)}>{t.status}</Badge>
                    {t.status === 'completed' && (
                      <CopyButton transferId={t.id} fileName={t.fileName} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
