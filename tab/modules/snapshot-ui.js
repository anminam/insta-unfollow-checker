// ── Snapshot UI Module ──

import { t } from './i18n.js';
import { getSnapshots, deleteSnapshot } from '../storage/snapshot.js';
import { getWhitelist } from '../storage/whitelist.js';
import { show, hide, showToast, formatDate, usernameLink } from './ui.js';
import { drawStatsChart } from './chart.js';

export function initSnapshotUI({ snapshotSection, snapshotList, compareBtn, compareModal, compareContent, compareCloseBtn, compareSelected }) {

  function showSnapshots() {
    const snapshots = getSnapshots();

    if (snapshots.length === 0) {
      hide(snapshotSection);
      return;
    }

    if (snapshots.length >= 2) show(compareBtn);
    else hide(compareBtn);

    snapshotList.innerHTML = '';
    compareSelected.clear();

    snapshots.forEach((snap, i) => {
      const prev = snapshots[i + 1];
      const card = document.createElement('div');
      card.className = 'snapshot-card';
      card.dataset.snapIndex = i;

      const deltaHtml = (current, previous, invertColor) => {
        if (!prev) return '';
        const diff = current - previous;
        if (diff === 0) return '<span class="snapshot-delta neutral">\u00B10</span>';
        const cls = invertColor
          ? (diff > 0 ? 'down' : 'up')
          : (diff > 0 ? 'up' : 'down');
        const sign = diff > 0 ? '+' : '';
        return `<span class="snapshot-delta ${cls}">${sign}${diff}</span>`;
      };

      let changesHtml = '';
      if (prev && snap.followerUsernames && prev.followerUsernames) {
        const prevSet = new Set(prev.followerUsernames);
        const currSet = new Set(snap.followerUsernames);
        const lost = prev.followerUsernames.filter(u => !currSet.has(u));
        const gained = snap.followerUsernames.filter(u => !prevSet.has(u));

        if (lost.length > 0 || gained.length > 0) {
          const lostHtml = lost.length > 0
            ? `<div><span class="change-label-lost">${t('lostFollowers', lost.length)}</span><div class="snapshot-changes-list">${lost.map(u => `${usernameLink(u)}`).join(', ')}</div></div>`
            : '';
          const gainedHtml = gained.length > 0
            ? `<div><span class="change-label-new">${t('newFollowers', gained.length)}</span><div class="snapshot-changes-list">${gained.map(u => `${usernameLink(u)}`).join(', ')}</div></div>`
            : '';
          changesHtml = `<details class="snapshot-changes"><summary>${t('followerChanges')}</summary>${lostHtml}${gainedHtml}</details>`;
        }
      }

      const autoLabel = snap.auto ? ' (auto)' : '';

      card.innerHTML = `
        <div class="snapshot-header">
          <span class="snapshot-date">${formatDate(snap.date)}${autoLabel}</span>
          <div class="snapshot-actions">
            <button class="btn btn-secondary btn-sm snapshot-view" data-index="${i}">${t('snapshotView')}</button>
            <input type="checkbox" class="snapshot-compare-check" data-snap-index="${i}" title="비교 선택">
            <button class="snapshot-delete" data-index="${i}" title="삭제">&times;</button>
          </div>
        </div>
        <div class="snapshot-stats">
          <div class="snapshot-stat">
            <span class="snapshot-stat-label">${t('following')}</span>
            <span class="snapshot-stat-value">${snap.following}</span>
            ${deltaHtml(snap.following, prev?.following, false)}
          </div>
          <div class="snapshot-stat">
            <span class="snapshot-stat-label">${t('followers')}</span>
            <span class="snapshot-stat-value">${snap.followers}</span>
            ${deltaHtml(snap.followers, prev?.followers, false)}
          </div>
          <div class="snapshot-stat">
            <span class="snapshot-stat-label">${t('notFollowing')}</span>
            <span class="snapshot-stat-value">${snap.notFollowingBack}</span>
            ${deltaHtml(snap.notFollowingBack, prev?.notFollowingBack, true)}
          </div>
        </div>
        ${changesHtml}
      `;
      snapshotList.appendChild(card);
    });

    show(snapshotSection);
  }

  // ── Compare checkbox ──
  snapshotList.addEventListener('change', (e) => {
    const check = e.target.closest('.snapshot-compare-check');
    if (!check) return;
    const idx = parseInt(check.dataset.snapIndex, 10);

    if (check.checked) {
      if (compareSelected.size >= 2) {
        const oldest = [...compareSelected][0];
        compareSelected.delete(oldest);
        const oldCheck = snapshotList.querySelector(`.snapshot-compare-check[data-snap-index="${oldest}"]`);
        if (oldCheck) oldCheck.checked = false;
        const oldCard = oldCheck?.closest('.snapshot-card');
        if (oldCard) oldCard.classList.remove('selected-compare');
      }
      compareSelected.add(idx);
      check.closest('.snapshot-card').classList.add('selected-compare');
    } else {
      compareSelected.delete(idx);
      check.closest('.snapshot-card').classList.remove('selected-compare');
    }
  });

  // ── Compare modal ──
  compareBtn.addEventListener('click', () => {
    if (compareSelected.size !== 2) {
      showToast(t('selectTwoSnapshots'));
      return;
    }

    const snapshots = getSnapshots();
    const indices = [...compareSelected].sort((a, b) => b - a);
    const older = snapshots[indices[0]];
    const newer = snapshots[indices[1]];

    let html = '';

    const rows = [
      { label: t('following'), old: older.following, new_: newer.following },
      { label: t('followers'), old: older.followers, new_: newer.followers },
      { label: t('notFollowing'), old: older.notFollowingBack, new_: newer.notFollowingBack }
    ];

    html += '<div class="compare-section">';
    rows.forEach(r => {
      const diff = r.new_ - r.old;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      const cls = diff > 0 ? 'compare-diff-up' : diff < 0 ? 'compare-diff-down' : 'compare-diff-neutral';
      html += `<div class="compare-row"><span class="compare-label">${r.label}</span><div class="compare-values"><span>${r.old}</span><span class="compare-arrow">\u2192</span><span>${r.new_}</span><span class="${cls}">${diffStr}</span></div></div>`;
    });
    html += '</div>';

    if (older.followerUsernames && newer.followerUsernames) {
      const oldSet = new Set(older.followerUsernames);
      const newSet = new Set(newer.followerUsernames);
      const lost = older.followerUsernames.filter(u => !newSet.has(u));
      const gained = newer.followerUsernames.filter(u => !oldSet.has(u));

      if (lost.length > 0) {
        html += `<div class="compare-section"><h4 class="change-label-lost">${t('lostFollowers', lost.length)}</h4><div class="compare-userlist">${lost.map(u => `${usernameLink(u)}`).join(', ')}</div></div>`;
      }
      if (gained.length > 0) {
        html += `<div class="compare-section"><h4 class="change-label-new">${t('newFollowers', gained.length)}</h4><div class="compare-userlist">${gained.map(u => `${usernameLink(u)}`).join(', ')}</div></div>`;
      }
    }

    html += `<div class="compare-export-row"><button class="btn btn-secondary btn-sm compare-export-btn">${t('exportComparison')}</button></div>`;

    compareContent.innerHTML = html;
    show(compareModal);

    const exportBtn = compareContent.querySelector('.compare-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        let text = `Snapshot Comparison\n${'='.repeat(40)}\n`;
        rows.forEach(r => {
          const diff = r.new_ - r.old;
          text += `${r.label}: ${r.old} → ${r.new_} (${diff >= 0 ? '+' : ''}${diff})\n`;
        });
        if (older.followerUsernames && newer.followerUsernames) {
          const oldSet2 = new Set(older.followerUsernames);
          const newSet2 = new Set(newer.followerUsernames);
          const lost2 = older.followerUsernames.filter(u => !newSet2.has(u));
          const gained2 = newer.followerUsernames.filter(u => !oldSet2.has(u));
          if (lost2.length > 0) text += `\nLost (${lost2.length}): ${lost2.join(', ')}\n`;
          if (gained2.length > 0) text += `\nNew (${gained2.length}): ${gained2.join(', ')}\n`;
        }
        navigator.clipboard.writeText(text).then(() => showToast(t('comparisonExported'), 'success'));
      });
    }
  });

  compareCloseBtn.addEventListener('click', () => {
    hide(compareModal);
  });

  // ── Delete / View ──
  snapshotList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.snapshot-delete');
    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index, 10);
      deleteSnapshot(index);
      drawStatsChart();
      showSnapshots();
      return;
    }
  });

  return { showSnapshots };
}

// ── Snapshot View ──

export function buildSnapshotAnalysis(index) {
  const snapshots = getSnapshots();
  const snap = snapshots[index];
  if (!snap || !snap.followerUsernames || !snap.followingUsernames) return null;

  const toUser = (username) => ({
    id: username,
    username,
    full_name: '',
    profile_pic_url: '',
    is_verified: false,
    is_private: false
  });

  const followingUsers = snap.followingUsernames.map(toUser);
  const followerUsers = snap.followerUsernames.map(toUser);

  const followerSet = new Set(snap.followerUsernames);
  const followingSet = new Set(snap.followingUsernames);

  const notFollowingBack = followingUsers.filter(u => !followerSet.has(u.username));
  const mutual = followingUsers.filter(u => followerSet.has(u.username));
  const followerOnly = followerUsers.filter(u => !followingSet.has(u.username));

  return {
    analysisData: { following: followingUsers, followers: followerUsers, notFollowingBack, mutual, followerOnly },
    stats: {
      following: snap.following,
      followers: snap.followers,
      mutual: mutual.length,
      notFollowingBack: notFollowingBack.length,
      followerOnly: followerOnly.length
    }
  };
}
