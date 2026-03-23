// ── Unfollow Module ──

import { t } from './i18n.js';
import { recordUnfollow } from '../storage/history.js';
import { UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX, UNFOLLOW_BATCH_SIZE, UNFOLLOW_BATCH_PAUSE } from '../storage/tier.js';
import { show, hide, showToast, formatEta, estimateEta, randomDelay, countdownDelay } from './ui.js';

export async function batchUnfollow({ targets, els, selectedIds, onEachUnfollow, onComplete }) {
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
        if (onEachUnfollow) onEachUnfollow(userId, username);
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
