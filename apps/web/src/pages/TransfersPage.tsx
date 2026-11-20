import { useState } from 'react';
import { History, Search, FileText, Smartphone, ArrowDownLeft, ArrowUpRight, RefreshCw, XCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge, statusToBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useTransfers } from '../hooks/useTransfers';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { cancelTransfer } from '../services/api';
import { CopyButton } from '../components/ui/CopyButton';

type FilterTab = 'all' | 'completed' | 'active' | 'failed' | 'cancelled';

export function TransfersPage() {
  const { transfers, isLoading, refetch } = useTransfers();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransfers = transfers.filter((t) => {
    // Filter tab
    if (activeTab === 'completed' && t.status !== 'completed') return false;
    if (activeTab === 'active' && !['uploading', 'downloading', 'pending', 'available'].includes(t.status)) return false;
    if (activeTab === 'failed' && t.status !== 'failed') return false;
    if (activeTab === 'cancelled' && t.status !== 'cancelled') return false;

    // Search query
    if (searchQuery.trim()) {
      return t.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const handleCancel = async (id: string) => {
    try {
      await cancelTransfer(id);
      refetch();
    } catch (err) {
      console.error('Failed to cancel transfer:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Transfer History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete log of all past and current file exchanges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(['all', 'active', 'completed', 'failed', 'cancelled'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : filteredTransfers.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <History className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No transfers found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try clearing your search query.' : 'Transfers will appear here once started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTransfers.map((t) => {
            const isToMobile = t.direction === 'pc-to-mobile';
            const isActive = ['pending', 'uploading', 'downloading', 'available'].includes(t.status);

            return (
              <Card key={t.id} className="transition-colors hover:border-slate-700">
                <CardContent className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isToMobile
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isToMobile ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{t.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatBytes(t.fileSize)}</span>
                        <span>·</span>
                        <span className="capitalize">{t.direction.replace('-', ' → ')}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(t.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={statusToBadgeVariant(t.status)}>{t.status}</Badge>

                    {t.status === 'completed' && (
                      <CopyButton transferId={t.id} fileName={t.fileName} showLabel />
                    )}

                    {isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(t.id)}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
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

