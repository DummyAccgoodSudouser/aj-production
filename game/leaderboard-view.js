import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, query, where, orderBy, limit, onSnapshot
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
const db = getFirestore(app);

const GAMES = [
  { id: 'snake', label: 'Snake' },
  { id: 'tetris', label: 'Tetris' },
  { id: 'dino', label: 'Dino Jump' },
  { id: 'pacman', label: 'Pac-Man' },
  { id: 'car', label: 'Traffic Racer' },
  { id: 'dungeon', label: 'Dungeon Crawl' },
  { id: 'breakout', label: 'Breakout' },
  { id: '2048', label: '2048' },
  { id: 'memory', label: 'Memory Match' },
];

const tabsEl = document.getElementById('tabs');
const boardEl = document.getElementById('board');
let active = GAMES[0].id;
let unsub = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTabs() {
  tabsEl.innerHTML = GAMES.map(g =>
    `<button class="tab ${g.id === active ? 'active' : ''}" data-id="${g.id}">${g.label}</button>`
  ).join('');
  tabsEl.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      active = btn.dataset.id;
      renderTabs();
      listen();
    });
  });
}

function listen() {
  if (unsub) unsub();
  boardEl.innerHTML = '<div class="empty">Loading…</div>';
  const q = query(
    collection(db, 'scores'),
    where('game', '==', active),
    orderBy('score', 'desc'),
    limit(10)
  );
  unsub = onSnapshot(q, snap => {
    if (snap.empty) {
      boardEl.innerHTML = '<div class="empty">No scores yet — be the first to play.</div>';
      return;
    }
    boardEl.innerHTML = snap.docs.map((doc, i) => {
      const d = doc.data();
      return `<div class="row">
        <div class="rank">${i + 1}</div>
        <div class="rname">${escapeHtml(d.name || 'Anonymous')}</div>
        <div class="rscore">${d.score}</div>
      </div>`;
    }).join('');
  }, err => {
    boardEl.innerHTML = '<div class="empty">Could not load rankings.</div>';
    console.error(err);
  });
}

renderTabs();
listen();
