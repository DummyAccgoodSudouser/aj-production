// ---------- CATEGORY DEFINITIONS ----------
const TB_CATEGORIES = [
  { id:'security',    label:'Security',        icon:'🔐', accent:'--cyan' },
  { id:'text',        label:'Text',            icon:'📝', accent:'--green' },
  { id:'code',        label:'Code',            icon:'💻', accent:'--violet' },
  { id:'convert',     label:'Encoder / Decoder',icon:'🔄', accent:'--rose' },
  { id:'design',      label:'Design / CSS',    icon:'🎨', accent:'--teal' },
  { id:'web',         label:'Web',             icon:'🌐', accent:'--amber' },
  { id:'files',       label:'File Tools',      icon:'📦', accent:'--coral' },
  { id:'data',        label:'Data',            icon:'📊', accent:'--periwinkle' },
  { id:'testing',     label:'Testing',         icon:'🧪', accent:'--magenta' },
  { id:'calculators', label:'Calculators',     icon:'📐', accent:'--gold' },
  { id:'datetime',    label:'Date & Time',     icon:'🕐', accent:'--sky' },
  { id:'generators',  label:'Generators',      icon:'🧬', accent:'--lime' },
  { id:'responsive',  label:'Responsive Design',icon:'📱', accent:'--red' },
  { id:'reference',   label:'References',      icon:'📚', accent:'--lavender' },
];

function tbCatMeta(id){ return TB_CATEGORIES.find(c => c.id === id) || TB_CATEGORIES[0]; }

// ---------- HELPERS ----------
function tbEl(html){ const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function tbCopy(text, btn){
  navigator.clipboard?.writeText(text).then(() => {
    if (btn){ const old = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = old, 1100); }
  });
}

// ---------- TOOL REGISTRY ----------
// Each tool: { id, name, cat, icon, desc, render(container) }
const TB_TOOLS = [];

// 1. PASSWORD GENERATOR ------------------------------------------------
TB_TOOLS.push({
  id:'password-generator', name:'Password Generator', cat:'security', icon:'🔐',
  desc:'Cryptographically random passwords. Generated in your browser, never stored, never sent anywhere.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row" style="gap:8px;">
          <input type="text" class="tb-output" id="pwOut" readonly style="flex:1; font-size:16px;" value="">
          <button class="tb-btn tb-btn-sm" id="pwCopy">Copy</button>
        </div>
        <div class="tb-row" style="flex-direction:column; align-items:stretch;">
          <span class="tb-label">Length</span>
          <div class="tb-slider-row">
            <input type="range" min="4" max="64" value="16" class="tb-slider" id="pwLen">
            <span class="tb-slider-val" id="pwLenVal">16</span>
          </div>
        </div>
        <div class="tb-row tb-check-row">
          <label class="tb-check"><input type="checkbox" id="pwUpper" checked> Uppercase (A-Z)</label>
          <label class="tb-check"><input type="checkbox" id="pwLower" checked> Lowercase (a-z)</label>
          <label class="tb-check"><input type="checkbox" id="pwNum" checked> Numbers (0-9)</label>
          <label class="tb-check"><input type="checkbox" id="pwSym" checked> Symbols (!@#$)</label>
        </div>
        <div class="tb-strength-bar"><div class="tb-strength-fill" id="pwStrength"></div></div>
        <div class="tb-hint" id="pwStrengthLabel">Strength: —</div>
        <div class="tb-row" style="margin-top:16px;">
          <button class="tb-btn tb-btn-primary" id="pwGen">Generate</button>
        </div>
      </div>`;
    const out = container.querySelector('#pwOut');
    const len = container.querySelector('#pwLen');
    const lenVal = container.querySelector('#pwLenVal');
    const upper = container.querySelector('#pwUpper');
    const lower = container.querySelector('#pwLower');
    const num = container.querySelector('#pwNum');
    const sym = container.querySelector('#pwSym');
    const strength = container.querySelector('#pwStrength');
    const strengthLabel = container.querySelector('#pwStrengthLabel');

    function generate(){
      let chars = '';
      if (upper.checked) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      if (lower.checked) chars += 'abcdefghijkmnpqrstuvwxyz';
      if (num.checked) chars += '23456789';
      if (sym.checked) chars += '!@#$%^&*()-_=+[]{}';
      if (!chars){ out.value = ''; return; }
      const L = parseInt(len.value, 10);
      const arr = new Uint32Array(L);
      crypto.getRandomValues(arr);
      let pw = '';
      for (let i = 0; i < L; i++) pw += chars[arr[i] % chars.length];
      out.value = pw;

      let score = 0;
      if (upper.checked) score++;
      if (lower.checked) score++;
      if (num.checked) score++;
      if (sym.checked) score++;
      score += L >= 12 ? 2 : L >= 8 ? 1 : 0;
      const pct = Math.min(100, (score / 6) * 100);
      const color = pct < 40 ? 'var(--rose)' : pct < 75 ? 'var(--gold)' : 'var(--green)';
      strength.style.width = pct + '%';
      strength.style.background = color;
      strengthLabel.textContent = 'Strength: ' + (pct < 40 ? 'Weak' : pct < 75 ? 'Good' : 'Strong');
    }
    len.addEventListener('input', () => { lenVal.textContent = len.value; generate(); });
    [upper, lower, num, sym].forEach(el => el.addEventListener('change', generate));
    container.querySelector('#pwGen').addEventListener('click', generate);
    container.querySelector('#pwCopy').addEventListener('click', (e) => tbCopy(out.value, e.target));
    generate();
  }
});

// 2. JSON FORMATTER / VALIDATOR -----------------------------------------
TB_TOOLS.push({
  id:'json-formatter', name:'JSON Formatter', cat:'code', icon:'💻',
  desc:'Format, validate and minify JSON — all in-browser.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Input</span>
        <textarea class="tb-textarea" id="jsonIn" placeholder='{"hello":"world"}'></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <button class="tb-btn tb-btn-primary" id="jsonFormat">Format</button>
          <button class="tb-btn" id="jsonMinify">Minify</button>
          <button class="tb-btn" id="jsonClear">Clear</button>
        </div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="jsonOut">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="jsonCopy">Copy Output</button>
        </div>
      </div>`;
    const input = container.querySelector('#jsonIn');
    const out = container.querySelector('#jsonOut');
    function run(mode){
      try{
        const parsed = JSON.parse(input.value);
        out.classList.remove('tb-error');
        out.textContent = mode === 'min' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      }catch(err){
        out.classList.add('tb-error');
        out.textContent = 'Invalid JSON — ' + err.message;
      }
    }
    container.querySelector('#jsonFormat').addEventListener('click', () => run('pretty'));
    container.querySelector('#jsonMinify').addEventListener('click', () => run('min'));
    container.querySelector('#jsonClear').addEventListener('click', () => { input.value=''; out.textContent='Result appears here.'; out.classList.remove('tb-error'); });
    container.querySelector('#jsonCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 3. BASE64 ENCODER / DECODER --------------------------------------------
TB_TOOLS.push({
  id:'base64', name:'Base64 Encoder / Decoder', cat:'convert', icon:'🔄',
  desc:'Convert text to and from Base64.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Input</span>
        <textarea class="tb-textarea" id="b64In" placeholder="Type or paste text…"></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <button class="tb-btn tb-btn-primary" id="b64Encode">Encode</button>
          <button class="tb-btn" id="b64Decode">Decode</button>
          <button class="tb-btn" id="b64Clear">Clear</button>
        </div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="b64Out">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="b64Copy">Copy Output</button>
        </div>
      </div>`;
    const input = container.querySelector('#b64In');
    const out = container.querySelector('#b64Out');
    container.querySelector('#b64Encode').addEventListener('click', () => {
      try{ out.classList.remove('tb-error'); out.textContent = btoa(unescape(encodeURIComponent(input.value))); }
      catch(e){ out.classList.add('tb-error'); out.textContent = 'Could not encode input.'; }
    });
    container.querySelector('#b64Decode').addEventListener('click', () => {
      try{ out.classList.remove('tb-error'); out.textContent = decodeURIComponent(escape(atob(input.value.trim()))); }
      catch(e){ out.classList.add('tb-error'); out.textContent = 'Invalid Base64 input.'; }
    });
    container.querySelector('#b64Clear').addEventListener('click', () => { input.value=''; out.textContent='Result appears here.'; out.classList.remove('tb-error'); });
    container.querySelector('#b64Copy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 4. UUID GENERATOR --------------------------------------------------------
TB_TOOLS.push({
  id:'uuid-generator', name:'UUID Generator', cat:'generators', icon:'🧬',
  desc:'Generate RFC-4122 v4 UUIDs.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <span class="tb-label" style="margin:0;">How many?</span>
          <input type="number" id="uuidCount" class="tb-input" value="5" min="1" max="50" style="width:90px;">
          <button class="tb-btn tb-btn-primary" id="uuidGen">Generate</button>
        </div>
        <div class="tb-output" id="uuidOut" style="margin-top:10px;">Click generate.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="uuidCopy">Copy All</button>
        </div>
      </div>`;
    const out = container.querySelector('#uuidOut');
    function gen(){
      const n = Math.min(50, Math.max(1, parseInt(container.querySelector('#uuidCount').value, 10) || 1));
      const list = [];
      for (let i = 0; i < n; i++) list.push(crypto.randomUUID());
      out.textContent = list.join('\n');
    }
    container.querySelector('#uuidGen').addEventListener('click', gen);
    container.querySelector('#uuidCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
    gen();
  }
});

// 5. TEXT COUNTER ------------------------------------------------------
TB_TOOLS.push({
  id:'text-counter', name:'Text Counter', cat:'text', icon:'📝',
  desc:'Word, character and line counts, live as you type.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <textarea class="tb-textarea" id="tcIn" placeholder="Start typing or paste text…" style="min-height:160px;"></textarea>
        <div class="tb-card-grid" style="margin-top:14px; grid-template-columns:repeat(auto-fit,minmax(110px,1fr));">
          <div class="tb-tool-card" style="--accent:var(--green);"><div class="tb-tool-name" id="tcWords">0</div><div class="tb-tool-cat">Words</div></div>
          <div class="tb-tool-card" style="--accent:var(--green);"><div class="tb-tool-name" id="tcChars">0</div><div class="tb-tool-cat">Characters</div></div>
          <div class="tb-tool-card" style="--accent:var(--green);"><div class="tb-tool-name" id="tcLines">0</div><div class="tb-tool-cat">Lines</div></div>
          <div class="tb-tool-card" style="--accent:var(--green);"><div class="tb-tool-name" id="tcSent">0</div><div class="tb-tool-cat">Sentences</div></div>
        </div>
      </div>`;
    const input = container.querySelector('#tcIn');
    function update(){
      const v = input.value;
      const words = v.trim() ? v.trim().split(/\s+/).length : 0;
      const chars = v.length;
      const lines = v ? v.split(/\n/).length : 0;
      const sentences = v.trim() ? (v.match(/[.!?]+(\s|$)/g) || []).length : 0;
      container.querySelector('#tcWords').textContent = words;
      container.querySelector('#tcChars').textContent = chars;
      container.querySelector('#tcLines').textContent = lines;
      container.querySelector('#tcSent').textContent = sentences;
    }
    input.addEventListener('input', update);
    update();
  }
});

// 6. COLOR CONVERTER -----------------------------------------------------
TB_TOOLS.push({
  id:'color-converter', name:'Color Converter', cat:'design', icon:'🎨',
  desc:'Convert between HEX, RGB and HSL, with a live preview.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-swatch" id="ccSwatch"></div>
        <div class="tb-row">
          <input type="color" id="ccPicker" value="#5CCFE6" style="width:52px; height:40px; border:none; background:none; border-radius:8px;">
          <input type="text" class="tb-input" id="ccHex" value="#5CCFE6" style="flex:1;">
        </div>
        <div style="margin-top:14px; display:flex; flex-direction:column; gap:10px;">
          <div><span class="tb-label" style="display:inline;">RGB</span><div class="tb-output" id="ccRgb" style="margin-top:4px;"></div></div>
          <div><span class="tb-label" style="display:inline;">HSL</span><div class="tb-output" id="ccHsl" style="margin-top:4px;"></div></div>
        </div>
      </div>`;
    const picker = container.querySelector('#ccPicker');
    const hexIn = container.querySelector('#ccHex');
    const swatch = container.querySelector('#ccSwatch');
    const rgbOut = container.querySelector('#ccRgb');
    const hslOut = container.querySelector('#ccHsl');

    function hexToRgb(hex){
      hex = hex.replace('#','');
      if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
      const num = parseInt(hex, 16);
      return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
    }
    function rgbToHsl(r,g,b){
      r/=255; g/=255; b/=255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b);
      let h,s,l=(max+min)/2;
      if(max===min){ h=s=0; }
      else{
        const d=max-min;
        s = l>0.5 ? d/(2-max-min) : d/(max+min);
        switch(max){
          case r: h=(g-b)/d+(g<b?6:0); break;
          case g: h=(b-r)/d+2; break;
          case b: h=(r-g)/d+4; break;
        }
        h/=6;
      }
      return { h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100) };
    }
    function update(hex){
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex) && !/^#[0-9A-Fa-f]{3}$/.test(hex)) return;
      const {r,g,b} = hexToRgb(hex);
      const {h,s,l} = rgbToHsl(r,g,b);
      swatch.style.background = hex;
      picker.value = hex.length === 4 ? '#'+hex.slice(1).split('').map(c=>c+c).join('') : hex;
      rgbOut.textContent = `rgb(${r}, ${g}, ${b})`;
      hslOut.textContent = `hsl(${h}, ${s}%, ${l}%)`;
    }
    picker.addEventListener('input', () => { hexIn.value = picker.value; update(picker.value); });
    hexIn.addEventListener('input', () => update(hexIn.value.trim()));
    update('#5CCFE6');
  }
});

// 7. CSS GRADIENT GENERATOR ------------------------------------------------
TB_TOOLS.push({
  id:'gradient-generator', name:'CSS Gradient Generator', cat:'design', icon:'🎨',
  desc:'Build a linear gradient visually and copy the CSS.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-swatch" id="gradPreview" style="height:110px;"></div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Color 1</span><input type="color" id="gradC1" value="#5CCFE6" style="width:100%; height:40px; border:none; border-radius:8px;"></div>
          <div style="flex:1;"><span class="tb-label">Color 2</span><input type="color" id="gradC2" value="#B9A3FF" style="width:100%; height:40px; border:none; border-radius:8px;"></div>
        </div>
        <div class="tb-row" style="flex-direction:column; align-items:stretch; margin-top:8px;">
          <span class="tb-label">Angle</span>
          <div class="tb-slider-row">
            <input type="range" min="0" max="360" value="135" class="tb-slider" id="gradAngle">
            <span class="tb-slider-val" id="gradAngleVal">135°</span>
          </div>
        </div>
        <div class="tb-output" id="gradCss" style="margin-top:10px;"></div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="gradCopy">Copy CSS</button>
        </div>
      </div>`;
    const c1 = container.querySelector('#gradC1');
    const c2 = container.querySelector('#gradC2');
    const angle = container.querySelector('#gradAngle');
    const angleVal = container.querySelector('#gradAngleVal');
    const preview = container.querySelector('#gradPreview');
    const cssOut = container.querySelector('#gradCss');
    function update(){
      const css = `background: linear-gradient(${angle.value}deg, ${c1.value}, ${c2.value});`;
      preview.style.background = `linear-gradient(${angle.value}deg, ${c1.value}, ${c2.value})`;
      cssOut.textContent = css;
      angleVal.textContent = angle.value + '°';
    }
    [c1, c2, angle].forEach(el => el.addEventListener('input', update));
    container.querySelector('#gradCopy').addEventListener('click', (e) => tbCopy(cssOut.textContent, e.target));
    update();
  }
});

// 8. UNIX TIMESTAMP CONVERTER --------------------------------------------
TB_TOOLS.push({
  id:'unix-timestamp', name:'Unix Timestamp Converter', cat:'datetime', icon:'🕐',
  desc:'Convert between Unix timestamps and human-readable dates.',
  render(container){
    const nowSec = Math.floor(Date.now()/1000);
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Unix Timestamp (seconds)</span>
        <div class="tb-row">
          <input type="text" class="tb-input" id="utsIn" value="${nowSec}">
          <button class="tb-btn tb-btn-sm" id="utsNow">Now</button>
        </div>
        <div class="tb-output" id="utsDate" style="margin-top:6px;"></div>

        <span class="tb-label" style="margin-top:16px;">Human Date</span>
        <input type="datetime-local" class="tb-input" id="utsDateIn">
        <div class="tb-output" id="utsSeconds" style="margin-top:6px;"></div>
      </div>`;
    const tsIn = container.querySelector('#utsIn');
    const dateOut = container.querySelector('#utsDate');
    const dateIn = container.querySelector('#utsDateIn');
    const secOut = container.querySelector('#utsSeconds');

    function fromTs(){
      const ts = parseInt(tsIn.value, 10);
      if (isNaN(ts)){ dateOut.textContent = 'Enter a valid number.'; dateOut.classList.add('tb-error'); return; }
      dateOut.classList.remove('tb-error');
      const d = new Date(ts * 1000);
      dateOut.textContent = d.toUTCString() + '  (local: ' + d.toLocaleString() + ')';
    }
    function fromDate(){
      if (!dateIn.value){ secOut.textContent = ''; return; }
      const ts = Math.floor(new Date(dateIn.value).getTime() / 1000);
      secOut.textContent = 'Unix timestamp: ' + ts;
    }
    tsIn.addEventListener('input', fromTs);
    dateIn.addEventListener('input', fromDate);
    container.querySelector('#utsNow').addEventListener('click', () => { tsIn.value = Math.floor(Date.now()/1000); fromTs(); });
    fromTs();
  }
});

// 9. LOREM IPSUM GENERATOR ------------------------------------------------
TB_TOOLS.push({
  id:'lorem-ipsum', name:'Lorem Ipsum Generator', cat:'generators', icon:'🧬',
  desc:'Generate placeholder text by paragraphs, sentences or words.',
  render(container){
    const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <select class="tb-select" id="loremType" style="max-width:160px;">
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
          <input type="number" class="tb-input" id="loremCount" value="3" min="1" max="50" style="width:90px;">
          <button class="tb-btn tb-btn-primary" id="loremGen">Generate</button>
        </div>
        <div class="tb-output" id="loremOut" style="margin-top:10px; max-height:260px; overflow-y:auto;"></div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="loremCopy">Copy</button>
        </div>
      </div>`;
    function sentence(){
      const len = 6 + Math.floor(Math.random()*9);
      let words = [];
      for (let i=0;i<len;i++) words.push(WORDS[Math.floor(Math.random()*WORDS.length)]);
      let s = words.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }
    function paragraph(){
      const count = 3 + Math.floor(Math.random()*4);
      let s = [];
      for (let i=0;i<count;i++) s.push(sentence());
      return s.join(' ');
    }
    const out = container.querySelector('#loremOut');
    function gen(){
      const type = container.querySelector('#loremType').value;
      const n = Math.min(50, Math.max(1, parseInt(container.querySelector('#loremCount').value,10) || 1));
      let result;
      if (type === 'paragraphs'){
        result = Array.from({length:n}, paragraph).join('\n\n');
      } else if (type === 'sentences'){
        result = Array.from({length:n}, sentence).join(' ');
      } else {
        let words = [];
        for (let i=0;i<n;i++) words.push(WORDS[Math.floor(Math.random()*WORDS.length)]);
        result = words.join(' ');
      }
      out.textContent = result;
    }
    container.querySelector('#loremGen').addEventListener('click', gen);
    container.querySelector('#loremCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
    gen();
  }
});

// 10. URL ENCODER / DECODER ------------------------------------------------
TB_TOOLS.push({
  id:'url-encoder', name:'URL Encoder / Decoder', cat:'convert', icon:'🔄',
  desc:'Percent-encode or decode text and URLs.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Input</span>
        <textarea class="tb-textarea" id="urlIn" placeholder="https://example.com/search?q=hello world"></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <button class="tb-btn tb-btn-primary" id="urlEncode">Encode</button>
          <button class="tb-btn" id="urlDecode">Decode</button>
          <button class="tb-btn" id="urlClear">Clear</button>
        </div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="urlOut">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="urlCopy">Copy Output</button>
        </div>
      </div>`;
    const input = container.querySelector('#urlIn');
    const out = container.querySelector('#urlOut');
    container.querySelector('#urlEncode').addEventListener('click', () => {
      out.classList.remove('tb-error');
      out.textContent = encodeURIComponent(input.value);
    });
    container.querySelector('#urlDecode').addEventListener('click', () => {
      try{ out.classList.remove('tb-error'); out.textContent = decodeURIComponent(input.value); }
      catch(e){ out.classList.add('tb-error'); out.textContent = 'Invalid percent-encoded input.'; }
    });
    container.querySelector('#urlClear').addEventListener('click', () => { input.value=''; out.textContent='Result appears here.'; out.classList.remove('tb-error'); });
    container.querySelector('#urlCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// =====================================================================
// PHASE 2
// =====================================================================

// ---------- shared file-tool helpers ----------
function tbFmtBytes(bytes){
  if (bytes === 0) return '0 B';
  const units = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}
function tbBufToHex(buf){
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function tbWireDropzone(zone, input, onFile){
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { if (input.files[0]) onFile(input.files[0]); });
  ['dragover','dragenter'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }));
  zone.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) onFile(f); });
}

// 11. FILE → BASE64 -------------------------------------------------------
TB_TOOLS.push({
  id:'file-to-base64', name:'File → Base64', cat:'files', icon:'📦',
  desc:'Upload any file and get its Base64 representation. The file is read entirely in your browser — never uploaded anywhere.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-dropzone" id="f2bZone">
          <span class="tb-dz-icon">📤</span>
          Tap to choose a file, or drag one here
          <input type="file" class="tb-file-input" id="f2bInput">
        </div>
        <div class="tb-file-meta" id="f2bMeta"></div>
        <img class="tb-preview-img" id="f2bPreview" style="display:none;">
        <span class="tb-label" style="margin-top:14px;">Base64 Output</span>
        <div class="tb-output" id="f2bOut" style="max-height:220px; overflow-y:auto;">Choose a file to begin.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="f2bCopy">Copy Base64</button>
        </div>
      </div>`;
    const zone = container.querySelector('#f2bZone');
    const input = container.querySelector('#f2bInput');
    const meta = container.querySelector('#f2bMeta');
    const preview = container.querySelector('#f2bPreview');
    const out = container.querySelector('#f2bOut');

    tbWireDropzone(zone, input, (file) => {
      out.textContent = 'Reading…';
      meta.innerHTML = `<span><b>${file.name}</b></span><span>${tbFmtBytes(file.size)}</span><span>${file.type || 'unknown type'}</span>`;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result; // data:mime;base64,XXXX
        const b64 = result.split(',')[1] || '';
        out.textContent = b64;
        if (file.type.startsWith('image/')){
          preview.src = result;
          preview.style.display = 'block';
        } else {
          preview.style.display = 'none';
        }
      };
      reader.onerror = () => { out.textContent = 'Could not read that file.'; out.classList.add('tb-error'); };
      reader.readAsDataURL(file);
    });
    container.querySelector('#f2bCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 12. BASE64 → FILE (download) --------------------------------------------
TB_TOOLS.push({
  id:'base64-to-file', name:'Base64 → File', cat:'files', icon:'📦',
  desc:'Paste a Base64 string and download it back as a real file.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Base64 String</span>
        <textarea class="tb-textarea" id="b2fIn" placeholder="Paste raw base64 (with or without the data:... prefix)…"></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <input type="text" class="tb-input" id="b2fName" placeholder="filename.png" style="flex:1;">
        </div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-primary" id="b2fDownload">Decode & Download</button>
        </div>
        <div class="tb-output" id="b2fStatus" style="margin-top:10px; display:none;"></div>
      </div>`;
    const input = container.querySelector('#b2fIn');
    const nameIn = container.querySelector('#b2fName');
    const status = container.querySelector('#b2fStatus');
    container.querySelector('#b2fDownload').addEventListener('click', () => {
      try{
        let raw = input.value.trim();
        raw = raw.includes(',') && raw.startsWith('data:') ? raw.split(',')[1] : raw;
        const byteChars = atob(raw);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nameIn.value.trim() || 'download.bin';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        status.style.display = 'block';
        status.classList.remove('tb-error');
        status.textContent = `Decoded ${tbFmtBytes(bytes.length)} — download started.`;
      }catch(e){
        status.style.display = 'block';
        status.classList.add('tb-error');
        status.textContent = 'Invalid Base64 — could not decode.';
      }
    });
  }
});

// 13. FILE HASH CALCULATOR --------------------------------------------------
TB_TOOLS.push({
  id:'file-hash', name:'File Hash Calculator', cat:'files', icon:'📦',
  desc:'Compute a cryptographic hash of any file for integrity checks — the file never leaves your device.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <select class="tb-select" id="fhAlgo" style="max-width:160px;">
            <option value="SHA-256" selected>SHA-256</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
        </div>
        <div class="tb-dropzone" id="fhZone" style="margin-top:10px;">
          <span class="tb-dz-icon">🔎</span>
          Tap to choose a file, or drag one here
          <input type="file" class="tb-file-input" id="fhInput">
        </div>
        <div class="tb-file-meta" id="fhMeta"></div>
        <div class="tb-progress" id="fhProgress"><div class="tb-progress-fill" id="fhProgressFill"></div></div>
        <span class="tb-label" style="margin-top:14px;">Hash</span>
        <div class="tb-output" id="fhOut">Choose a file to begin.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="fhCopy">Copy Hash</button>
        </div>
      </div>`;
    const zone = container.querySelector('#fhZone');
    const input = container.querySelector('#fhInput');
    const meta = container.querySelector('#fhMeta');
    const out = container.querySelector('#fhOut');
    const algoSel = container.querySelector('#fhAlgo');
    const progress = container.querySelector('#fhProgress');
    const progressFill = container.querySelector('#fhProgressFill');

    async function hashFile(file){
      meta.innerHTML = `<span><b>${file.name}</b></span><span>${tbFmtBytes(file.size)}</span>`;
      out.textContent = 'Hashing…';
      out.classList.remove('tb-error');
      progress.classList.add('active');
      progressFill.style.width = '30%';
      try{
        const buf = await file.arrayBuffer();
        progressFill.style.width = '75%';
        const digest = await crypto.subtle.digest(algoSel.value, buf);
        progressFill.style.width = '100%';
        out.textContent = tbBufToHex(digest);
      }catch(e){
        out.classList.add('tb-error');
        out.textContent = 'Could not hash this file (it may be too large for this device\'s memory).';
      }
      setTimeout(() => { progress.classList.remove('active'); progressFill.style.width = '0%'; }, 500);
    }
    tbWireDropzone(zone, input, hashFile);
    container.querySelector('#fhCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 14. IMAGE RESIZER / COMPRESSOR --------------------------------------------
TB_TOOLS.push({
  id:'image-resizer', name:'Image Resizer', cat:'files', icon:'📦',
  desc:'Resize or compress an image entirely in your browser, then download the result.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-dropzone" id="irZone">
          <span class="tb-dz-icon">🖼️</span>
          Tap to choose an image, or drag one here
          <input type="file" class="tb-file-input" id="irInput" accept="image/*">
        </div>
        <img class="tb-preview-img" id="irPreview" style="display:none;">
        <div class="tb-file-meta" id="irMeta"></div>

        <div class="tb-row" style="margin-top:14px;">
          <div style="flex:1;"><span class="tb-label">Width (px)</span><input type="number" class="tb-input" id="irWidth" placeholder="auto"></div>
          <div style="flex:1;"><span class="tb-label">Height (px)</span><input type="number" class="tb-input" id="irHeight" placeholder="auto"></div>
        </div>
        <label class="tb-check" style="margin:6px 0 14px;"><input type="checkbox" id="irLock" checked> Lock aspect ratio</label>

        <div class="tb-row" style="flex-direction:column; align-items:stretch;">
          <span class="tb-label">Quality (JPEG)</span>
          <div class="tb-slider-row">
            <input type="range" min="10" max="100" value="85" class="tb-slider" id="irQuality">
            <span class="tb-slider-val" id="irQualityVal">85%</span>
          </div>
        </div>

        <div class="tb-row" style="margin-top:14px;">
          <select class="tb-select" id="irFormat" style="max-width:140px;">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
          <button class="tb-btn tb-btn-primary" id="irDownload" disabled>Process & Download</button>
        </div>
        <div class="tb-output" id="irStatus" style="margin-top:10px; display:none;"></div>
      </div>`;
    const zone = container.querySelector('#irZone');
    const input = container.querySelector('#irInput');
    const preview = container.querySelector('#irPreview');
    const meta = container.querySelector('#irMeta');
    const widthIn = container.querySelector('#irWidth');
    const heightIn = container.querySelector('#irHeight');
    const lock = container.querySelector('#irLock');
    const quality = container.querySelector('#irQuality');
    const qualityVal = container.querySelector('#irQualityVal');
    const format = container.querySelector('#irFormat');
    const downloadBtn = container.querySelector('#irDownload');
    const status = container.querySelector('#irStatus');

    let img = null, origW = 0, origH = 0, srcName = 'image';

    tbWireDropzone(zone, input, (file) => {
      srcName = file.name.replace(/\.[^.]+$/, '') || 'image';
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          img = image; origW = image.width; origH = image.height;
          preview.src = reader.result;
          preview.style.display = 'block';
          widthIn.value = origW;
          heightIn.value = origH;
          meta.innerHTML = `<span><b>${file.name}</b></span><span>${origW}×${origH}px</span><span>${tbFmtBytes(file.size)}</span>`;
          downloadBtn.disabled = false;
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    widthIn.addEventListener('input', () => {
      if (lock.checked && origW) heightIn.value = Math.round(widthIn.value * (origH / origW));
    });
    heightIn.addEventListener('input', () => {
      if (lock.checked && origH) widthIn.value = Math.round(heightIn.value * (origW / origH));
    });
    quality.addEventListener('input', () => { qualityVal.textContent = quality.value + '%'; });

    downloadBtn.addEventListener('click', () => {
      if (!img) return;
      const w = parseInt(widthIn.value, 10) || origW;
      const h = parseInt(heightIn.value, 10) || origH;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const mime = format.value;
      canvas.toBlob((blob) => {
        if (!blob){ status.style.display='block'; status.classList.add('tb-error'); status.textContent='Could not process this image.'; return; }
        const url = URL.createObjectURL(blob);
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const a = document.createElement('a');
        a.href = url; a.download = `${srcName}-${w}x${h}.${ext}`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        status.style.display = 'block';
        status.classList.remove('tb-error');
        status.textContent = `Done — ${w}×${h}px, ${tbFmtBytes(blob.size)}. Download started.`;
      }, mime, mime === 'image/png' ? undefined : parseInt(quality.value, 10) / 100);
    });
  }
});

// 15. JSON ↔ CSV ---------------------------------------------------------
TB_TOOLS.push({
  id:'json-csv', name:'JSON ↔ CSV', cat:'data', icon:'📊',
  desc:'Convert an array of JSON objects to CSV, or CSV back to JSON. You can also upload a .csv or .json file directly.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-dropzone" id="jcZone">
          <span class="tb-dz-icon">📄</span>
          Tap to upload a .json or .csv file (optional), or paste below
          <input type="file" class="tb-file-input" id="jcInput" accept=".json,.csv,text/csv,application/json">
        </div>
        <span class="tb-label" style="margin-top:12px;">Input</span>
        <textarea class="tb-textarea" id="jcIn" placeholder='[{"name":"Ada","role":"Engineer"}]  or  name,role&#10;Ada,Engineer'></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <button class="tb-btn tb-btn-primary" id="jcToCsv">JSON → CSV</button>
          <button class="tb-btn" id="jcToJson">CSV → JSON</button>
        </div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="jcOut" style="max-height:220px; overflow-y:auto;">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="jcCopy">Copy Output</button>
        </div>
      </div>`;
    const zone = container.querySelector('#jcZone');
    const fileInput = container.querySelector('#jcInput');
    const input = container.querySelector('#jcIn');
    const out = container.querySelector('#jcOut');

    tbWireDropzone(zone, fileInput, (file) => {
      const reader = new FileReader();
      reader.onload = () => { input.value = reader.result; };
      reader.readAsText(file);
    });

    function csvEscape(v){
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }
    function parseCsvLine(line){
      const out = []; let cur = ''; let inQ = false;
      for (let i=0;i<line.length;i++){
        const c = line[i];
        if (inQ){
          if (c === '"' && line[i+1] === '"'){ cur += '"'; i++; }
          else if (c === '"'){ inQ = false; }
          else cur += c;
        } else {
          if (c === '"') inQ = true;
          else if (c === ','){ out.push(cur); cur = ''; }
          else cur += c;
        }
      }
      out.push(cur);
      return out;
    }

    container.querySelector('#jcToCsv').addEventListener('click', () => {
      try{
        const data = JSON.parse(input.value);
        const arr = Array.isArray(data) ? data : [data];
        if (!arr.length){ out.textContent = '(empty array)'; return; }
        const headers = [...new Set(arr.flatMap(o => Object.keys(o)))];
        const lines = [headers.join(',')];
        arr.forEach(o => lines.push(headers.map(h => csvEscape(o[h])).join(',')));
        out.classList.remove('tb-error');
        out.textContent = lines.join('\n');
      }catch(e){ out.classList.add('tb-error'); out.textContent = 'Invalid JSON — ' + e.message; }
    });

    container.querySelector('#jcToJson').addEventListener('click', () => {
      try{
        const lines = input.value.trim().split(/\r?\n/).filter(Boolean);
        if (!lines.length){ out.textContent = '[]'; return; }
        const headers = parseCsvLine(lines[0]);
        const rows = lines.slice(1).map(line => {
          const vals = parseCsvLine(line);
          const obj = {};
          headers.forEach((h,i) => obj[h] = vals[i] ?? '');
          return obj;
        });
        out.classList.remove('tb-error');
        out.textContent = JSON.stringify(rows, null, 2);
      }catch(e){ out.classList.add('tb-error'); out.textContent = 'Could not parse CSV.'; }
    });

    container.querySelector('#jcCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 16. HASH GENERATOR (text) -------------------------------------------------
TB_TOOLS.push({
  id:'hash-generator', name:'Hash Generator', cat:'security', icon:'🔐',
  desc:'Compute SHA-1/256/384/512 hashes of text using your browser\'s native crypto engine.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Text</span>
        <textarea class="tb-textarea" id="hgIn" placeholder="Type or paste text…"></textarea>
        <div class="tb-row" style="margin-top:12px;">
          <select class="tb-select" id="hgAlgo" style="max-width:160px;">
            <option value="SHA-256" selected>SHA-256</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button class="tb-btn tb-btn-primary" id="hgRun">Generate</button>
        </div>
        <div class="tb-output" id="hgOut" style="margin-top:10px;">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="hgCopy">Copy</button>
        </div>
      </div>`;
    const input = container.querySelector('#hgIn');
    const algo = container.querySelector('#hgAlgo');
    const out = container.querySelector('#hgOut');
    async function run(){
      const data = new TextEncoder().encode(input.value);
      const digest = await crypto.subtle.digest(algo.value, data);
      out.textContent = tbBufToHex(digest);
    }
    container.querySelector('#hgRun').addEventListener('click', run);
    container.querySelector('#hgCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 17. HMAC GENERATOR --------------------------------------------------------
TB_TOOLS.push({
  id:'hmac-generator', name:'HMAC Generator', cat:'security', icon:'🔐',
  desc:'Generate a keyed-hash message authentication code (HMAC) for a message and secret key.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Message</span>
        <textarea class="tb-textarea" id="hmMsg" placeholder="Message to sign…" style="min-height:80px;"></textarea>
        <span class="tb-label" style="margin-top:10px;">Secret Key</span>
        <input type="text" class="tb-input" id="hmKey" placeholder="your-secret-key">
        <div class="tb-row" style="margin-top:12px;">
          <select class="tb-select" id="hmAlgo" style="max-width:160px;">
            <option value="SHA-256" selected>SHA-256</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button class="tb-btn tb-btn-primary" id="hmRun">Generate HMAC</button>
        </div>
        <div class="tb-output" id="hmOut" style="margin-top:10px;">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;">
          <button class="tb-btn tb-btn-sm" id="hmCopy">Copy</button>
        </div>
      </div>`;
    const msg = container.querySelector('#hmMsg');
    const key = container.querySelector('#hmKey');
    const algo = container.querySelector('#hmAlgo');
    const out = container.querySelector('#hmOut');
    async function run(){
      try{
        const keyData = new TextEncoder().encode(key.value);
        const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name:'HMAC', hash:{ name:algo.value } }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg.value));
        out.classList.remove('tb-error');
        out.textContent = tbBufToHex(sig);
      }catch(e){ out.classList.add('tb-error'); out.textContent = 'Could not generate HMAC.'; }
    }
    container.querySelector('#hmRun').addEventListener('click', run);
    container.querySelector('#hmCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 18. JWT DECODER (decode only — no signature verification) ----------------
TB_TOOLS.push({
  id:'jwt-decoder', name:'JWT Decoder', cat:'security', icon:'🔐',
  desc:'Decode a JSON Web Token\'s header and payload. This only decodes — it does not verify the signature.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Token</span>
        <textarea class="tb-textarea" id="jwtIn" placeholder="eyJhbGciOi..."></textarea>
        <div class="tb-row" style="margin-top:12px;"><button class="tb-btn tb-btn-primary" id="jwtRun">Decode</button></div>
        <span class="tb-label" style="margin-top:10px;">Header</span>
        <div class="tb-output" id="jwtHeader">—</div>
        <span class="tb-label" style="margin-top:10px;">Payload</span>
        <div class="tb-output" id="jwtPayload">—</div>
        <p class="tb-hint" style="margin-top:10px;">⚠️ Signature is not verified here — this only decodes the readable parts.</p>
      </div>`;
    function b64urlDecode(s){
      s = s.replace(/-/g,'+').replace(/_/g,'/');
      while (s.length % 4) s += '=';
      return decodeURIComponent(escape(atob(s)));
    }
    container.querySelector('#jwtRun').addEventListener('click', () => {
      const headerOut = container.querySelector('#jwtHeader');
      const payloadOut = container.querySelector('#jwtPayload');
      const parts = container.querySelector('#jwtIn').value.trim().split('.');
      if (parts.length < 2){
        headerOut.classList.add('tb-error'); headerOut.textContent = 'Not a valid JWT.';
        payloadOut.textContent = '—';
        return;
      }
      try{
        headerOut.classList.remove('tb-error');
        headerOut.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[0])), null, 2);
        payloadOut.classList.remove('tb-error');
        payloadOut.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2);
      }catch(e){
        headerOut.classList.add('tb-error'); headerOut.textContent = 'Could not decode this token.'; payloadOut.textContent = '—';
      }
    });
  }
});

// 19. CASE CONVERTER --------------------------------------------------------
TB_TOOLS.push({
  id:'case-converter', name:'Case Converter', cat:'text', icon:'📝',
  desc:'Convert text between UPPERCASE, lowercase, Title Case, camelCase and more.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <textarea class="tb-textarea" id="ccvIn" placeholder="Type or paste text…"></textarea>
        <div class="tb-row" style="margin-top:12px; flex-wrap:wrap;">
          <button class="tb-btn tb-btn-sm" data-case="upper">UPPERCASE</button>
          <button class="tb-btn tb-btn-sm" data-case="lower">lowercase</button>
          <button class="tb-btn tb-btn-sm" data-case="title">Title Case</button>
          <button class="tb-btn tb-btn-sm" data-case="sentence">Sentence case</button>
          <button class="tb-btn tb-btn-sm" data-case="camel">camelCase</button>
          <button class="tb-btn tb-btn-sm" data-case="snake">snake_case</button>
          <button class="tb-btn tb-btn-sm" data-case="kebab">kebab-case</button>
        </div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="ccvOut">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="ccvCopy">Copy</button></div>
      </div>`;
    const input = container.querySelector('#ccvIn');
    const out = container.querySelector('#ccvOut');
    function words(s){ return s.trim().split(/\s+/).filter(Boolean); }
    const converters = {
      upper: s => s.toUpperCase(),
      lower: s => s.toLowerCase(),
      title: s => words(s).map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      sentence: s => { const t = s.trim().toLowerCase(); return t ? t[0].toUpperCase() + t.slice(1) : t; },
      camel: s => words(s).map((w,i) => i===0 ? w.toLowerCase() : w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''),
      snake: s => words(s).map(w => w.toLowerCase()).join('_'),
      kebab: s => words(s).map(w => w.toLowerCase()).join('-'),
    };
    container.querySelectorAll('[data-case]').forEach(btn => {
      btn.addEventListener('click', () => { out.textContent = converters[btn.dataset.case](input.value); });
    });
    container.querySelector('#ccvCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 20. LINE TOOLS (dedupe / sort / trim / remove empty) ----------------------
TB_TOOLS.push({
  id:'line-tools', name:'Line Tools', cat:'text', icon:'📝',
  desc:'Sort lines, remove duplicates, trim whitespace, or drop empty lines.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <textarea class="tb-textarea" id="ltIn" placeholder="One item per line…" style="min-height:160px;"></textarea>
        <div class="tb-row tb-check-row" style="margin-top:12px;">
          <label class="tb-check"><input type="checkbox" id="ltDedupe"> Remove duplicates</label>
          <label class="tb-check"><input type="checkbox" id="ltSort"> Sort A→Z</label>
          <label class="tb-check"><input type="checkbox" id="ltTrim" checked> Trim whitespace</label>
          <label class="tb-check"><input type="checkbox" id="ltEmpty" checked> Remove empty lines</label>
        </div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-primary" id="ltRun">Process</button></div>
        <span class="tb-label" style="margin-top:10px;">Output</span>
        <div class="tb-output" id="ltOut" style="max-height:220px; overflow-y:auto;">Result appears here.</div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="ltCopy">Copy</button></div>
      </div>`;
    const input = container.querySelector('#ltIn');
    const out = container.querySelector('#ltOut');
    container.querySelector('#ltRun').addEventListener('click', () => {
      let lines = input.value.split(/\r?\n/);
      if (container.querySelector('#ltTrim').checked) lines = lines.map(l => l.trim());
      if (container.querySelector('#ltEmpty').checked) lines = lines.filter(l => l.length > 0);
      if (container.querySelector('#ltDedupe').checked) lines = [...new Set(lines)];
      if (container.querySelector('#ltSort').checked) lines = lines.sort((a,b) => a.localeCompare(b));
      out.textContent = lines.join('\n') || '(nothing left)';
    });
    container.querySelector('#ltCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 21. SLUG GENERATOR --------------------------------------------------------
TB_TOOLS.push({
  id:'slug-generator', name:'Slug Generator', cat:'text', icon:'📝',
  desc:'Turn any text into a clean URL-safe slug.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <input type="text" class="tb-input" id="slIn" placeholder="My Awesome Blog Post!">
        <div class="tb-output" id="slOut" style="margin-top:12px;">your-slug-appears-here</div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="slCopy">Copy</button></div>
      </div>`;
    const input = container.querySelector('#slIn');
    const out = container.querySelector('#slOut');
    function slugify(){
      const slug = input.value.trim().toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9\s-]/g,'')
        .replace(/\s+/g,'-')
        .replace(/-+/g,'-')
        .replace(/^-|-$/g,'');
      out.textContent = slug || 'your-slug-appears-here';
    }
    input.addEventListener('input', slugify);
    container.querySelector('#slCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
  }
});

// 22. BOX SHADOW GENERATOR ---------------------------------------------------
TB_TOOLS.push({
  id:'box-shadow-generator', name:'Box Shadow Generator', cat:'design', icon:'🎨',
  desc:'Build a CSS box-shadow visually.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-swatch" id="bsPreviewWrap" style="background:transparent; display:flex; align-items:center; justify-content:center; height:120px;">
          <div id="bsBox" style="width:90px; height:90px; border-radius:12px; background:var(--bg-panel-2);"></div>
        </div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Offset X</span><input type="range" min="-40" max="40" value="0" class="tb-slider" id="bsX"></div>
          <div style="flex:1;"><span class="tb-label">Offset Y</span><input type="range" min="-40" max="40" value="10" class="tb-slider" id="bsY"></div>
        </div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Blur</span><input type="range" min="0" max="80" value="24" class="tb-slider" id="bsBlur"></div>
          <div style="flex:1;"><span class="tb-label">Spread</span><input type="range" min="-30" max="30" value="0" class="tb-slider" id="bsSpread"></div>
        </div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Color</span><input type="color" id="bsColor" value="#5CCFE6" style="width:100%; height:40px; border:none; border-radius:8px;"></div>
          <label class="tb-check" style="align-self:flex-end; padding-bottom:8px;"><input type="checkbox" id="bsInset"> Inset</label>
        </div>
        <div class="tb-output" id="bsCss" style="margin-top:10px;"></div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="bsCopy">Copy CSS</button></div>
      </div>`;
    const ids = ['bsX','bsY','bsBlur','bsSpread','bsColor','bsInset'];
    const els = {}; ids.forEach(id => els[id] = container.querySelector('#'+id));
    const box = container.querySelector('#bsBox');
    const cssOut = container.querySelector('#bsCss');
    function update(){
      const inset = els.bsInset.checked ? 'inset ' : '';
      const css = `box-shadow: ${inset}${els.bsX.value}px ${els.bsY.value}px ${els.bsBlur.value}px ${els.bsSpread.value}px ${els.bsColor.value};`;
      box.style.boxShadow = `${inset}${els.bsX.value}px ${els.bsY.value}px ${els.bsBlur.value}px ${els.bsSpread.value}px ${els.bsColor.value}`;
      cssOut.textContent = css;
    }
    ids.forEach(id => els[id].addEventListener('input', update));
    container.querySelector('#bsCopy').addEventListener('click', (e) => tbCopy(cssOut.textContent, e.target));
    update();
  }
});

// 23. BORDER RADIUS GENERATOR -------------------------------------------------
TB_TOOLS.push({
  id:'border-radius-generator', name:'Border Radius Generator', cat:'design', icon:'🎨',
  desc:'Set each corner radius individually and copy the CSS.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div style="display:flex; align-items:center; justify-content:center; height:130px;">
          <div id="brBox" style="width:110px; height:110px; background:linear-gradient(135deg, var(--cyan), var(--violet));"></div>
        </div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Top Left</span><input type="range" min="0" max="80" value="16" class="tb-slider" id="brTL"></div>
          <div style="flex:1;"><span class="tb-label">Top Right</span><input type="range" min="0" max="80" value="16" class="tb-slider" id="brTR"></div>
        </div>
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Bottom Left</span><input type="range" min="0" max="80" value="16" class="tb-slider" id="brBL"></div>
          <div style="flex:1;"><span class="tb-label">Bottom Right</span><input type="range" min="0" max="80" value="16" class="tb-slider" id="brBR"></div>
        </div>
        <div class="tb-output" id="brCss" style="margin-top:10px;"></div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="brCopy">Copy CSS</button></div>
      </div>`;
    const ids = ['brTL','brTR','brBL','brBR'];
    const els = {}; ids.forEach(id => els[id] = container.querySelector('#'+id));
    const box = container.querySelector('#brBox');
    const cssOut = container.querySelector('#brCss');
    function update(){
      const val = `${els.brTL.value}px ${els.brTR.value}px ${els.brBR.value}px ${els.brBL.value}px`;
      box.style.borderRadius = val;
      cssOut.textContent = `border-radius: ${val};`;
    }
    ids.forEach(id => els[id].addEventListener('input', update));
    container.querySelector('#brCopy').addEventListener('click', (e) => tbCopy(cssOut.textContent, e.target));
    update();
  }
});

// 24. PERCENTAGE CALCULATOR --------------------------------------------------
TB_TOOLS.push({
  id:'percentage-calculator', name:'Percentage Calculator', cat:'calculators', icon:'📐',
  desc:'Two common percentage calculations, solved live.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">What is X% of Y?</span>
        <div class="tb-row">
          <input type="number" class="tb-input" id="pc1X" placeholder="X %" value="20">
          <span>% of</span>
          <input type="number" class="tb-input" id="pc1Y" placeholder="Y" value="150">
        </div>
        <div class="tb-output" id="pc1Out" style="margin-top:8px;"></div>

        <span class="tb-label" style="margin-top:18px;">X is what % of Y?</span>
        <div class="tb-row">
          <input type="number" class="tb-input" id="pc2X" placeholder="X" value="30">
          <span>of</span>
          <input type="number" class="tb-input" id="pc2Y" placeholder="Y" value="150">
        </div>
        <div class="tb-output" id="pc2Out" style="margin-top:8px;"></div>
      </div>`;
    const els = ['pc1X','pc1Y','pc2X','pc2Y'].reduce((a,id) => (a[id]=container.querySelector('#'+id), a), {});
    const out1 = container.querySelector('#pc1Out');
    const out2 = container.querySelector('#pc2Out');
    function update(){
      const x1 = parseFloat(els.pc1X.value), y1 = parseFloat(els.pc1Y.value);
      out1.textContent = (!isNaN(x1) && !isNaN(y1)) ? `${x1}% of ${y1} = ${(x1/100*y1).toLocaleString(undefined,{maximumFractionDigits:4})}` : '—';
      const x2 = parseFloat(els.pc2X.value), y2 = parseFloat(els.pc2Y.value);
      out2.textContent = (!isNaN(x2) && !isNaN(y2) && y2 !== 0) ? `${x2} is ${(x2/y2*100).toLocaleString(undefined,{maximumFractionDigits:4})}% of ${y2}` : '—';
    }
    Object.values(els).forEach(el => el.addEventListener('input', update));
    update();
  }
});

// 25. UNIT CONVERTER (length) ------------------------------------------------
TB_TOOLS.push({
  id:'unit-converter', name:'Unit Converter', cat:'calculators', icon:'📐',
  desc:'Convert between common length units.',
  render(container){
    const UNITS = { mm:0.001, cm:0.01, m:1, km:1000, in:0.0254, ft:0.3048, yd:0.9144, mi:1609.344 };
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <input type="number" class="tb-input" id="ucVal" value="1" style="flex:1;">
          <select class="tb-select" id="ucFrom" style="max-width:100px;">${Object.keys(UNITS).map(u=>`<option value="${u}">${u}</option>`).join('')}</select>
          <span>→</span>
          <select class="tb-select" id="ucTo" style="max-width:100px;">${Object.keys(UNITS).map(u=>`<option value="${u}"${u==='ft'?' selected':''}>${u}</option>`).join('')}</select>
        </div>
        <div class="tb-output" id="ucOut" style="margin-top:10px;"></div>
      </div>`;
    const val = container.querySelector('#ucVal');
    const from = container.querySelector('#ucFrom');
    const to = container.querySelector('#ucTo');
    const out = container.querySelector('#ucOut');
    function update(){
      const n = parseFloat(val.value);
      if (isNaN(n)){ out.textContent = '—'; return; }
      const meters = n * UNITS[from.value];
      const result = meters / UNITS[to.value];
      out.textContent = `${n} ${from.value} = ${result.toLocaleString(undefined,{maximumFractionDigits:6})} ${to.value}`;
    }
    [val, from, to].forEach(el => el.addEventListener('input', update));
    update();
  }
});

// 26. PX ↔ REM CALCULATOR -----------------------------------------------------
TB_TOOLS.push({
  id:'px-rem-calculator', name:'PX ↔ REM Calculator', cat:'calculators', icon:'📐',
  desc:'Convert between pixels and rem units, based on a root font size.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Root font size (px)</span>
        <input type="number" class="tb-input" id="prBase" value="16">
        <div class="tb-row" style="margin-top:14px;">
          <div style="flex:1;"><span class="tb-label">Pixels</span><input type="number" class="tb-input" id="prPx" value="24"></div>
          <div style="flex:1;"><span class="tb-label">Rem</span><input type="number" class="tb-input" id="prRem" value="1.5" step="0.01"></div>
        </div>
      </div>`;
    const base = container.querySelector('#prBase');
    const px = container.querySelector('#prPx');
    const rem = container.querySelector('#prRem');
    let updating = false;
    function fromPx(){ if (updating) return; updating = true; rem.value = (parseFloat(px.value) / parseFloat(base.value)).toFixed(4).replace(/\.?0+$/,'') || 0; updating = false; }
    function fromRem(){ if (updating) return; updating = true; px.value = (parseFloat(rem.value) * parseFloat(base.value)).toFixed(2).replace(/\.?0+$/,'') || 0; updating = false; }
    px.addEventListener('input', fromPx);
    rem.addEventListener('input', fromRem);
    base.addEventListener('input', fromPx);
  }
});

// 27. RANDOM NUMBER GENERATOR --------------------------------------------------
TB_TOOLS.push({
  id:'random-number', name:'Random Number Generator', cat:'generators', icon:'🧬',
  desc:'Cryptographically random integers in a range you choose.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Min</span><input type="number" class="tb-input" id="rnMin" value="1"></div>
          <div style="flex:1;"><span class="tb-label">Max</span><input type="number" class="tb-input" id="rnMax" value="100"></div>
          <div style="flex:1;"><span class="tb-label">How many?</span><input type="number" class="tb-input" id="rnCount" value="1" min="1" max="50"></div>
        </div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-primary" id="rnGen">Generate</button></div>
        <div class="tb-output" id="rnOut" style="margin-top:10px;">—</div>
      </div>`;
    const min = container.querySelector('#rnMin');
    const max = container.querySelector('#rnMax');
    const count = container.querySelector('#rnCount');
    const out = container.querySelector('#rnOut');
    function gen(){
      const lo = Math.min(parseInt(min.value,10), parseInt(max.value,10));
      const hi = Math.max(parseInt(min.value,10), parseInt(max.value,10));
      const n = Math.min(50, Math.max(1, parseInt(count.value,10) || 1));
      const results = [];
      const range = hi - lo + 1;
      const arr = new Uint32Array(n);
      crypto.getRandomValues(arr);
      for (let i=0;i<n;i++) results.push(lo + (arr[i] % range));
      out.textContent = results.join(', ');
    }
    container.querySelector('#rnGen').addEventListener('click', gen);
    gen();
  }
});

// =====================================================================
// PHASE 3
// =====================================================================
function tbEscapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 28. REGEX TESTER -----------------------------------------------------------
TB_TOOLS.push({
  id:'regex-tester', name:'Regex Tester', cat:'testing', icon:'🧪',
  desc:'Test a regular expression against sample text, with matches highlighted live.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Pattern</span>
        <div class="tb-row" style="gap:6px;">
          <span style="color:var(--text-dim);">/</span>
          <input type="text" class="tb-input" id="rxPattern" placeholder="[a-z]+" style="flex:1;">
          <span style="color:var(--text-dim);">/</span>
        </div>
        <div class="tb-row tb-check-row" style="margin-top:8px;">
          <label class="tb-check"><input type="checkbox" id="rxI"> i (ignore case)</label>
          <label class="tb-check"><input type="checkbox" id="rxM"> m (multiline)</label>
          <label class="tb-check"><input type="checkbox" id="rxS"> s (dotAll)</label>
        </div>
        <span class="tb-label" style="margin-top:12px;">Test String</span>
        <textarea class="tb-textarea" id="rxText" placeholder="Paste text to test against…" style="min-height:120px;"></textarea>
        <span class="tb-label" style="margin-top:12px;">Highlighted Result</span>
        <div class="tb-output" id="rxHighlight" style="max-height:200px; overflow-y:auto;"></div>
        <span class="tb-label" style="margin-top:10px;">Matches</span>
        <div class="tb-output" id="rxMatches" style="max-height:160px; overflow-y:auto;">No matches yet.</div>
      </div>`;
    const pattern = container.querySelector('#rxPattern');
    const text = container.querySelector('#rxText');
    const flagsEls = { i: container.querySelector('#rxI'), m: container.querySelector('#rxM'), s: container.querySelector('#rxS') };
    const highlight = container.querySelector('#rxHighlight');
    const matchesOut = container.querySelector('#rxMatches');

    function run(){
      const raw = text.value;
      if (!pattern.value){ highlight.innerHTML = tbEscapeHtml(raw) || '(nothing to test)'; matchesOut.textContent = 'Enter a pattern above.'; return; }
      let flags = 'g';
      if (flagsEls.i.checked) flags += 'i';
      if (flagsEls.m.checked) flags += 'm';
      if (flagsEls.s.checked) flags += 's';
      let re;
      try{ re = new RegExp(pattern.value, flags); }
      catch(e){ highlight.classList.add('tb-error'); highlight.textContent = 'Invalid pattern — ' + e.message; matchesOut.textContent = '—'; return; }
      highlight.classList.remove('tb-error');

      let html = ''; let lastIndex = 0; const found = [];
      for (const m of raw.matchAll(re)){
        html += tbEscapeHtml(raw.slice(lastIndex, m.index));
        html += `<mark style="background:var(--cyan); color:#06171d; border-radius:3px; padding:0 1px;">${tbEscapeHtml(m[0])}</mark>`;
        lastIndex = m.index + m[0].length;
        found.push(m);
        if (m.index === re.lastIndex) re.lastIndex++; // guard against zero-length infinite loop
        if (found.length > 500) break;
      }
      html += tbEscapeHtml(raw.slice(lastIndex));
      highlight.innerHTML = html || '(nothing to test)';

      matchesOut.textContent = found.length
        ? found.map((m,i) => `#${i+1}: "${m[0]}"${m.length>1 ? '  groups: [' + m.slice(1).map(g=>g===undefined?'undefined':`"${g}"`).join(', ') + ']' : ''}`).join('\n')
        : 'No matches.';
    }
    pattern.addEventListener('input', run);
    text.addEventListener('input', run);
    Object.values(flagsEls).forEach(el => el.addEventListener('change', run));
    run();
  }
});

// 29. TEXT DIFF ----------------------------------------------------------------
TB_TOOLS.push({
  id:'text-diff', name:'Text Diff', cat:'testing', icon:'🧪',
  desc:'Compare two blocks of text line by line.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Original</span><textarea class="tb-textarea" id="tdA" style="min-height:140px;"></textarea></div>
          <div style="flex:1;"><span class="tb-label">Changed</span><textarea class="tb-textarea" id="tdB" style="min-height:140px;"></textarea></div>
        </div>
        <div class="tb-row" style="margin-top:12px;"><button class="tb-btn tb-btn-primary" id="tdRun">Compare</button></div>
        <span class="tb-label" style="margin-top:10px;">Diff</span>
        <div class="tb-output" id="tdOut" style="max-height:280px; overflow-y:auto;">Result appears here.</div>
      </div>`;
    function diffLines(a, b){
      const n = a.length, m = b.length;
      const dp = Array.from({length:n+1}, () => new Array(m+1).fill(0));
      for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--)
        dp[i][j] = a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
      const out = []; let i=0, j=0;
      while (i<n && j<m){
        if (a[i]===b[j]){ out.push(['same', a[i]]); i++; j++; }
        else if (dp[i+1][j] >= dp[i][j+1]){ out.push(['del', a[i]]); i++; }
        else { out.push(['add', b[j]]); j++; }
      }
      while (i<n){ out.push(['del', a[i]]); i++; }
      while (j<m){ out.push(['add', b[j]]); j++; }
      return out;
    }
    container.querySelector('#tdRun').addEventListener('click', () => {
      const a = container.querySelector('#tdA').value.split(/\r?\n/);
      const b = container.querySelector('#tdB').value.split(/\r?\n/);
      const rows = diffLines(a, b);
      const out = container.querySelector('#tdOut');
      out.innerHTML = rows.map(([type, line]) => {
        const color = type==='same' ? 'var(--text-dim)' : type==='del' ? 'var(--rose)' : 'var(--green)';
        const prefix = type==='same' ? '  ' : type==='del' ? '- ' : '+ ';
        return `<div style="color:${color};">${prefix}${tbEscapeHtml(line)}</div>`;
      }).join('') || '(identical)';
    });
  }
});

// 30. PASSWORD STRENGTH TESTER ------------------------------------------------
TB_TOOLS.push({
  id:'password-strength', name:'Password Strength Tester', cat:'testing', icon:'🧪',
  desc:'Check how strong a password is. Nothing you type here is stored or sent anywhere.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Password</span>
        <input type="text" class="tb-input" id="psIn" placeholder="Type a password to check…" autocomplete="off">
        <div class="tb-strength-bar" style="margin-top:14px;"><div class="tb-strength-fill" id="psBar"></div></div>
        <div class="tb-hint" id="psLabel">Strength: —</div>
        <div class="tb-output" id="psNotes" style="margin-top:12px;"></div>
      </div>`;
    const input = container.querySelector('#psIn');
    const bar = container.querySelector('#psBar');
    const label = container.querySelector('#psLabel');
    const notes = container.querySelector('#psNotes');
    function analyze(){
      const v = input.value;
      const notesArr = [];
      let score = 0;
      if (!v){ bar.style.width='0%'; label.textContent='Strength: —'; notes.textContent=''; return; }
      if (v.length >= 8) score++; else notesArr.push('Use at least 8 characters.');
      if (v.length >= 12) score++;
      if (/[a-z]/.test(v)) score++; else notesArr.push('Add a lowercase letter.');
      if (/[A-Z]/.test(v)) score++; else notesArr.push('Add an uppercase letter.');
      if (/[0-9]/.test(v)) score++; else notesArr.push('Add a number.');
      if (/[^a-zA-Z0-9]/.test(v)) score++; else notesArr.push('Add a symbol.');
      if (/(.)\1\1/.test(v)) { score--; notesArr.push('Avoid repeating the same character 3+ times.'); }
      if (/^(?:0123|1234|2345|3456|4567|5678|6789|abcd|qwerty|password|letmein)/i.test(v)) { score -= 2; notesArr.push('Avoid common sequences or words.'); }
      const pct = Math.max(0, Math.min(100, (score/7)*100));
      const color = pct < 35 ? 'var(--rose)' : pct < 70 ? 'var(--gold)' : 'var(--green)';
      bar.style.width = pct + '%'; bar.style.background = color;
      label.textContent = 'Strength: ' + (pct < 35 ? 'Weak' : pct < 70 ? 'Okay' : 'Strong');
      notes.textContent = notesArr.length ? notesArr.join('\n') : 'Looks solid.';
    }
    input.addEventListener('input', analyze);
  }
});

// 31. COLOR CONTRAST CHECKER ---------------------------------------------------
TB_TOOLS.push({
  id:'contrast-checker', name:'Color Contrast Checker', cat:'testing', icon:'🧪',
  desc:'Check WCAG contrast ratio between a text color and a background color.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">Text Color</span><input type="color" id="ctFg" value="#E7EAF0" style="width:100%; height:40px; border:none; border-radius:8px;"></div>
          <div style="flex:1;"><span class="tb-label">Background</span><input type="color" id="ctBg" value="#10141B" style="width:100%; height:40px; border:none; border-radius:8px;"></div>
        </div>
        <div id="ctPreview" style="margin-top:14px; padding:20px; border-radius:12px; font-size:16px; text-align:center;">Sample text on this background</div>
        <div class="tb-output" id="ctRatio" style="margin-top:12px; font-size:20px; text-align:center;"></div>
        <div class="tb-card-grid" style="margin-top:12px; grid-template-columns:repeat(auto-fit,minmax(120px,1fr));" id="ctLevels"></div>
      </div>`;
    const fg = container.querySelector('#ctFg');
    const bg = container.querySelector('#ctBg');
    const preview = container.querySelector('#ctPreview');
    const ratioOut = container.querySelector('#ctRatio');
    const levels = container.querySelector('#ctLevels');
    function luminance(hex){
      const c = hex.replace('#','');
      const [r,g,b] = [0,2,4].map(i => parseInt(c.substr(i,2),16)/255).map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
      return 0.2126*r + 0.7152*g + 0.0722*b;
    }
    function update(){
      preview.style.color = fg.value; preview.style.background = bg.value;
      const l1 = luminance(fg.value), l2 = luminance(bg.value);
      const ratio = (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
      ratioOut.textContent = ratio.toFixed(2) + ' : 1';
      const checks = [
        ['AA Normal Text', 4.5], ['AA Large Text', 3], ['AAA Normal Text', 7], ['AAA Large Text', 4.5]
      ];
      levels.innerHTML = checks.map(([label, min]) => {
        const pass = ratio >= min;
        return `<div class="tb-tool-card" style="--accent:${pass?'var(--green)':'var(--rose)'}">
          <div class="tb-tool-name">${pass ? '✓ Pass' : '✗ Fail'}</div>
          <div class="tb-tool-cat">${label}</div>
        </div>`;
      }).join('');
    }
    [fg, bg].forEach(el => el.addEventListener('input', update));
    update();
  }
});

// 32. URL PARSER -----------------------------------------------------------
TB_TOOLS.push({
  id:'url-parser', name:'URL Parser', cat:'web', icon:'🌐',
  desc:'Break a URL down into its protocol, host, path, query params and hash.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">URL</span>
        <input type="text" class="tb-input" id="upIn" placeholder="https://example.com/path?a=1&b=2#section" value="https://example.com/search?q=hello+world&page=2#results">
        <div class="tb-output" id="upOut" style="margin-top:12px; max-height:280px; overflow-y:auto;"></div>
      </div>`;
    const input = container.querySelector('#upIn');
    const out = container.querySelector('#upOut');
    function run(){
      try{
        const u = new URL(input.value);
        const params = [...u.searchParams.entries()];
        out.classList.remove('tb-error');
        out.innerHTML = [
          ['Protocol', u.protocol], ['Host', u.host], ['Hostname', u.hostname],
          ['Port', u.port || '(default)'], ['Pathname', u.pathname], ['Hash', u.hash || '(none)']
        ].map(([k,v]) => `<div><b style="color:var(--amber);">${k}:</b> ${tbEscapeHtml(String(v))}</div>`).join('') +
        `<div style="margin-top:10px;"><b style="color:var(--amber);">Query Params:</b></div>` +
        (params.length ? params.map(([k,v]) => `<div style="padding-left:12px;">${tbEscapeHtml(k)} = ${tbEscapeHtml(v)}</div>`).join('') : '<div style="padding-left:12px;">(none)</div>');
      }catch(e){ out.classList.add('tb-error'); out.textContent = 'Not a valid absolute URL.'; }
    }
    input.addEventListener('input', run);
    run();
  }
});

// 33. QUERY STRING BUILDER ---------------------------------------------------
TB_TOOLS.push({
  id:'query-string-builder', name:'Query String Builder', cat:'web', icon:'🌐',
  desc:'Build a URL query string from key/value pairs.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div id="qsRows"></div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="qsAdd">+ Add Field</button></div>
        <span class="tb-label" style="margin-top:14px;">Query String</span>
        <div class="tb-output" id="qsOut"></div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="qsCopy">Copy</button></div>
      </div>`;
    const rows = container.querySelector('#qsRows');
    const out = container.querySelector('#qsOut');
    function addRow(k='', v=''){
      const row = document.createElement('div');
      row.className = 'tb-row';
      row.innerHTML = `<input type="text" class="tb-input qsKey" placeholder="key" value="${tbEscapeHtml(k)}" style="flex:1;">
        <input type="text" class="tb-input qsVal" placeholder="value" value="${tbEscapeHtml(v)}" style="flex:1;">
        <button class="tb-btn tb-btn-sm qsRemove">✕</button>`;
      rows.appendChild(row);
      row.querySelectorAll('input').forEach(i => i.addEventListener('input', update));
      row.querySelector('.qsRemove').addEventListener('click', () => { row.remove(); update(); });
    }
    function update(){
      const params = new URLSearchParams();
      rows.querySelectorAll('.tb-row').forEach(row => {
        const k = row.querySelector('.qsKey').value;
        const v = row.querySelector('.qsVal').value;
        if (k) params.append(k, v);
      });
      out.textContent = '?' + params.toString();
    }
    container.querySelector('#qsAdd').addEventListener('click', () => addRow());
    container.querySelector('#qsCopy').addEventListener('click', (e) => tbCopy(out.textContent, e.target));
    addRow('q','hello world'); addRow('page','2'); update();
  }
});

// 34. HTTP STATUS CODES ------------------------------------------------------
TB_TOOLS.push({
  id:'http-status-codes', name:'HTTP Status Codes', cat:'web', icon:'🌐',
  desc:'Searchable reference of standard HTTP status codes.',
  render(container){
    const CODES = [
      [200,'OK','Request succeeded.'],[201,'Created','Resource created successfully.'],
      [204,'No Content','Succeeded, nothing to return.'],[301,'Moved Permanently','Resource permanently moved.'],
      [302,'Found','Resource temporarily at a different URI.'],[304,'Not Modified','Cached version is still valid.'],
      [400,'Bad Request','Malformed request syntax.'],[401,'Unauthorized','Authentication required.'],
      [403,'Forbidden','Server understood but refuses to authorize.'],[404,'Not Found','Resource does not exist.'],
      [405,'Method Not Allowed','HTTP method not supported for this resource.'],[408,'Request Timeout','Server timed out waiting for the request.'],
      [409,'Conflict','Request conflicts with current state.'],[410,'Gone','Resource permanently removed.'],
      [415,'Unsupported Media Type','Payload format not supported.'],[418,"I'm a Teapot",'April Fools\' joke code (RFC 2324).'],
      [422,'Unprocessable Entity','Well-formed but semantically invalid.'],[429,'Too Many Requests','Rate limit exceeded.'],
      [500,'Internal Server Error','Generic server error.'],[502,'Bad Gateway','Invalid response from upstream server.'],
      [503,'Service Unavailable','Server temporarily unable to handle the request.'],[504,'Gateway Timeout','Upstream server did not respond in time.'],
    ];
    container.innerHTML = `
      <div class="tb-panel">
        <input type="text" class="tb-input" id="hsSearch" placeholder="Search by code or name…">
        <div id="hsList" style="margin-top:14px; display:flex; flex-direction:column; gap:8px; max-height:340px; overflow-y:auto;"></div>
      </div>`;
    const list = container.querySelector('#hsList');
    function render(filter=''){
      const f = filter.toLowerCase();
      const matches = CODES.filter(([c,n]) => String(c).includes(f) || n.toLowerCase().includes(f));
      list.innerHTML = matches.map(([code, name, desc]) => {
        const color = code < 300 ? 'var(--green)' : code < 400 ? 'var(--sky)' : code < 500 ? 'var(--gold)' : 'var(--rose)';
        return `<div class="tb-tool-card" style="--accent:${color}; cursor:default;">
          <div class="tb-tool-name">${code} — ${name}</div>
          <div class="tb-tool-cat" style="color:var(--text-dim); text-transform:none; letter-spacing:0;">${desc}</div>
        </div>`;
      }).join('') || '<div class="tb-empty-hint">No matches.</div>';
    }
    container.querySelector('#hsSearch').addEventListener('input', (e) => render(e.target.value));
    render();
  }
});

// 35. MIME TYPE LOOKUP --------------------------------------------------------
TB_TOOLS.push({
  id:'mime-lookup', name:'MIME Type Lookup', cat:'web', icon:'🌐',
  desc:'Look up the MIME type for a file extension.',
  render(container){
    const MAP = {
      html:'text/html', css:'text/css', js:'text/javascript', json:'application/json',
      png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', webp:'image/webp',
      pdf:'application/pdf', zip:'application/zip', txt:'text/plain', csv:'text/csv', xml:'application/xml',
      mp3:'audio/mpeg', mp4:'video/mp4', wav:'audio/wav', woff:'font/woff', woff2:'font/woff2', ttf:'font/ttf',
      doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls:'application/vnd.ms-excel', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ico:'image/x-icon', md:'text/markdown', gz:'application/gzip', tar:'application/x-tar', wasm:'application/wasm',
    };
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Extension</span>
        <input type="text" class="tb-input" id="mtIn" placeholder="pdf or .pdf">
        <div class="tb-output" id="mtOut" style="margin-top:10px;">Type an extension above.</div>
        <span class="tb-label" style="margin-top:16px;">All Known Types</span>
        <div class="tb-output" style="max-height:200px; overflow-y:auto;">${Object.entries(MAP).map(([e,m])=>`.${e} → ${m}`).join('\n')}</div>
      </div>`;
    const input = container.querySelector('#mtIn');
    const out = container.querySelector('#mtOut');
    input.addEventListener('input', () => {
      const ext = input.value.trim().toLowerCase().replace(/^\./,'');
      out.textContent = MAP[ext] ? `.${ext} → ${MAP[ext]}` : (ext ? 'Unknown extension.' : 'Type an extension above.');
    });
  }
});

// 36. USER-AGENT VIEWER --------------------------------------------------------
TB_TOOLS.push({
  id:'user-agent-viewer', name:'User-Agent Viewer', cat:'web', icon:'🌐',
  desc:'Shows exactly what your browser reports about itself and your device.',
  render(container){
    const info = [
      ['User Agent', navigator.userAgent],
      ['Platform', navigator.platform || '(not reported)'],
      ['Language', navigator.language],
      ['Languages', (navigator.languages||[]).join(', ')],
      ['Screen Size', `${screen.width} × ${screen.height}`],
      ['Viewport Size', `${window.innerWidth} × ${window.innerHeight}`],
      ['Pixel Ratio', window.devicePixelRatio],
      ['CPU Cores (reported)', navigator.hardwareConcurrency || '(not reported)'],
      ['Max Touch Points', navigator.maxTouchPoints],
      ['Online', navigator.onLine ? 'Yes' : 'No'],
      ['Cookies Enabled', navigator.cookieEnabled ? 'Yes' : 'No'],
    ];
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-output">${info.map(([k,v]) => `<div><b style="color:var(--amber);">${k}:</b> ${tbEscapeHtml(String(v))}</div>`).join('')}</div>
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="uaCopy">Copy Raw User Agent</button></div>
      </div>`;
    container.querySelector('#uaCopy').addEventListener('click', (e) => tbCopy(navigator.userAgent, e.target));
  }
});

// 37. MARKDOWN PREVIEW ----------------------------------------------------------
TB_TOOLS.push({
  id:'markdown-preview', name:'Markdown Preview', cat:'web', icon:'🌐',
  desc:'Basic live Markdown → HTML preview.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Markdown</span>
        <textarea class="tb-textarea" id="mdIn" style="min-height:180px;">
# Hello world

This is **bold**, this is *italic*, and this is \`inline code\`.

- First item
- Second item

[A link](https://example.com)
        </textarea>
        <span class="tb-label" style="margin-top:12px;">Preview</span>
        <div class="tb-output" id="mdOut" style="min-height:120px;"></div>
      </div>`;
    const input = container.querySelector('#mdIn');
    const out = container.querySelector('#mdOut');
    function render(md){
      let html = tbEscapeHtml(md);
      html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
                  .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                  .replace(/^# (.*)$/gm, '<h1>$1</h1>')
                  .replace(/^&gt; (.*)$/gm, '<blockquote style="border-left:2px solid var(--line-strong); padding-left:10px; color:var(--text-dim);">$1</blockquote>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/`(.+?)`/g, '<code style="background:var(--bg); padding:1px 5px; border-radius:4px;">$1</code>')
                  .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--cyan);">$1</a>')
                  .replace(/^- (.*)$/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>\n?)+/g, m => '<ul style="padding-left:20px;">' + m + '</ul>')
                  .replace(/\n\n/g, '<br><br>');
      out.innerHTML = html;
    }
    input.addEventListener('input', () => render(input.value));
    render(input.value);
  }
});

// 38. HTML PREVIEW (sandboxed, no script execution) ------------------------------
TB_TOOLS.push({
  id:'html-preview', name:'HTML Preview', cat:'web', icon:'🌐',
  desc:'Live-render an HTML snippet in a sandboxed frame — scripts are blocked for safety.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">HTML</span>
        <textarea class="tb-textarea" id="hpIn" style="min-height:160px;"><h2 style="font-family:sans-serif;">Hello!</h2>
<p style="font-family:sans-serif; color:#444;">Edit this HTML and watch it render live.</p></textarea>
        <span class="tb-label" style="margin-top:12px;">Preview</span>
        <iframe id="hpFrame" sandbox="allow-same-origin" style="width:100%; min-height:200px; border:1px solid var(--line-strong); border-radius:10px; background:#fff;"></iframe>
        <p class="tb-hint" style="margin-top:8px;">⚠️ Scripts are disabled in this preview for safety.</p>
      </div>`;
    const input = container.querySelector('#hpIn');
    const frame = container.querySelector('#hpFrame');
    function render(){ frame.srcdoc = input.value; }
    input.addEventListener('input', render);
    render();
  }
});

// 39. UTC / LOCAL CLOCK -------------------------------------------------------
TB_TOOLS.push({
  id:'utc-clock', name:'UTC / Local Clock', cat:'datetime', icon:'🕐',
  desc:'A live clock showing your local time alongside UTC.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-card-grid" style="grid-template-columns:1fr 1fr;">
          <div class="tb-tool-card" style="--accent:var(--sky); text-align:center; padding:24px 10px;">
            <div class="tb-tool-cat">Local Time</div>
            <div id="clockLocal" style="font-size:22px; font-weight:700; margin-top:8px; font-family:var(--disp);"></div>
          </div>
          <div class="tb-tool-card" style="--accent:var(--violet); text-align:center; padding:24px 10px;">
            <div class="tb-tool-cat">UTC Time</div>
            <div id="clockUtc" style="font-size:22px; font-weight:700; margin-top:8px; font-family:var(--disp);"></div>
          </div>
        </div>
        <div class="tb-hint" style="margin-top:14px; text-align:center;" id="clockZone"></div>
      </div>`;
    const localEl = container.querySelector('#clockLocal');
    const utcEl = container.querySelector('#clockUtc');
    const zoneEl = container.querySelector('#clockZone');
    function tick(){
      const d = new Date();
      localEl.textContent = d.toLocaleTimeString();
      utcEl.textContent = d.toUTCString().split(' ').slice(4,5)[0] || d.toUTCString();
      zoneEl.textContent = 'Detected timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    tick();
    tbAddInterval(setInterval(tick, 1000));
  }
});

// 40. TIMEZONE CONVERTER --------------------------------------------------------
TB_TOOLS.push({
  id:'timezone-converter', name:'Timezone Converter', cat:'datetime', icon:'🕐',
  desc:'See what your chosen local date & time looks like in other timezones.',
  render(container){
    const ZONES = ['UTC','America/Los_Angeles','America/Denver','America/Chicago','America/New_York','Europe/London','Europe/Paris','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Bangkok','Asia/Shanghai','Asia/Tokyo','Australia/Sydney','Pacific/Auckland'];
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Your Local Date & Time</span>
        <input type="datetime-local" class="tb-input" id="tzIn">
        <div id="tzOut" style="margin-top:14px; display:flex; flex-direction:column; gap:8px;"></div>
      </div>`;
    const input = container.querySelector('#tzIn');
    const out = container.querySelector('#tzOut');
    function pad(n){ return String(n).padStart(2,'0'); }
    const now = new Date();
    input.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    function update(){
      if (!input.value){ out.innerHTML=''; return; }
      const d = new Date(input.value);
      out.innerHTML = ZONES.map(zone => {
        const formatted = new Intl.DateTimeFormat('en-US', { timeZone: zone, dateStyle:'medium', timeStyle:'short' }).format(d);
        return `<div class="tb-row" style="justify-content:space-between; margin:0;"><span style="color:var(--text-dim);">${zone}</span><span>${formatted}</span></div>`;
      }).join('');
    }
    input.addEventListener('input', update);
    update();
  }
});

// 41. DATE DIFFERENCE CALCULATOR ------------------------------------------------
TB_TOOLS.push({
  id:'date-difference', name:'Date Difference', cat:'datetime', icon:'🕐',
  desc:'Find the time between two dates.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-row">
          <div style="flex:1;"><span class="tb-label">From</span><input type="date" class="tb-input" id="ddFrom"></div>
          <div style="flex:1;"><span class="tb-label">To</span><input type="date" class="tb-input" id="ddTo"></div>
        </div>
        <div class="tb-output" id="ddOut" style="margin-top:14px;"></div>
      </div>`;
    const from = container.querySelector('#ddFrom');
    const to = container.querySelector('#ddTo');
    const out = container.querySelector('#ddOut');
    const today = new Date();
    from.value = today.toISOString().slice(0,10);
    const nextMonth = new Date(today); nextMonth.setMonth(nextMonth.getMonth()+1);
    to.value = nextMonth.toISOString().slice(0,10);
    function update(){
      if (!from.value || !to.value){ out.textContent=''; return; }
      const d1 = new Date(from.value + 'T00:00:00');
      const d2 = new Date(to.value + 'T00:00:00');
      const ms = Math.abs(d2 - d1);
      const days = Math.round(ms / 86400000);
      const weeks = (days / 7).toFixed(1);
      const years = (days / 365.25).toFixed(2);
      out.textContent = `${days.toLocaleString()} days  •  ${weeks} weeks  •  ~${years} years`;
    }
    [from, to].forEach(el => el.addEventListener('input', update));
    update();
  }
});

// 42. ISO 8601 GENERATOR --------------------------------------------------------
TB_TOOLS.push({
  id:'iso8601-generator', name:'ISO 8601 Generator', cat:'datetime', icon:'🕐',
  desc:'Convert a chosen date & time into ISO 8601 formats.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Date & Time (your local time)</span>
        <input type="datetime-local" class="tb-input" id="isoIn">
        <div class="tb-row" style="margin-top:10px;"><button class="tb-btn tb-btn-sm" id="isoNow">Now</button></div>
        <span class="tb-label" style="margin-top:14px;">Full ISO 8601 (UTC)</span>
        <div class="tb-output" id="isoFull"></div>
        <span class="tb-label" style="margin-top:10px;">Date Only</span>
        <div class="tb-output" id="isoDate"></div>
      </div>`;
    const input = container.querySelector('#isoIn');
    const fullOut = container.querySelector('#isoFull');
    const dateOut = container.querySelector('#isoDate');
    function pad(n){ return String(n).padStart(2,'0'); }
    function setNow(){
      const d = new Date();
      input.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      update();
    }
    function update(){
      if (!input.value){ fullOut.textContent=''; dateOut.textContent=''; return; }
      const d = new Date(input.value);
      fullOut.textContent = d.toISOString();
      dateOut.textContent = d.toISOString().slice(0,10);
    }
    input.addEventListener('input', update);
    container.querySelector('#isoNow').addEventListener('click', setNow);
    setNow();
  }
});

// 43. COUNTDOWN TIMER -----------------------------------------------------------
TB_TOOLS.push({
  id:'countdown-timer', name:'Countdown Timer', cat:'datetime', icon:'🕐',
  desc:'Live countdown to any future date & time.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <span class="tb-label">Target Date & Time</span>
        <input type="datetime-local" class="tb-input" id="cdTarget">
        <div class="tb-card-grid" style="margin-top:16px; grid-template-columns:repeat(4,1fr);">
          <div class="tb-tool-card" style="--accent:var(--gold); text-align:center;"><div id="cdDays" style="font-size:22px; font-weight:700;">0</div><div class="tb-tool-cat">Days</div></div>
          <div class="tb-tool-card" style="--accent:var(--gold); text-align:center;"><div id="cdHours" style="font-size:22px; font-weight:700;">0</div><div class="tb-tool-cat">Hours</div></div>
          <div class="tb-tool-card" style="--accent:var(--gold); text-align:center;"><div id="cdMins" style="font-size:22px; font-weight:700;">0</div><div class="tb-tool-cat">Min</div></div>
          <div class="tb-tool-card" style="--accent:var(--gold); text-align:center;"><div id="cdSecs" style="font-size:22px; font-weight:700;">0</div><div class="tb-tool-cat">Sec</div></div>
        </div>
        <div class="tb-hint" id="cdStatus" style="margin-top:12px; text-align:center;"></div>
      </div>`;
    const target = container.querySelector('#cdTarget');
    const dEl = container.querySelector('#cdDays'), hEl = container.querySelector('#cdHours'),
          mEl = container.querySelector('#cdMins'), sEl = container.querySelector('#cdSecs');
    const status = container.querySelector('#cdStatus');
    const soon = new Date(Date.now() + 3600000 * 26);
    function pad(n){ return String(n).padStart(2,'0'); }
    target.value = `${soon.getFullYear()}-${pad(soon.getMonth()+1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;
    function tick(){
      if (!target.value){ status.textContent='Pick a target date & time.'; return; }
      const diff = new Date(target.value) - new Date();
      if (diff <= 0){ dEl.textContent=hEl.textContent=mEl.textContent=sEl.textContent='0'; status.textContent="⏰ Time's up!"; return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      dEl.textContent = days; hEl.textContent = hours; mEl.textContent = mins; sEl.textContent = secs;
      status.textContent = '';
    }
    target.addEventListener('input', tick);
    tick();
    tbAddInterval(setInterval(tick, 1000));
  }
});

// ---------- shared searchable reference list renderer ----------
function tbReferenceTool(container, entries){
  container.innerHTML = `
    <div class="tb-panel">
      <input type="text" class="tb-input" id="refSearch" placeholder="Search…">
      <div id="refList" style="margin-top:14px; display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;"></div>
    </div>`;
  const list = container.querySelector('#refList');
  function render(filter=''){
    const f = filter.toLowerCase();
    const matches = entries.filter(([term, desc]) => term.toLowerCase().includes(f) || desc.toLowerCase().includes(f));
    list.innerHTML = matches.map(([term, desc]) => `
      <div class="tb-tool-card" style="cursor:default;">
        <div class="tb-tool-name" style="font-family:var(--mono);">${tbEscapeHtml(term)}</div>
        <div class="tb-tool-cat" style="color:var(--text-dim); text-transform:none; letter-spacing:0;">${tbEscapeHtml(desc)}</div>
      </div>`).join('') || '<div class="tb-empty-hint">No matches.</div>';
  }
  container.querySelector('#refSearch').addEventListener('input', (e) => render(e.target.value));
  render();
}

// 44. REGEX REFERENCE ------------------------------------------------------------
TB_TOOLS.push({
  id:'regex-reference', name:'Regex Reference', cat:'reference', icon:'📚',
  desc:'Common regular expression syntax, searchable.',
  render(container){
    tbReferenceTool(container, [
      ['.', 'Any character except newline'],
      ['\\d', 'Any digit (0-9)'],
      ['\\D', 'Any non-digit'],
      ['\\w', 'Word character (a-z, A-Z, 0-9, _)'],
      ['\\W', 'Non-word character'],
      ['\\s', 'Whitespace character'],
      ['\\S', 'Non-whitespace character'],
      ['^', 'Start of string (or line, with m flag)'],
      ['$', 'End of string (or line, with m flag)'],
      ['*', 'Zero or more of the preceding'],
      ['+', 'One or more of the preceding'],
      ['?', 'Zero or one of the preceding'],
      ['{n}', 'Exactly n occurrences'],
      ['{n,}', 'n or more occurrences'],
      ['{n,m}', 'Between n and m occurrences'],
      ['[abc]', 'Any one of a, b, or c'],
      ['[^abc]', 'Any character except a, b, or c'],
      ['[a-z]', 'Any character in the range a to z'],
      ['(abc)', 'Capturing group'],
      ['(?:abc)', 'Non-capturing group'],
      ['a|b', 'a or b'],
      ['\\b', 'Word boundary'],
      ['g flag', 'Global — find all matches, not just the first'],
      ['i flag', 'Case-insensitive matching'],
      ['m flag', 'Multiline — ^ and $ match line boundaries'],
      ['s flag', 'Dot matches newline characters too'],
    ]);
  }
});

// 45. GIT COMMANDS REFERENCE -------------------------------------------------------
TB_TOOLS.push({
  id:'git-reference', name:'Git Commands', cat:'reference', icon:'📚',
  desc:'Common Git commands, searchable.',
  render(container){
    tbReferenceTool(container, [
      ['git init', 'Create a new local repository'],
      ['git clone <url>', 'Copy a remote repository locally'],
      ['git status', 'Show changed/staged files'],
      ['git add <file>', 'Stage a file for commit'],
      ['git add .', 'Stage all changed files'],
      ['git commit -m "msg"', 'Commit staged changes'],
      ['git push', 'Upload commits to the remote'],
      ['git pull', 'Fetch and merge from the remote'],
      ['git fetch', 'Download remote changes without merging'],
      ['git branch', 'List local branches'],
      ['git branch <name>', 'Create a new branch'],
      ['git checkout <branch>', 'Switch to a branch'],
      ['git checkout -b <branch>', 'Create and switch to a new branch'],
      ['git switch <branch>', 'Modern alternative to checkout for switching branches'],
      ['git merge <branch>', 'Merge a branch into the current one'],
      ['git log', 'Show commit history'],
      ['git log --oneline', 'Compact commit history'],
      ['git diff', 'Show unstaged changes'],
      ['git diff --staged', 'Show staged changes'],
      ['git stash', 'Temporarily shelve changes'],
      ['git stash pop', 'Reapply the most recent stash'],
      ['git reset --hard', 'Discard all local changes (destructive)'],
      ['git revert <commit>', 'Create a new commit that undoes another'],
      ['git remote -v', 'List remote repositories'],
      ['git rm <file>', 'Remove a file from working tree and index'],
      ['git tag <name>', 'Create a tag on the current commit'],
    ]);
  }
});

// 46. MARKDOWN REFERENCE ---------------------------------------------------------
TB_TOOLS.push({
  id:'markdown-reference', name:'Markdown Reference', cat:'reference', icon:'📚',
  desc:'Common Markdown syntax, searchable.',
  render(container){
    tbReferenceTool(container, [
      ['# Heading', 'Heading level 1'],
      ['## Heading', 'Heading level 2'],
      ['### Heading', 'Heading level 3'],
      ['**bold**', 'Bold text'],
      ['*italic*', 'Italic text'],
      ['~~strikethrough~~', 'Strikethrough text'],
      ['`code`', 'Inline code'],
      ['```code block```', 'Fenced code block'],
      ['[text](url)', 'Link'],
      ['![alt](url)', 'Image'],
      ['- item', 'Unordered list item'],
      ['1. item', 'Ordered list item'],
      ['> quote', 'Blockquote'],
      ['---', 'Horizontal rule'],
      ['| a | b |', 'Table row'],
      ['- [ ] task', 'Unchecked task list item'],
      ['- [x] task', 'Checked task list item'],
    ]);
  }
});

// 47. JPG TO PDF -----------------------------------------------------------
// Builds a real, valid PDF file from scratch (no external library) and
// triggers a direct download. Images are decoded via <canvas> (so PNG works
// too), flattened onto white (for any transparency), and embedded as
// DeviceRGB image data — compressed with the browser's native
// CompressionStream when available, falling back to uncompressed if not.
TB_TOOLS.push({
  id:'jpg-to-pdf', name:'JPG to PDF', cat:'files', icon:'📦',
  desc:'Combine one or more JPG/PNG images into a single PDF, downloaded straight to your device — nothing is ever uploaded anywhere.',
  render(container){
    container.innerHTML = `
      <div class="tb-panel">
        <div class="tb-dropzone" id="jpZone">
          <span class="tb-dz-icon">🖼️</span>
          Tap to choose images, or drag them here — you can add several
          <input type="file" class="tb-file-input" id="jpInput" accept="image/jpeg,image/png,image/*" multiple>
        </div>
        <div id="jpList" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;"></div>

        <div class="tb-row" style="margin-top:14px;">
          <div style="flex:1;">
            <span class="tb-label">Page Size</span>
            <select class="tb-select" id="jpPageMode">
              <option value="original">Original Image Size</option>
              <option value="a4">Fit to A4</option>
            </select>
          </div>
          <div style="flex:1;">
            <span class="tb-label">Filename</span>
            <input type="text" class="tb-input" id="jpFilename" value="images.pdf">
          </div>
        </div>

        <div class="tb-progress" id="jpProgress"><div class="tb-progress-fill" id="jpProgressFill"></div></div>
        <div class="tb-row" style="margin-top:12px;">
          <button class="tb-btn tb-btn-primary" id="jpConvert" disabled>Convert & Download PDF</button>
        </div>
        <div class="tb-output" id="jpStatus" style="margin-top:10px; display:none;"></div>
      </div>`;

    const zone = container.querySelector('#jpZone');
    const input = container.querySelector('#jpInput');
    const listEl = container.querySelector('#jpList');
    const convertBtn = container.querySelector('#jpConvert');
    const status = container.querySelector('#jpStatus');
    const progress = container.querySelector('#jpProgress');
    const progressFill = container.querySelector('#jpProgressFill');
    const pageMode = container.querySelector('#jpPageMode');
    const filenameIn = container.querySelector('#jpFilename');

    let files = []; // { file, url }

    function renderList(){
      listEl.innerHTML = files.map((f, i) => `
        <div class="tb-row" style="margin:0; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:8px 10px;">
          <img src="${f.url}" style="width:38px; height:38px; object-fit:cover; border-radius:6px; flex-shrink:0;">
          <span style="flex:1; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${tbEscapeHtml(f.file.name)}</span>
          <span style="font-size:11px; color:var(--text-dim);">${tbFmtBytes(f.file.size)}</span>
          <button class="tb-btn tb-btn-sm" data-remove="${i}">✕</button>
        </div>`).join('');
      convertBtn.disabled = files.length === 0;
    }

    function addFiles(fileList){
      Array.from(fileList).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        files.push({ file, url: URL.createObjectURL(file) });
      });
      renderList();
    }

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files.length) addFiles(input.files); input.value = ''; });
    ['dragover','dragenter'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (btn){ const i = parseInt(btn.dataset.remove, 10); URL.revokeObjectURL(files[i].url); files.splice(i,1); renderList(); }
    });

    // ---------- PDF building helpers ----------
    function loadImage(file){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Could not decode ' + file.name));
          img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read ' + file.name));
        reader.readAsDataURL(file);
      });
    }

    function imageToRgbBytes(img){
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const rgb = new Uint8Array((rgba.length / 4) * 3);
      for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3){
        rgb[j] = rgba[i]; rgb[j+1] = rgba[i+1]; rgb[j+2] = rgba[i+2];
      }
      return { rgb, width: canvas.width, height: canvas.height };
    }

    async function deflate(bytes){
      if (typeof CompressionStream === 'undefined') return null;
      try{
        const cs = new CompressionStream('deflate');
        const writer = cs.writable.getWriter();
        writer.write(bytes); writer.close();
        const reader = cs.readable.getReader();
        const chunks = []; let total = 0;
        while (true){
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); total += value.length;
        }
        const out = new Uint8Array(total); let off = 0;
        for (const c of chunks){ out.set(c, off); off += c.length; }
        return out;
      }catch(e){ return null; }
    }

    class PdfBuilder{
      constructor(totalObjs){ this.chunks = []; this.offset = 0; this.objOffsets = new Array(totalObjs+1).fill(0); }
      push(x){
        const bytes = typeof x === 'string' ? new TextEncoder().encode(x) : (x instanceof Uint8Array ? x : new Uint8Array(x));
        this.chunks.push(bytes); this.offset += bytes.length;
      }
      obj(num){ this.objOffsets[num] = this.offset; this.push(num + ' 0 obj\n'); }
      endObj(){ this.push('endobj\n'); }
      build(rootNum){
        const xrefStart = this.offset;
        let xref = 'xref\n0 ' + (this.objOffsets.length) + '\n0000000000 65535 f \n';
        for (let i = 1; i < this.objOffsets.length; i++) xref += String(this.objOffsets[i]).padStart(10,'0') + ' 00000 n \n';
        xref += 'trailer\n<< /Size ' + this.objOffsets.length + ' /Root ' + rootNum + ' 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';
        this.push(xref);
        return new Blob(this.chunks, { type:'application/pdf' });
      }
    }

    async function convert(){
      if (!files.length) return;
      convertBtn.disabled = true;
      status.style.display = 'none';
      progress.classList.add('active');
      progressFill.style.width = '5%';

      try{
        const n = files.length;
        const totalObjs = 2 + 3 * n;
        const pdf = new PdfBuilder(totalObjs);
        pdf.push(new Uint8Array([0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x34,0x0A])); // %PDF-1.4\n
        pdf.push(new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A])); // binary marker comment

        pdf.obj(1); pdf.push('<< /Type /Catalog /Pages 2 0 R >>\n'); pdf.endObj();
        const kids = Array.from({length:n}, (_,i) => (3+3*i) + ' 0 R').join(' ');
        pdf.obj(2); pdf.push('<< /Type /Pages /Kids [' + kids + '] /Count ' + n + ' >>\n'); pdf.endObj();

        for (let i = 0; i < n; i++){
          progressFill.style.width = Math.round(10 + (i / n) * 80) + '%';
          const img = await loadImage(files[i].file);
          const { rgb, width: imgW, height: imgH } = imageToRgbBytes(img);
          const compressed = await deflate(rgb);
          const imgBytes = compressed || rgb;

          let W, H, scaleX, scaleY, offX, offY;
          if (pageMode.value === 'a4'){
            const landscape = imgW > imgH;
            W = landscape ? 842 : 595; H = landscape ? 595 : 842;
            const margin = 20;
            const availW = W - margin*2, availH = H - margin*2;
            const scale = Math.min(availW/imgW, availH/imgH);
            scaleX = imgW*scale; scaleY = imgH*scale;
            offX = (W-scaleX)/2; offY = (H-scaleY)/2;
          } else {
            W = imgW; H = imgH; scaleX = imgW; scaleY = imgH; offX = 0; offY = 0;
          }

          const pageNum = 3+3*i, imgNum = 4+3*i, contentNum = 5+3*i;

          pdf.obj(pageNum);
          pdf.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 ' + imgNum + ' 0 R >> >> /Contents ' + contentNum + ' 0 R >>\n');
          pdf.endObj();

          const filterLine = compressed ? '/Filter /FlateDecode ' : '';
          pdf.obj(imgNum);
          pdf.push('<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 ' + filterLine + '/Length ' + imgBytes.length + ' >>\nstream\n');
          pdf.push(imgBytes);
          pdf.push('\nendstream\n');
          pdf.endObj();

          const contentStr = 'q\n' + scaleX.toFixed(2) + ' 0 0 ' + scaleY.toFixed(2) + ' ' + offX.toFixed(2) + ' ' + offY.toFixed(2) + ' cm\n/Im0 Do\nQ';
          pdf.obj(contentNum);
          pdf.push('<< /Length ' + contentStr.length + ' >>\nstream\n' + contentStr + '\nendstream\n');
          pdf.endObj();
        }

        progressFill.style.width = '95%';
        const blob = pdf.build(1);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let outName = filenameIn.value.trim() || 'images.pdf';
        if (!/\.pdf$/i.test(outName)) outName += '.pdf';
        a.download = outName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);

        progressFill.style.width = '100%';
        status.style.display = 'block';
        status.classList.remove('tb-error');
        status.textContent = `Done — ${n} page${n===1?'':'s'}, ${tbFmtBytes(blob.size)}. Download started.`;
      }catch(e){
        status.style.display = 'block';
        status.classList.add('tb-error');
        status.textContent = 'Could not build the PDF — ' + e.message;
      }
      setTimeout(() => { progress.classList.remove('active'); progressFill.style.width = '0%'; }, 600);
      convertBtn.disabled = false;
    }

    convertBtn.addEventListener('click', convert);
  }
});

// =====================================================================
// PHASE 4
// =====================================================================

// 48. QR CODE GENERATOR ------------------------------------------------------
// Hand-built QR encoder (Reed-Solomon + ISO/IEC 18004 module placement),
// no external library. Verified byte-for-byte against a real QR decoder
// (OpenCV) across versions 1-5, short/long text, URLs and special chars
// before shipping.
(function(){
  const GF_EXP = new Array(512);
  const GF_LOG = new Array(256);
  (function(){
    let x = 1;
    for (let i = 0; i < 255; i++){ GF_EXP[i]=x; GF_LOG[x]=i; x<<=1; if (x&0x100) x^=0x11D; }
    for (let i = 255; i < 512; i++) GF_EXP[i]=GF_EXP[i-255];
  })();
  function gfMul(a,b){ if (a===0||b===0) return 0; return GF_EXP[GF_LOG[a]+GF_LOG[b]]; }
  function rsGeneratorPoly(degree){
    let poly=[1];
    for (let i=0;i<degree;i++){
      const next=new Array(poly.length+1).fill(0);
      for (let j=0;j<poly.length;j++){ next[j+1]^=poly[j]; next[j]^=gfMul(poly[j],GF_EXP[i]); }
      poly=next;
    }
    return poly.reverse();
  }
  function rsEncode(dataCodewords, ecCount){
    const gen = rsGeneratorPoly(ecCount);
    const res = new Array(dataCodewords.length+ecCount).fill(0);
    for (let i=0;i<dataCodewords.length;i++) res[i]=dataCodewords[i];
    for (let i=0;i<dataCodewords.length;i++){
      const coef=res[i]; if (coef===0) continue;
      for (let j=0;j<gen.length;j++) res[i+j]^=gfMul(gen[j],coef);
    }
    return res.slice(dataCodewords.length);
  }
  const QR_VERSIONS = {
    1:{size:21,dataCw:19,ecCw:7}, 2:{size:25,dataCw:34,ecCw:10}, 3:{size:29,dataCw:55,ecCw:15},
    4:{size:33,dataCw:80,ecCw:20}, 5:{size:37,dataCw:108,ecCw:26},
  };
  function chooseVersion(byteLen){
    for (let v=1; v<=5; v++){
      const capBits = QR_VERSIONS[v].dataCw*8;
      const overhead = 4+8;
      if (overhead + byteLen*8 + 4 <= capBits) return v;
    }
    return null;
  }
  function encodeData(bytes, version){
    const info = QR_VERSIONS[version];
    const bits=[];
    function put(val,len){ for (let i=len-1;i>=0;i--) bits.push((val>>i)&1); }
    put(0b0100,4); put(bytes.length,8);
    for (const b of bytes) put(b,8);
    const capBits = info.dataCw*8;
    const termLen = Math.min(4, capBits-bits.length);
    if (termLen>0) put(0,termLen);
    while (bits.length%8!==0) bits.push(0);
    const padBytes=[0xEC,0x11]; let pi=0;
    while (bits.length<capBits){ put(padBytes[pi%2],8); pi++; }
    const codewords=[];
    for (let i=0;i<bits.length;i+=8){ let b=0; for (let j=0;j<8;j++) b=(b<<1)|bits[i+j]; codewords.push(b); }
    return codewords;
  }
  function buildMatrix(version){
    const info = QR_VERSIONS[version];
    const N = info.size;
    const matrix = Array.from({length:N},()=>new Array(N).fill(null));
    const reserved = Array.from({length:N},()=>new Array(N).fill(false));
    function setModule(r,c,val,res=true){ matrix[r][c]=val?1:0; if (res) reserved[r][c]=true; }
    function placeFinder(r,c){
      for (let dr=-1; dr<=7; dr++) for (let dc=-1; dc<=7; dc++){
        const rr=r+dr, cc=c+dc;
        if (rr<0||cc<0||rr>=N||cc>=N) continue;
        let val;
        if (dr>=0&&dr<=6&&dc>=0&&dc<=6){
          const isBorder=dr===0||dr===6||dc===0||dc===6;
          const isInner=dr>=2&&dr<=4&&dc>=2&&dc<=4;
          val=(isBorder||isInner)?1:0;
        } else val=0;
        setModule(rr,cc,val,true);
      }
    }
    placeFinder(0,0); placeFinder(0,N-7); placeFinder(N-7,0);
    for (let i=8;i<N-8;i++){ setModule(6,i,i%2===0,true); setModule(i,6,i%2===0,true); }
    setModule(4*version+9,8,1,true);
    if (version>=2){
      const p=4*version+10;
      for (let dr=-2; dr<=2; dr++) for (let dc=-2; dc<=2; dc++){
        const rr=p+dr, cc=p+dc;
        const isBorder=Math.max(Math.abs(dr),Math.abs(dc))===2;
        const isCenter=dr===0&&dc===0;
        setModule(rr,cc,isBorder||isCenter,true);
      }
    }
    for (let i=0;i<=8;i++){ if (!reserved[8][i]) reserved[8][i]=true; if (!reserved[i][8]) reserved[i][8]=true; }
    for (let i=0;i<7;i++) reserved[N-1-i][8]=true;
    for (let i=0;i<8;i++) reserved[8][N-1-i]=true;
    reserved[8][8]=true;
    return { matrix, reserved, N };
  }
  function placeData(matrix, reserved, N, codewords){
    const bits=[];
    for (const cw of codewords) for (let i=7;i>=0;i--) bits.push((cw>>i)&1);
    let bi=0, col=N-1, dir=-1;
    while (col>0){
      if (col===6) col--;
      for (let i=0;i<N;i++){
        const row = dir===-1 ? N-1-i : i;
        for (const c of [col,col-1]){
          if (!reserved[row][c]){ matrix[row][c] = bi<bits.length ? bits[bi] : 0; bi++; }
        }
      }
      dir=-dir; col-=2;
    }
  }
  function applyMask(matrix, reserved, N){
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (!reserved[r][c] && (r+c)%2===0) matrix[r][c]^=1;
  }
  function formatBits(maskPattern){
    const ecBits=0b01;
    let data=(ecBits<<3)|maskPattern;
    let d=data<<10;
    const gen=0b10100110111;
    for (let i=14;i>=10;i--) if ((d>>i)&1) d^=(gen<<(i-10));
    return (((data<<10)|d) ^ 0b101010000010010) & 0x7FFF;
  }
  function placeFormatInfo(matrix, N, maskPattern){
    const fbits=formatBits(maskPattern);
    const bit=(i)=>(fbits>>(14-i))&1;
    for (let i=0;i<=5;i++) matrix[8][i]=bit(i);
    matrix[8][7]=bit(6); matrix[8][8]=bit(7); matrix[7][8]=bit(8);
    for (let i=9;i<15;i++) matrix[14-i][8]=bit(i);
    for (let i=0;i<7;i++) matrix[N-1-i][8]=bit(i);
    for (let i=7;i<15;i++) matrix[8][N-15+i]=bit(i);
  }
  function generateQRMatrix(text){
    const bytes = Array.from(new TextEncoder().encode(text));
    const version = chooseVersion(bytes.length);
    if (!version) return null;
    const info = QR_VERSIONS[version];
    const dataCodewords = encodeData(bytes, version);
    const ecCodewords = rsEncode(dataCodewords, info.ecCw);
    const allCodewords = dataCodewords.concat(ecCodewords);
    const { matrix, reserved, N } = buildMatrix(version);
    placeData(matrix, reserved, N, allCodewords);
    applyMask(matrix, reserved, N);
    placeFormatInfo(matrix, N, 0);
    return { matrix, N };
  }

  TB_TOOLS.push({
    id:'qr-code-generator', name:'QR Code Generator', cat:'web', icon:'🌐',
    desc:'Turn text or a URL into a scannable QR code — generated locally, nothing is sent anywhere.',
    render(container){
      container.innerHTML = `
        <div class="tb-panel">
          <span class="tb-label">Text or URL</span>
          <textarea class="tb-textarea" id="qrIn" style="min-height:80px;" placeholder="https://example.com">https://example.com</textarea>
          <div style="display:flex; justify-content:center; margin-top:16px;">
            <canvas id="qrCanvas" style="border-radius:10px; max-width:100%;"></canvas>
          </div>
          <div class="tb-output" id="qrStatus" style="margin-top:10px; text-align:center;"></div>
          <div class="tb-row" style="margin-top:10px; justify-content:center;">
            <button class="tb-btn tb-btn-primary" id="qrDownload">Download PNG</button>
          </div>
        </div>`;
      const input = container.querySelector('#qrIn');
      const canvas = container.querySelector('#qrCanvas');
      const status = container.querySelector('#qrStatus');
      const downloadBtn = container.querySelector('#qrDownload');
      const ctx = canvas.getContext('2d');

      function render(){
        const text = input.value;
        if (!text){ status.textContent = 'Enter some text above.'; canvas.style.display='none'; downloadBtn.disabled=true; return; }
        const result = generateQRMatrix(text);
        if (!result){ status.classList.add('tb-error'); status.textContent = 'Text is too long (max ~100 characters).'; canvas.style.display='none'; downloadBtn.disabled=true; return; }
        status.classList.remove('tb-error');
        const { matrix, N } = result;
        const scale = 8, quiet = 4;
        const size = (N + quiet*2) * scale;
        canvas.width = size; canvas.height = size;
        canvas.style.display = 'block';
        canvas.style.width = Math.min(300, size) + 'px';
        canvas.style.height = Math.min(300, size) + 'px';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0,0,size,size);
        ctx.fillStyle = '#000000';
        for (let r=0;r<N;r++) for (let c=0;c<N;c++){
          if (matrix[r][c]) ctx.fillRect((c+quiet)*scale, (r+quiet)*scale, scale, scale);
        }
        status.textContent = `${N}×${N} modules`;
        downloadBtn.disabled = false;
      }
      input.addEventListener('input', render);
      downloadBtn.addEventListener('click', () => {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'qrcode.png';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }, 'image/png');
      });
      render();
    }
  });
})();

// 49. TRUSTED RESOURCES ------------------------------------------------------
TB_TOOLS.push({
  id:'trusted-resources', name:'Trusted Resources', cat:'reference', icon:'📚',
  desc:'A curated shortlist of sites CS students and web developers actually reach for — docs, learning, and daily tools.',
  render(container){
    const GROUPS = [
      { title:'Documentation', accent:'--cyan', links:[
        ['MDN Web Docs', 'The reference for HTML, CSS, JS & Web APIs', 'https://developer.mozilla.org'],
        ['DevDocs', 'Fast, searchable docs for dozens of languages in one place', 'https://devdocs.io'],
        ['Can I Use', 'Browser support tables for web features', 'https://caniuse.com'],
        ['TypeScript Docs', 'Official TypeScript handbook & reference', 'https://www.typescriptlang.org/docs'],
      ]},
      { title:'Learning', accent:'--green', links:[
        ['freeCodeCamp', 'Free, project-based coding curriculum', 'https://www.freecodecamp.org'],
        ['The Odin Project', 'Free full-stack web dev course', 'https://www.theodinproject.com'],
        ['CS50 (Harvard)', "Harvard's free intro to computer science", 'https://cs50.harvard.edu'],
        ['roadmap.sh', 'Visual roadmaps for dev & CS career paths', 'https://roadmap.sh'],
      ]},
      { title:'Practice & Tools', accent:'--violet', links:[
        ['LeetCode', 'Coding interview & algorithm practice', 'https://leetcode.com'],
        ['GitHub', 'Host and collaborate on code', 'https://github.com'],
        ['Stack Overflow', 'Q&A for programming problems', 'https://stackoverflow.com'],
        ['regex101', 'Interactive regex tester & explainer', 'https://regex101.com'],
        ['npm', 'JavaScript package registry', 'https://www.npmjs.com'],
        ['CodePen', 'Live front-end playground & sharing', 'https://codepen.io'],
      ]},
    ];
    container.innerHTML = GROUPS.map(group => `
      <div class="tb-section-title" style="margin-top:22px;">${group.title}</div>
      <div class="tb-card-grid">
        ${group.links.map(([name, desc, url]) => `
          <a class="tb-tool-card" style="--accent:var(${group.accent}); text-decoration:none;" href="${url}" target="_blank" rel="noopener noreferrer">
            <span class="tb-tool-icon">↗</span>
            <div class="tb-tool-name">${name}</div>
            <div class="tb-tool-cat" style="color:var(--text-dim); text-transform:none; letter-spacing:0;">${desc}</div>
          </a>`).join('')}
      </div>`).join('');
  }
});
