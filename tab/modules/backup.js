// ── Backup / Restore Module ──

import { getUnfollowHistory, saveUnfollowHistory } from '../storage/history.js';
import { getSnapshots } from '../storage/snapshot.js';
import { getWhitelist, saveWhitelist } from '../storage/whitelist.js';
import { getMemos, saveMemos } from '../storage/memo.js';
import { getScheduledQueue, saveScheduledQueue, getFirstSeen } from '../storage/preferences.js';
import { validateBackupData } from '../storage/tier.js';

// Storage keys used directly for settings backup/restore
const SNAPSHOT_KEY = 'insta-analysis-snapshots';
const DARK_MODE_KEY = 'insta-dark-mode';
const SORT_KEY = 'insta-sort-preference';
const AUTO_WHITELIST_KEY = 'insta-auto-whitelist';
const SMART_SCHEDULE_KEY = 'insta-smart-schedule';
const SCHEDULED_INTERVAL_KEY = 'insta-scheduled-interval';
const SCHEDULED_DAILY_LIMIT_KEY = 'insta-scheduled-daily-limit';
import { showToast } from './ui.js';
import { t, getLang } from './i18n.js';

export function exportBackup() {
  const data = {
    version: 5,
    date: new Date().toISOString(),
    unfollowHistory: getUnfollowHistory(),
    snapshots: getSnapshots(),
    whitelist: [...getWhitelist()],
    memos: getMemos(),
    scheduledQueue: getScheduledQueue(),
    firstSeen: getFirstSeen(),
    settings: {
      darkMode: localStorage.getItem(DARK_MODE_KEY),
      sort: localStorage.getItem(SORT_KEY),
      lang: localStorage.getItem('insta-lang'),
      autoWhitelist: localStorage.getItem(AUTO_WHITELIST_KEY),
      smartSchedule: localStorage.getItem(SMART_SCHEDULE_KEY),
      scheduledInterval: localStorage.getItem(SCHEDULED_INTERVAL_KEY),
      scheduledDailyLimit: localStorage.getItem(SCHEDULED_DAILY_LIMIT_KEY)
    }
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insta-unfollow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('backupSuccess'), 'success');
}

export function importBackup(file, onComplete) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!validateBackupData(data)) {
        showToast(t('restoreFail'), 'error');
        return;
      }
      if (data.unfollowHistory) saveUnfollowHistory(data.unfollowHistory);
      if (data.snapshots) localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data.snapshots));
      if (data.whitelist) saveWhitelist(new Set(data.whitelist));
      if (data.memos) saveMemos(data.memos);
      if (data.scheduledQueue) saveScheduledQueue(data.scheduledQueue);
      if (data.firstSeen) localStorage.setItem('insta-first-seen', JSON.stringify(data.firstSeen));
      if (data.settings) {
        if (data.settings.darkMode !== null) localStorage.setItem(DARK_MODE_KEY, data.settings.darkMode);
        if (data.settings.sort) localStorage.setItem(SORT_KEY, data.settings.sort);
        if (data.settings.lang) localStorage.setItem('insta-lang', data.settings.lang);
        if (data.settings.autoWhitelist) localStorage.setItem(AUTO_WHITELIST_KEY, data.settings.autoWhitelist);
        if (data.settings.smartSchedule) localStorage.setItem(SMART_SCHEDULE_KEY, data.settings.smartSchedule);
        if (data.settings.scheduledInterval) localStorage.setItem(SCHEDULED_INTERVAL_KEY, data.settings.scheduledInterval);
        if (data.settings.scheduledDailyLimit) localStorage.setItem(SCHEDULED_DAILY_LIMIT_KEY, data.settings.scheduledDailyLimit);
      }
      showToast(t('restoreSuccess'), 'success');
      if (onComplete) onComplete();
    } catch {
      showToast(t('restoreFail'), 'error');
    }
  };
  reader.readAsText(file);
}
