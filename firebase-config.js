// Firebase 설정 및 인증/동기화 모듈
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAgphZ8FIOMY6vMhcUbg8ZvqkpxxZ_untI",
  authDomain: "jp-tutor-7a967.firebaseapp.com",
  projectId: "jp-tutor-7a967",
  storageBucket: "jp-tutor-7a967.firebasestorage.app",
  messagingSenderId: "937449734884",
  appId: "1:937449734884:web:7827046017d4496363a2f1",
  measurementId: "G-SSDWWYX5FR"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 현재 사용자 상태
let currentUser = null;
let unsubscribeSnapshot = null;

// ========== 인증 함수 ==========

// Google 로그인
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
}

// 로그아웃
async function logout() {
  try {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
}

// 인증 상태 감지
function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

// ========== 데이터 동기화 함수 ==========

// 사용자 데이터 저장 (Firestore)
async function saveUserData(dataType, data) {
  if (!currentUser) return false;
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, 'data', dataType);
    await setDoc(docRef, {
      data: data,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    return false;
  }
}

// 사용자 데이터 불러오기 (Firestore)
async function loadUserData(dataType) {
  if (!currentUser) return null;
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, 'data', dataType);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return null;
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    return null;
  }
}

// 실시간 동기화 리스너
function subscribeToData(dataType, callback) {
  if (!currentUser) return null;
  
  const docRef = doc(db, 'users', currentUser.uid, 'data', dataType);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data);
    }
  });
}

// ========== 로컬 ↔ 클라우드 동기화 ==========

// 로컬 데이터를 클라우드로 업로드
async function uploadLocalToCloud(localStorageKeys) {
  if (!currentUser) return;
  
  for (const key of localStorageKeys) {
    const localData = localStorage.getItem(key);
    if (localData) {
      await saveUserData(key, JSON.parse(localData));
    }
  }
}

// 클라우드 데이터를 로컬로 다운로드
async function downloadCloudToLocal(localStorageKeys) {
  if (!currentUser) return;
  
  for (const key of localStorageKeys) {
    const cloudData = await loadUserData(key);
    if (cloudData) {
      localStorage.setItem(key, JSON.stringify(cloudData));
    }
  }
}

// 데이터 병합 (로컬 + 클라우드)
async function mergeData(key, mergeStrategy = 'cloud') {
  if (!currentUser) return null;
  
  const localData = localStorage.getItem(key);
  const cloudData = await loadUserData(key);
  
  if (!localData && !cloudData) return null;
  if (!localData) return cloudData;
  if (!cloudData) return JSON.parse(localData);
  
  // 기본: 클라우드 우선
  if (mergeStrategy === 'cloud') {
    return cloudData;
  }
  // 로컬 우선
  if (mergeStrategy === 'local') {
    return JSON.parse(localData);
  }
  // 최신 데이터 우선 (updatedAt 비교 필요)
  return cloudData;
}

// ========== Export ==========
export {
  auth,
  db,
  currentUser,
  loginWithGoogle,
  logout,
  onAuthChange,
  saveUserData,
  loadUserData,
  subscribeToData,
  uploadLocalToCloud,
  downloadCloudToLocal,
  mergeData
};
