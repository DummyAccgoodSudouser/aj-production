import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCSjdaDB2X_4QHrIOfstkxPC6X95uVPLaU",
  authDomain: "aj-solution-chat.firebaseapp.com",
  projectId: "aj-solution-chat",
  storageBucket: "aj-solution-chat.firebasestorage.app",
  messagingSenderId: "785402540147",
  appId: "1:785402540147:web:2c0f0c7d28a8a8a3d5fa06",
  measurementId: "G-C1MGRBXJVD",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const NAME_KEY = 'aj_player_name';
let myUid = null;
let authFailed = false;

const authReady = new Promise(resolve => {
  onAuthStateChanged(auth, user => {
    if (user) { myUid = user.uid; resolve(user.uid); }
    else {
      signInAnonymously(auth).catch(err => {
        authFailed = true;
        console.error('Leaderboard: anonymous sign-in failed', err);
        resolve(null);
      });
    }
  });
});

// ---------- injected UI: name modal + toast, no HTML edits needed per game page ----------
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ajlb-modal{ position:fixed; inset:0; z-index:200; background:rgba(10,13,18,0.88);
      display:none; align-items:center; justify-content:center; padding:20px; font-family:'JetBrains Mono',monospace; }
    .ajlb-card{ background:#10141B; border:1px solid #1E2530; border-radius:14px; padding:24px; width:100%; max-width:320px; }
    .ajlb-card h3{ font-size:15px; color:#E7EAF0; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.04em; }
    .ajlb-card p{ font-size:11px; color:#8993A6; margin:0 0 16px; line-height:1.5; }
    .ajlb-card input{ width:100%; box-sizing:border-box; background:#0A0D12; border:1px solid #1E2530; border-radius:8px;
      color:#E7EAF0; font-family:inherit; font-size:14px; padding:10px 12px; margin-bottom:12px; outline:none; }
    .ajlb-card input:focus{ border-color:#5CCFE6; }
    .ajlb-card button{ width:100%; background:#FFB454; color:#0A0D12; border:none; border-radius:8px;
      padding:11px; font-family:inherit; font-weight:700; font-size:12px; letter-spacing:0.05em; text-transform:uppercase; cursor:pointer; }
    .ajlb-toast{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%) translateY(20px);
      background:#10141B; border:1px solid #1E2530; border-radius:10px; padding:11px 18px; z-index:250;
      font-family:'JetBrains Mono',monospace; font-size:12px; color:#E7EAF0; opacity:0; transition:all 0.25s ease; pointer-events:none; }
    .ajlb-toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }
    .ajlb-toast.good{ border-color:#7FD98A; color:#7FD98A; }
    .ajlb-toast.bad{ border-color:#FF8FA3; color:#FF8FA3; }
  `;
  document.head.appendChild(style);
}

function injectModal() {
  const el = document.createElement('div');
  el.className = 'ajlb-modal';
  el.id = 'ajlbModal';
  el.innerHTML = `
    <div class="ajlb-card">
      <h3>New high score!</h3>
      <p>Enter a name to save it to the leaderboard (max 24 characters).</p>
      <input id="ajlbNameInput" type="text" placeholder="Your name" maxlength="24" autocomplete="off">
      <button id="ajlbNameSave">Save score</button>
    </div>`;
  document.body.appendChild(el);
  return el;
}

function injectToast() {
  const el = document.createElement('div');
  el.className = 'ajlb-toast';
  el.id = 'ajlbToast';
  document.body.appendChild(el);
  return el;
}

let modalEl, toastEl;
function ensureUI() {
  if (!document.getElementById('ajlbModal')) { injectStyles(); modalEl = injectModal(); toastEl = injectToast(); }
}

function showToast(msg, kind) {
  ensureUI();
  toastEl.textContent = msg;
  toastEl.className = 'ajlb-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.classList.remove('show'); }, 3200);
}

function askForName() {
  return new Promise(resolve => {
    ensureUI();
    const modal = document.getElementById('ajlbModal');
    const input = document.getElementById('ajlbNameInput');
    const btn = document.getElementById('ajlbNameSave');
    modal.style.display = 'flex';
    input.value = '';
    setTimeout(() => input.focus(), 50);

    function submit() {
      const v = input.value.trim().slice(0, 24);
      if (!v) return;
      modal.style.display = 'none';
      btn.removeEventListener('click', submit);
      input.removeEventListener('keydown', onKey);
      resolve(v);
    }
    function onKey(e) { if (e.key === 'Enter') submit(); }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', onKey);
  });
}

async function getPlayerName() {
  let name = localStorage.getItem(NAME_KEY);
  if (name) return name;
  name = await askForName();
  if (name) localStorage.setItem(NAME_KEY, name);
  return name;
}

async function realSubmit(game, score) {
  if (!Number.isFinite(score) || score <= 0) return;
  try {
    await authReady;
    if (!myUid) {
      showToast(authFailed ? 'Leaderboard offline — could not connect' : 'Leaderboard unavailable', 'bad');
      return;
    }
    const name = await getPlayerName();
    if (!name) return;
    await addDoc(collection(db, 'scores'), {
      game,
      name,
      score: Math.round(score),
      uid: myUid,
      timestamp: serverTimestamp(),
    });
    showToast(`✓ Saved to ${game} leaderboard as ${name}`, 'good');
  } catch (err) {
    console.error('score submit failed', err);
    showToast('Could not save score — check Firestore rules', 'bad');
  }
}

// Flush anything queued before this module finished loading
window.AJSubmitScore = realSubmit;
if (window.__scoreQueue && window.__scoreQueue.length) {
  window.__scoreQueue.forEach(([g, s]) => realSubmit(g, s));
  window.__scoreQueue = [];
}
