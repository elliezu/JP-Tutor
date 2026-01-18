// ==================== JLPT XP/레벨/계급 시스템 ====================

// 계급 정의
const RANKS = [
  { name: '見習い', icon: '🌱', minLv: 1, maxLv: 5 },
  { name: '初心者', icon: '🌿', minLv: 6, maxLv: 10 },
  { name: '中級者', icon: '🌳', minLv: 11, maxLv: 15 },
  { name: '上級者', icon: '🔥', minLv: 16, maxLv: 20 },
  { name: '達人', icon: '⭐', minLv: 21, maxLv: 25 },
  { name: '名人', icon: '👑', minLv: 26, maxLv: 30 }
];

// 레벨별 필요 XP (누적)
const LEVEL_XP = [
  0,      // Lv.1
  100,    // Lv.2
  250,    // Lv.3
  450,    // Lv.4
  700,    // Lv.5
  1000,   // Lv.6
  1350,   // Lv.7
  1750,   // Lv.8
  2200,   // Lv.9
  2700,   // Lv.10
  3250,   // Lv.11
  3850,   // Lv.12
  4500,   // Lv.13
  5200,   // Lv.14
  5950,   // Lv.15
  6750,   // Lv.16
  7600,   // Lv.17
  8500,   // Lv.18
  9450,   // Lv.19
  10450,  // Lv.20
  11500,  // Lv.21
  12600,  // Lv.22
  13750,  // Lv.23
  14950,  // Lv.24
  16200,  // Lv.25
  17500,  // Lv.26
  18850,  // Lv.27
  20250,  // Lv.28
  21700,  // Lv.29
  23200   // Lv.30
];

// XP 보상
const XP_REWARDS = {
  correct: 10,       // 알아요 퀴즈 정답
  review: 15,        // 복습 테스트 정답
  notebook: 10,      // 단어장 퀴즈 정답
  dailyGoal: 50,     // 일일 목표 달성
  streak7: 100       // 7일 연속 보너스
};

// XP 데이터 로드
function loadXpData(level) {
  const key = `jlpt_${level}_xp`;
  const profile = localStorage.getItem('currentProfile') || '게스트';
  const saved = localStorage.getItem(`${key}_${profile}`);
  if (saved) return JSON.parse(saved);
  return { xp: 0, level: 1 };
}

// XP 데이터 저장
function saveXpData(level, data) {
  const key = `jlpt_${level}_xp`;
  const profile = localStorage.getItem('currentProfile') || '게스트';
  localStorage.setItem(`${key}_${profile}`, JSON.stringify(data));
  if (window.autoSaveToCloud) window.autoSaveToCloud();
}

// XP 추가 & 레벨업 체크
function addXp(level, amount) {
  const data = loadXpData(level);
  data.xp += amount;
  
  // 레벨업 체크
  let leveledUp = false;
  while (data.level < 30 && data.xp >= LEVEL_XP[data.level]) {
    data.level++;
    leveledUp = true;
  }
  
  saveXpData(level, data);
  return { ...data, leveledUp };
}

// 레벨 강등 (3일 미접속)
function demoteLevel(level) {
  const data = loadXpData(level);
  if (data.level > 1) {
    data.level--;
    // XP는 강등된 레벨의 시작점으로
    data.xp = LEVEL_XP[data.level - 1];
    saveXpData(level, data);
  }
  return data;
}

// 현재 레벨로 계급 가져오기
function getRank(lv) {
  return RANKS.find(r => lv >= r.minLv && lv <= r.maxLv) || RANKS[0];
}

// 다음 레벨까지 필요 XP
function getXpToNextLevel(data) {
  if (data.level >= 30) return 0;
  return LEVEL_XP[data.level] - data.xp;
}

// 현재 레벨 진행률 (%)
function getLevelProgress(data) {
  if (data.level >= 30) return 100;
  const prevXp = data.level > 1 ? LEVEL_XP[data.level - 1] : 0;
  const nextXp = LEVEL_XP[data.level];
  const current = data.xp - prevXp;
  const needed = nextXp - prevXp;
  return Math.floor((current / needed) * 100);
}

// 복습 상태 관리
const REVIEW_STAGES = {
  0: 1,   // 처음 → 1일 후
  1: 3,   // 1차 통과 → 3일 후
  2: 7,   // 2차 통과 → 7일 후
  3: null // 마스터
};

function loadReviewData(level) {
  const key = `jlpt_${level}_review`;
  const profile = localStorage.getItem('currentProfile') || '게스트';
  const saved = localStorage.getItem(`${key}_${profile}`);
  if (saved) return JSON.parse(saved);
  return {}; // { cardId: { stage: 0, nextReview: '2025-01-20' } }
}

function saveReviewData(level, data) {
  const key = `jlpt_${level}_review`;
  const profile = localStorage.getItem('currentProfile') || '게스트';
  localStorage.setItem(`${key}_${profile}`, JSON.stringify(data));
}

// 알아요 체크 (퀴즈 통과 시)
function markKnown(level, type, cardId) {
  const review = loadReviewData(level);
  const today = new Date().toISOString().split('T')[0];
  
  if (!review[`${type}_${cardId}`]) {
    // 첫 알아요
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    review[`${type}_${cardId}`] = {
      stage: 0,
      nextReview: nextDate.toISOString().split('T')[0]
    };
  }
  
  saveReviewData(level, review);
}

// 복습 통과 시 다음 단계로
function passReview(level, type, cardId) {
  const review = loadReviewData(level);
  const key = `${type}_${cardId}`;
  
  if (review[key]) {
    review[key].stage++;
    const days = REVIEW_STAGES[review[key].stage];
    
    if (days === null) {
      // 마스터 달성
      review[key].mastered = true;
      review[key].nextReview = null;
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);
      review[key].nextReview = nextDate.toISOString().split('T')[0];
    }
    saveReviewData(level, review);
  }
}

// 복습 실패 시 단계 다운
function failReview(level, type, cardId) {
  const review = loadReviewData(level);
  const key = `${type}_${cardId}`;
  
  if (review[key] && review[key].stage > 0) {
    review[key].stage--;
    const days = REVIEW_STAGES[review[key].stage];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    review[key].nextReview = nextDate.toISOString().split('T')[0];
    saveReviewData(level, review);
  }
}

// 오늘 복습할 카드 목록
function getTodayReviews(level) {
  const review = loadReviewData(level);
  const today = new Date().toISOString().split('T')[0];
  
  return Object.entries(review)
    .filter(([key, val]) => val.nextReview && val.nextReview <= today && !val.mastered)
    .map(([key, val]) => {
      const [type, id] = key.split('_');
      return { type, id: parseInt(id), stage: val.stage };
    });
}

// 알아요 체크된 카드 수
function getKnownCount(level, type) {
  const review = loadReviewData(level);
  return Object.keys(review).filter(k => k.startsWith(`${type}_`)).length;
}

// 마스터된 카드 수
function getMasteredCount(level, type) {
  const review = loadReviewData(level);
  return Object.entries(review)
    .filter(([k, v]) => k.startsWith(`${type}_`) && v.mastered)
    .length;
}

// 전역 노출
window.RANKS = RANKS;
window.LEVEL_XP = LEVEL_XP;
window.XP_REWARDS = XP_REWARDS;
window.loadXpData = loadXpData;
window.saveXpData = saveXpData;
window.addXp = addXp;
window.demoteLevel = demoteLevel;
window.getRank = getRank;
window.getXpToNextLevel = getXpToNextLevel;
window.getLevelProgress = getLevelProgress;
window.loadReviewData = loadReviewData;
window.saveReviewData = saveReviewData;
window.markKnown = markKnown;
window.passReview = passReview;
window.failReview = failReview;
window.getTodayReviews = getTodayReviews;
window.getKnownCount = getKnownCount;
window.getMasteredCount = getMasteredCount;
