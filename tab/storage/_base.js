// ── Storage Base Utilities ──

/**
 * @param {string} key
 * @param {*} [fallback=null]
 * @returns {*}
 */
export function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {*} value
 */
export function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * @param {string} key
 * @param {*} [fallback=null]
 * @returns {*}
 */
export function getSessionJSON(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {*} value
 */
export function setSessionJSON(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Get a daily-resetting counter.
 * @param {string} countKey
 * @param {string} dateKey
 * @returns {number}
 */
export function getDailyCount(countKey, dateKey) {
  const savedDate = localStorage.getItem(dateKey);
  const today = new Date().toDateString();
  if (savedDate !== today) {
    localStorage.setItem(dateKey, today);
    localStorage.setItem(countKey, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(countKey), 10) || 0;
}

/**
 * Increment a daily-resetting counter.
 * @param {string} countKey
 * @param {string} dateKey
 * @returns {number} new count
 */
export function incrementDailyCount(countKey, dateKey) {
  const today = new Date().toDateString();
  localStorage.setItem(dateKey, today);
  const count = getDailyCount(countKey, dateKey) + 1;
  localStorage.setItem(countKey, String(count));
  return count;
}
