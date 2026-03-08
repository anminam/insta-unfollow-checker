// ── Service Worker Entry Point (ES Module) ──

import { getCsrfToken, getCurrentUserId, fetchAllFollowing, fetchAllFollowers, findNotFollowingBack, unfollowUser, followUser } from './modules/instagram-api.js';
import { googleLogin, googleLogout, getAuthStatus } from './modules/auth.js';
import { initAlarmListener, setAutoAnalysis, getAutoAnalysisStatus } from './modules/auto-analysis.js';

// Initialize alarm listener
initAlarmListener();

// ── Message Handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message, sender) {
  try {
    switch (message.action) {
      case 'ANALYZE': {
        const csrfToken = await getCsrfToken();
        const userId = await getCurrentUserId();

        const sendProgress = (phase, current, total) => {
          chrome.runtime.sendMessage({
            action: 'PROGRESS',
            data: { phase, current, total }
          }).catch(() => {});
        };

        const following = await fetchAllFollowing(userId, csrfToken, sendProgress);
        const followers = await fetchAllFollowers(userId, csrfToken, sendProgress);
        const notFollowingBack = findNotFollowingBack(following, followers);

        return {
          success: true,
          data: {
            following,
            followers,
            notFollowingBack,
            totalFollowing: following.length,
            totalFollowers: followers.length
          }
        };
      }

      case 'UNFOLLOW_USER': {
        const csrfToken = await getCsrfToken();
        const result = await unfollowUser(message.data.userId, csrfToken);
        return { success: result };
      }

      case 'FOLLOW_USER': {
        const csrfToken = await getCsrfToken();
        const result = await followUser(message.data.userId, csrfToken);
        return { success: result };
      }

      case 'SET_AUTO_ANALYSIS': {
        await setAutoAnalysis(message.data.enabled, message.data.periodMinutes);
        return { success: true };
      }

      case 'GET_AUTO_ANALYSIS_STATUS': {
        const status = await getAutoAnalysisStatus();
        return { success: true, data: status };
      }

      case 'CLEAR_BADGE': {
        chrome.action.setBadgeText({ text: '' });
        return { success: true };
      }

      case 'GOOGLE_LOGIN': {
        const result = await googleLogin();
        return { success: true, data: result };
      }

      case 'GOOGLE_LOGOUT': {
        await googleLogout();
        return { success: true };
      }

      case 'GET_AUTH_STATUS': {
        const status = await getAuthStatus();
        return { success: true, data: status };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('[InstaUnfollow]', error);
    return { success: false, error: error.message };
  }
}
