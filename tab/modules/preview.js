// ── Profile Mini Preview Module (FR-02) ──
// hover 시 프로필 bio/팔로워수/최근 게시물 팝업

import { t } from './i18n.js';
import { escapeHtml, loadImageAsBlob, FALLBACK_AVATAR } from './ui.js';

const PREVIEW_DELAY = 400;
const PREVIEW_CACHE_TTL = 5 * 60 * 1000; // 5분

// 프로필 데이터 캐시
const profileCache = new Map();

let activePopover = null;
let hoverTimer = null;
let currentTarget = null;

/**
 * Instagram 프로필 정보 fetch
 */
async function fetchProfileInfo(username) {
  const cached = profileCache.get(username);
  if (cached && Date.now() - cached.timestamp < PREVIEW_CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
    headers: {
      'x-ig-app-id': '936619743392459',
      'x-requested-with': 'XMLHttpRequest'
    },
    credentials: 'include'
  });

  if (!response.ok) return null;

  const json = await response.json();
  const user = json?.data?.user;
  if (!user) return null;

  const data = {
    biography: user.biography || '',
    followerCount: user.edge_followed_by?.count ?? 0,
    followingCount: user.edge_follow?.count ?? 0,
    postCount: user.edge_owner_to_timeline_media?.count ?? 0,
    profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
    fullName: user.full_name || '',
    isVerified: user.is_verified || false,
    isPrivate: user.is_private || false,
    recentPosts: (user.edge_owner_to_timeline_media?.edges || []).slice(0, 3).map(edge => ({
      thumbnailUrl: edge.node.thumbnail_src || edge.node.display_url,
      isVideo: edge.node.is_video
    }))
  };

  profileCache.set(username, { data, timestamp: Date.now() });
  return data;
}

/**
 * 숫자 포맷 (1.2K, 3.4M)
 */
function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/**
 * popover DOM 생성 (safe DOM API)
 */
function createPopover(username, data) {
  const popover = document.createElement('div');
  popover.className = 'profile-preview-popover';

  // Header
  const header = document.createElement('div');
  header.className = 'preview-header';

  const avatar = document.createElement('img');
  avatar.className = 'preview-avatar';
  avatar.src = FALLBACK_AVATAR;
  avatar.dataset.src = data.profilePicUrl;
  avatar.alt = username;

  const headerInfo = document.createElement('div');
  headerInfo.className = 'preview-header-info';

  const usernameDiv = document.createElement('div');
  usernameDiv.className = 'preview-username';
  usernameDiv.textContent = username;
  if (data.isVerified) {
    const vSpan = document.createElement('span');
    vSpan.className = 'preview-verified';
    vSpan.textContent = '\u2713';
    usernameDiv.appendChild(vSpan);
  }
  if (data.isPrivate) {
    const pSpan = document.createElement('span');
    pSpan.className = 'preview-private';
    pSpan.textContent = t('privateAccount');
    usernameDiv.appendChild(pSpan);
  }

  const fullnameDiv = document.createElement('div');
  fullnameDiv.className = 'preview-fullname';
  fullnameDiv.textContent = data.fullName;

  headerInfo.appendChild(usernameDiv);
  headerInfo.appendChild(fullnameDiv);
  header.appendChild(avatar);
  header.appendChild(headerInfo);
  popover.appendChild(header);

  // Stats
  const statsDiv = document.createElement('div');
  statsDiv.className = 'preview-stats';

  const statsData = [
    { value: data.postCount, label: t('previewPosts') },
    { value: data.followerCount, label: t('followers') },
    { value: data.followingCount, label: t('following') }
  ];

  statsData.forEach(({ value, label }) => {
    const stat = document.createElement('div');
    stat.className = 'preview-stat';
    const valSpan = document.createElement('span');
    valSpan.className = 'preview-stat-value';
    valSpan.textContent = formatCount(value);
    const lblSpan = document.createElement('span');
    lblSpan.className = 'preview-stat-label';
    lblSpan.textContent = label;
    stat.appendChild(valSpan);
    stat.appendChild(lblSpan);
    statsDiv.appendChild(stat);
  });
  popover.appendChild(statsDiv);

  // Bio
  if (data.biography) {
    const bioDiv = document.createElement('div');
    bioDiv.className = 'preview-bio';
    bioDiv.textContent = data.biography;
    popover.appendChild(bioDiv);
  }

  // Recent posts
  if (data.recentPosts.length > 0 && !data.isPrivate) {
    const postsDiv = document.createElement('div');
    postsDiv.className = 'preview-posts';

    data.recentPosts.forEach(p => {
      const thumb = document.createElement('div');
      thumb.className = 'preview-post-thumb';
      const img = document.createElement('img');
      img.src = FALLBACK_AVATAR;
      img.dataset.src = p.thumbnailUrl;
      img.alt = '';
      thumb.appendChild(img);
      if (p.isVideo) {
        const icon = document.createElement('span');
        icon.className = 'preview-video-icon';
        icon.textContent = '\u25B6';
        thumb.appendChild(icon);
      }
      postsDiv.appendChild(thumb);
    });
    popover.appendChild(postsDiv);
  }

  return popover;
}

/**
 * popover 위치 계산 및 표시
 */
function showPopover(popover, anchorEl) {
  document.body.appendChild(popover);
  activePopover = popover;

  const rect = anchorEl.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();

  let top = rect.bottom + 8;
  let left = rect.left;

  // 화면 밖으로 나가지 않도록 보정
  if (top + popoverRect.height > window.innerHeight - 16) {
    top = rect.top - popoverRect.height - 8;
  }
  if (left + popoverRect.width > window.innerWidth - 16) {
    left = window.innerWidth - popoverRect.width - 16;
  }
  if (left < 16) left = 16;

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;

  // lazy load images
  popover.querySelectorAll('img[data-src]').forEach(img => {
    const src = img.dataset.src;
    if (src) {
      loadImageAsBlob(src).then(blobUrl => {
        img.src = blobUrl;
      }).catch(() => {});
      delete img.dataset.src;
    }
  });

  requestAnimationFrame(() => popover.classList.add('visible'));
}

function dismissPopover() {
  if (activePopover) {
    activePopover.classList.remove('visible');
    setTimeout(() => {
      activePopover?.remove();
      activePopover = null;
    }, 150);
  }
  clearTimeout(hoverTimer);
  currentTarget = null;
}

/**
 * 프로필 프리뷰 시스템 초기화
 * @param {HTMLElement} userListEl - 유저 리스트 컨테이너
 */
export function initProfilePreview(userListEl) {
  userListEl.addEventListener('mouseenter', (e) => {
    const link = e.target.closest('.username-link');
    if (!link) return;

    const card = link.closest('.user-card');
    if (!card) return;

    const username = link.textContent.trim();
    if (!username) return;

    currentTarget = link;
    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(async () => {
      if (currentTarget !== link) return;

      try {
        const data = await fetchProfileInfo(username);
        if (!data || currentTarget !== link) return;

        dismissPopover();
        const popover = createPopover(username, data);
        showPopover(popover, link);

        // popover에 마우스를 올리면 유지
        popover.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
        });
        popover.addEventListener('mouseleave', () => {
          dismissPopover();
        });
      } catch {
        // API 실패 시 조용히 무시
      }
    }, PREVIEW_DELAY);
  }, true);

  userListEl.addEventListener('mouseleave', (e) => {
    const link = e.target.closest('.username-link');
    if (!link) return;

    hoverTimer = setTimeout(() => {
      if (activePopover && !activePopover.matches(':hover')) {
        dismissPopover();
      }
    }, 200);
  }, true);

  // 스크롤 시 popover 닫기
  userListEl.addEventListener('scroll', dismissPopover);
}
