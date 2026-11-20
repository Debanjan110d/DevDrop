import React, { useState } from 'react';
import { HealthResult } from '../../services/healthCheck';
import QuickActions from './QuickActions';

interface Props {
  health: HealthResult;
  onServerStopped?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '8px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  statusText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#34d399',
  },
  versionPill: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: '#1e293b',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  infoLabel: {
    color: '#94a3b8',
  },
  infoValue: {
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontWeight: 500,
  },
  deviceBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: 600,
  },
  deviceList: {
    marginTop: '4px',
    paddingTop: '6px',
    borderTop: '1px dashed #334155',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  deviceChip: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  stopButton: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
};

export default function ServerStatus({ health, onServerStopped }: Props) {
  const address = health.address ?? 'http://localhost:4545';
  const devices = health.devices ?? [];
  const [isStopping, setIsStopping] = useState(false);

  const handleStopServer = async () => {
    setIsStopping(true);
    try {
      await fetch(`${address}/api/server/shutdown`, {
        method: 'POST',
      });
    } catch {
      // Ignored
    }
    setTimeout(() => {
      onServerStopped?.();
    }, 600);
  };

  return (
    <div style={styles.root}>
      <div style={styles.statusCard}>
        <div style={styles.statusLeft}>
          <div style={styles.dot} />
          <span style={styles.statusText}>Server Active</span>
        </div>
        <span style={styles.versionPill}>v{health.version ?? '1.0.0'}</span>
      </div>

      <div style={styles.infoSection}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Local URL</span>
          <span style={styles.infoValue}>{address}</span>
        </div>

        {health.networkAddress && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Wi-Fi LAN</span>
            <span style={styles.infoValue}>{health.networkAddress}</span>
          </div>
        )}

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Paired Devices</span>
          <span style={styles.deviceBadge}>
            {devices.length} {devices.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        {devices.length > 0 && (
          <div style={styles.deviceList}>
            {devices.map((d) => (
              <span key={d.id} style={styles.deviceChip}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: d.status === 'online' ? '#10b981' : '#64748b',
                  }}
                />
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <QuickActions dashboardUrl={address} />

      <button
        style={{
          ...styles.stopButton,
          opacity: isStopping ? 0.6 : 1,
        }}
        disabled={isStopping}
        onClick={handleStopServer}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
      >
        <span>⏹</span>
        <span>{isStopping ? 'Stopping Server…' : 'Stop Server (Free RAM & CPU)'}</span>
      </button>
    </div>
  );
}
