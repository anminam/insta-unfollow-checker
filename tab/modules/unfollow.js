// ── Unfollow Module ──

import { t } from './i18n.js';
import { recordUnfollow, getWhitelist, getScheduledQueue, saveScheduledQueue, getScheduledInterval, UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX, UNFOLLOW_BATCH_SIZE, UNFOLLOW_BATCH_PAUSE } from './storage.js';
import { show, hide, showConfirm, showToast, formatEta, estimateEta, randomDelay, countdownDelay } from './ui.js';

export async function batchUnfollow({ targets, els, selectedIds, onComplete }) {
  const {
    resultSection, unfollowProgress, unfollowMessage, unfollowTarget,
    unfollowBar, unfollowCount, unfollowStopBtn, unfollowEta, userListEl
  } = els;

  let unfollowStopped = false;

  unfollowStopBtn.disabled = false;
  unfollowStopBtn.textContent = t('stop');
  hide(resultSection);
  show(unfollowProgress);

  const stopHandler = () => {
    unfollowStopped = true;
    unfollowStopBtn.disabled = true;
    unfollowStopBtn.textContent = t('stopping');
  };
  unfollowStopBtn.addEventListener('click', stopHandler);

  let completed = 0;
  const total = targets.length;

  unfollowEta.textContent = formatEta(estimateEta(0, total));

  for (let i = 0; i < targets.length; i++) {
    if (unfollowStopped) break;

    const { userId, username } = targets[i];
    const current = i + 1;
    const percent = Math.round((current / total) * 100);

    unfollowMessage.textContent = `${t('unfollowing')}... (${current}/${total})`;
    unfollowTarget.textContent = `@${username}`;
    unfollowBar.style.width = `${percent}%`;
    unfollowCount.textContent = `${current} / ${total}`;
    unfollowEta.textContent = formatEta(estimateEta(completed, total));

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'UNFOLLOW_USER',
        data: { userId }
      });

      if (response.success) {
        recordUnfollow(userId, username);
        const card = userListEl.querySelector(`[data-user-id="${userId}"]`);
        if (card) {
          const btn = card.querySelector('.btn-unfollow');
          if (btn) {
            btn.textContent = t('done');
            btn.classList.add('done');
          }
          const cb = card.querySelector('.user-checkbox');
          if (cb) cb.checked = false;
        }
      }
    } catch {
      // skip failed ones
    }

    completed++;

    if (unfollowStopped) break;

    if (completed % UNFOLLOW_BATCH_SIZE === 0 && completed < total) {
      const waitSec = Math.ceil((UNFOLLOW_BATCH_PAUSE + Math.random() * 5000) / 1000);
      const baseEta = estimateEta(completed, total);
      await countdownDelay(waitSec, (remaining) => {
        unfollowMessage.textContent = `${t('waitingSafety')}... (${completed}/${total})`;
        unfollowTarget.textContent = t('resumeIn', remaining);
        unfollowEta.textContent = formatEta(baseEta - (waitSec - remaining));
      });
      unfollowTarget.textContent = '';
    } else if (completed < total) {
      await randomDelay(UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX);
    }
  }

  unfollowStopBtn.removeEventListener('click', stopHandler);

  unfollowMessage.textContent = unfollowStopped ? t('stopped', completed) : t('completed', completed);
  unfollowTarget.textContent = '';
  unfollowEta.textContent = '';
  unfollowBar.style.width = unfollowStopped ? `${Math.round((completed / total) * 100)}%` : '100%';
  unfollowCount.textContent = `${completed} / ${total}`;
  unfollowStopBtn.disabled = true;

  showToast(unfollowStopped ? t('stopped', completed) : t('completed', completed), 'success');

  setTimeout(() => {
    hide(unfollowProgress);
    show(resultSection);
    onComplete(completed);
  }, 2000);
}

export function processScheduledQueue(onProcessed) {
  const queue = getScheduledQueue();
  if (queue.length === 0) return null;

  const item = queue.shift();
  saveScheduledQueue(queue);

  const doProcess = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'UNFOLLOW_USER',
        data: { userId: item.userId }
      });
      if (response.success) {
        recordUnfollow(item.userId, item.username);
        showToast(t('toastUnfollowed', item.username), 'success');
      }
    } catch {
      // Skip failed
    }

    onProcessed();

    const remainingQueue = getScheduledQueue();
    if (remainingQueue.length > 0) {
      const intervalMin = getScheduledInterval();
      const delayMs = intervalMin * 60000 + Math.random() * 60000;
      return setTimeout(() => processScheduledQueue(onProcessed), delayMs);
    }
    return null;
  };

  doProcess();

  // Return a promise-like handle for initial call
  const remainingQueue = getScheduledQueue();
  if (remainingQueue.length > 0) {
    const intervalMin = getScheduledInterval();
    const delayMs = intervalMin * 60000 + Math.random() * 60000;
    return delayMs;
  }
  return null;
}

export async function scheduleUnfollow(targets, selectedIds, selectAllCheckbox, onScheduled) {
  if (targets.length === 0) return;
  if (!await showConfirm(t('confirmSchedule', targets.length))) return;

  const queue = getScheduledQueue();
  queue.push(...targets);
  saveScheduledQueue(queue);

  selectedIds.clear();
  selectAllCheckbox.checked = false;

  onScheduled();
}
