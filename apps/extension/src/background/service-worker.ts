/// <reference lib="webworker" />

import { checkHealth } from '../services/healthCheck';

declare const self: ServiceWorkerGlobalScope;

const HEALTH_CHECK_INTERVAL_MS = 30_000; // 30 seconds
const ALARM_NAME = 'devdrop-health-check';

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  scheduleAlarm();
  setupContextMenus();
});

// ── Context Menus ────────────────────────────────────────────────────────────

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'devdrop-open-dashboard',
      title: 'DevDrop: Open Dashboard',
      contexts: ['action'],
    });

    chrome.contextMenus.create({
      id: 'devdrop-send-page',
      title: 'DevDrop: Send Page to Devices',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: 'devdrop-send-link',
      title: 'DevDrop: Send Link to Devices',
      contexts: ['link'],
    });
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'devdrop-open-dashboard') {
    chrome.tabs.create({ url: 'http://localhost:4545' });
  } else if (info.menuItemId === 'devdrop-send-page' || info.menuItemId === 'devdrop-send-link') {
    chrome.tabs.create({ url: 'http://localhost:4545/send' });
  }
});

// ── Alarm ────────────────────────────────────────────────────────────────────

function scheduleAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: HEALTH_CHECK_INTERVAL_MS / 60_000,
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    runHealthCheck();
  }
});

// ── Health check ─────────────────────────────────────────────────────────────

async function runHealthCheck() {
  const result = await checkHealth();
  await chrome.storage.local.set({
    devdrop_status: result.ok ? 'online' : 'offline',
    devdrop_address: result.address ?? null,
    devdrop_network_address: result.networkAddress ?? null,
    devdrop_last_check: Date.now(),
  });

  // Update badge
  if (result.ok) {
    const onlineCount = result.devices?.filter((d) => d.status === 'online').length ?? 0;
    chrome.action.setBadgeText({ text: onlineCount > 0 ? String(onlineCount) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    chrome.action.setTitle({ title: `DevDrop: Online (${onlineCount} device active)` });
  } else {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.action.setTitle({ title: 'DevDrop: Server Offline' });
  }
}

// ── Message handler (from popup) ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'HEALTH_CHECK') {
    runHealthCheck().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

export {};
