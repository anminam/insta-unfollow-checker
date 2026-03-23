// ── Unfollow Service ──

import { bus } from '../core/event-bus.js';
import { store } from '../core/store.js';
import { logger } from '../core/logger.js';
import { recordUnfollow } from '../storage/history.js';
import {
  UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX,
  UNFOLLOW_BATCH_SIZE, UNFOLLOW_BATCH_PAUSE
} from '../storage/tier.js';
import { MSG } from '../../shared/message-types.js';

let _stopped = false;

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Unfollow a single user.
 * @param {string} userId
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function unfollowSingle(userId, username) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: MSG.UNFOLLOW_USER,
      data: { userId }
    });

    if (response.success) {
      recordUnfollow(userId, username);
      bus.emit('unfollow:complete', { userId, username, count: 1 });
      logger.info('unfollow', `Unfollowed @${username}`);
      return true;
    }

    logger.warn('unfollow', `Failed to unfollow @${username}`, response.error);
    return false;
  } catch (error) {
    logger.error('unfollow', `Error unfollowing @${username}`, error.message);
    bus.emit('unfollow:error', { userId, error });
    return false;
  }
}

/**
 * Batch unfollow with rate limiting.
 * @param {Array<{ userId: string, username: string }>} targets
 */
export async function unfollowBatch(targets) {
  _stopped = false;
  const total = targets.length;

  store.setState({
    unfollowStatus: 'running',
    unfollowProgress: { current: 0, total, eta: '' }
  });
  bus.emit('unfollow:start', { total });
  logger.info('unfollow', `Batch start: ${total} users`);

  let completed = 0;

  for (let i = 0; i < targets.length; i++) {
    if (_stopped) break;

    const { userId, username } = targets[i];

    try {
      const response = await chrome.runtime.sendMessage({
        action: MSG.UNFOLLOW_USER,
        data: { userId }
      });

      if (response.success) {
        recordUnfollow(userId, username);
        completed++;
      }
    } catch {
      // skip failed
    }

    const eta = _estimateEta(completed, total);
    store.setState({
      unfollowProgress: { current: completed, total, eta }
    });
    bus.emit('unfollow:progress', { current: completed, total, userId, username });

    if (_stopped) break;

    // Rate limiting
    if (completed % UNFOLLOW_BATCH_SIZE === 0 && completed < total) {
      const pause = UNFOLLOW_BATCH_PAUSE + Math.random() * 5000;
      await new Promise(r => setTimeout(r, pause));
    } else if (completed < total) {
      await randomDelay(UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX);
    }
  }

  const status = _stopped ? 'paused' : 'complete';
  store.setState({
    unfollowStatus: status,
    unfollowProgress: { current: completed, total, eta: '' }
  });
  bus.emit('unfollow:complete', { count: completed, total, stopped: _stopped });
  logger.info('unfollow', `Batch ${status}: ${completed}/${total}`);
}

/**
 * Stop ongoing batch unfollow.
 */
export function stopUnfollow() {
  _stopped = true;
  store.setState({ unfollowStatus: 'paused' });
  bus.emit('unfollow:stop');
  logger.info('unfollow', 'Stopped by user');
}

/** @private */
function _estimateEta(completed, total) {
  const remaining = total - completed;
  if (remaining <= 0) return '';
  const avgDelay = (UNFOLLOW_DELAY_MIN + UNFOLLOW_DELAY_MAX) / 2 / 1000;
  const batchPause = (UNFOLLOW_BATCH_PAUSE + 2500) / 1000;
  let eta = remaining * avgDelay;
  for (let i = 1; i <= remaining; i++) {
    if ((completed + i) % UNFOLLOW_BATCH_SIZE === 0 && (completed + i) < total) {
      eta += batchPause;
    }
  }
  const m = Math.floor(eta / 60);
  const s = Math.round(eta % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
