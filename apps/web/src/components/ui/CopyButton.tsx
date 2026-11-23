import React, { useState } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { copyTransferToClipboard } from '../../utils/clipboard';

interface Props {
  transferId: string;
  fileName: string;
  className?: string;
  showLabel?: boolean;
}

export function CopyButton({ transferId, fileName, className = '', showLabel = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<'image' | 'text' | 'file'>('text');

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || copied) return;

    setLoading(true);
    try {
      const res = await copyTransferToClipboard(transferId, fileName);
      if (res.success) {
        setCopiedType(res.type);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (!copied) return 'Copy';
    if (copiedType === 'image') return 'Copied Image!';
    if (copiedType === 'text') return 'Copied Text!';
    return 'Copied Name!';
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? getLabel() : 'Copy content to clipboard'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {showLabel && <span>{getLabel()}</span>}
    </button>
  );
}
