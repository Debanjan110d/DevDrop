import React, { useState } from 'react';

interface Props {
  onRetry: () => void;
  onStartServer: () => void;
  isStarting?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '4px 0',
  },
  warningCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    boxShadow: '0 0 6px #ef4444',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f87171',
    margin: 0,
  },
  message: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: 0,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '2px',
  },
  startButton: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
    transition: 'background-color 0.15s',
  },
  secondaryRow: {
    display: 'flex',
    gap: '8px',
  },
  retryButton: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  guideButton: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};

export default function OfflineMessage({ onRetry, onStartServer, isStarting }: Props) {
  return (
    <div style={styles.root}>
      <div style={styles.warningCard}>
        <div style={styles.dot} />
        <span style={styles.title}>DevDrop Server Inactive</span>
      </div>

      <p style={styles.message}>
        The server is turned off to save system resources. Start it with 1-click below:
      </p>

      <div style={styles.actions}>
        <button
          style={{
            ...styles.startButton,
            backgroundColor: isStarting ? '#059669' : '#10b981',
            opacity: isStarting ? 0.8 : 1,
          }}
          disabled={isStarting}
          onClick={onStartServer}
        >
          <span>{isStarting ? '⏳' : '▶'}</span>
          <span>{isStarting ? 'Starting Server…' : 'Start Server On-Demand'}</span>
        </button>

        <div style={styles.secondaryRow}>
          <button style={styles.retryButton} onClick={onRetry}>
            ↻ Check Status
          </button>
          <button
            style={styles.guideButton}
            onClick={() => chrome.tabs.create({ url: 'http://localhost:4545' })}
          >
            Open Browser Tab
          </button>
        </div>
      </div>
    </div>
  );
}
