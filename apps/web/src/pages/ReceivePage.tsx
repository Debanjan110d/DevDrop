import { useState } from 'react';
import { Download, CheckCircle, Clock, FileText, Smartphone, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge, statusToBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Spinner } from '../components/ui/Spinner';
import { useTransfers } from '../hooks/useTransfers';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { getBaseUrl } from '../services/api';
import { CopyButton } from '../components/ui/CopyButton';

export function ReceivePage() {
  const { transfers, isLoading, refetch } = useTransfers();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Incoming mobile files staged or available
  const incomingTransfers = transfers.filter(
    (t) => t.direction === 'mobile-to-pc' || t.direction === 'pc-to-mobile'
  );

  const handleDownload = async (transferId: string, fileName: string) => {
    try {
      setDownloadingId(transferId);
      const downloadUrl = `${getBaseUrl()}/transfers/${transferId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download trigger error:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Received Files</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and save files received from mobile devices or staged on the PC.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : incomingTransfers.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Download className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No incoming files yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Files sent from your mobile device or staged for download will appear here automatically in real time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incomingTransfers.map((t) => {
            const isDownloading = downloadingId === t.id;
            const isAvailable = t.status === 'available';
            const isCompleted = t.status === 'completed';

            return (
              <Card key={t.id} className="transition-colors hover:border-slate-700">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{t.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatBytes(t.fileSize)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {t.direction === 'mobile-to-pc' ? 'From Mobile' : 'To Mobile'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(t.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <Badge variant={statusToBadgeVariant(t.status)}>{t.status}</Badge>

                    {(isAvailable || isCompleted) && (
                      <CopyButton transferId={t.id} fileName={t.fileName} showLabel />
                    )}

                    {isAvailable && (
                      <Button
                        size="sm"
                        disabled={isDownloading}
                        onClick={() => handleDownload(t.id, t.fileName)}
                        className="gap-2"
                      >
                        {isDownloading ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
                        Download
                      </Button>
                    )}

                    {isCompleted && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Saved
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

