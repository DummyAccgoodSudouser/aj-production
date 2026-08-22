import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, doc, getDoc, setDoc, updateDoc,
  arrayUnion, where, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
// ---------- Cloudinary (profile photo uploads — free, no card, replaces Firebase Storage) ----------
const CLOUDINARY_CLOUD_NAME = "wpma3mja";      // from Cloudinary Dashboard
const CLOUDINARY_UPLOAD_PRESET = "chat_avatar_ishbisiodjs"; // Settings → Upload → Add upload preset → Unsigned
// ------------------------------------------------------------------

// ---------- Your AJ Solution Firebase project ----------
const firebaseConfig = {
  apiKey: "AIzaSyCSjdaDB2X_4QHrIOfstkxPC6X95uVPLaU",
  authDomain: "aj-solution-chat.firebaseapp.com",
  projectId: "aj-solution-chat",
  storageBucket: "aj-solution-chat.firebasestorage.app",
  messagingSenderId: "785402540147",
  appId: "1:785402540147:web:2c0f0c7d28a8a8a3d5fa06",
  measurementId: "G-C1MGRBXJVD",
};
// ------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- constants ----------
const DELETE_WINDOW_MS = 15 * 60 * 1000; // 15 min "delete for everyone" window
const TYPING_IDLE_MS = 3000;
const PRESENCE_HEARTBEAT_MS = 25000;
const PRESENCE_STALE_MS = 45000;
const GLOBAL_ID = '__global__';

// ---------- chat background scenes (personal, saved per-device) ----------
const CHAT_BACKGROUNDS = [
  { id: 'campfire',      file: 'assets/chat-bg/campfire-camp.gif',        label: 'Campfire Camp' },
  { id: 'lake-sunset',   file: 'assets/chat-bg/lake-sunset.gif',          label: 'Lake Sunset' },
  { id: 'waterfall',     file: 'assets/chat-bg/waterfall-canyon.gif',     label: 'Waterfall Canyon' },
  { id: 'cherry-cliff',  file: 'assets/chat-bg/cherry-blossom-cliff.gif', label: 'Cherry Blossom Cliff' },
  { id: 'firefly-camp',  file: 'assets/chat-bg/firefly-campsite.gif',     label: 'Firefly Campsite' },
  { id: 'neon-cafe',     file: 'assets/chat-bg/neon-cafe.gif',            label: 'Neon Café' },
  { id: 'snowy-stop',    file: 'assets/chat-bg/snowy-bus-stop.gif',       label: 'Snowy Bus Stop' },
  { id: 'fireplace',     file: 'assets/chat-bg/cozy-fireplace.gif',       label: 'Cozy Fireplace' },
  { id: 'golden-pond',   file: 'assets/chat-bg/golden-willow-pond.gif',   label: 'Golden Willow Pond' },
  { id: 'rooftop-foxes', file: 'assets/chat-bg/rooftop-foxes.gif',        label: 'Rooftop Foxes' },
  { id: 'koi-pond',      file: 'assets/chat-bg/koi-dock-pond.gif',        label: 'Koi Dock Pond' },
  { id: 'korean-bbq',    file: 'assets/chat-bg/korean-bbq-dinner.gif',    label: 'Korean BBQ Dinner' },
  { id: 'pixel-painter', file: 'assets/chat-bg/pixel-painter-window.gif', label: 'City Window Painter' },
  { id: 'garden-gate',   file: 'assets/chat-bg/pixel-garden-gate.gif',    label: 'Garden Gate' },
  { id: 'record-shop',   file: 'assets/chat-bg/pixel-record-shop.gif',    label: 'Record Shop' },
  { id: 'night-car',     file: 'assets/chat-bg/night-car-scene.gif',      label: 'Night Car' },
  { id: 'coin-vault',    file: 'assets/chat-bg/gold-coin-vault.gif',      label: 'Coin Vault' },
  { id: 'cherry-bridge', file: 'assets/chat-bg/cherry-blossom-bridge.gif',label: 'Cherry Blossom Bridge' },
  { id: 'midnight-roof', file: 'assets/chat-bg/midnight-rooftop.gif',     label: 'Midnight Rooftop' },
  { id: 'streetlamp-dog',file: 'assets/chat-bg/streetlamp-city-dog.gif',  label: 'Streetlamp & Dog' },
  { id: 'violet-window', file: 'assets/chat-bg/violet-window-figure.gif', label: 'Violet Window' },
  { id: 'hat-horizon',   file: 'assets/chat-bg/hat-ocean-horizon.gif',    label: 'Hat & Horizon' },
  { id: 'cape-walker',   file: 'assets/chat-bg/cape-walker-ruins.gif',    label: 'Cape Walker' },
  { id: 'rooftop-sunset',file: 'assets/chat-bg/rooftop-sunset-overlook.gif', label: 'Rooftop Sunset' },
  { id: 'forest-wanderer',file:'assets/chat-bg/forest-wanderer-crows.gif',label: 'Forest Wanderer' },
  { id: 'skyline-swinger',file:'assets/chat-bg/skyline-swinger.gif',      label: 'Skyline Swinger' },
];
const BG_KEY = 'aj_chat_bg', BG_OPACITY_KEY = 'aj_chat_bg_opacity';

// ---------- dom ----------
const $ = id => document.getElementById(id);
const appEl = $('app');
const chatsList = $('chatsList');
const peopleList = $('peopleList');
const tabChats = $('tabChats'), tabPeople = $('tabPeople');
const searchInput = $('searchInput');
const convoPanel = $('convoPanel');
const toastStack = $('toastStack');
const myAvatarBtn = $('myAvatarBtn');

const codeModal = $('codeModal'), codeInput = $('codeInput'), codeError = $('codeError'), codeSubmitBtn = $('codeSubmitBtn');
const nameModal = $('nameModal'), nameInput = $('nameInput'), aboutInput = $('aboutInput'), nameSaveBtn = $('nameSaveBtn');
const myProfileModal = $('myProfileModal'), myProfileAvatar = $('myProfileAvatar'), editPhotoBtn = $('editPhotoBtn'),
      photoInput = $('photoInput'), editNameInput = $('editNameInput'), editAboutInput = $('editAboutInput'),
      saveProfileBtn = $('saveProfileBtn'), closeProfileBtn = $('closeProfileBtn');
const otherProfileModal = $('otherProfileModal'), otherAvatar = $('otherAvatar'), otherName = $('otherName'),
      otherAbout = $('otherAbout'), messageBtn = $('messageBtn'), closeOtherProfileBtn = $('closeOtherProfileBtn');
const bgModal = $('bgModal'), bgGrid = $('bgGrid'), bgOpacitySlider = $('bgOpacitySlider'),
      bgOpacityVal = $('bgOpacityVal'), bgPickerBtn = $('bgPickerBtn'), closeBgBtn = $('closeBgBtn');
const settingsBtn = $('settingsBtn'), settingsModal = $('settingsModal'), closeSettingsBtn = $('closeSettingsBtn'),
      settingsReveal = $('settingsReveal'), notifToggle = $('notifToggle'), notifStatusSub = $('notifStatusSub');
const newGroupBtn = $('newGroupBtn'), groupCreateModal = $('groupCreateModal'), groupNameInput = $('groupNameInput'),
      groupMemberPicker = $('groupMemberPicker'), groupCreateBtn = $('groupCreateBtn'), groupCreateCancelBtn = $('groupCreateCancelBtn');
const groupInfoModal = $('groupInfoModal'), groupInfoAvatar = $('groupInfoAvatar'), groupInfoName = $('groupInfoName'),
      groupInfoCount = $('groupInfoCount'), groupInfoMembers = $('groupInfoMembers'),
      groupAddMembersBtn = $('groupAddMembersBtn'), groupLeaveBtn = $('groupLeaveBtn'), closeGroupInfoBtn = $('closeGroupInfoBtn');
const groupAddModal = $('groupAddModal'), groupAddPicker = $('groupAddPicker'),
      groupAddConfirmBtn = $('groupAddConfirmBtn'), groupAddCancelBtn = $('groupAddCancelBtn');

// ---------- state ----------
let myUid = null;
let myProfile = { name: '', about: '', photoURL: '' };
let canSend = false;
let usersCache = new Map();      // uid -> {name, about, photoURL, lastActive}
let chatsCache = new Map();      // chatId -> chat doc data
let groupsCache = new Map();     // groupId -> group doc data
let currentView = null;          // { type:'global'|'dm', id }
let unsubMessages = null, unsubTyping = null, unsubOtherPresence = null;
let typingTimer = null, lastTypingWrite = 0;
let activeOtherUid = null;
let cooldown = false;
let notifPermissionAsked = false;
let selectedBg = localStorage.getItem(BG_KEY) || 'none';
let bgOpacity = parseInt(localStorage.getItem(BG_OPACITY_KEY) || '35', 10);
const lastReadMap = JSON.parse(localStorage.getItem('aj_chat_lastread') || '{}');
const NAME_KEY = 'aj_chat_name', ABOUT_KEY = 'aj_chat_about';

function saveLastRead(id) {
  lastReadMap[id] = Date.now();
  localStorage.setItem('aj_chat_lastread', JSON.stringify(lastReadMap));
}

// ---------- helpers ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}
function avatarHtml(profile, opts = {}) {
  const cls = opts.cls || '';
  const presence = opts.presence !== undefined
    ? `<span class="presence ${opts.presence ? 'on' : ''}"></span>` : '';
  if (profile?.photoURL) {
    return `<div class="avatar ${cls}">${presence}<img src="${escapeHtml(profile.photoURL)}" alt=""></div>`;
  }
  return `<div class="avatar ${cls}">${presence}${escapeHtml(initials(profile?.name))}</div>`;
}
function isOnline(profile) {
  return profile?.lastActive && (Date.now() - profile.lastActive) < PRESENCE_STALE_MS;
}
function fmtTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function tsToMs(ts) { return ts?.toDate ? ts.toDate().getTime() : (ts || 0); }
function dmChatId(a, b) { return [a, b].sort().join('_'); }

function tickIcon(state) {
  // state: 'sent' | 'delivered' | 'read'
  if (state === 'sent') {
    return `<span class="ticks sent"><svg viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 6l3.5 3.5L14 1"/></svg></span>`;
  }
  const cls = state === 'read' ? 'read' : 'delivered';
  return `<span class="ticks ${cls}"><svg viewBox="0 0 20 11" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 6l3.5 3.5L11 1"/><path d="M8 6l3.5 3.5L18 1"/></svg></span>`;
}

function toast(name, text, onClick) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="avatar" style="width:32px;height:32px;font-size:12px;">${initials(name)}</div>
    <div><div class="t-name">${escapeHtml(name)}</div><div class="t-text">${escapeHtml(text)}</div></div>`;
  el.addEventListener('click', () => { el.remove(); onClick?.(); });
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 4500);

  if (document.hidden && notifPrefEnabled() && Notification?.permission === 'granted') {
    const n = new Notification(name, { body: text, tag: 'aj-chat' });
    n.onclick = () => { window.focus(); onClick?.(); n.close(); };
  }
}

// ---------- Settings: gear reveal + notification toggle ----------
function notifPrefEnabled() {
  return localStorage.getItem('ajChatNotifEnabled') === 'true';
}

function refreshNotifToggleUI() {
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  notifToggle.classList.remove('on', 'denied');
  if (perm === 'denied') {
    notifToggle.classList.add('denied');
    notifToggle.setAttribute('aria-checked', 'false');
    notifStatusSub.textContent = 'Blocked in your browser settings — enable notifications for this site to turn this on.';
  } else if (perm === 'granted' && notifPrefEnabled()) {
    notifToggle.classList.add('on');
    notifToggle.setAttribute('aria-checked', 'true');
    notifStatusSub.textContent = "Get notified when a message arrives on a chat you're not viewing.";
  } else {
    notifToggle.setAttribute('aria-checked', 'false');
    notifStatusSub.textContent = perm === 'unsupported'
      ? 'Notifications are not supported in this browser.'
      : "Get notified when a message arrives on a chat you're not viewing.";
  }
}

settingsBtn?.addEventListener('click', () => {
  settingsReveal.classList.add('playing');
  const gifEl = $('settingsRevealGif');
  gifEl.src = ''; gifEl.src = 'assets/settings-gear-reveal.gif'; // restart gif from frame 0
  setTimeout(() => {
    refreshNotifToggleUI();
    settingsModal.classList.add('show');
  }, 750);
  setTimeout(() => {
    settingsReveal.classList.remove('playing');
  }, 1500);
});

closeSettingsBtn?.addEventListener('click', () => settingsModal.classList.remove('show'));

notifToggle?.addEventListener('click', async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') {
    refreshNotifToggleUI();
    return;
  }
  const turningOn = !notifToggle.classList.contains('on');
  if (turningOn) {
    const perm = await Notification.requestPermission().catch(() => 'denied');
    if (perm === 'granted') {
      localStorage.setItem('ajChatNotifEnabled', 'true');
    }
  } else {
    localStorage.setItem('ajChatNotifEnabled', 'false');
  }
  refreshNotifToggleUI();
});

// ---------- auth + access gate ----------
async function trySubmitCode() {
  const code = codeInput.value.trim();
  if (!code) return;
  codeSubmitBtn.disabled = true;
  try {
    await setDoc(doc(db, 'access', myUid), { code, joinedAt: serverTimestamp() });
    codeModal.classList.remove('show');
    codeError.style.display = 'none';
    canSend = true;
    afterAccessGranted();
  } catch (err) {
    codeError.style.display = 'block';
    codeInput.value = '';
    codeInput.focus();
  }
  codeSubmitBtn.disabled = false;
}
codeSubmitBtn.addEventListener('click', trySubmitCode);
codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') trySubmitCode(); });

async function checkAccess() {
  try {
    const snap = await getDoc(doc(db, 'access', myUid));
    if (snap.exists()) {
      canSend = true;
      afterAccessGranted();
    } else {
      codeModal.classList.add('show');
      codeInput.focus();
    }
  } catch (err) {
    console.error(err);
  }
}

onAuthStateChanged(auth, user => {
  if (user) {
    myUid = user.uid;
    checkAccess();
  } else {
    signInAnonymously(auth).catch(err => console.error(err));
  }
});

// ---------- onboarding / profile ----------
function afterAccessGranted() {
  const savedName = localStorage.getItem(NAME_KEY);
  const savedAbout = localStorage.getItem(ABOUT_KEY) || '';
  if (savedName) {
    myProfile.name = savedName;
    myProfile.about = savedAbout;
    loadMyProfileDoc();
  } else {
    nameModal.classList.add('show');
    nameInput.focus();
  }
}

nameSaveBtn.addEventListener('click', async () => {
  const v = nameInput.value.trim().slice(0, 24);
  if (!v) return;
  myProfile.name = v;
  myProfile.about = aboutInput.value.trim().slice(0, 60);
  localStorage.setItem(NAME_KEY, myProfile.name);
  localStorage.setItem(ABOUT_KEY, myProfile.about);
  nameModal.classList.remove('show');
  await saveProfileDoc();
  boot();
});
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') nameSaveBtn.click(); });

async function loadMyProfileDoc() {
  try {
    const snap = await getDoc(doc(db, 'users', myUid));
    if (snap.exists()) {
      const d = snap.data();
      myProfile.photoURL = d.photoURL || '';
      if (d.name) myProfile.name = d.name;
      if (d.about !== undefined) myProfile.about = d.about;
    }
  } catch (e) { console.error(e); }
  await saveProfileDoc();
  boot();
}

async function saveProfileDoc() {
  try {
    await setDoc(doc(db, 'users', myUid), {
      name: myProfile.name,
      about: myProfile.about || '',
      photoURL: myProfile.photoURL || '',
      lastActive: serverTimestamp(),
    }, { merge: true });
  } catch (e) { console.error(e); }
}

function renderMyAvatarBtn() {
  myAvatarBtn.innerHTML = myProfile.photoURL
    ? `<img src="${escapeHtml(myProfile.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : escapeHtml(initials(myProfile.name));
}

myAvatarBtn.addEventListener('click', () => openMyProfileModal());
function openMyProfileModal() {
  myProfileAvatar.innerHTML = myProfile.photoURL
    ? `<img src="${escapeHtml(myProfile.photoURL)}" alt="">` : escapeHtml(initials(myProfile.name));
  editNameInput.value = myProfile.name;
  editAboutInput.value = myProfile.about || '';
  myProfileModal.classList.add('show');
}
closeProfileBtn.addEventListener('click', () => myProfileModal.classList.remove('show'));
editPhotoBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) return;
  try {
    const resized = await resizeImage(file, 256);
    const url = await uploadToCloudinary(resized);
    myProfile.photoURL = url;
    myProfileAvatar.innerHTML = `<img src="${escapeHtml(url)}" alt="">`;
    renderMyAvatarBtn();
    await saveProfileDoc();
  } catch (e) {
    console.error(e);
    alert('Photo upload failed — check Cloudinary settings / connection.');
  }
});

// Uploads a resized photo blob directly to Cloudinary (unsigned) and returns its hosted URL.
// NOTE: Cloudinary ignores "overwrite" for unsigned uploads (it's always forced to false, by
// Cloudinary's own design, to stop random people overwriting your assets from the client).
// So instead of reusing one public_id, we give every upload a unique id. The app still behaves
// like a replacement — Firestore's photoURL is updated to the new file, so old photos stop being
// shown anywhere immediately. The old file itself just sits unused in Cloudinary (fine for small
// avatar images on the free plan).
async function uploadToCloudinary(blob) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('public_id', `profile-photos/${myUid}_${Date.now()}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url;
}

function resizeImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

saveProfileBtn.addEventListener('click', async () => {
  const v = editNameInput.value.trim().slice(0, 24);
  if (!v) return;
  myProfile.name = v;
  myProfile.about = editAboutInput.value.trim().slice(0, 60);
  localStorage.setItem(NAME_KEY, myProfile.name);
  localStorage.setItem(ABOUT_KEY, myProfile.about);
  await saveProfileDoc();
  renderMyAvatarBtn();
  myProfileModal.classList.remove('show');
});

// ---------- chat background picker ----------
function renderBgGrid() {
  bgGrid.innerHTML = '';

  const noneTile = document.createElement('div');
  noneTile.className = 'bg-tile none-tile' + (selectedBg === 'none' ? ' selected' : '');
  noneTile.innerHTML = `<span>No background</span><div class="check">✓</div>`;
  noneTile.addEventListener('click', () => chooseBg('none'));
  bgGrid.appendChild(noneTile);

  CHAT_BACKGROUNDS.forEach(bg => {
    const tile = document.createElement('div');
    tile.className = 'bg-tile' + (selectedBg === bg.id ? ' selected' : '');
    tile.innerHTML = `<img src="${bg.file}" alt="${escapeHtml(bg.label)}" loading="lazy"><div class="bg-label">${escapeHtml(bg.label)}</div><div class="check">✓</div>`;
    tile.addEventListener('click', () => chooseBg(bg.id));
    bgGrid.appendChild(tile);
  });
}
function chooseBg(id) {
  selectedBg = id;
  localStorage.setItem(BG_KEY, id);
  renderBgGrid();
  applyChatBackground();
}
bgOpacitySlider.addEventListener('input', () => {
  bgOpacity = parseInt(bgOpacitySlider.value, 10);
  bgOpacityVal.textContent = bgOpacity + '%';
  localStorage.setItem(BG_OPACITY_KEY, String(bgOpacity));
  applyChatBackground();
});
bgPickerBtn.addEventListener('click', () => {
  bgOpacitySlider.value = bgOpacity;
  bgOpacityVal.textContent = bgOpacity + '%';
  renderBgGrid();
  bgModal.classList.add('show');
});
closeBgBtn.addEventListener('click', () => bgModal.classList.remove('show'));

function applyChatBackground() {
  const wrap = document.querySelector('.feed-wrap');
  const layer = $('feedBgLayer');
  if (!wrap || !layer) return;
  const bg = CHAT_BACKGROUNDS.find(b => b.id === selectedBg);
  if (!bg) {
    wrap.classList.remove('has-bg');
    layer.innerHTML = '';
    return;
  }
  wrap.classList.add('has-bg');
  layer.innerHTML = `<img src="${bg.file}" alt="">`;
  layer.style.opacity = (bgOpacity / 100).toFixed(2);
}

// ---------- boot: presence, users list, chats list ----------
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  renderMyAvatarBtn();
  startPresenceHeartbeat();
  subscribeUsers();
  subscribeMyChats();
  subscribeMyGroups();
  subscribeGlobalPreview();
  renderChatsList();
  if ('Notification' in window && Notification.permission === 'default' && !notifPermissionAsked) {
    notifPermissionAsked = true;
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') localStorage.setItem('ajChatNotifEnabled', 'true');
    }).catch(() => {});
  }
}

function startPresenceHeartbeat() {
  saveProfileDoc();
  setInterval(saveProfileDoc, PRESENCE_HEARTBEAT_MS);
  window.addEventListener('beforeunload', () => { navigator.sendBeacon?.(); });
}

// ---------- users (People tab) ----------
function subscribeUsers() {
  const q = query(collection(db, 'users'));
  onSnapshot(q, snap => {
    snap.forEach(d => {
      const data = d.data();
      usersCache.set(d.id, {
        name: data.name || 'Someone',
        about: data.about || '',
        photoURL: data.photoURL || '',
        lastActive: tsToMs(data.lastActive),
      });
    });
    renderPeopleList();
    renderChatsList(); // names/avatars in chat rows may depend on user profiles
  });
}

function renderPeopleList() {
  const term = searchInput.value.trim().toLowerCase();
  const rows = [...usersCache.entries()]
    .filter(([uid]) => uid !== myUid)
    .filter(([, u]) => !term || u.name.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  peopleList.innerHTML = '';
  if (!rows.length) {
    peopleList.innerHTML = `<div class="empty-hint">No one else here yet.<br>Share the invite code to grow the room.</div>`;
    return;
  }
  rows.forEach(([uid, u]) => {
    const row = document.createElement('div');
    row.className = 'person-row';
    row.innerHTML = `
      ${avatarHtml(u, { presence: isOnline(u) })}
      <div class="row-mid">
        <div class="row-name">${escapeHtml(u.name)}</div>
        <div class="row-preview">${escapeHtml(u.about || (isOnline(u) ? 'Online' : 'Offline'))}</div>
      </div>`;
    row.addEventListener('click', () => openOtherProfile(uid, u));
    peopleList.appendChild(row);
  });
}

function openOtherProfile(uid, u) {
  otherAvatar.innerHTML = u.photoURL ? `<img src="${escapeHtml(u.photoURL)}" alt="">` : escapeHtml(initials(u.name));
  otherName.textContent = u.name;
  otherAbout.textContent = u.about || (isOnline(u) ? 'Online' : 'Offline');
  messageBtn.onclick = async () => {
    otherProfileModal.classList.remove('show');
    const chatId = await ensureDmChat(uid, u.name);
    selectChat('dm', chatId, uid);
  };
  otherProfileModal.classList.add('show');
}
closeOtherProfileBtn.addEventListener('click', () => otherProfileModal.classList.remove('show'));

async function ensureDmChat(otherUid, otherName) {
  const chatId = dmChatId(myUid, otherUid);
  const ref = doc(db, 'chats', chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      members: [myUid, otherUid],
      names: { [myUid]: myProfile.name, [otherUid]: otherName },
      lastMessage: '', lastMessageAt: serverTimestamp(), lastSenderUid: '', lastDeleted: false,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  return chatId;
}

// ---------- chats list (global pinned + DMs) ----------
function subscribeMyChats() {
  const q = query(collection(db, 'chats'), where('members', 'array-contains', myUid));
  onSnapshot(q, snap => {
    snap.forEach(d => chatsCache.set(d.id, d.data()));
    renderChatsList();

    // watch for incoming messages -> toast if not currently viewing that chat
    snap.docChanges().forEach(ch => {
      if (ch.type === 'modified') {
        const data = ch.doc.data();
        const isMine = data.lastSenderUid === myUid;
        const isOpen = currentView?.type === 'dm' && currentView.id === ch.doc.id;
        if (!isMine && !isOpen && data.lastMessage) {
          const otherUid = data.members.find(m => m !== myUid);
          const name = data.names?.[otherUid] || usersCache.get(otherUid)?.name || 'Someone';
          toast(name, data.lastDeleted ? 'Deleted a message' : data.lastMessage, () => {
            selectChat('dm', ch.doc.id, otherUid);
          });
        }
      }
    });
  });
}

let globalPreview = { text: '', ts: 0 };

// ---------- groups ----------
function subscribeMyGroups() {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', myUid));
  onSnapshot(q, snap => {
    snap.forEach(d => groupsCache.set(d.id, d.data()));
    // drop groups we've left (removed from members) out of the local cache
    groupsCache.forEach((v, k) => { if (!snap.docs.find(d => d.id === k)) groupsCache.delete(k); });
    renderChatsList();
    if (currentView?.type === 'group' && !groupsCache.has(currentView.id)) {
      // we left/were removed from the group currently open
      appEl.classList.remove('chat-open');
      convoPanel.classList.add('empty');
      convoPanel.innerHTML = `<span>Select a chat to start messaging</span>`;
      currentView = null;
    }

    snap.docChanges().forEach(ch => {
      if (ch.type === 'modified') {
        const data = ch.doc.data();
        const isMine = data.lastSenderUid === myUid;
        const isOpen = currentView?.type === 'group' && currentView.id === ch.doc.id;
        if (!isMine && !isOpen && data.lastMessage) {
          toast(`${data.lastSenderName || 'Someone'} in ${data.name}`, data.lastDeleted ? 'Deleted a message' : data.lastMessage, () => {
            selectChat('group', ch.doc.id);
          });
        }
      }
    });
  });
}

function renderMemberPicker(container, { excludeUids = [], onChange } = {}) {
  const candidates = [...usersCache.entries()].filter(([uid]) => uid !== myUid && !excludeUids.includes(uid));
  container.innerHTML = '';
  if (!candidates.length) {
    container.innerHTML = `<div class="empty-hint">No one else to add yet.</div>`;
    return;
  }
  candidates.sort((a, b) => a[1].name.localeCompare(b[1].name)).forEach(([uid, u]) => {
    const row = document.createElement('label');
    row.className = 'member-row';
    row.innerHTML = `${avatarHtml(u, {})}<span class="m-name">${escapeHtml(u.name)}</span><input type="checkbox" value="${uid}">`;
    row.querySelector('input').addEventListener('change', onChange);
    container.appendChild(row);
  });
}
function pickedUids(container) {
  return [...container.querySelectorAll('input[type=checkbox]:checked')].map(el => el.value);
}

newGroupBtn.addEventListener('click', () => {
  groupNameInput.value = '';
  renderMemberPicker(groupMemberPicker);
  groupCreateModal.classList.add('show');
  groupNameInput.focus();
});
groupCreateCancelBtn.addEventListener('click', () => groupCreateModal.classList.remove('show'));
groupCreateBtn.addEventListener('click', async () => {
  const name = groupNameInput.value.trim().slice(0, 30);
  const members = pickedUids(groupMemberPicker);
  if (!name || !members.length) return;
  groupCreateBtn.disabled = true;
  try {
    const ref = await addDoc(collection(db, 'groups'), {
      name,
      members: [myUid, ...members],
      createdBy: myUid,
      createdAt: serverTimestamp(),
      lastMessage: '', lastMessageAt: serverTimestamp(), lastSenderUid: '', lastSenderName: '', lastDeleted: false,
    });
    groupCreateModal.classList.remove('show');
    selectChat('group', ref.id);
  } catch (e) { console.error(e); }
  groupCreateBtn.disabled = false;
});

function openGroupInfo(groupId) {
  const g = groupsCache.get(groupId);
  if (!g) return;
  groupInfoAvatar.innerHTML = escapeHtml(initials(g.name));
  groupInfoName.textContent = g.name;
  groupInfoCount.textContent = `${g.members.length} member${g.members.length === 1 ? '' : 's'}`;
  groupInfoMembers.innerHTML = '';
  g.members.forEach(uid => {
    const u = usersCache.get(uid) || { name: uid === myUid ? myProfile.name : 'Someone' };
    const row = document.createElement('div');
    row.className = 'member-row';
    row.style.cursor = 'default';
    row.innerHTML = `${avatarHtml(u, { presence: isOnline(u) })}<span class="m-name">${escapeHtml(uid === myUid ? 'You' : u.name)}</span>${uid === g.createdBy ? '<span class="m-tag">Creator</span>' : ''}`;
    groupInfoMembers.appendChild(row);
  });
  groupAddMembersBtn.onclick = () => {
    renderMemberPicker(groupAddPicker, { excludeUids: g.members });
    groupAddModal.classList.add('show');
    groupAddConfirmBtn.onclick = async () => {
      const add = pickedUids(groupAddPicker);
      if (!add.length) return;
      await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(...add) }).catch(() => {});
      groupAddModal.classList.remove('show');
    };
  };
  groupLeaveBtn.onclick = async () => {
    if (!confirm(`Leave "${g.name}"?`)) return;
    await updateDoc(doc(db, 'groups', groupId), { members: g.members.filter(u => u !== myUid) }).catch(() => {});
    groupInfoModal.classList.remove('show');
  };
  groupInfoModal.classList.add('show');
}
closeGroupInfoBtn.addEventListener('click', () => groupInfoModal.classList.remove('show'));
groupAddCancelBtn.addEventListener('click', () => groupAddModal.classList.remove('show'));

function subscribeGlobalPreview() {
  const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(1));
  onSnapshot(q, snap => {
    const d = snap.docs[0]?.data();
    const wasNewer = d && tsToMs(d.timestamp) > globalPreview.ts;
    if (d) {
      const isMine = d.uid === myUid;
      const isOpen = currentView?.type === 'global';
      globalPreview = { text: d.deleted ? 'Deleted a message' : d.text, name: d.name, ts: tsToMs(d.timestamp) };
      if (wasNewer && !isMine && !isOpen && globalPreview.ts) {
        toast(d.deleted ? 'Global Chat' : d.name, globalPreview.text, () => selectChat('global', GLOBAL_ID));
      }
    }
    renderChatsList();
  });
}

function renderChatsList() {
  const term = searchInput.value.trim().toLowerCase();
  chatsList.innerHTML = '';

  // Global row, pinned
  if (!term || 'global chat'.includes(term)) {
    const unread = globalPreview.ts && globalPreview.ts > (lastReadMap[GLOBAL_ID] || 0);
    const row = document.createElement('div');
    row.className = 'chat-row' + (currentView?.type === 'global' ? ' selected' : '');
    row.innerHTML = `
      <div class="avatar" style="background:linear-gradient(135deg,var(--amber),var(--rose));">🌐</div>
      <div class="row-mid">
        <div class="row-top"><span class="row-name">Global Chat <span class="pin-tag">· all users</span></span><span class="row-time">${fmtTime(globalPreview.ts)}</span></div>
        <div class="row-bottom">
          <span class="row-preview">${globalPreview.name ? escapeHtml(globalPreview.name) + ': ' : ''}${escapeHtml(globalPreview.text || 'Say hello 👋')}</span>
          ${unread ? `<span class="unread-badge">•</span>` : ''}
        </div>
      </div>`;
    row.addEventListener('click', () => selectChat('global', GLOBAL_ID));
    chatsList.appendChild(row);
  }

  const dms = [...chatsCache.entries()]
    .filter(([, c]) => c.members?.includes(myUid))
    .filter(([, c]) => {
      if (!term) return true;
      const otherUid = c.members.find(m => m !== myUid);
      const nm = c.names?.[otherUid] || usersCache.get(otherUid)?.name || '';
      return nm.toLowerCase().includes(term);
    })
    .map(([id, c]) => ({ kind: 'dm', id, data: c, ts: tsToMs(c.lastMessageAt) }));

  const groups = [...groupsCache.entries()]
    .filter(([, g]) => !term || g.name.toLowerCase().includes(term))
    .map(([id, g]) => ({ kind: 'group', id, data: g, ts: tsToMs(g.lastMessageAt) }));

  const combined = [...dms, ...groups].sort((a, b) => b.ts - a.ts);

  if (!combined.length && !chatsList.children.length) {
    chatsList.insertAdjacentHTML('beforeend', `<div class="empty-hint">No chats yet.<br>Go to People to start a 1:1, or create a group.</div>`);
  }

  combined.forEach(item => {
    if (item.kind === 'dm') {
      const { id, data: c } = item;
      const otherUid = c.members.find(m => m !== myUid);
      const u = usersCache.get(otherUid) || { name: c.names?.[otherUid] || 'Someone' };
      const unread = tsToMs(c.lastMessageAt) > (lastReadMap[id] || 0) && c.lastSenderUid !== myUid;
      const row = document.createElement('div');
      row.className = 'chat-row' + (currentView?.type === 'dm' && currentView.id === id ? ' selected' : '');
      row.innerHTML = `
        ${avatarHtml(u, { presence: isOnline(u) })}
        <div class="row-mid">
          <div class="row-top"><span class="row-name">${escapeHtml(u.name)}</span><span class="row-time">${fmtTime(tsToMs(c.lastMessageAt))}</span></div>
          <div class="row-bottom">
            <span class="row-preview">${c.lastDeleted ? '<span class="deleted">Deleted a message</span>' : escapeHtml(c.lastMessage || 'No messages yet')}</span>
            ${unread ? `<span class="unread-badge">•</span>` : ''}
          </div>
        </div>`;
      row.addEventListener('click', () => selectChat('dm', id, otherUid));
      chatsList.appendChild(row);
    } else {
      const { id, data: g } = item;
      const unread = tsToMs(g.lastMessageAt) > (lastReadMap[id] || 0) && g.lastSenderUid !== myUid;
      const senderPrefix = g.lastSenderUid === myUid ? 'You: ' : g.lastSenderName ? `${escapeHtml(g.lastSenderName)}: ` : '';
      const row = document.createElement('div');
      row.className = 'chat-row' + (currentView?.type === 'group' && currentView.id === id ? ' selected' : '');
      row.innerHTML = `
        <div class="avatar group">${escapeHtml(initials(g.name))}</div>
        <div class="row-mid">
          <div class="row-top"><span class="row-name">${escapeHtml(g.name)} <span class="pin-tag">· ${g.members.length}</span></span><span class="row-time">${fmtTime(tsToMs(g.lastMessageAt))}</span></div>
          <div class="row-bottom">
            <span class="row-preview">${g.lastDeleted ? '<span class="deleted">Deleted a message</span>' : (senderPrefix + escapeHtml(g.lastMessage || 'No messages yet'))}</span>
            ${unread ? `<span class="unread-badge">•</span>` : ''}
          </div>
        </div>`;
      row.addEventListener('click', () => selectChat('group', id));
      chatsList.appendChild(row);
    }
  });
}

// ---------- tabs / search ----------
tabChats.addEventListener('click', () => switchTab('chats'));
tabPeople.addEventListener('click', () => switchTab('people'));
function switchTab(tab) {
  tabChats.classList.toggle('active', tab === 'chats');
  tabPeople.classList.toggle('active', tab === 'people');
  chatsList.style.display = tab === 'chats' ? '' : 'none';
  peopleList.style.display = tab === 'people' ? '' : 'none';
}
searchInput.addEventListener('input', () => { renderChatsList(); renderPeopleList(); });

// ---------- conversation ----------
function selectChat(type, id, otherUid) {
  currentView = { type, id };
  activeOtherUid = otherUid || null;
  appEl.classList.add('chat-open');
  saveLastRead(id);
  renderChatsList();
  renderConvoShell();
  if (unsubMessages) unsubMessages();
  if (unsubTyping) unsubTyping();
  if (unsubOtherPresence) unsubOtherPresence();

  const base = type === 'global' ? null : type === 'dm' ? ['chats', id] : ['groups', id];
  const msgsCol = type === 'global' ? collection(db, 'messages') : collection(db, base[0], base[1], 'messages');
  const typingCol = type === 'global' ? collection(db, 'typing_global') : collection(db, base[0], base[1], 'typing');

  const q = query(msgsCol, orderBy('timestamp', 'asc'), limit(300));
  unsubMessages = onSnapshot(q, snap => {
    renderFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })), type, id);
  });

  unsubTyping = onSnapshot(typingCol, snap => {
    const now = Date.now();
    const typers = snap.docs
      .filter(d => d.id !== myUid)
      .map(d => d.data())
      .filter(t => now - tsToMs(t.ts) < TYPING_IDLE_MS + 1500);
    renderTypingStatus(typers);
  });
}

function renderConvoShell() {
  const { type, id } = currentView;
  let headerName = 'Global Chat', headerAvatar = `<div class="avatar" style="background:linear-gradient(135deg,var(--amber),var(--rose));">🌐</div>`;
  let clickHeader = null;
  let statusText = '';

  if (type === 'dm') {
    const u = usersCache.get(activeOtherUid) || { name: 'Someone' };
    headerName = u.name;
    headerAvatar = avatarHtml(u, { presence: isOnline(u) });
    clickHeader = () => openOtherProfile(activeOtherUid, u);
    statusText = isOnline(u) ? 'Online' : 'Offline';
  } else if (type === 'group') {
    const g = groupsCache.get(id);
    headerName = g?.name || 'Group';
    headerAvatar = `<div class="avatar group">${escapeHtml(initials(headerName))}</div>`;
    clickHeader = () => openGroupInfo(id);
    statusText = g ? `${g.members.length} members` : '';
  }

  convoPanel.classList.remove('empty');
  convoPanel.innerHTML = `
    <div class="convo-header">
      <button class="icon-btn back-btn" id="backBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; cursor:${clickHeader ? 'pointer' : 'default'};" id="convoWho">
        ${headerAvatar}
        <div class="who">
          <div class="who-name">${escapeHtml(headerName)}</div>
          <div class="who-status" id="whoStatus">${escapeHtml(statusText)}</div>
        </div>
      </div>
    </div>
    <div class="feed-wrap">
      <div class="feed-bg-layer" id="feedBgLayer"></div>
      <div class="feed" id="feed"></div>
    </div>
    <div class="typing-row" id="typingRow">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
    <form class="composer" id="composer">
      <input id="msgInput" type="text" placeholder="Type a message…" maxlength="300" autocomplete="off">
      <button type="submit" id="sendBtn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </form>`;

  $('backBtn').addEventListener('click', () => { appEl.classList.remove('chat-open'); });
  if (clickHeader) $('convoWho').addEventListener('click', clickHeader);

  const input = $('msgInput');
  input.addEventListener('input', handleTyping);
  input.focus();

  $('composer').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  document.addEventListener('visibilitychange', markVisibleAsRead);
  applyChatBackground();
}

function renderTypingStatus(typers) {
  const row = $('typingRow');
  const status = $('whoStatus');
  if (!row) return;
  if (typers.length) {
    row.classList.add('show');
    if (status) {
      const label = currentView.type === 'dm' ? 'typing…'
        : typers.length === 1 ? `${typers[0].name} typing…`
        : `${typers.length} typing…`;
      status.textContent = label;
      status.classList.add('typing');
    }
  } else {
    row.classList.remove('show');
    if (status) {
      status.classList.remove('typing');
      if (currentView.type === 'dm') {
        status.textContent = isOnline(usersCache.get(activeOtherUid)) ? 'Online' : 'Offline';
      } else if (currentView.type === 'group') {
        const g = groupsCache.get(currentView.id);
        status.textContent = g ? `${g.members.length} members` : '';
      } else {
        status.textContent = '';
      }
    }
  }
}

// ---------- typing writes ----------
function typingDocRef() {
  if (currentView.type === 'global') return doc(db, 'typing_global', myUid);
  const coll = currentView.type === 'dm' ? 'chats' : 'groups';
  return doc(db, coll, currentView.id, 'typing', myUid);
}
function handleTyping() {
  if (!currentView) return;
  const now = Date.now();
  if (now - lastTypingWrite > 1200) {
    lastTypingWrite = now;
    setDoc(typingDocRef(), { name: myProfile.name, ts: serverTimestamp() }).catch(() => {});
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(clearTyping, TYPING_IDLE_MS);
}
function clearTyping() {
  if (!currentView) return;
  setDoc(typingDocRef(), { name: myProfile.name, ts: new Timestamp(0, 0) }).catch(() => {});
}

// ---------- feed rendering ----------
let feedObserver = null;
function renderFeed(msgs, type, chatId) {
  const feed = $('feed');
  if (!feed) return;
  const wasAtBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 60;
  feed.innerHTML = '';
  let lastDay = '';
  const total = type === 'dm' ? 2 : Math.max(2, usersCache.size); // rough "seen by" denominator for global

  msgs.forEach((msg, i) => {
    const ms = tsToMs(msg.timestamp);
    const day = ms ? new Date(ms).toDateString() : '';
    if (day && day !== lastDay) {
      lastDay = day;
      feed.insertAdjacentHTML('beforeend', `<div class="day-sep">${new Date(ms).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div>`);
    }

    const mine = msg.uid === myUid;
    const readBy = msg.readBy || [];
    const otherMembers = type === 'dm' ? [activeOtherUid] : type === 'group' ? (groupsCache.get(chatId)?.members || []).filter(u => u !== msg.uid) : [];
    const readByOthers = type === 'global' ? readBy.some(u => u !== msg.uid) : otherMembers.some(u => readBy.includes(u));
    const isRead = readByOthers;
    const canDelete = mine && !msg.deleted && (Date.now() - ms) < DELETE_WINDOW_MS;

    const row = document.createElement('div');
    row.className = 'bubble-row' + (mine ? ' mine' : '');
    row.dataset.id = msg.id;
    row.dataset.mine = mine ? '1' : '0';
    row.dataset.read = readBy.includes(myUid) ? '1' : '0';

    const bodyHtml = msg.deleted
      ? `<div class="b-text deleted">🚫 This message was deleted</div>`
      : `<div class="b-text">${escapeHtml(msg.text)}</div>`;

    row.innerHTML = `
      <div class="bubble">
        ${mine && canDelete ? `<button class="bubble-menu-btn" data-id="${msg.id}">⋮</button>` : ''}
        ${(type === 'global' || type === 'group') && !mine ? `<div class="b-name">${escapeHtml(msg.name || 'Anonymous')}</div>` : ''}
        ${bodyHtml}
        <div class="b-meta">
          <span class="b-time">${ms ? new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          ${mine && !msg.deleted ? tickIcon(ms ? (isRead ? 'read' : 'delivered') : 'sent') : ''}
        </div>
      </div>`;
    feed.appendChild(row);

    if (mine && !msg.deleted && i === msgs.length - 1 && (type === 'dm' || type === 'group')) {
      const seenLine = document.createElement('div');
      seenLine.className = 'seen-line';
      if (type === 'dm') {
        seenLine.textContent = isRead ? 'Seen' : 'Delivered';
      } else {
        const seenCount = otherMembers.filter(u => readBy.includes(u)).length;
        seenLine.textContent = seenCount > 0 ? `Seen by ${seenCount}` : 'Delivered';
      }
      feed.appendChild(seenLine);
    }
  });

  feed.querySelectorAll('.bubble-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openMsgMenu(btn, btn.dataset.id, type, chatId); });
  });

  if (wasAtBottom) feed.scrollTop = feed.scrollHeight;

  observeUnread(type, chatId);
}

function msgDocRef(type, chatId, msgId) {
  if (type === 'global') return doc(db, 'messages', msgId);
  const coll = type === 'dm' ? 'chats' : 'groups';
  return doc(db, coll, chatId, 'messages', msgId);
}

function openMsgMenu(btn, msgId, type, chatId) {
  document.querySelectorAll('.ctx-menu').forEach(m => m.remove());
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.innerHTML = `<button class="danger" id="delBtn">Delete message</button><div class="hint">Deletes for everyone · within 15 min of sending</div>`;
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.left = Math.max(8, r.right - 170) + 'px';
  menu.querySelector('#delBtn').addEventListener('click', async () => {
    menu.remove();
    const ref = msgDocRef(type, chatId, msgId);
    try {
      await updateDoc(ref, { deleted: true, text: '' });
      if (type === 'dm') {
        await updateDoc(doc(db, 'chats', chatId), { lastDeleted: true, lastMessage: '' });
      } else if (type === 'group') {
        await updateDoc(doc(db, 'groups', chatId), { lastDeleted: true, lastMessage: '' });
      }
    } catch (e) { console.error(e); }
  });
  setTimeout(() => document.addEventListener('click', function close() {
    menu.remove(); document.removeEventListener('click', close);
  }), 0);
}

// ---------- read receipts via visibility ----------
function observeUnread(type, chatId) {
  if (feedObserver) feedObserver.disconnect();
  feedObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const row = entry.target;
      if (row.dataset.mine === '1' || row.dataset.read === '1') return;
      if (document.hidden) return;
      row.dataset.read = '1';
      const ref = msgDocRef(type, chatId, row.dataset.id);
      updateDoc(ref, { readBy: arrayUnion(myUid) }).catch(() => {});
    });
  }, { root: $('feed'), threshold: 0.6 });
  document.querySelectorAll('.bubble-row').forEach(r => feedObserver.observe(r));
}
function markVisibleAsRead() {
  if (!document.hidden) document.querySelectorAll('.bubble-row').forEach(r => feedObserver?.observe(r));
}

// ---------- send ----------
async function sendMessage() {
  const input = $('msgInput');
  const text = input.value.trim().slice(0, 300);
  if (!text || !canSend || cooldown || !currentView) return;

  cooldown = true;
  $('sendBtn').disabled = true;
  clearTyping();

  try {
    if (currentView.type === 'global') {
      await addDoc(collection(db, 'messages'), {
        text, name: myProfile.name, uid: myUid, timestamp: serverTimestamp(), deleted: false, readBy: [myUid],
      });
    } else if (currentView.type === 'dm') {
      const chatId = currentView.id;
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text, uid: myUid, timestamp: serverTimestamp(), deleted: false, readBy: [myUid],
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text, lastMessageAt: serverTimestamp(), lastSenderUid: myUid, lastDeleted: false,
      });
    } else if (currentView.type === 'group') {
      const groupId = currentView.id;
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text, name: myProfile.name, uid: myUid, timestamp: serverTimestamp(), deleted: false, readBy: [myUid],
      });
      await updateDoc(doc(db, 'groups', groupId), {
        lastMessage: text, lastMessageAt: serverTimestamp(), lastSenderUid: myUid, lastSenderName: myProfile.name, lastDeleted: false,
      });
    }
    input.value = '';
  } catch (err) {
    console.error(err);
  }
  setTimeout(() => { cooldown = false; $('sendBtn').disabled = false; }, 400);
}
