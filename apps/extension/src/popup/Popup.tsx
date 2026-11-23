import React, { useEffect, useState } from 'react';
import { checkHealth, HealthResult } from '../services/healthCheck';
import ServerStatus from './components/ServerStatus';
import OfflineMessage from './components/OfflineMessage';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '320px',
    minHeight: '220px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
    backgroundColor: '#1e293b',
  },
  logo: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    objectFit: 'contain',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
  },
  appName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  body: {
    padding: '14px 16px 16px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '30px 0',
    color: '#94a3b8',
    fontSize: '13px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #334155',
    borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
};

type Status = 'loading' | 'starting' | 'online' | 'offline';

export default function Popup() {
  const [status, setStatus] = useState<Status>('loading');
  const [health, setHealth] = useState<HealthResult | null>(null);

  const pollHealthUntilReady = (maxAttempts = 12) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const result = await checkHealth();
      if (result.ok) {
        clearInterval(interval);
        setHealth(result);
        setStatus('online');
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus('offline');
      }
    }, 500);
  };

  const startServerOnDemand = () => {
    setStatus('starting');
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendNativeMessage) {
        chrome.runtime.sendNativeMessage(
          'com.devdrop.launcher',
          { action: 'start' },
          (response) => {
            // Started or acknowledged
          }
        );
      }
    } catch {
      // Fallback to polling
    }
    pollHealthUntilReady();
  };

  const checkInitialStatus = async () => {
    setStatus('loading');
    const result = await checkHealth();
    if (result.ok) {
      setHealth(result);
      setStatus('online');
    } else {
      // Auto-start on demand when opening the extension!
      startServerOnDemand();
    }
  };

  useEffect(() => {
    checkInitialStatus();
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #0f172a; }
      `}</style>

      <header style={styles.header}>
        <img src="/icon48.png" style={styles.logo} alt="DevDrop" />
        <div style={styles.headerText}>
          <span style={styles.appName}>DevDrop</span>
          <span style={styles.tagline}>Local Network Sharing</span>
        </div>
      </header>

      <div style={styles.body}>
        {status === 'loading' && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Connecting to DevDrop…</span>
          </div>
        )}

        {status === 'starting' && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Starting server on-demand…</span>
          </div>
        )}

        {status === 'online' && health && (
          <ServerStatus
            health={health}
            onServerStopped={() => {
              setHealth(null);
              setStatus('offline');
            }}
          />
        )}

        {status === 'offline' && (
          <OfflineMessage
            onRetry={checkInitialStatus}
            onStartServer={startServerOnDemand}
            isStarting={false}
          />
        )}
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
        <span>DevDrop v1.2</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="https://buymeachai.in/debanjan110d"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#FFC436',
              color: '#18181B',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '10px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span>☕</span> Buy me a chai <span>↗</span>
          </a>
          <a
            href="https://github.com/Debanjan110d/DevDrop"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#818cf8', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
