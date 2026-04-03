// ── Snapshot UI Module ──

import { t } from './i18n.js';
import { getSnapshots, deleteSnapshot } from '../storage/snapshot.js';
import { show, hide, showToast, formatDate } from './ui.js';
import { drawStatsChart } from './chart.js';
import { buildChangesDOM } from './change-entry.js';

export function initSnapshotUI({ snapshotSection, snapshotList, compareBtn, compareModal, compareContent, compareCloseBtn, compareSelected, getState }) {

  function showSnapshots() {
    const snapshots = getSnapshots();

    if (snapshots.length === 0) {
      hide(snapshotSection);
      return;
    }

    if (snapshots.length >= 2) show(compareBtn);
    else hide(compareBtn);

    snapshotList.textContent = '';
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

      // Build changes using shared module (ID-based when available)
      let changesEl = null;
      if (prev && snap.followerUsernames && prev.followerUsernames) {
        const prevIdMap = prev.followerIdMap ? new Map(Object.entries(prev.followerIdMap)) : null;
        const currIdMap = snap.followerIdMap ? new Map(Object.entries(snap.followerIdMap)) : null;

        let gained = [], lost = [], renamed = [];

        if (prevIdMap && currIdMap) {
          const prevIds = new Set(prevIdMap.keys());
          const currIds = new Set(currIdMap.keys());
          for (const [id, username] of currIdMap) {
            if (!prevIds.has(id)) gained.push({ username, userId: id });
            else if (prevIdMap.get(id) !== username) renamed.push({ oldUsername: prevIdMap.get(id), newUsername: username, userId: id });
          }
          for (const [id, username] of prevIdMap) {
            if (!currIds.has(id)) lost.push({ username, userId: id });
          }
        } else {
          const prevSet = new Set(prev.followerUsernames);
          const currSet = new Set(snap.followerUsernames);
          prev.followerUsernames.filter(u => !currSet.has(u)).forEach(u => lost.push({ username: u, userId: null }));
          snap.followerUsernames.filter(u => !prevSet.has(u)).forEach(u => gained.push({ username: u, userId: null }));
        }

        // resolveUserId: lazy lookup from analysis data + all snapshot idMaps
        const resolveUserId = (username) => {
          // 1. Try current analysis data
          const data = getState?.()?.analysisData;
          if (data) {
            const all = [...(data.followers || []), ...(data.following || [])];
            const found = all.find(u => u.username === username);
            if (found) return found.id;
          }
          // 2. Try all snapshots' idMaps (reverse lookup: find id by username)
          for (const s of snapshots) {
            if (s.followerIdMap) {
              for (const [id, uname] of Object.entries(s.followerIdMap)) {
                if (uname === username) return id;
              }
            }
            if (s.followingIdMap) {
              for (const [id, uname] of Object.entries(s.followingIdMap)) {
                if (uname === username) return id;
              }
            }
          }
          return null;
        };

        changesEl = buildChangesDOM({ gained, lost, renamed, resolveUserId });
      }

      const autoLabel = snap.auto ? ' (auto)' : '';

      // Build card using DOM API
      const header = document.createElement('div');
      header.className = 'snapshot-header';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'snapshot-date';
      dateSpan.textContent = `${formatDate(snap.date)}${autoLabel}`;
      const actions = document.createElement('div');
      actions.className = 'snapshot-actions';
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-secondary btn-sm snapshot-view';
      viewBtn.dataset.index = i;
      viewBtn.textContent = t('snapshotView');
      const compareCheck = document.createElement('input');
      compareCheck.type = 'checkbox';
      compareCheck.className = 'snapshot-compare-check';
      compareCheck.dataset.snapIndex = i;
      compareCheck.title = '비교 선택';
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'snapshot-delete';
      deleteBtn.dataset.index = i;
      deleteBtn.title = '삭제';
      deleteBtn.textContent = '\u00D7';
      actions.appendChild(viewBtn);
      actions.appendChild(compareCheck);
      actions.appendChild(deleteBtn);
      header.appendChild(dateSpan);
      header.appendChild(actions);
      card.appendChild(header);

      const stats = document.createElement('div');
      stats.className = 'snapshot-stats';
      const statItems = [
        { label: t('following'), value: snap.following, prev: prev?.following, invert: false },
        { label: t('followers'), value: snap.followers, prev: prev?.followers, invert: false },
        { label: t('notFollowing'), value: snap.notFollowingBack, prev: prev?.notFollowingBack, invert: true }
      ];
      statItems.forEach(s => {
        const stat = document.createElement('div');
        stat.className = 'snapshot-stat';
        const lbl = document.createElement('span');
        lbl.className = 'snapshot-stat-label';
        lbl.textContent = s.label;
        const val = document.createElement('span');
        val.className = 'snapshot-stat-value';
        val.textContent = s.value;
        stat.appendChild(lbl);
        stat.appendChild(val);
        if (prev && s.prev !== undefined) {
          const diff = s.value - s.prev;
          const delta = document.createElement('span');
          if (diff === 0) { delta.className = 'snapshot-delta neutral'; delta.textContent = '\u00B10'; }
          else {
            const cls = s.invert ? (diff > 0 ? 'down' : 'up') : (diff > 0 ? 'up' : 'down');
            delta.className = `snapshot-delta ${cls}`;
            delta.textContent = `${diff > 0 ? '+' : ''}${diff}`;
          }
          stat.appendChild(delta);
        }
        stats.appendChild(stat);
      });
      card.appendChild(stats);

      if (changesEl) card.appendChild(changesEl);

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
