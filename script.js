// ---------- CONFIG ----------
// Add/remove tools by editing these arrays. `url` for AI/editing opens externally.
// Games point to local files in /games.

const CATEGORY_COLORS = {
  ai:        { var:'--cyan',   label:'AI Models' },
  design:    { var:'--teal',   label:'UI Design Tools' },
  devtools:  { var:'--amber',  label:'Dev Tools' },
  games:     { var:'--green',  label:'Games' },
  editing:   { var:'--violet', label:'Editing Tools' },
  community: { var:'--rose',   label:'Community' },
  social:    { var:'--indigo', label:'Social' },
};

const MODULES = [
  // ---------- AI ----------
  { cat:'ai', name:'ChatGPT',   badge:'GPT', desc:'OpenAI\'s general-purpose assistant.', url:'https://chat.openai.com', external:true },
  { cat:'ai', name:'Claude',    badge:'CLD', desc:'Anthropic\'s assistant for writing & reasoning.', url:'https://claude.ai', external:true },
  { cat:'ai', name:'Gemini',    badge:'GEM', desc:'Google\'s multimodal AI model.', url:'https://gemini.google.com', external:true },
  { cat:'ai', name:'DeepSeek',  badge:'DS',  desc:'Open-weight reasoning & chat model.', url:'https://www.deepseek.com', external:true },
  { cat:'ai', name:'Meta AI',   badge:'LLM', desc:'Meta\'s assistant, powered by Llama.', url:'https://www.meta.ai', external:true },
  { cat:'ai', name:'Perplexity',badge:'PPX', desc:'Answer engine with cited sources.', url:'https://www.perplexity.ai', external:true },
  { cat:'ai', name:'Copilot',   badge:'COP', desc:'Microsoft\'s AI assistant.', url:'https://copilot.microsoft.com', external:true },
  { cat:'ai', name:'Grok',      badge:'GRK', desc:'xAI\'s conversational model.', url:'https://grok.com', external:true },
  { cat:'ai', name:'Ollama',    badge:'OLA', desc:'Run open-source LLMs locally on your own machine.', url:'https://ollama.com', external:true },

  // ---------- UI DESIGN TOOLS ----------
  { cat:'design', name:'Figma',  badge:'FIG', desc:'Browser-based interface & product design, built for real-time team collaboration.', url:'https://www.figma.com', external:true },
  { cat:'design', name:'Sketch', badge:'SKT', desc:'Native Mac vector design tool for crafting UI, icons & prototypes.', url:'https://www.sketch.com', external:true },

  // ---------- DEV TOOLS ----------
  { cat:'devtools', name:'Developer Toolbox', badge:'DEV', desc:'Password generator, JSON formatter, Base64, UUIDs and more — all client-side, nothing leaves your browser.', url:'toolbox/index.html' },
  { cat:'devtools', name:'Encyclopedia', badge:'ENC', desc:'273 reference articles — languages, CS concepts, Linux/Kali, web, databases, AI, design & media tools.', url:'encyclopedia/index.html' },

  // ---------- EDITING ----------
  { cat:'editing', name:'Canva',     badge:'CNV', desc:'Drag-and-drop graphic design.', url:'https://www.canva.com', external:true },
  { cat:'editing', name:'Photopea',  badge:'PHP', desc:'Free browser-based Photoshop-style editor.', url:'https://www.photopea.com', external:true },
  { cat:'editing', name:'CapCut',    badge:'CC',  desc:'Video editing & captions.', url:'https://www.capcut.com', external:true },
  { cat:'editing', name:'Kapwing',   badge:'KPW', desc:'Online video editor & subtitles.', url:'https://www.kapwing.com', external:true },
  { cat:'editing', name:'Remove.bg', badge:'RBG', desc:'One-click background removal.', url:'https://www.remove.bg', external:true },

  // ---------- GAMES ----------
  { cat:'games', name:'Games', badge:'PLY', desc:'9 built-in games plus a curated directory of things to play — search, browse, or jump straight in.', url:'arcade-showcase.html' },

  // ---------- COMMUNITY ----------
  { cat:'community', name:'Live Chat', badge:'CHT', desc:'Real-time chat room with anyone else on the site.', url:'chat.html' },

  // ---------- SOCIAL ----------
  { cat:'social', name:'GitHub',   badge:'GH',  desc:'Source code and repositories.', url:'https://github.com', external:true },
  { cat:'social', name:'LinkedIn', badge:'LI',  desc:'Professional network.', url:'https://linkedin.com', external:true },
  { cat:'social', name:'Reddit',   badge:'RD',  desc:'Communities and discussion.', url:'https://reddit.com', external:true },
];

// ---------- RENDER ----------
const grid = document.getElementById('grid');
const switchboard = document.getElementById('switchboard');
const heroMeta = document.getElementById('heroMeta');
const countTag = document.getElementById('countTag');

const arrowIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;

let activeCat = 'all';

function categories() {
  const seen = [];
  MODULES.forEach(m => { if (!seen.includes(m.cat)) seen.push(m.cat); });
  return seen;
}

function renderSwitchboard() {
  const cats = ['all', ...categories()];
  switchboard.innerHTML = cats.map(c => {
    const isAll = c === 'all';
    const meta = isAll ? null : CATEGORY_COLORS[c];
    const label = isAll ? 'All Channels' : meta.label;
    const colorVar = isAll ? '--amber' : meta.var;
    const activeClass = c === activeCat ? 'active' : '';
    return `<button class="switch ${activeClass}" style="--cat-color:var(${colorVar})" data-cat="${c}">${label}</button>`;
  }).join('');

  switchboard.querySelectorAll('.switch').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      renderSwitchboard();
      renderGrid();
    });
  });
}

function renderGrid() {
  const items = activeCat === 'all' ? MODULES : MODULES.filter(m => m.cat === activeCat);
  grid.innerHTML = items.map((m, i) => {
    const colorVar = CATEGORY_COLORS[m.cat].var;
    const target = m.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `
      <a class="module" href="${m.url}"${target} style="--cat-color:var(${colorVar}); animation-delay:${i * 0.03}s">
        <div class="module-top">
          <div class="badge">${m.badge}</div>
          <div class="led"></div>
        </div>
        <div>
          <h3>${m.name}</h3>
          <p>${m.desc}</p>
        </div>
        <div class="goto">Launch ${arrowIcon}</div>
      </a>`;
  }).join('');
  countTag.textContent = `— ${items.length} MODULE${items.length === 1 ? '' : 'S'} LOADED`;
}

function renderMeta() {
  const total = MODULES.length;
  const aiCount = MODULES.filter(m => m.cat === 'ai').length;
  const GAMES_HUB_COUNT = 51; // 9 built + 42 curated — keep in sync with arcade/games-data.js
  heroMeta.innerHTML = `
    <div><strong>${total}</strong>TOTAL MODULES</div>
    <div><strong>${aiCount}</strong>AI CHANNELS</div>
    <div><strong>${GAMES_HUB_COUNT}</strong>GAMES IN HUB</div>
  `;
}

renderMeta();
renderSwitchboard();
renderGrid();
