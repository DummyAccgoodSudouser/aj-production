// =====================================================================
// AJ SOLUTION — DIGITAL ENCYCLOPEDIA
// Hash-based router + renderer, driven entirely by data.js (BRANCHES / ARTICLES).
// =====================================================================

// ---------- STORAGE (favorites / recently viewed — article IDs only, never input data) ----------
const E_STORE = {
  favKey: 'enc_favorites',
  recentKey: 'enc_recent',

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
    recent = recent.slice(0, 12);
    localStorage.setItem(this.recentKey, JSON.stringify(recent));
  },
};

// ---------- DOM refs ----------
const mainEl = document.getElementById('main');
const navBranchesEl = document.getElementById('navBranches');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const menuBtn = document.getElementById('menuBtn');

// ---------- MOBILE SIDEBAR ----------
function openMobileSidebar(){ sidebarEl.classList.add('open'); sidebarBackdrop.classList.add('open'); }
function closeMobileSidebar(){ sidebarEl.classList.remove('open'); sidebarBackdrop.classList.remove('open'); }
menuBtn.addEventListener('click', openMobileSidebar);
sidebarBackdrop.addEventListener('click', closeMobileSidebar);

// ---------- SIDEBAR BUILD ----------
function buildSidebar(){
  navBranchesEl.innerHTML = BRANCHES.filter(b => b.id !== 'dictionary').map(b => {
    const count = ARTICLES.filter(a => a.branch === b.id).length;
    return `<button class="e-nav-item" data-view="branch:${b.id}" style="--accent:var(${b.color})">
      <span class="e-nav-icon">${b.icon}</span> ${b.name} <span class="e-nav-count">${count}</span>
    </button>`;
  }).join('');
}
buildSidebar();

function setActiveNav(view){
  document.querySelectorAll('.e-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

document.body.addEventListener('click', (e) => {
  const navBtn = e.target.closest('.e-nav-item');
  if (navBtn){
    location.hash = '#/' + navBtn.dataset.view;
    closeMobileSidebar();
  }
});
document.body.addEventListener('click', (e) => {
  if (e.target.closest('[data-view-home]')) location.hash = '#/home';
});

// ---------- FAVORITE BUTTON HELPER ----------
function favBtnHtml(id, extraClass=''){
  const active = E_STORE.isFavorite(id) ? 'active' : '';
  return `<button class="e-fav-btn ${active} ${extraClass}" data-fav-toggle="${id}" title="Toggle favorite">★</button>`;
}
document.body.addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav-toggle]');
  if (favBtn){
    e.stopPropagation();
    E_STORE.toggleFavorite(favBtn.dataset.favToggle);
    favBtn.classList.toggle('active');
    if (location.hash === '#/home' || location.hash === '' || location.hash === '#/') renderHome();
  }
});

// ---------- HELPERS ----------
function esc(str){
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function articleCardHtml(a){
  const b = branchMeta(a.branch);
  return `<div class="e-article-card" style="--accent:var(${b.color})" data-open-article="${a.id}">
    ${favBtnHtml(a.id)}
    <span class="e-article-icon">${a.icon || b.icon}</span>
    <h4>${esc(a.name)}</h4>
    <span class="e-diff">${esc(a.difficulty || '')}</span>
    <p>${esc(a.summary)}</p>
  </div>`;
}

document.body.addEventListener('click', (e) => {
  if (e.target.closest('[data-fav-toggle]')) return;
  const card = e.target.closest('[data-open-article]');
  if (card){ location.hash = '#/article:' + card.dataset.openArticle; closeMobileSidebar(); }
  const branchCard = e.target.closest('[data-open-branch]');
  if (branchCard){ location.hash = '#/branch:' + branchCard.dataset.openBranch; closeMobileSidebar(); }
  const tagChip = e.target.closest('[data-open-tag]');
  if (tagChip){ location.hash = '#/tag:' + tagChip.dataset.openTag; closeMobileSidebar(); }
});

function footerHtml(){
  return `<footer class="e-footer">
    <span>AJ SOLUTION — DIGITAL ENCYCLOPEDIA</span>
    <span>${ARTICLES.length} ARTICLES · ${BRANCHES.length - 1} BRANCHES</span>
  </footer>`;
}

// ---------- HOME ----------
function renderHome(){
  setActiveNav('home');
  const total = ARTICLES.length;
  const branchCount = BRANCHES.length - 1; // exclude dictionary from the "branch" count shown
  const tagSet = new Set();
  ARTICLES.forEach(a => (a.tags || []).forEach(t => tagSet.add(t)));

  const favTools = E_STORE.getFavorites().map(id => ARTICLES_BY_ID[id]).filter(Boolean);
  const recentTools = E_STORE.getRecent().map(id => ARTICLES_BY_ID[id]).filter(Boolean);

  mainEl.innerHTML = `
    <div class="e-hero">
      <h2>Everything about computing, in one searchable place.</h2>
      <p>Programming languages, Linux & Kali Linux tools, editing software, AI, databases, design and a live multi-language dictionary —
      every entry follows the same format: what it is, why it matters, how it works, real examples, related topics and official links.</p>
      <div class="e-hero-stats">
        <div><strong>${total}</strong>ARTICLES</div>
        <div><strong>${branchCount}</strong>BRANCHES</div>
        <div><strong>${tagSet.size}</strong>TAGS</div>
      </div>
    </div>

    <div class="e-section-title">⭐ Favorites</div>
    ${favTools.length
      ? `<div class="e-card-grid">${favTools.map(articleCardHtml).join('')}</div>`
      : `<div class="e-empty-hint">Tap the ★ on any article to pin it here.</div>`}

    <div class="e-section-title">🕘 Recently Viewed</div>
    ${recentTools.length
      ? `<div class="e-card-grid">${recentTools.map(articleCardHtml).join('')}</div>`
      : `<div class="e-empty-hint">Articles you open will show up here.</div>`}

    <div class="e-section-title">🌐 Browse by branch</div>
    <div class="e-branch-grid" id="branchGrid"></div>

    <div class="e-section-title">🏷️ Popular tags</div>
    <div class="e-tag-cloud" id="tagCloudHome"></div>

    <div class="e-section-title">📚 Multi-language dictionary</div>
    <div class="e-branch-grid">
      <button class="e-branch-card" data-view="dictionary" style="--accent:var(--e-lime)">
        <span class="e-branch-icon">📚</span>
        <h3>Dictionary</h3>
        <p>Look up English word definitions, or translate a word into dozens of languages — live, right on this page.</p>
        <span class="e-branch-count">Open →</span>
      </button>
    </div>
    ${footerHtml()}
  `;

  const branchGrid = document.getElementById('branchGrid');
  branchGrid.innerHTML = BRANCHES.filter(b => b.id !== 'dictionary').map((b, i) => {
    const count = ARTICLES.filter(a => a.branch === b.id).length;
    return `<button class="e-branch-card" data-open-branch="${b.id}" style="--accent:var(${b.color}); animation-delay:${i*0.03}s">
      <span class="e-branch-icon">${b.icon}</span>
      <h3>${b.name}</h3>
      <p>${b.desc}</p>
      <span class="e-branch-count">${count} article${count===1?'':'s'} →</span>
    </button>`;
  }).join('');

  const popularTags = [...tagSet].slice(0, 24);
  document.getElementById('tagCloudHome').innerHTML = popularTags.map(t =>
    `<button class="e-tag-chip" data-open-tag="${esc(t)}">#${esc(t)}</button>`
  ).join('');
}

// ---------- BRANCH VIEW ----------
function renderBranch(branchId){
  const b = branchMeta(branchId);
  setActiveNav('branch:' + branchId);
  const items = ARTICLES.filter(a => a.branch === branchId);
  mainEl.innerHTML = `
    <div class="e-breadcrumb"><button data-view-home>Home</button> / ${b.icon} ${b.name}</div>
    <div class="e-visual-badge" style="--accent:var(${b.color})">${b.icon}</div>
    <div class="e-hero" style="border-bottom:none; padding-bottom:6px; margin-bottom:10px;">
      <h2 style="font-size:24px;">${b.icon} ${b.name}</h2>
      <p>${b.desc}</p>
    </div>
    <div class="e-section-title">${items.length} article${items.length===1?'':'s'}</div>
    ${items.length
      ? `<div class="e-card-grid">${items.map(articleCardHtml).join('')}</div>`
      : `<div class="e-empty-hint">More ${b.name.toLowerCase()} articles are on the way — check back soon.</div>`}
    ${footerHtml()}
  `;
}

function renderTagsIndex(){
  setActiveNav('tags');
  const tagCounts = {};
  ARTICLES.forEach(a => (a.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; }));
  const tags = Object.keys(tagCounts).sort();
  mainEl.innerHTML = `
    <div class="e-breadcrumb"><button data-view-home>Home</button> / 🏷️ Browse by Tag</div>
    <div class="e-section-title">🏷️ All tags</div>
    <div class="e-tag-cloud">
      ${tags.map(t => `<button class="e-tag-chip" data-open-tag="${esc(t)}">#${esc(t)} <span style="opacity:.5">(${tagCounts[t]})</span></button>`).join('')}
    </div>
    ${footerHtml()}
  `;
}

function renderTag(tag){
  setActiveNav('tags');
  const items = ARTICLES.filter(a => (a.tags||[]).includes(tag));
  mainEl.innerHTML = `
    <div class="e-breadcrumb"><button data-view-home>Home</button> / <button data-open-tag="${esc(tag)}" style="background:none;border:none;color:var(--text-dim);font-family:inherit;">Tags</button> / #${esc(tag)}</div>
    <div class="e-section-title">#${esc(tag)} — ${items.length} article${items.length===1?'':'s'}</div>
    ${items.length
      ? `<div class="e-card-grid">${items.map(articleCardHtml).join('')}</div>`
      : `<div class="e-empty-hint">No articles tagged "${esc(tag)}" yet.</div>`}
    ${footerHtml()}
  `;
}

// ---------- SETTINGS ----------
function renderSettings(){
  setActiveNav('settings');
  mainEl.innerHTML = `
    <div class="e-breadcrumb"><button data-view-home>Home</button> / ⚙️ Settings</div>
    <div class="e-section-title">⚙️ Settings</div>
    <div class="e-dict-panel" style="--accent:var(--e-cyan)">
      <div class="e-settings-item">
        <div>
          <div style="font-weight:600; font-size:13px;">Clear favorites</div>
          <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">Removes every article you've starred.</div>
        </div>
        <button class="e-dict-btn e-settings-btn" id="clearFavs">Clear</button>
      </div>
      <div class="e-settings-item">
        <div>
          <div style="font-weight:600; font-size:13px;">Clear recently viewed</div>
          <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">Just the list of article names — nothing else is ever stored.</div>
        </div>
        <button class="e-dict-btn e-settings-btn" id="clearRecent">Clear</button>
      </div>
    </div>
    <p class="e-dict-hint" style="max-width:560px;">
      Everything here runs entirely in your browser. The encyclopedia never sends what you view or star anywhere —
      it's stored locally on this device only, the same way the toolbox remembers your favorite tools.
    </p>
    ${footerHtml()}
  `;
  document.getElementById('clearFavs').addEventListener('click', () => {
    localStorage.removeItem(E_STORE.favKey);
    alert('Favorites cleared.');
    renderSettings();
  });
  document.getElementById('clearRecent').addEventListener('click', () => {
    localStorage.removeItem(E_STORE.recentKey);
    alert('Recently viewed cleared.');
    renderSettings();
  });
}

// ---------- ARTICLE DETAIL ----------
function listBlock(title, icon, items){
  if (!items || !items.length) return '';
  return `<div class="e-block">
    <h5>${icon} ${title}</h5>
    <ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  </div>`;
}

function renderArticle(id){
  const a = ARTICLES_BY_ID[id];
  if (!a){ renderHome(); return; }
  const b = branchMeta(a.branch);
  setActiveNav('branch:' + a.branch);
  E_STORE.addRecent(id);

  const relatedArticles = (a.related || []).map(rid => ARTICLES_BY_ID[rid]).filter(Boolean);

  mainEl.innerHTML = `
    <div class="e-breadcrumb">
      <button data-view-home>Home</button> / <button data-open-branch="${a.branch}">${b.icon} ${b.name}</button> / ${esc(a.name)}
    </div>

    <div class="e-visual-badge" style="--accent:var(${b.color})">${a.icon || b.icon}</div>

    <div class="e-article-header" style="--accent:var(${b.color})">
      <span class="e-article-icon">${a.icon || b.icon}</span>
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:10px;">
          <h2>${esc(a.name)}</h2>
          ${favBtnHtml(a.id, 'e-fav-btn-inline')}
        </div>
        <div class="e-article-meta">
          <span class="e-pill accent">${b.icon} ${b.name}</span>
          ${a.difficulty ? `<span class="e-pill">${esc(a.difficulty)}</span>` : ''}
          ${(a.tags||[]).map(t => `<span class="e-pill" style="cursor:pointer" data-open-tag="${esc(t)}">#${esc(t)}</span>`).join('')}
        </div>
      </div>
    </div>

    <p class="e-summary" style="--accent:var(${b.color})">${esc(a.summary)}</p>

    <div class="e-detail-grid" style="--accent:var(${b.color})">
      ${a.what ? `<div class="e-block" style="--accent:var(${b.color})"><h5>📌 What is it?</h5><p>${esc(a.what)}</p></div>` : ''}
      ${a.why ? `<div class="e-block" style="--accent:var(${b.color})"><h5>🎯 Why does it exist?</h5><p>${esc(a.why)}</p></div>` : ''}
      ${a.how ? `<div class="e-block" style="--accent:var(${b.color})"><h5>⚙️ How does it work?</h5><p>${esc(a.how)}</p></div>` : ''}
      ${listBlock('What is it used for?', '🧰', a.usedFor).replace('<div class="e-block">', `<div class="e-block" style="--accent:var(${b.color})">`)}
      ${listBlock('Where is it used?', '📍', a.whereUsed).replace('<div class="e-block">', `<div class="e-block" style="--accent:var(${b.color})">`)}
      ${listBlock('Limitations / things to know', '⚠️', a.limitations).replace('<div class="e-block">', `<div class="e-block" style="--accent:var(${b.color})">`)}

      ${a.example ? `<div class="e-block full" style="--accent:var(${b.color})">
        <h5>💡 Example</h5>
        <div class="e-code-block">${esc(a.example.code)}</div>
        ${a.example.output ? `<div class="e-code-output">${esc(a.example.output)}</div>` : ''}
      </div>` : ''}

      ${relatedArticles.length ? `<div class="e-block full" style="--accent:var(${b.color})">
        <h5>🔗 Related topics</h5>
        <div class="e-related-chips">
          ${relatedArticles.map(r => `<span class="e-related-chip" data-open-article="${r.id}">${r.icon||''} ${esc(r.name)}</span>`).join('')}
        </div>
      </div>` : ''}

      ${(a.links && a.links.length) ? `<div class="e-block full" style="--accent:var(${b.color})">
        <h5>🌐 Official resources</h5>
        <div class="e-links-list">
          ${a.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(l.label)}</a>`).join('')}
        </div>
      </div>` : ''}
    </div>
    ${footerHtml()}
  `;
}

// ---------- DICTIONARY ----------
const DICT_LANGS = [
  { code:'en', name:'English' }, { code:'es', name:'Spanish' }, { code:'fr', name:'French' },
  { code:'de', name:'German' }, { code:'it', name:'Italian' }, { code:'pt', name:'Portuguese' },
  { code:'hi', name:'Hindi' }, { code:'zh', name:'Chinese' }, { code:'ja', name:'Japanese' },
  { code:'ko', name:'Korean' }, { code:'ar', name:'Arabic' }, { code:'ru', name:'Russian' },
  { code:'ta', name:'Tamil' }, { code:'te', name:'Telugu' }, { code:'bn', name:'Bengali' },
  { code:'ur', name:'Urdu' }, { code:'tr', name:'Turkish' }, { code:'nl', name:'Dutch' },
  { code:'pl', name:'Polish' }, { code:'vi', name:'Vietnamese' }, { code:'th', name:'Thai' },
  { code:'id', name:'Indonesian' }, { code:'sw', name:'Swahili' }, { code:'el', name:'Greek' },
];

let dictMode = 'define'; // 'define' | 'translate'

function langOptions(selectedCode){
  return DICT_LANGS.map(l => `<option value="${l.code}" ${l.code===selectedCode?'selected':''}>${l.name}</option>`).join('');
}

function renderDictionary(){
  setActiveNav('dictionary');
  mainEl.innerHTML = `
    <div class="e-breadcrumb"><button data-view-home>Home</button> / 📚 Dictionary</div>
    <div class="e-visual-badge" style="--accent:var(--e-lime)">📚</div>
    <div class="e-hero" style="border-bottom:none; padding-bottom:6px; margin-bottom:6px;">
      <h2 style="font-size:24px;">📚 Multi-Language Dictionary</h2>
      <p>Look up an English word's definitions & synonyms, or translate any word/phrase into dozens of languages — fetched live, right here.</p>
    </div>

    <div class="e-dict-panel" style="--accent:var(--e-lime)">
      <div class="e-dict-tabs">
        <button class="e-dict-tab ${dictMode==='define'?'active':''}" id="tabDefine">🧠 Define (English)</button>
        <button class="e-dict-tab ${dictMode==='translate'?'active':''}" id="tabTranslate">🌍 Translate</button>
      </div>
      <div id="dictForm"></div>
      <div class="e-dict-result" id="dictResult"></div>
      <p class="e-dict-hint">Definitions via the Free Dictionary API. Translations via the MyMemory Translation API. Both run live in your browser — quality can vary for less common languages.</p>
    </div>
    ${footerHtml()}
  `;

  document.getElementById('tabDefine').addEventListener('click', () => { dictMode='define'; renderDictionary(); });
  document.getElementById('tabTranslate').addEventListener('click', () => { dictMode='translate'; renderDictionary(); });

  const formEl = document.getElementById('dictForm');
  const resultEl = document.getElementById('dictResult');

  if (dictMode === 'define'){
    formEl.innerHTML = `
      <div class="e-dict-row">
        <input class="e-dict-input" id="dictWord" type="text" placeholder="Type an English word… e.g. algorithm" autocomplete="off">
        <button class="e-dict-btn" id="dictGo">Define</button>
      </div>
    `;
    const wordInput = document.getElementById('dictWord');
    const go = () => defineWord(wordInput.value.trim(), resultEl);
    document.getElementById('dictGo').addEventListener('click', go);
    wordInput.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    wordInput.focus();
  } else {
    formEl.innerHTML = `
      <div class="e-dict-row">
        <input class="e-dict-input" id="dictWord" type="text" placeholder="Type a word or phrase…" autocomplete="off">
      </div>
      <div class="e-dict-row">
        <select class="e-dict-select" id="dictFrom">${langOptions('en')}</select>
        <button class="e-dict-swap" id="dictSwap" title="Swap languages">⇄</button>
        <select class="e-dict-select" id="dictTo">${langOptions('es')}</select>
        <button class="e-dict-btn" id="dictGo">Translate</button>
      </div>
    `;
    const wordInput = document.getElementById('dictWord');
    const fromSel = document.getElementById('dictFrom');
    const toSel = document.getElementById('dictTo');
    const go = () => translateWord(wordInput.value.trim(), fromSel.value, toSel.value, resultEl);
    document.getElementById('dictGo').addEventListener('click', go);
    document.getElementById('dictSwap').addEventListener('click', () => {
      const f = fromSel.value; fromSel.value = toSel.value; toSel.value = f;
    });
    wordInput.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    wordInput.focus();
  }
}

async function defineWord(word, resultEl){
  if (!word){ resultEl.innerHTML = `<div class="e-dict-error">Type a word first.</div>`; return; }
  resultEl.innerHTML = `<div class="e-dict-loading"><span class="e-spin"></span> Looking up "${esc(word)}"…</div>`;
  try{
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (res.status === 404){
      resultEl.innerHTML = `<div class="e-dict-error">No definition found for "${esc(word)}". Try the Translate tab for non-English words.</div>`;
      return;
    }
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    const entry = data[0];
    const phonetic = entry.phonetic || (entry.phonetics || []).map(p => p.text).find(Boolean) || '';
    let html = `<div class="e-dict-word">${esc(entry.word)}</div>`;
    if (phonetic) html += `<div class="e-dict-phonetic">${esc(phonetic)}</div>`;
    (entry.meanings || []).forEach(m => {
      html += `<div class="e-dict-meaning">`;
      html += `<span class="e-dict-pos">${esc(m.partOfSpeech)}</span>`;
      (m.definitions || []).slice(0, 4).forEach((d, i) => {
        html += `<div class="e-dict-def"><span class="e-dict-def-num">${i+1}.</span>${esc(d.definition)}</div>`;
        if (d.example) html += `<div class="e-dict-example">"${esc(d.example)}"</div>`;
      });
      const syn = (m.synonyms || []).slice(0, 6);
      if (syn.length) html += `<div class="e-dict-syn">Synonyms: ${syn.map(esc).join(', ')}</div>`;
      html += `</div>`;
    });
    resultEl.innerHTML = html;
  }catch(err){
    console.error('Dictionary lookup failed:', err);
    const reason = (err && err.message === 'Failed to fetch')
      ? 'Could not reach the dictionary API — check your internet connection, or this page may be running from a local file instead of a live web address.'
      : `Something went wrong (${err && err.message ? esc(err.message) : 'unknown error'}).`;
    resultEl.innerHTML = `<div class="e-dict-error">${reason}</div>`;
  }
}

async function translateWord(word, from, to, resultEl){
  if (!word){ resultEl.innerHTML = `<div class="e-dict-error">Type a word or phrase first.</div>`; return; }
  resultEl.innerHTML = `<div class="e-dict-loading"><span class="e-spin"></span> Translating…</div>`;
  try{
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`);
    if (!res.ok) throw new Error('translation failed');
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated) throw new Error('no translation');
    resultEl.innerHTML = `
      <div style="font-size:12.5px; color:var(--text-dim); margin-bottom:4px;">${esc(word)} (${from} → ${to})</div>
      <div class="e-dict-translation">${esc(translated)}</div>
    `;
  }catch(err){
    resultEl.innerHTML = `<div class="e-dict-error">Couldn't translate "${esc(word)}" right now — try again in a moment.</div>`;
  }
}

// ---------- ROUTER ----------
function route(){
  const hash = location.hash.replace('#/', '');
  if (!hash || hash === 'home'){ renderHome(); return; }
  if (hash.startsWith('article:')){ renderArticle(hash.replace('article:','')); window.scrollTo(0,0); return; }
  if (hash.startsWith('branch:')){ renderBranch(hash.replace('branch:','')); window.scrollTo(0,0); return; }
  if (hash.startsWith('tag:')){ renderTag(decodeURIComponent(hash.replace('tag:',''))); window.scrollTo(0,0); return; }
  if (hash === 'tags'){ renderTagsIndex(); return; }
  if (hash === 'settings'){ renderSettings(); window.scrollTo(0,0); return; }
  if (hash === 'dictionary'){ renderDictionary(); return; }
  renderHome();
}
window.addEventListener('hashchange', route);
route();

// ---------- SEARCH ----------
function runSearch(q){
  q = q.trim().toLowerCase();
  if (!q){ searchResults.classList.remove('open'); return; }
  const matches = ARTICLES.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.summary && a.summary.toLowerCase().includes(q)) ||
    (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
    branchMeta(a.branch).name.toLowerCase().includes(q)
  ).slice(0, 10);
  searchResults.innerHTML = matches.length
    ? matches.map(a => {
        const b = branchMeta(a.branch);
        return `<div class="e-result-item" data-open-article="${a.id}" style="--accent:var(${b.color})">
          <span>${a.icon || b.icon}</span> ${esc(a.name)} <span class="e-result-branch">${b.name}</span>
        </div>`;
      }).join('')
    : `<div class="e-result-empty">No articles match "${esc(q)}" yet — try a different term, or check the Dictionary tab.</div>`;
  searchResults.classList.add('open');
}
searchInput.addEventListener('input', e => runSearch(e.target.value));
searchInput.addEventListener('focus', e => { if (e.target.value) runSearch(e.target.value); });
document.addEventListener('click', e => {
  if (!e.target.closest('.e-search-wrap')) searchResults.classList.remove('open');
});
document.body.addEventListener('click', e => {
  const item = e.target.closest('.e-result-item[data-open-article]');
  if (item){ searchInput.value=''; searchResults.classList.remove('open'); }
});
