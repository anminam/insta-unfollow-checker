// ── Safety Score Module (FR-01) ──
// 24시간 내 언팔 수/속도 기반 계정 안전 점수 계산

import { getUnfollowHistory } from '../storage/history.js';
import { t } from './i18n.js';

const HOUR_24 = 24 * 60 * 60 * 1000;
const HOUR_1 = 60 * 60 * 1000;

// Instagram의 알려진 제재 기준 (보수적 추정)
const THRESHOLDS = {
  daily: 60,       // 24시간 내 60건 이상 → 위험
  hourly: 20,      // 1시간 내 20건 이상 → 위험
  dailyWarn: 30,   // 24시간 내 30건 이상 → 경고
  hourlyWarn: 10   // 1시간 내 10건 이상 → 경고
};

/**
 * 24시간/1시간 내 언팔 수 계산
 * @returns {{ daily: number, hourly: number, recentHistory: Array }}
 */
export function getRecentUnfollowStats() {
  const history = getUnfollowHistory();
  const now = Date.now();
  let daily = 0;
  let hourly = 0;

  for (const [, entry] of Object.entries(history)) {
    const diff = now - new Date(entry.date).getTime();
    if (diff <= HOUR_24) daily++;
    if (diff <= HOUR_1) hourly++;
  }

  return { daily, hourly };
}

/**
 * 안전 점수 계산 (0~100, 높을수록 안전)
 * @returns {{ score: number, level: 'safe'|'caution'|'warning'|'danger', daily: number, hourly: number }}
 */
export function calculateSafetyScore() {
  const { daily, hourly } = getRecentUnfollowStats();

  // 각 지표별 위험도 (0~1, 높을수록 위험)
  const dailyRisk = Math.min(daily / THRESHOLDS.daily, 1);
  const hourlyRisk = Math.min(hourly / THRESHOLDS.hourly, 1);

  // 종합 위험도 (hourly 가중치 더 높음)
  const risk = Math.min(dailyRisk * 0.4 + hourlyRisk * 0.6, 1);
  const score = Math.round((1 - risk) * 100);

  let level;
  if (score >= 80) level = 'safe';
  else if (score >= 50) level = 'caution';
  else if (score >= 25) level = 'warning';
  else level = 'danger';

  return { score, level, daily, hourly };
}

/**
 * 안전 점수 게이지 HTML 생성
 * @returns {string}
 */
export function renderSafetyGauge() {
  const { score, level, daily, hourly } = calculateSafetyScore();

  const levelColors = {
    safe: 'var(--color-up)',
    caution: '#f59e0b',
    warning: '#f97316',
    danger: 'var(--color-danger)'
  };

  const color = levelColors[level];
  const angle = (score / 100) * 180;

  return `
    <div class="safety-gauge" data-level="${level}">
      <div class="safety-gauge-header">
        <span class="safety-gauge-icon">${level === 'safe' ? '🛡️' : level === 'caution' ? '⚠️' : '🚨'}</span>
        <span class="safety-gauge-title">${t('safetyScore')}</span>
      </div>
      <div class="safety-gauge-meter">
        <svg viewBox="0 0 120 70" class="safety-gauge-svg">
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="var(--border-color)" stroke-width="8" stroke-linecap="round"/>
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${(angle / 180) * 157} 157"/>
        </svg>
        <div class="safety-gauge-value" style="color:${color}">${score}</div>
      </div>
      <div class="safety-gauge-label" style="color:${color}">${t('safetyLevel_' + level)}</div>
      <div class="safety-gauge-stats">
        <span>${t('safetyDaily', daily, THRESHOLDS.daily)}</span>
        <span>${t('safetyHourly', hourly, THRESHOLDS.hourly)}</span>
      </div>
    </div>
  `;
}

/**
 * 언팔 실행 전 안전 체크
 * @param {number} plannedCount - 예정된 언팔 수
 * @returns {{ safe: boolean, message: string|null }}
 */
export function checkSafetyBeforeUnfollow(plannedCount) {
  const { daily, hourly } = getRecentUnfollowStats();

  if (daily + plannedCount > THRESHOLDS.daily) {
    return { safe: false, message: t('safetyDailyExceed', THRESHOLDS.daily - daily) };
  }
  if (hourly + plannedCount > THRESHOLDS.hourly) {
    return { safe: false, message: t('safetyHourlyExceed', THRESHOLDS.hourly - hourly) };
  }
  if (daily + plannedCount > THRESHOLDS.dailyWarn) {
    return { safe: true, message: t('safetyDailyWarn') };
  }

  return { safe: true, message: null };
}
