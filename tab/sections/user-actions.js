// ── User Actions (unfollow, whitelist, memo, report, selection) ──

import { t } from '../modules/i18n.js';
import { getWhitelist, toggleWhitelist } from '../storage/whitelist.js';
import { getUserMemo, setUserMemo } from '../storage/memo.js';
import { recordUnfollow, removeUnfollowRecord, getUnfollowHistory } from '../storage/history.js';
import { canFreeUserUnfollow, incrementFreeUnfollowCount, FREE_UNFOLLOW_DAILY_LIMIT, setMaliciousUsers } from '../storage/tier.js';
import { getScheduledQueue, saveScheduledQueue, getScheduledInterval, getScheduledDailyLimit, getSmartSchedule, isOnboardingDone, setOnboardingDone } from '../storage/preferences.js';
import { getScheduledDailyCount, incrementScheduledDailyCount } from '../storage/tier.js';
import { show, hide, showConfirm, showToast, formatDate, escapeHtml } from '../modules/ui.js';
import { batchUnfollow } from '../modules/unfollow.js';
import { checkSafetyBeforeUnfollow } from '../modules/safety.js';

export function setupUserActions(els, state) {
  const {
    userListEl, selectAllCheckbox, unfollowSelectedBtn, scheduledUnfollowBtn,
    selectedCountEl, viewUsers, unfollowProgress, unfollowMessage,
    unfollowTarget, unfollowBar, unfollowCountEl, unfollowStopBtn, unfollowEta,
    notFollowingCountEl, tabNotFollowingCount, tabWhitelistCount
  } = els;

  let lastClickedIndex = -1;
  let memoTargetUserId = null;
  let memoTargetTags = [];
  let scheduledTimer = null;

  function updateSelectedCount() {
    selectedCountEl.textContent = state.selectedIds.size;
    unfollowSelectedBtn.disabled = state.selectedIds.size === 0;
    scheduledUnfollowBtn.disabled = state.selectedIds.size === 0;
  }

  function syncCheckboxes() {
    userListEl.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.checked = state.selectedIds.has(cb.dataset.userId);
    });
  }

  // ── Select All ──
  selectAllCheckbox.addEventListener('change', () => {
    const whitelist = getWhitelist();
    if (selectAllCheckbox.checked) {
      state.getFiltered().forEach(u => { if (!whitelist.has(u.id)) state.selectedIds.add(u.id); });
    } else { state.selectedIds.clear(); }
    syncCheckboxes(); updateSelectedCount();
  });

  // ── Checkbox + Shift+Click ──
  userListEl.addEventListener('click', (e) => {
    const cb = e.target.closest('.user-checkbox');
    if (!cb) return;
    const currentIndex = parseInt(cb.closest('.user-card').dataset.index, 10);
    if (e.shiftKey && lastClickedIndex >= 0) {
      const users = state.getFiltered();
      const whitelist = getWhitelist();
      const start = Math.min(lastClickedIndex, currentIndex);
      const end = Math.max(lastClickedIndex, currentIndex);
      for (let i = start; i <= end; i++) {
        if (i < users.length && !whitelist.has(users[i].id)) {
          cb.checked ? state.selectedIds.add(users[i].id) : state.selectedIds.delete(users[i].id);
        }
      }
      syncCheckboxes(); updateSelectedCount();
      const selectableCount = users.filter(u => !whitelist.has(u.id)).length;
      selectAllCheckbox.checked = selectableCount > 0 && state.selectedIds.size >= selectableCount;
    }
    lastClickedIndex = currentIndex;
  });

  userListEl.addEventListener('change', (e) => {
    if (!e.target.classList.contains('user-checkbox')) return;
    const uid = e.target.dataset.userId;
    e.target.checked ? state.selectedIds.add(uid) : state.selectedIds.delete(uid);
    updateSelectedCount();
    const whitelist = getWhitelist();
    const users = state.getFiltered();
    const selectableCount = users.filter(u => !whitelist.has(u.id)).length;
    selectAllCheckbox.checked = selectableCount > 0 && state.selectedIds.size >= selectableCount;
  });

  // ── Whitelist Toggle ──
  userListEl.addEventListener('click', (e) => {
    const wlBtn = e.target.closest('.btn-whitelist');
    if (!wlBtn) return;
    const userId = wlBtn.dataset.userId;
    const nowWL = toggleWhitelist(userId);
    wlBtn.classList.toggle('active', nowWL);
    const card = wlBtn.closest('.user-card');
    const cb = card.querySelector('.user-checkbox');
    const ufBtn = card.querySelector('.btn-unfollow');
    const uDiv = card.querySelector('.user-username');
    if (nowWL) {
      if (cb) { cb.checked = false; cb.disabled = true; }
      if (ufBtn) ufBtn.disabled = true;
      state.selectedIds.delete(userId);
      if (!uDiv.querySelector('.badge-whitelist')) {
        const badge = document.createElement('span'); badge.className = 'badge-whitelist'; badge.textContent = t('protected');
        const anchor = uDiv.querySelector('.user-verified') || uDiv.querySelector('.username-link');
        anchor.insertAdjacentElement('afterend', badge);
      }
    } else {
      if (cb) cb.disabled = false;
      if (ufBtn) ufBtn.disabled = false;
      uDiv.querySelector('.badge-whitelist')?.remove();
    }
    if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
    updateSelectedCount();
  });

  // ── Individual Unfollow ──
  userListEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-unfollow');
    if (!btn || btn.classList.contains('done') || btn.disabled) return;
    if (state.userTier === 'free') {
      const { allowed } = canFreeUserUnfollow();
      if (!allowed) { showToast(t('freeUnfollowLimitReached'), 'warning'); return; }
    }
    const userId = btn.dataset.userId; const username = btn.dataset.username;
    btn.textContent = '...'; btn.disabled = true;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'UNFOLLOW_USER', data: { userId } });
      if (response.success) {
        if (state.userTier === 'free') incrementFreeUnfollowCount();
        recordUnfollow(userId, username);
        btn.textContent = t('done'); btn.classList.add('done');
        const cb = btn.closest('.user-card').querySelector('.user-checkbox');
        if (cb) cb.checked = false;
        state.selectedIds.delete(userId); updateSelectedCount();
        state.refreshSafetyGauge?.();
        showToast(t('toastUnfollowed', username), 'success', {
          label: t('undoUnfollow'),
          callback: async () => {
            try {
              const r = await chrome.runtime.sendMessage({ action: 'FOLLOW_USER', data: { userId } });
              if (r.success) { removeUnfollowRecord(userId); btn.textContent = t('unfollow'); btn.classList.remove('done'); btn.disabled = false; showToast(t('toastRefollowed', username), 'success'); }
            } catch { /* ignore */ }
          }
        });
      } else { btn.textContent = t('fail'); setTimeout(() => { btn.textContent = t('unfollow'); btn.disabled = false; }, 2000); }
    } catch { btn.textContent = t('error'); setTimeout(() => { btn.textContent = t('unfollow'); btn.disabled = false; }, 2000); }
  });

  // ── Batch Unfollow ──
  unfollowSelectedBtn.addEventListener('click', async () => {
    if (state.selectedIds.size === 0) return;
    const whitelist = getWhitelist();
    let targets = state.getFiltered().filter(u => state.selectedIds.has(u.id) && !whitelist.has(u.id)).map(u => ({ userId: u.id, username: u.username }));
    if (targets.length === 0) return;
    if (state.userTier === 'free') {
      const { allowed, remaining } = canFreeUserUnfollow();
      if (!allowed) { showToast(t('freeUnfollowLimitReached'), 'warning'); return; }
      if (targets.length > remaining) { targets = targets.slice(0, remaining); showToast(t('freeBatchLimited', FREE_UNFOLLOW_DAILY_LIMIT), 'warning'); }
    }
    const safetyCheck = checkSafetyBeforeUnfollow(targets.length);
    if (!safetyCheck.safe) { showToast(safetyCheck.message, 'warning'); return; }
    if (safetyCheck.message) showToast(safetyCheck.message, 'warning');
    if (!await showConfirm(t('confirmUnfollow', targets.length))) return;
    const onEach = state.userTier === 'free' ? () => incrementFreeUnfollowCount() : null;
    await batchUnfollow({
      targets, els: { viewUsers, unfollowProgress, unfollowMessage, unfollowTarget, unfollowBar, unfollowCount: unfollowCountEl, unfollowStopBtn, unfollowEta, userListEl },
      selectedIds: state.selectedIds, onEachUnfollow: onEach,
      onComplete: () => { updateSelectedCount(); state.refreshSafetyGauge?.(); }
    });
  });

  // ── Memo Modal ──
  userListEl.addEventListener('click', (e) => {
    const memoBtn = e.target.closest('.btn-memo');
    if (!memoBtn) return;
    memoTargetUserId = memoBtn.dataset.userId;
    const modal = document.getElementById('memo-modal');
    document.getElementById('memo-username').textContent = `@${memoBtn.dataset.username}`;
    const input = document.getElementById('memo-input');
    const existing = getUserMemo(memoTargetUserId);
    input.value = existing?.text || '';
    memoTargetTags = existing?.tags ? [...existing.tags] : [];
    modal.querySelectorAll('.tag-btn').forEach(btn => btn.classList.toggle('active', memoTargetTags.includes(btn.dataset.tag)));
    show(modal); input.focus();
  });

  document.getElementById('memo-modal').addEventListener('click', (e) => {
    const tagBtn = e.target.closest('.tag-btn');
    if (!tagBtn) return;
    const tag = tagBtn.dataset.tag;
    if (memoTargetTags.includes(tag)) { memoTargetTags = memoTargetTags.filter(t => t !== tag); tagBtn.classList.remove('active'); }
    else { memoTargetTags.push(tag); tagBtn.classList.add('active'); }
  });

  document.getElementById('memo-save').addEventListener('click', () => {
    if (!memoTargetUserId) return;
    setUserMemo(memoTargetUserId, document.getElementById('memo-input').value.trim(), memoTargetTags);
    hide(document.getElementById('memo-modal')); showToast(t('memoSaved'), 'success');
    if (state.analysisData) state.refreshList(); memoTargetUserId = null; memoTargetTags = [];
  });

  document.getElementById('memo-cancel').addEventListener('click', () => { hide(document.getElementById('memo-modal')); memoTargetUserId = null; memoTargetTags = []; });

  // ── Report Malicious ──
  userListEl.addEventListener('click', (e) => {
    const reportBtn = e.target.closest('.btn-report');
    if (!reportBtn) return;
    const username = reportBtn.dataset.username;
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
    const box = document.createElement('div'); box.className = 'modal-box';
    const title = document.createElement('div'); title.className = 'modal-title'; title.textContent = t('reportTitle');
    const user = document.createElement('div'); user.className = 'memo-username'; user.textContent = `@${username}`;
    const textarea = document.createElement('textarea'); textarea.className = 'memo-input'; textarea.rows = 3; textarea.placeholder = t('reportPlaceholder');
    const btns = document.createElement('div'); btns.className = 'modal-buttons';
    const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn btn-secondary'; cancelBtn.textContent = t('no');
    const submitBtn = document.createElement('button'); submitBtn.className = 'btn btn-danger'; submitBtn.textContent = t('reportSubmit');
    btns.appendChild(cancelBtn); btns.appendChild(submitBtn);
    box.appendChild(title); box.appendChild(user); box.appendChild(textarea); box.appendChild(btns);
    overlay.appendChild(box); document.body.appendChild(overlay); textarea.focus();
    cancelBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    submitBtn.addEventListener('click', async () => {
      const reason = textarea.value.trim(); if (!reason) return;
      try {
        const res = await chrome.runtime.sendMessage({ action: 'REPORT_MALICIOUS_USER', data: { username, reason } });
        showToast(res.success ? t('reportSuccess') : t('reportFail'), res.success ? 'success' : 'error');
      } catch { showToast(t('reportFail'), 'error'); }
      overlay.remove();
    });
  });

  // ── Scheduled Unfollow ──
  function showScheduledStatus() {
    const queue = getScheduledQueue();
    const section = document.getElementById('scheduled-section');
    const statusEl = document.getElementById('scheduled-status');
    const listEl = document.getElementById('scheduled-list');
    if (queue.length === 0) { hide(section); return; }
    statusEl.textContent = t('scheduledRemaining', queue.length);
    listEl.textContent = '';
    queue.slice(0, 10).forEach(item => {
      const div = document.createElement('div'); div.className = 'scheduled-item'; div.textContent = `@${item.username}`; listEl.appendChild(div);
    });
    if (queue.length > 10) { const more = document.createElement('div'); more.className = 'scheduled-item'; more.textContent = `...+${queue.length - 10}`; listEl.appendChild(more); }
    show(section);
  }

  function isNightTime() { const h = new Date().getHours(); return h >= 0 && h < 6; }

  async function processScheduledLoop() {
    const queue = getScheduledQueue();
    if (queue.length === 0) return;
    if (getSmartSchedule() && isNightTime()) {
      showToast(t('nightPause'), 'warning');
      const sixAm = new Date(); sixAm.setHours(6, 0, 0, 0); if (sixAm <= new Date()) sixAm.setDate(sixAm.getDate() + 1);
      scheduledTimer = setTimeout(processScheduledLoop, sixAm - new Date() + 60000); return;
    }
    if (getScheduledDailyCount() >= getScheduledDailyLimit()) { showToast(t('dailyLimitReached', getScheduledDailyLimit()), 'warning'); return; }
    const item = queue.shift(); saveScheduledQueue(queue);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'UNFOLLOW_USER', data: { userId: item.userId } });
      if (response.success) { recordUnfollow(item.userId, item.username); incrementScheduledDailyCount(); showToast(t('toastUnfollowed', item.username), 'success'); }
    } catch { /* skip */ }
    showScheduledStatus();
    if (getScheduledQueue().length > 0) {
      const delay = getScheduledInterval() * 60000 + Math.random() * 60000;
      scheduledTimer = setTimeout(processScheduledLoop, delay);
    }
  }

  document.getElementById('scheduled-cancel-btn').addEventListener('click', () => { saveScheduledQueue([]); if (scheduledTimer) clearTimeout(scheduledTimer); scheduledTimer = null; showScheduledStatus(); });

  scheduledUnfollowBtn.addEventListener('click', async () => {
    if (state.userTier === 'free') { showToast(t('freeScheduledDisabled'), 'warning'); return; }
    if (state.selectedIds.size === 0) return;
    const whitelist = getWhitelist();
    const targets = state.getFiltered().filter(u => state.selectedIds.has(u.id) && !whitelist.has(u.id)).map(u => ({ userId: u.id, username: u.username }));
    if (targets.length === 0) return;
    if (!await showConfirm(t('confirmSchedule', targets.length))) return;
    const queue = getScheduledQueue(); queue.push(...targets); saveScheduledQueue(queue);
    state.selectedIds.clear(); selectAllCheckbox.checked = false; syncCheckboxes(); updateSelectedCount();
    showScheduledStatus();
    if (!scheduledTimer) scheduledTimer = setTimeout(processScheduledLoop, 5000);
  });

  // ── History ──
  function showHistory() {
    const history = getUnfollowHistory();
    const entries = Object.entries(history);
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    if (entries.length === 0) { hide(historySection); return; }
    entries.sort((a, b) => new Date(b[1].date) - new Date(a[1].date));
    historyList.textContent = '';
    entries.forEach(([userId, { username, date }]) => {
      const item = document.createElement('div'); item.className = 'history-item';
      const link = document.createElement('a'); link.className = 'history-username';
      link.href = `https://www.instagram.com/${encodeURIComponent(username)}/`; link.target = '_blank'; link.rel = 'noopener'; link.textContent = `@${username}`;
      const rightDiv = document.createElement('div'); rightDiv.className = 'history-right';
      const btn = document.createElement('button'); btn.className = 'btn-refollow'; btn.dataset.userId = userId; btn.dataset.username = username; btn.textContent = t('refollow');
      const dateSpan = document.createElement('span'); dateSpan.className = 'history-date'; dateSpan.textContent = formatDate(date);
      rightDiv.appendChild(btn); rightDiv.appendChild(dateSpan); item.appendChild(link); item.appendChild(rightDiv); historyList.appendChild(item);
    });
    show(historySection);
  }

  document.getElementById('history-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-refollow');
    if (!btn || btn.disabled) return;
    const userId = btn.dataset.userId; const username = btn.dataset.username;
    btn.textContent = '...'; btn.disabled = true;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'FOLLOW_USER', data: { userId } });
      if (response.success) { removeUnfollowRecord(userId); btn.textContent = t('refollowed'); showToast(t('toastRefollowed', username), 'success'); setTimeout(() => showHistory(), 1500); }
      else { btn.textContent = t('fail'); setTimeout(() => { btn.textContent = t('refollow'); btn.disabled = false; }, 2000); }
    } catch { btn.textContent = t('error'); setTimeout(() => { btn.textContent = t('refollow'); btn.disabled = false; }, 2000); }
  });

  // ── Start scheduled if queue exists ──
  function resumeScheduled() {
    if (getScheduledQueue().length > 0 && !scheduledTimer) {
      scheduledTimer = setTimeout(processScheduledLoop, 10000);
    }
  }

  return { updateSelectedCount, syncCheckboxes, showScheduledStatus, showHistory, resumeScheduled };
}
