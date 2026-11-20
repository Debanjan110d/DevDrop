import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Clipboard,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useDevices } from '../hooks/useDevices';
import { getSocket } from '../services/socket';
import { formatRelativeTime } from '../utils/format';

interface TextSnippet {
  id: string;
  text: string;
  senderName: string;
  senderId?: string;
  createdAt: number;
  direction?: string;
}

export function TextPage() {
  const { devices } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first device
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0]!.id);
    }
  }, [devices, selectedDeviceId]);

  // Load initial text history
  const loadTextSnippets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/text');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSnippets(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load text snippets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTextSnippets();
  }, []);

  // Listen to real-time incoming text
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTextReceived = (data: any) => {
      if (data && data.text) {
        setSnippets((prev) => [
          {
            id: data.id || String(Date.now()),
            text: data.text,
            senderName: data.senderName || 'Device',
            senderId: data.senderId,
            createdAt: data.timestamp || Date.now(),
          },
          ...prev,
        ]);
      }
    };

    (socket as any).on('text:received', handleTextReceived);
    return () => {
      (socket as any).off('text:received', handleTextReceived);
    };
  }, []);

  // Handle paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setTextInput((prev) => (prev ? `${prev}\n${clipText}` : clipText));
      }
    } catch {
      // Permission denied or not supported
    }
  };

  // Copy snippet to clipboard
  const handleCopySnippet = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Send text
  const handleSendText = async () => {
    if (!textInput.trim() || !selectedDeviceId) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textInput.trim(),
          destinationDeviceId: selectedDeviceId,
        }),
      });

      if (res.ok) {
        setTextInput('');
        loadTextSnippets();
      }
    } catch (err) {
      console.error('Failed to send text:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            Quick Text & Clipboard Drop
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Instantly push text, notes, URLs, and code snippets between your PC and phone with one-click copy.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadTextSnippets} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Send Text Panel */}
        <div className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Send to Device</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="text-xs text-indigo-400 hover:text-indigo-300 gap-1.5 h-8 px-2"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Paste from Clipboard
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target device selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Destination Device
                </label>
                {devices.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No devices paired yet. Pair a phone in the Devices tab.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {devices.map((d) => {
                      const isSelected = selectedDeviceId === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDeviceId(d.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {d.platform === 'android' ? (
                            <Smartphone className="h-3.5 w-3.5" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5" />
                          )}
                          <span>{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Text area */}
              <div>
                <textarea
                  rows={6}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type or paste anything here... links, notes, OTP codes, commands, or messages."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono resize-none leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                  <span>{textInput.length} characters</span>
                  <span>Instant push over local Wi-Fi</span>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendText}
                disabled={!textInput.trim() || !selectedDeviceId || isSending}
                className="w-full py-2.5 font-semibold text-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending to Device…' : 'Send Text to Phone'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Received / Shared Snippets Roster */}
        <div className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>Shared Snippets</span>
                <span className="text-xs font-normal text-slate-400">({snippets.length})</span>
              </CardTitle>
              <Badge variant="muted">Live Synced</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Loading text snippets…
                </div>
              ) : snippets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm space-y-2">
                  <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
                  <p>No text snippets sent yet.</p>
                  <p className="text-xs text-slate-600">
                    Paste text on PC or phone to immediately share and copy!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {snippets.map((snip) => {
                    const isCopied = copiedId === snip.id;

                    return (
                      <div
                        key={snip.id}
                        className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 transition-all hover:border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">
                              {snip.senderName || 'Device'}
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(snip.createdAt)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopySnippet(snip.id, snip.text)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-900 font-mono text-xs text-slate-200 select-all whitespace-pre-wrap break-words leading-relaxed max-h-36 overflow-y-auto">
                          {snip.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
