const main = document.getElementById('main');
const navCats = document.getElementById('navCats');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const menuBtn = document.getElementById('menuBtn');

const MOODS = [
  { label: '🌐 Multiplayer', cat: 'io' },
  { label: '🧠 Make me think', cat: 'brain' },
  { label: '🔤 Word puzzle', cat: 'word' },
  { label: '🌱 Something chill', cat: 'sim' },
  { label: '🎉 With friends', cat: 'party' },
];

function gameLink(g) {
  const target = g.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const badge = g.external ? '<span class="ac-ext-badge">↗ external</span>' : '';
  const accent = GAME_CATEGORIES[g.cat] ? GAME_CATEGORIES[g.cat].accent : '--cyan';
  return `
    <a class="ac-game-card" href="${g.url}"${target} style="--accent:var(${accent})">
      ${badge}
      <span class="ac-game-icon">${g.icon}</span>
      <div class="ac-game-name">${g.name}</div>
      <div class="ac-game-desc">${g.desc}</div>
      <div class="ac-game-cat">${GAME_CATEGORIES[g.cat] ? GAME_CATEGORIES[g.cat].name : g.cat}</div>
    </a>`;
}

function renderNavCats() {
  navCats.innerHTML = Object.entries(GAME_CATEGORIES).map(([id, c]) =>
    `<button class="ac-nav-item" data-view="cat/${id}"><span class="ac-nav-icon">${c.icon}</span> ${c.name}</button>`
  ).join('');
}

function setActiveNav(view) {
  document.querySelectorAll('.ac-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function renderHome() {
  const built = GAMES.filter(g => g.cat === 'built');
  main.innerHTML = `
    <div class="ac-mood-row">
      ${MOODS.map(m => `<button class="ac-mood-chip" data-cat="${m.cat}">${m.label}</button>`).join('')}
    </div>

    <div class="ac-section-title">🛠️ Built here</div>
    <div class="ac-card-grid">${built.map(gameLink).join('')}</div>

    <div class="ac-section-title">📂 Browse everything</div>
    <div class="ac-cat-grid" id="catGrid"></div>
  `;

  const catGrid = document.getElementById('catGrid');
  catGrid.innerHTML = Object.entries(GAME_CATEGORIES).map(([id, c]) => {
    const count = GAMES.filter(g => g.cat === id).length;
    return `
      <button class="ac-cat-card" data-cat="${id}" style="--accent:var(${c.accent})">
        <span class="ac-game-icon">${c.icon}</span>
        <div class="ac-game-name">${c.name}</div>
        <div class="ac-cat-count">${count} game${count === 1 ? '' : 's'}</div>
      </button>`;
  }).join('');

  catGrid.querySelectorAll('.ac-cat-card').forEach(btn => {
    btn.addEventListener('click', () => { location.hash = `#cat/${btn.dataset.cat}`; });
  });
  main.querySelectorAll('.ac-mood-chip').forEach(btn => {
    btn.addEventListener('click', () => { location.hash = `#cat/${btn.dataset.cat}`; });
  });
}

function renderCategory(id) {
  const cat = GAME_CATEGORIES[id];
  if (!cat) return renderHome();
  const items = GAMES.filter(g => g.cat === id);
  main.innerHTML = `
    <div class="ac-breadcrumb"><button id="crumbHome">Home</button> / ${cat.icon} ${cat.name}</div>
    <div class="ac-section-title">${cat.icon} ${cat.name}</div>
    ${items.length
      ? `<div class="ac-card-grid">${items.map(gameLink).join('')}</div>`
      : `<div class="ac-empty-hint">Nothing here yet.</div>`}
  `;
  document.getElementById('crumbHome').addEventListener('click', () => { location.hash = '#home'; });
}

function route() {
  const hash = location.hash.replace('#', '') || 'home';
  if (hash === 'leaderboard') {
    window.location.href = '../game/leaderboard.html';
    return;
  }
  if (hash.startsWith('cat/')) {
    renderCategory(hash.slice(4));
    setActiveNav(hash);
  } else {
    renderHome();
    setActiveNav('home');
  }
  closeSidebar();
}

// ---------- SEARCH ----------
function runSearch(q) {
  const query = q.trim().toLowerCase();
  if (!query) { searchResults.classList.remove('open'); return; }
  const matches = GAMES.filter(g =>
    g.name.toLowerCase().includes(query) || g.desc.toLowerCase().includes(query)
  ).slice(0, 10);

  searchResults.innerHTML = matches.length
    ? matches.map(g => {
        const target = g.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a class="ac-result-item" href="${g.url}"${target} style="color:inherit; text-decoration:none;">
          <span>${g.icon}</span><span>${g.name}</span>
          <span class="ac-result-cat">${GAME_CATEGORIES[g.cat] ? GAME_CATEGORIES[g.cat].name : g.cat}</span>
        </a>`;
      }).join('')
    : `<div class="ac-result-empty">No games match “${q}”.</div>`;
  searchResults.classList.add('open');
}
searchInput.addEventListener('input', e => runSearch(e.target.value));
searchInput.addEventListener('focus', e => { if (e.target.value) runSearch(e.target.value); });
document.addEventListener('click', e => {
  if (!e.target.closest('.ac-search-wrap')) searchResults.classList.remove('open');
});

// ---------- SIDEBAR NAV ----------
document.body.addEventListener('click', e => {
  const navBtn = e.target.closest('.ac-nav-item');
  if (navBtn) { location.hash = '#' + navBtn.dataset.view; }
});

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('open');
}
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarBackdrop.classList.toggle('open');
});
sidebarBackdrop.addEventListener('click', closeSidebar);

window.addEventListener('hashchange', route);
renderNavCats();
route();
