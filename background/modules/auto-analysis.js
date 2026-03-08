// ── Auto Analysis Module ──

import { getCsrfToken, getCurrentUserId, fetchAllFollowing, fetchAllFollowers, findNotFollowingBack } from './instagram-api.js';

const AUTO_ANALYSIS_ALARM = 'insta-auto-analysis';

export async function runAutoAnalysis() {
  try {
    const csrfToken = await getCsrfToken();
    const userId = await getCurrentUserId();
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
    console.error('[InstaUnfollow] Auto analysis failed:', error);
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
