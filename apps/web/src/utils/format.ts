/**
 * Format bytes into human-readable size string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remainingS = s % 60;
  if (m < 60) return remainingS > 0 ? `${m}m ${remainingS}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remainingM = m % 60;
  return remainingM > 0 ? `${h}h ${remainingM}m` : `${h}h`;
}

/**
 * Format a date string, timestamp number, or Date object as a relative time (e.g., "2 minutes ago").
 */
export function formatRelativeTime(date: string | number | Date | null | undefined): string {
  if (date === null || date === undefined || date === '') return '—';
  const now = Date.now();
  let target: number;

  if (typeof date === 'number') {
    target = date;
  } else if (typeof date === 'string') {
    const parsedNum = Number(date);
    if (!isNaN(parsedNum) && parsedNum > 1000000000) {
      target = parsedNum;
    } else {
      target = new Date(date).getTime();
    }
  } else if (date instanceof Date) {
    target = date.getTime();
  } else {
    target = now;
  }

  if (isNaN(target) || target <= 0) return '—';
  const diffMs = now - target;

  if (diffMs < 0) return 'just now';
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) {
    const mins = Math.floor(diffMs / 60_000);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(target).toLocaleDateString();
}

/**
 * Calculate transfer speed in bytes/sec and return a human-readable string.
 */
export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

/**
 * Estimate remaining time given current bytes, total bytes, and start time.
 */
export function estimateTimeRemaining(
  bytesTransferred: number,
  totalBytes: number,
  startedAt: string | number | Date,
): string {
  const target = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime();
  const elapsed = Date.now() - target;
  if (elapsed <= 0 || bytesTransferred <= 0) return '—';
  const bytesPerMs = bytesTransferred / elapsed;
  const remaining = totalBytes - bytesTransferred;
  if (remaining <= 0) return '0s';
  return formatDuration(remaining / bytesPerMs);
}
