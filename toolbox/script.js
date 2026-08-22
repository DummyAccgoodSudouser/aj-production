// ---------- STORAGE (favorites / recents / usage counts — tool IDs only, never input data) ----------
const TB_STORE = {
  favKey:'tb_favorites',
  recentKey:'tb_recent',
  countKey:'tb_usage_counts',

  getFavorites(){ try{ return JSON.parse(localStorage.getItem(this.favKey)) || []; }catch(e){ return []; } },
  toggleFavorite(id){
    let favs = this.getFavorites();
    favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem(this.favKey, JSON.stringify(favs));
    return favs;
  },
  isFavorite(id){ return this.getFavorites().includes(id); },

  getRecent(){ try{ return JSON.parse(localStorage.getItem(this.recentKey)) || []; }catch(e){ return []; } },
  addRecent(id){
    let recent = this.getRecent().filter(r => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 8);
    localStorage.setItem(this.recentKey, JSON.stringify(recent));
  },

  getCounts(){ try{ return JSON.parse(localStorage.getItem(this.countKey)) || {}; }catch(e){ return {}; } },
  bumpCount(id){
    const counts = this.getCounts();
    counts[id] = (counts[id] || 0) + 1;
    localStorage.setItem(this.countKey, JSON.stringify(counts));
  },
};

// ---------- DOM refs ----------
const mainEl = document.getElementById('main');
const navCatsEl = document.getElementById('navCats');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const menuBtn = document.getElementById('menuBtn');

// ---------- SIDEBAR NAV BUILD ----------
function buildSidebar(){
  navCatsEl.innerHTML = TB_CATEGORIES.map(c => {
    const count = TB_TOOLS.filter(t => t.cat === c.id).length;
    return `<button class="tb-nav-item" data-view="cat:${c.id}">
      <span class="tb-nav-icon">${c.icon}</span> ${c.label}
    </button>`;
  }).join('');
}
buildSidebar();

function setActiveNav(view){
  document.querySelectorAll('.tb-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

document.querySelectorAll('.tb-nav-item, .tb-nav-cats').forEach(() => {}); // no-op, delegation below
document.body.addEventListener('click', (e) => {
  const navBtn = e.target.closest('.tb-nav-item');
  if (navBtn){
    location.hash = '#/' + navBtn.dataset.view;
    closeMobileSidebar();
  }
});

// ---------- MOBILE SIDEBAR ----------
function openMobileSidebar(){ sidebarEl.classList.add('open'); sidebarBackdrop.classList.add('open'); }
function closeMobileSidebar(){ sidebarEl.classList.remove('open'); sidebarBackdrop.classList.remove('open'); }
menuBtn.addEventListener('click', openMobileSidebar);
sidebarBackdrop.addEventListener('click', closeMobileSidebar);

// ---------- FAVORITE BUTTON HELPER ----------
function favBtnHtml(id, extraClass=''){
  const active = TB_STORE.isFavorite(id) ? 'active' : '';
  return `<button class="tb-fav-btn ${active} ${extraClass}" data-fav-toggle="${id}" title="Toggle favorite">★</button>`;
}
document.body.addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav-toggle]');
  if (favBtn){
    e.stopPropagation();
    TB_STORE.toggleFavorite(favBtn.dataset.favToggle);
    favBtn.classList.toggle('active');
    // if we're on home, re-render favorites section live
    if (location.hash === '#/home' || location.hash === '' || location.hash === '#/') renderHome();
  }
});

// ---------- TOOL CARD ----------
function toolCardHtml(tool){
  const cat = tbCatMeta(tool.cat);
  return `<div class="tb-tool-card" style="--accent:var(${cat.accent})" data-open-tool="${tool.id}">
    ${favBtnHtml(tool.id)}
    <span class="tb-tool-icon">${tool.icon}</span>
    <div class="tb-tool-name">${tool.name}</div>
    <div class="tb-tool-cat">${cat.label}</div>
  </div>`;
}
document.body.addEventListener('click', (e) => {
  if (e.target.closest('[data-fav-toggle]')) return;
  const card = e.target.closest('[data-open-tool]');
  if (card){ location.hash = '#/tool/' + card.dataset.openTool; closeMobileSidebar(); }
  const catCard = e.target.closest('[data-open-cat]');
  if (catCard){ location.hash = '#/cat:' + catCard.dataset.openCat; closeMobileSidebar(); }
});

// ---------- VIEWS ----------
function renderHome(){
  setActiveNav('home');
  const favs = TB_STORE.getFavorites();
  const recent = TB_STORE.getRecent();
  const counts = TB_STORE.getCounts();

  const popularIds = Object.keys(counts).length
    ? Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6).map(([id]) => id)
    : ['password-generator','json-formatter','base64','uuid-generator','color-converter','text-counter'];
  const popularTools = popularIds.map(id => TB_TOOLS.find(t => t.id === id)).filter(Boolean);

  const favTools = favs.map(id => TB_TOOLS.find(t => t.id === id)).filter(Boolean);
  const recentTools = recent.map(id => TB_TOOLS.find(t => t.id === id)).filter(Boolean);

  mainEl.innerHTML = `
    <div class="tb-section-title">⭐ Favorites</div>
    ${favTools.length
      ? `<div class="tb-card-grid">${favTools.map(toolCardHtml).join('')}</div>`
      : `<div class="tb-empty-hint">Tap the ★ on any tool to pin it here.</div>`}

    <div class="tb-section-title">🕘 Recently Used</div>
    ${recentTools.length
      ? `<div class="tb-card-grid">${recentTools.map(toolCardHtml).join('')}</div>`
      : `<div class="tb-empty-hint">Tools you open will show up here. Nothing you type is ever saved — just which tool you used.</div>`}

    <div class="tb-section-title">🔥 Popular Tools</div>
    <div class="tb-card-grid">${popularTools.map(toolCardHtml).join('')}</div>

    <div class="tb-section-title">📁 All Categories</div>
    <div class="tb-cat-grid">
      ${TB_CATEGORIES.map(c => {
        const count = TB_TOOLS.filter(t => t.cat === c.id).length;
        return `<button class="tb-cat-card" style="--accent:var(${c.accent})" data-open-cat="${c.id}">
          <span class="tb-tool-icon">${c.icon}</span>
          <div class="tb-tool-name">${c.label}</div>
          <div class="tb-cat-count">${count} tool${count===1?'':'s'}</div>
        </button>`;
      }).join('')}
    </div>
  `;
}

function renderCategory(catId){
  setActiveNav('cat:' + catId);
  const cat = tbCatMeta(catId);
  const tools = TB_TOOLS.filter(t => t.cat === catId);
  mainEl.innerHTML = `
    <div class="tb-breadcrumb"><button data-view-home>Home</button> / ${cat.icon} ${cat.label}</div>
    <div class="tb-section-title">${cat.icon} ${cat.label}</div>
    ${tools.length
      ? `<div class="tb-card-grid">${tools.map(toolCardHtml).join('')}</div>`
      : `<div class="tb-empty-hint">More ${cat.label.toLowerCase()} tools are coming soon — this category is on the roadmap.</div>`}
  `;
}

function renderTool(toolId){
  const tool = TB_TOOLS.find(t => t.id === toolId);
  if (!tool){ renderHome(); return; }
  setActiveNav('cat:' + tool.cat);
  TB_STORE.addRecent(tool.id);
  TB_STORE.bumpCount(tool.id);
  const cat = tbCatMeta(tool.cat);

  mainEl.innerHTML = `
    <div class="tb-breadcrumb">
      <button data-view-home>Home</button> / <button data-open-cat="${tool.cat}">${cat.label}</button> / ${tool.name}
    </div>
    <div class="tb-tool-header">
      <span class="tb-tool-icon" style="font-size:26px;">${tool.icon}</span>
      <h2>${tool.name}</h2>
      ${favBtnHtml(tool.id)}
    </div>
    <p class="tb-hint" style="margin-bottom:16px; max-width:560px;">${tool.desc}</p>
    <div id="toolMount"></div>
  `;
  tool.render(document.getElementById('toolMount'));
}

function renderSettings(){
  setActiveNav('settings');
  mainEl.innerHTML = `
    <div class="tb-section-title">⚙️ Settings</div>
    <div class="tb-panel">
      <div class="tb-settings-item">
        <div>
          <div style="font-weight:600; font-size:13px;">Clear favorites</div>
          <div class="tb-hint">Removes every tool you've starred.</div>
        </div>
        <button class="tb-btn tb-btn-sm" id="clearFavs">Clear</button>
      </div>
      <div class="tb-settings-item">
        <div>
          <div style="font-weight:600; font-size:13px;">Clear recently used</div>
          <div class="tb-hint">Just the list of tool names — no input data is ever stored.</div>
        </div>
        <button class="tb-btn tb-btn-sm" id="clearRecent">Clear</button>
      </div>
      <div class="tb-settings-item">
        <div>
          <div style="font-weight:600; font-size:13px;">Reset usage counts</div>
          <div class="tb-hint">Resets the "Popular Tools" ranking.</div>
        </div>
        <button class="tb-btn tb-btn-sm" id="clearCounts">Reset</button>
      </div>
    </div>
    <p class="tb-hint" style="margin-top:16px; max-width:560px;">
      Everything in this toolbox runs entirely in your browser. Nothing you type into any tool is ever sent to a server —
      only which tools you've opened and starred is remembered, stored locally on this device.
    </p>
  `;
  document.getElementById('clearFavs').addEventListener('click', () => { localStorage.removeItem(TB_STORE.favKey); alert('Favorites cleared.'); });
  document.getElementById('clearRecent').addEventListener('click', () => { localStorage.removeItem(TB_STORE.recentKey); alert('Recently used cleared.'); });
  document.getElementById('clearCounts').addEventListener('click', () => { localStorage.removeItem(TB_STORE.countKey); alert('Usage counts reset.'); });
}

document.body.addEventListener('click', (e) => {
  if (e.target.closest('[data-view-home]')) location.hash = '#/home';
});

// ---------- INTERVAL CLEANUP (so live clocks/countdowns don't leak when navigating away) ----------
window.__tbIntervals = [];
function tbAddInterval(id){ window.__tbIntervals.push(id); return id; }
function tbClearIntervals(){ window.__tbIntervals.forEach(id => clearInterval(id)); window.__tbIntervals = []; }

// ---------- ROUTER ----------
function route(){
  tbClearIntervals();
  const hash = location.hash.replace('#/', '');
  if (!hash || hash === 'home'){ renderHome(); return; }
  if (hash.startsWith('tool/')){ renderTool(hash.replace('tool/','')); return; }
  if (hash.startsWith('cat:')){ renderCategory(hash.replace('cat:','')); return; }
  if (hash === 'settings'){ renderSettings(); return; }
  renderHome();
}
window.addEventListener('hashchange', route);
route();

// ---------- SEARCH ----------
function runSearch(q){
  q = q.trim().toLowerCase();
  if (!q){ searchResults.classList.remove('open'); return; }
  const matches = TB_TOOLS.filter(t =>
    t.name.toLowerCase().includes(q) || tbCatMeta(t.cat).label.toLowerCase().includes(q)
  ).slice(0, 8);
  searchResults.innerHTML = matches.length
    ? matches.map(t => `<div class="tb-result-item" data-open-tool="${t.id}">
        <span>${t.icon}</span> ${t.name} <span class="tb-result-cat">${tbCatMeta(t.cat).label}</span>
      </div>`).join('')
    : `<div class="tb-result-empty">No tools match "${q}" yet — more are on the roadmap.</div>`;
  searchResults.classList.add('open');
}
searchInput.addEventListener('input', (e) => runSearch(e.target.value));
searchInput.addEventListener('focus', (e) => { if (e.target.value) runSearch(e.target.value); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tb-search-wrap')) searchResults.classList.remove('open');
});
document.body.addEventListener('click', (e) => {
  const item = e.target.closest('.tb-result-item[data-open-tool]');
  if (item){ searchInput.value=''; searchResults.classList.remove('open'); }
});

// ---------- COMMAND PALETTE ----------
const paletteBackdrop = document.getElementById('paletteBackdrop');
const paletteInput = document.getElementById('paletteInput');
const paletteResults = document.getElementById('paletteResults');
let paletteActiveIndex = 0;
let paletteMatches = [];

function paletteRender(q){
  q = q.trim().toLowerCase();
  paletteMatches = q
    ? TB_TOOLS.filter(t => t.name.toLowerCase().includes(q) || tbCatMeta(t.cat).label.toLowerCase().includes(q))
    : (TB_STORE.getRecent().map(id => TB_TOOLS.find(t => t.id === id)).filter(Boolean).length
        ? TB_STORE.getRecent().map(id => TB_TOOLS.find(t => t.id === id)).filter(Boolean)
        : TB_TOOLS.slice(0, 8));
  paletteMatches = paletteMatches.slice(0, 30);
  paletteActiveIndex = 0;
  paletteResults.innerHTML = paletteMatches.length
    ? paletteMatches.map((t,i) => `<div class="tb-palette-item ${i===0?'active':''}" data-i="${i}">
        <span class="pi-icon">${t.icon}</span> ${t.name}
        <span class="pi-cat">${tbCatMeta(t.cat).label}</span>
      </div>`).join('')
    : `<div class="tb-palette-empty">No tools match "${q}".</div>`;
}
function paletteHighlight(){
  paletteResults.querySelectorAll('.tb-palette-item').forEach((el,i) => el.classList.toggle('active', i === paletteActiveIndex));
  const activeEl = paletteResults.querySelector('.tb-palette-item.active');
  if (activeEl) activeEl.scrollIntoView({ block:'nearest' });
}
function openPalette(){
  paletteBackdrop.classList.add('open');
  paletteInput.value = '';
  paletteRender('');
  setTimeout(() => paletteInput.focus(), 10);
}
function closePalette(){ paletteBackdrop.classList.remove('open'); }
function paletteSelect(i){
  const tool = paletteMatches[i];
  if (tool){ location.hash = '#/tool/' + tool.id; closePalette(); }
}

paletteInput.addEventListener('input', (e) => paletteRender(e.target.value));
paletteBackdrop.addEventListener('click', (e) => { if (e.target === paletteBackdrop) closePalette(); });
paletteResults.addEventListener('click', (e) => {
  const item = e.target.closest('.tb-palette-item');
  if (item) paletteSelect(parseInt(item.dataset.i, 10));
});
paletteInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown'){ e.preventDefault(); paletteActiveIndex = Math.min(paletteMatches.length-1, paletteActiveIndex+1); paletteHighlight(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); paletteActiveIndex = Math.max(0, paletteActiveIndex-1); paletteHighlight(); }
  else if (e.key === 'Enter'){ e.preventDefault(); paletteSelect(paletteActiveIndex); }
  else if (e.key === 'Escape'){ closePalette(); }
});

// ---------- KEYBOARD SHORTCUT: Cmd/Ctrl+K opens the command palette ----------
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    paletteBackdrop.classList.contains('open') ? closePalette() : openPalette();
  }
  if (e.key === 'Escape'){
    closePalette();
    searchInput.blur();
    searchResults.classList.remove('open');
  }
});
