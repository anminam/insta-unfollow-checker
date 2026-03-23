// ── Analysis Service ──

import { bus } from '../core/event-bus.js';
import { store } from '../core/store.js';
import { logger } from '../core/logger.js';
import { getCachedAnalysis, setCachedAnalysis } from '../storage/cache.js';
import { MSG } from '../../shared/message-types.js';

/**
 * Start analysis: send ANALYZE message to service worker.
 * Checks cache first, updates store throughout.
 */
export async function startAnalysis() {
  if (store.get('isLocked')) {
    logger.warn('analysis', 'Already in progress');
    return;
  }

  const cached = getCachedAnalysis();
  if (cached) {
    store.setState({
      analysisStatus: 'complete',
      analysisData: cached
    });
    bus.emit('analysis:complete', { data: cached, fromCache: true });
    logger.info('analysis', 'Loaded from cache');
    return;
  }

  store.setState({
    analysisStatus: 'analyzing',
    isLocked: true,
    error: null
  });
  bus.emit('analysis:start');
  logger.info('analysis', 'Starting analysis');

  try {
    const response = await chrome.runtime.sendMessage({ action: MSG.ANALYZE });

    if (!response.success) {
      throw new Error(response.error || 'UNKNOWN');
    }

    const data = response.data;
    setCachedAnalysis(
      data.following, data.followers, data.notFollowingBack,
      data.mutual, data.followerOnly,
      data.totalFollowing, data.totalFollowers
    );

    store.setState({
      analysisStatus: 'complete',
      analysisData: data,
      isLocked: false
    });
    bus.emit('analysis:complete', { data });
    logger.info('analysis', 'Complete', {
      following: data.totalFollowing,
      followers: data.totalFollowers
    });
  } catch (error) {
    store.setState({
      analysisStatus: 'error',
      error: { code: error.message, message: error.message },
      isLocked: false
    });
    bus.emit('analysis:error', { error });
    logger.error('analysis', 'Failed', error.message);
  }
}

/**
 * Clear cached analysis and reset store.
 */
export function clearAnalysis() {
  store.setState({
    analysisStatus: 'idle',
    analysisData: null,
    error: null,
    selectedIds: new Set()
  });
}

// Listen for progress messages from service worker
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === MSG.PROGRESS) {
    bus.emit('analysis:progress', msg.data);
  }
});
