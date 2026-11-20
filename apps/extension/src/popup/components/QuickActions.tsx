import React from 'react';

interface Props {
  dashboardUrl: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '6px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
    transition: 'background-color 0.15s, transform 0.05s',
  },
  secondaryRow: {
    display: 'flex',
    gap: '8px',
  },
  secondaryBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
};

export default function QuickActions({ dashboardUrl }: Props) {
  const openUrl = (path: string) => {
    chrome.tabs.create({ url: `${dashboardUrl}${path}` });
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.primaryBtn}
        onClick={() => openUrl('')}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
        }}
      >
        <span>↗</span>
        <span>Open Dashboard</span>
      </button>

      <div style={styles.secondaryRow}>
        <button
          style={styles.secondaryBtn}
          onClick={() => openUrl('/send')}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#334155';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e293b';
          }}
        >
          <span>📤</span>
          <span>Send Files</span>
        </button>

        <button
          style={styles.secondaryBtn}
          onClick={() => openUrl('/devices')}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#334155';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e293b';
          }}
        >
          <span>📱</span>
          <span>Pair Phone</span>
        </button>
      </div>
    </div>
  );
}
