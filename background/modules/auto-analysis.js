// ── Auto Analysis Module ──

import { getCsrfToken, getCurrentUserId, fetchAllFollowing, fetchAllFollowers, findNotFollowingBack } from './instagram-api.js';

const AUTO_ANALYSIS_ALARM = 'insta-auto-analysis';
const NOTIFICATION_THRESHOLD = 5;

export async function runAutoAnalysis() {
  try {
    let csrfToken, userId;
    try {
      csrfToken = await getCsrfToken();
      userId = await getCurrentUserId();
    } catch {
      console.log('[InstaUnfollow] Auto analysis skipped: not logged in');
      return;
    }
    const noop = () => {};

    const following = await fetchAllFollowing(userId, csrfToken, noop);
    const followers = await fetchAllFollowers(userId, csrfToken, noop);
    const notFollowingBack = findNotFollowingBack(following, followers);

    const { 'insta-analysis-snapshots': snapshots = [] } = await chrome.storage.local.get('insta-analysis-snapshots');
    const followerUsernames = followers.map(u => u.username);
    const followingUsernames = following.map(u => u.username);

    snapshots.unshift({
      date: new Date().toISOString(),
      following: following.length,
      followers: followers.length,
      notFollowingBack: notFollowingBack.length,
      followerUsernames,
      followingUsernames,
      auto: true
    });
    if (snapshots.length > 20) snapshots.length = 20;
    await chrome.storage.local.set({ 'insta-analysis-snapshots': snapshots });

    if (snapshots.length >= 2) {
      const prev = snapshots[1];
      const diff = followers.length - (prev.followers || 0);
      if (diff !== 0) {
        const text = diff > 0 ? `+${diff}` : `${diff}`;
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: diff > 0 ? '#00c853' : '#ed4956' });

        // Chrome notification for significant changes
        if (Math.abs(diff) >= NOTIFICATION_THRESHOLD) {
          const title = diff > 0
            ? chrome.i18n.getMessage('notifNewFollowers', [String(diff)])
            : chrome.i18n.getMessage('notifLostFollowers', [String(diff)]);
          let message = chrome.i18n.getMessage('notifFollowerChange', [String(prev.followers || 0), String(followers.length)]);
          if (diff < 0 && prev.followerUsernames) {
            const currSet = new Set(followerUsernames);
            const allLost = prev.followerUsernames.filter(u => !currSet.has(u));
            const shown = allLost.slice(0, 5);
            if (shown.length > 0) {
              message = shown.map(u => '@' + u).join(', ') + (allLost.length > 5 ? '...' : '');
            }
          }
          chrome.notifications.create('follower-change', {
            type: 'basic',
            iconUrl: '/icons/icon128.png',
            title,
            message
          });
        }
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    }

    console.log('[InstaUnfollow] Auto analysis complete:', {
      following: following.length,
      followers: followers.length,
      notFollowingBack: notFollowingBack.length
    });
  } catch (error) {
    const msg = error?.message || '';
    if (msg === 'NETWORK_ERROR' || msg.includes('Failed to fetch')) {
      console.log('[InstaUnfollow] Auto analysis skipped: network unavailable');
    } else {
      console.error('[InstaUnfollow] Auto analysis failed:', msg);
    }
  }
}

export function initAlarmListener() {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === AUTO_ANALYSIS_ALARM) {
      runAutoAnalysis();
    }
  });
}

export async function setAutoAnalysis(enabled, periodMinutes) {
  if (enabled) {
    const period = periodMinutes || 1440;
    await chrome.alarms.create(AUTO_ANALYSIS_ALARM, { periodInMinutes: period });
  } else {
    await chrome.alarms.clear(AUTO_ANALYSIS_ALARM);
  }
  chrome.action.setBadgeText({ text: '' });
}

export async function getAutoAnalysisStatus() {
  const alarm = await chrome.alarms.get(AUTO_ANALYSIS_ALARM);
  return { enabled: !!alarm, scheduledTime: alarm?.scheduledTime };
}
