// 개인 단어장 시스템
// localStorage 키: 'myNotebook_프로필명'

// 단어장에 항목 추가
function addToNotebook(item) {
  const profile = localStorage.getItem('currentProfile') || '기본';
  const key = 'myNotebook_' + profile;
  const notebook = JSON.parse(localStorage.getItem(key) || '{}');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (!notebook[today]) {
    notebook[today] = [];
  }
  
  // 중복 체크
  const isDuplicate = notebook[today].some(existing => 
    existing.jp === item.jp && existing.type === item.type
  );
  
  if (!isDuplicate) {
    notebook[today].push({
      ...item,
      addedAt: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(notebook));
    return true;
  }
  return false;
}

// 단어장 데이터 가져오기
function getNotebook() {
  const profile = localStorage.getItem('currentProfile') || '기본';
  const key = 'myNotebook_' + profile;
  return JSON.parse(localStorage.getItem(key) || '{}');
}

// 특정 날짜 데이터 가져오기
function getNotebookByDate(date) {
  const notebook = getNotebook();
  return notebook[date] || [];
}

// 항목 삭제
function removeFromNotebook(date, index) {
  const profile = localStorage.getItem('currentProfile') || '기본';
  const key = 'myNotebook_' + profile;
  const notebook = JSON.parse(localStorage.getItem(key) || '{}');
  
  if (notebook[date] && notebook[date][index]) {
    notebook[date].splice(index, 1);
    if (notebook[date].length === 0) {
      delete notebook[date];
    }
    localStorage.setItem(key, JSON.stringify(notebook));
  }
}

// 더블클릭 확인 팝업
function showAddConfirm(item, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'notebook-overlay';
  overlay.innerHTML = `
    <div class="notebook-confirm">
      <p>📒 단어장에 추가할까요?</p>
      <div class="confirm-preview">
        <strong>${item.jp || item.k || item.pt}</strong>
        <span>${item.kr || item.m}</span>
      </div>
      <div class="confirm-buttons">
        <button class="btn-yes">추가</button>
        <button class="btn-no">취소</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  overlay.querySelector('.btn-yes').onclick = () => {
    const added = addToNotebook(item);
    overlay.remove();
    if (added) {
      showToast('📒 단어장에 추가되었습니다!');
    } else {
      showToast('이미 오늘 추가된 항목입니다.');
    }
    if (callback) callback(added);
  };
  
  overlay.querySelector('.btn-no').onclick = () => {
    overlay.remove();
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// 토스트 메시지
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'notebook-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// 단어장 CSS 스타일
const notebookStyles = `
.notebook-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.notebook-confirm {
  background: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  min-width: 280px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.notebook-confirm p {
  font-size: 18px;
  margin-bottom: 16px;
}
.confirm-preview {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.confirm-preview strong {
  display: block;
  font-size: 20px;
  color: #2196F3;
  margin-bottom: 4px;
}
.confirm-preview span {
  color: #666;
}
.confirm-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.confirm-buttons button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-yes {
  background: #2196F3;
  color: white;
}
.btn-yes:hover { background: #1976D2; }
.btn-no {
  background: #e0e0e0;
  color: #333;
}
.btn-no:hover { background: #bdbdbd; }
.notebook-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  z-index: 10000;
  animation: toastIn 0.3s ease;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.notebook-link {
  position: fixed;
  top: 10px;
  right: 60px;
  background: #FF9800;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.notebook-link:hover {
  background: #F57C00;
}
`;

// 스타일 주입
if (!document.getElementById('notebook-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'notebook-styles';
  styleEl.textContent = notebookStyles;
  document.head.appendChild(styleEl);
}
