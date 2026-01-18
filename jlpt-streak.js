// ==================== 스트릭 & 일일목표 시스템 ====================

// 일일 목표 옵션
const DAILY_GOALS = [
  { id: 'easy', name: '가볍게', count: 10 },
  { id: 'normal', name: '보통', count: 20 },
  { id: 'hard', name: '열심히', count: 30 },
  { id: 'extreme', name: '빡세게', count: 50 }
];

// 스트릭 데이터 로드
function loadStreakData() {
  const profile = localStorage.getItem('currentProfile') || '게스트';
  const saved = localStorage.getItem(`jlpt_streak_${profile}`);
  if (saved) return JSON.parse(saved);
  return {
    streak: 0,
    lastStudy: null,
    dailyGoal: 'normal',
    todayCount: 0,
    todayDate: null
  };
}

// 스트릭 데이터 저장
function saveStreakData(data) {
  const profile = localStorage.getItem('currentProfile') || '게스트';
  localStorage.setItem(`jlpt_streak_${profile}`, JSON.stringify(data));
  if (window.autoSaveToCloud) window.autoSaveToCloud();
}

// 오늘 날짜
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// 날짜 차이 계산 (일 단위)
function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff;
}

// 앱 시작 시 스트릭 체크
function checkStreak() {
  const data = loadStreakData();
  const today = getToday();
  
  // 오늘 처음 접속
  if (data.todayDate !== today) {
    const daysSinceLastStudy = data.lastStudy ? getDaysDiff(data.lastStudy, today) : null;
    
    // 3일 이상 미접속 → 강등 알림 반환
    if (daysSinceLastStudy && daysSinceLastStudy >= 3) {
      data.streak = 0;
      data.todayCount = 0;
      data.todayDate = today;
      saveStreakData(data);
      return { demote: true, days: daysSinceLastStudy };
    }
    
    // 하루 넘게 미접속 → 스트릭 리셋
    if (daysSinceLastStudy && daysSinceLastStudy > 1) {
      data.streak = 0;
    }
    
    // 오늘 카운트 리셋
    data.todayCount = 0;
    data.todayDate = today;
    saveStreakData(data);
  }
  
  return { demote: false };
}

// 학습 완료 기록 (알아요 체크 시)
function recordStudy() {
  const data = loadStreakData();
  const today = getToday();
  
  // 오늘 날짜 체크
  if (data.todayDate !== today) {
    data.todayCount = 0;
    data.todayDate = today;
  }
  
  data.todayCount++;
  
  // 일일 목표 달성 체크
  const goal = DAILY_GOALS.find(g => g.id === data.dailyGoal);
  const justCompletedGoal = data.todayCount === goal.count;
  
  // 목표 달성 시 스트릭 업데이트
  if (data.todayCount >= goal.count && data.lastStudy !== today) {
    // 어제 했으면 스트릭 연속
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (data.lastStudy === yesterdayStr || data.streak === 0) {
      data.streak++;
    }
    data.lastStudy = today;
  }
  
  saveStreakData(data);
  
  return {
    todayCount: data.todayCount,
    goalCount: goal.count,
    goalComplete: justCompletedGoal,
    streak: data.streak,
    streak7Bonus: data.streak > 0 && data.streak % 7 === 0 && justCompletedGoal
  };
}

// 일일 목표 변경
function setDailyGoal(goalId) {
  const data = loadStreakData();
  data.dailyGoal = goalId;
  saveStreakData(data);
}

// 현재 목표 정보
function getDailyGoalInfo() {
  const data = loadStreakData();
  const goal = DAILY_GOALS.find(g => g.id === data.dailyGoal) || DAILY_GOALS[1];
  return {
    ...goal,
    todayCount: data.todayCount,
    streak: data.streak,
    complete: data.todayCount >= goal.count
  };
}

// 스트릭 정보
function getStreakInfo() {
  const data = loadStreakData();
  return {
    streak: data.streak,
    lastStudy: data.lastStudy
  };
}

// 전역 노출
window.DAILY_GOALS = DAILY_GOALS;
window.loadStreakData = loadStreakData;
window.saveStreakData = saveStreakData;
window.checkStreak = checkStreak;
window.recordStudy = recordStudy;
window.setDailyGoal = setDailyGoal;
window.getDailyGoalInfo = getDailyGoalInfo;
window.getStreakInfo = getStreakInfo;
