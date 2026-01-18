// Firebase 동기화 모듈 (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAgphZ8FIOMY6vMhcUbg8ZvqkpxxZ_untI",
  authDomain: "jp-tutor-7a967.firebaseapp.com",
  projectId: "jp-tutor-7a967",
  storageBucket: "jp-tutor-7a967.firebasestorage.app",
  messagingSenderId: "937449734884",
  appId: "1:937449734884:web:7827046017d4496363a2f1"
};

// Firebase 초기화
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

// 전역 변수
let firebaseUser = null;
let syncStatus = 'synced';
let saveTimeout = null;

// 상태 가져오기
export function getFirebaseUser() { return firebaseUser; }
export function getSyncStatus() { return syncStatus; }

// 로그인
export async function handleLogin(onSuccess) {
  try {
    const result = await signInWithPopup(auth, provider);
    firebaseUser = result.user;
    await downloadFromCloud();
    if (onSuccess) onSuccess();
    return firebaseUser;
  } catch (error) {
    console.error('로그인 실패:', error);
    alert('로그인에 실패했습니다.');
    throw error;
  }
}

// 로그아웃
export async function handleLogout(onSuccess) {
  try {
    await signOut(auth);
    firebaseUser = null;
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
}

// 클라우드에 저장
export async function uploadToCloud(onStatusChange) {
  if (!firebaseUser) return;
  
  syncStatus = 'syncing';
  if (onStatusChange) onStatusChange(syncStatus);
  
  try {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allData[key] = localStorage.getItem(key);
    }
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      data: allData,
      updatedAt: new Date().toISOString()
    });
    
    syncStatus = 'synced';
  } catch (error) {
    console.error('업로드 실패:', error);
    syncStatus = 'synced';
  }
  if (onStatusChange) onStatusChange(syncStatus);
}

// 클라우드에서 불러오기
export async function downloadFromCloud() {
  if (!firebaseUser) return;
  
  syncStatus = 'syncing';
  
  try {
    const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      for (const [key, value] of Object.entries(cloudData)) {
        localStorage.setItem(key, value);
      }
      location.reload();
    }
    syncStatus = 'synced';
  } catch (error) {
    console.error('다운로드 실패:', error);
    syncStatus = 'synced';
  }
}

// 자동 저장 (디바운스)
export function autoSaveToCloud(onStatusChange) {
  if (!firebaseUser) return;
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    uploadToCloud(onStatusChange);
  }, 3000);
}

// 지금 동기화
export async function syncNow(onStatusChange) {
  await uploadToCloud(onStatusChange);
  alert('동기화 완료!');
}

// 인증 상태 감지
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    firebaseUser = user;
    callback(user);
  });
}

// 로그인 버튼 HTML
export function getLoginButtonHtml() {
  return `
    <button class="login-btn" onclick="window.firebaseLogin()">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="16" height="16">
      로그인
    </button>
  `;
}

// 사용자 정보 HTML
export function getUserInfoHtml(user, status) {
  return `
    <div class="dropdown">
      <button class="user-info" onclick="window.toggleUserMenu()" style="background:none;border:none;cursor:pointer;">
        <img src="${user.photoURL || ''}" class="user-avatar" onerror="this.style.display='none'">
        <span class="user-name">${user.displayName || '사용자'}</span>
        <span class="sync-status ${status}">${status === 'synced' ? '✓' : '⟳'}</span>
      </button>
      <div class="dropdown-menu" id="userDropdown">
        <div class="dropdown-item" onclick="window.firebaseSyncNow()">🔄 지금 동기화</div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" onclick="window.firebaseLogout()">🚪 로그아웃</div>
      </div>
    </div>
  `;
}

// 공통 CSS
export const firebaseCss = `
  .login-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; background: white; border: 1px solid #ddd; border-radius: 0.5rem; cursor: pointer; font-size: 0.8rem; }
  .login-btn:hover { background: #f3f4f6; }
  .user-info { display: flex; align-items: center; gap: 0.5rem; }
  .user-avatar { width: 1.75rem; height: 1.75rem; border-radius: 50%; }
  .user-name { font-size: 0.75rem; color: white; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sync-status { font-size: 0.6rem; padding: 0.15rem 0.4rem; border-radius: 0.25rem; background: rgba(255,255,255,0.2); }
  .sync-status.synced { background: rgba(34,197,94,0.3); }
  .sync-status.syncing { background: rgba(234,179,8,0.3); }
  .dropdown { position: relative; }
  .dropdown-menu { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 140px; z-index: 100; display: none; margin-top: 0.5rem; }
  .dropdown-menu.show { display: block; }
  .dropdown-item { padding: 0.6rem 1rem; cursor: pointer; font-size: 0.85rem; color: #374151; }
  .dropdown-item:hover { background: #f3f4f6; }
  .dropdown-divider { border-top: 1px solid #e5e7eb; margin: 0.25rem 0; }
`;
