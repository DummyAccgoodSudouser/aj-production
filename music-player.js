/* ===================== Music Player (site-wide, persistent) =====================
   Free, ad-supported-by-YouTube-itself music search + playback.
   - Search + catalog: YouTube Data API v3 (free, no card — see setup note below)
   - Playback engine: YouTube IFrame Player API (free, hidden — we build 100% custom UI on top)
   - Cross-page "persistence": every ~1s we save {videoId, title, thumb, channel, time, playing,
     volume} to localStorage. Every new page reads that on load and resumes automatically.
     There's a small (~1-2s) gap while the page loads — that's expected and was the option chosen.

   >>> SETUP: paste your free YouTube Data API key below (Google Cloud Console →
       enable "YouTube Data API v3" → Credentials → Create API key → no billing needed). <<<
*/
const YOUTUBE_API_KEY = "AIzaSyA11XVCG55Q7fJ0QD1UYTpS6WhAXLTCxsw";

const MP_STATE_KEY = 'mp_state_v1';

(function () {
  let ytPlayer = null;
  let ytReady = false;
  let pendingLoad = null; // {videoId, time, playing} — applied once player is ready
  let saveTimer = null;
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(MP_STATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState(patch) {
    state = Object.assign({}, state || {}, patch);
    try { localStorage.setItem(MP_STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------------- Build UI ---------------- */
  function buildUI() {
    const root = document.createElement('div');
    root.id = 'mpRoot';
    root.innerHTML = `
      <div id="mpYt"><div id="mpYtInner"></div></div>
      <div id="mpPanel">
        <div id="mpPanelHead"><b>NOW PLAYING</b><span id="mpClose">&times;</span></div>
        <div id="mpHero">
          <div id="mpHeroDisc"></div>
          <div id="mpHeroTitle">No track playing</div>
          <div id="mpHeroSub">Search below to start</div>
          <div id="mpEq">${'<span></span>'.repeat(7)}</div>
        </div>
        <div id="mpSeekRow">
          <span id="mpTimeCur">0:00</span>
          <input id="mpSeek" type="range" min="0" max="100" value="0" />
          <span id="mpTimeDur">0:00</span>
        </div>
        <div id="mpControls">
          <span class="mp-btn" id="mpPrev" title="Restart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </span>
          <span class="mp-btn" id="mpPlayBtn" title="Play/Pause">
            <svg id="mpPlayIcon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
          <span class="mp-btn" id="mpNext" title="Skip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>
          </span>
        </div>
        <div id="mpVolRow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3z"/></svg>
          <input id="mpVol" type="range" min="0" max="100" value="70" />
        </div>
        <div id="mpSearchRow">
          <input id="mpSearchInput" type="text" placeholder="Search any song…" />
          <button id="mpSearchBtn">Go</button>
        </div>
        <div id="mpResults"><div class="mp-empty">Search for a song to get started</div></div>
      </div>
      <div id="mpPill">
        <div id="mpDisc"></div>
        <div id="mpPillText">
          <div id="mpPillTitle">Music</div>
          <div id="mpPillSub">Tap to open</div>
        </div>
        <div id="mpMiniEq"><span></span><span></span><span></span></div>
      </div>
    `;
    document.body.appendChild(root);
    wireUI();
  }

  function wireUI() {
    const pill = document.getElementById('mpPill');
    const panel = document.getElementById('mpPanel');
    const close = document.getElementById('mpClose');
    pill.addEventListener('click', () => panel.classList.toggle('mp-open'));
    close.addEventListener('click', () => panel.classList.remove('mp-open'));

    document.getElementById('mpPlayBtn').addEventListener('click', togglePlay);
    document.getElementById('mpPrev').addEventListener('click', () => { if (ytPlayer) ytPlayer.seekTo(0, true); });
    document.getElementById('mpNext').addEventListener('click', playNextFromResults);

    const seek = document.getElementById('mpSeek');
    seek.addEventListener('input', () => {
      if (!ytPlayer || !ytPlayer.getDuration) return;
      const dur = ytPlayer.getDuration() || 0;
      ytPlayer.seekTo((seek.value / 100) * dur, true);
    });

    const vol = document.getElementById('mpVol');
    vol.value = (state && typeof state.volume === 'number') ? state.volume : 70;
    vol.addEventListener('input', () => {
      if (ytPlayer) ytPlayer.setVolume(Number(vol.value));
      saveState({ volume: Number(vol.value) });
    });

    const input = document.getElementById('mpSearchInput');
    const btn = document.getElementById('mpSearchBtn');
    const doSearch = () => runSearch(input.value.trim());
    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  /* ---------------- YouTube search (Data API) ---------------- */
  let lastResults = [];
  async function runSearch(query) {
    const results = document.getElementById('mpResults');
    if (!query) return;
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
      results.innerHTML = `<div class="mp-empty">Music search isn't set up yet — add a free YouTube API key in music-player.js</div>`;
      return;
    }
    results.innerHTML = `<div class="mp-empty">Searching…</div>`;
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        // Surface Google's real reason instead of a generic message — same
        // "show the true error" fix we applied to the dictionary lookup.
        const reason = data?.error?.errors?.[0]?.reason || data?.error?.status || res.status;
        const msg = data?.error?.message || 'Unknown error';
        throw new Error(`${reason}: ${msg}`);
      }
      lastResults = (data.items || []).map(it => ({
        videoId: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url
      }));
      renderResults();
    } catch (e) {
      results.innerHTML = `<div class="mp-empty">Search failed: ${escapeHtml(e.message || String(e))}</div>`;
    }
  }

  function renderResults() {
    const results = document.getElementById('mpResults');
    if (!lastResults.length) { results.innerHTML = `<div class="mp-empty">No results</div>`; return; }
    results.innerHTML = '';
    lastResults.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'mp-result';
      row.innerHTML = `<img src="${r.thumb}" alt=""><div><div class="mp-result-title">${escapeHtml(r.title)}</div><div class="mp-result-channel">${escapeHtml(r.channel)}</div></div>`;
      row.addEventListener('click', () => playTrack(r));
      results.appendChild(row);
    });
  }

  function playNextFromResults() {
    if (!lastResults.length || !state) return;
    const idx = lastResults.findIndex(r => r.videoId === state.videoId);
    const next = lastResults[(idx + 1) % lastResults.length];
    if (next) playTrack(next);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ---------------- Playback ---------------- */
  function playTrack(track) {
    saveState({ videoId: track.videoId, title: track.title, channel: track.channel, thumb: track.thumb, time: 0, playing: true });
    updateNowPlayingUI();
    if (ytReady && ytPlayer) {
      ytPlayer.loadVideoById(track.videoId, 0);
    } else {
      pendingLoad = { videoId: track.videoId, time: 0, playing: true };
    }
  }

  function togglePlay() {
    if (!ytPlayer || !state || !state.videoId) return;
    const playerState = ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : -1;
    if (playerState === 1) { ytPlayer.pauseVideo(); } else { ytPlayer.playVideo(); }
  }

  function updateNowPlayingUI() {
    if (!state || !state.videoId) return;
    const title = state.title || 'Unknown track';
    document.getElementById('mpPillTitle').textContent = title;
    document.getElementById('mpPillSub').textContent = state.channel || '';
    document.getElementById('mpHeroTitle').textContent = title;
    document.getElementById('mpHeroSub').textContent = state.channel || '';
    if (state.thumb) {
      document.getElementById('mpDisc').style.backgroundImage = `url(${state.thumb})`;
      document.getElementById('mpHeroDisc').style.backgroundImage = `url(${state.thumb})`;
    }
  }

  function setPlayingVisual(isPlaying) {
    document.getElementById('mpDisc').classList.toggle('mp-playing', isPlaying);
    document.getElementById('mpHeroDisc').classList.toggle('mp-playing', isPlaying);
    document.getElementById('mpMiniEq').classList.toggle('mp-playing', isPlaying);
    document.getElementById('mpEq').classList.toggle('mp-playing', isPlaying);
    const icon = document.getElementById('mpPlayIcon');
    icon.innerHTML = isPlaying
      ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }

  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60), sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  }

  /* ---------------- YouTube IFrame API ---------------- */
  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) { initPlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
  }

  function initPlayer() {
    ytPlayer = new YT.Player('mpYtInner', {
      height: '1', width: '1',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: () => {
          ytReady = true;
          const vol = document.getElementById('mpVol');
          ytPlayer.setVolume(Number(vol.value));
          if (pendingLoad) {
            ytPlayer.loadVideoById(pendingLoad.videoId, pendingLoad.time || 0);
            pendingLoad = null;
          } else if (state && state.videoId) {
            // resume from a previous page
            ytPlayer.cueVideoById(state.videoId, state.time || 0);
            updateNowPlayingUI();
            if (state.playing) {
              setTimeout(() => ytPlayer.playVideo(), 300);
            }
          }
          startTicker();
        },
        onStateChange: (e) => {
          const playing = e.data === YT.PlayerState.PLAYING;
          setPlayingVisual(playing);
          saveState({ playing });
          if (e.data === YT.PlayerState.ENDED) playNextFromResults();
        }
      }
    });
  }

  function startTicker() {
    setInterval(() => {
      if (!ytPlayer || !ytPlayer.getCurrentTime) return;
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 0;
      document.getElementById('mpTimeCur').textContent = fmtTime(cur);
      document.getElementById('mpTimeDur').textContent = fmtTime(dur);
      if (dur > 0) document.getElementById('mpSeek').value = (cur / dur) * 100;
      saveState({ time: cur });
    }, 1000);
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    buildUI();
    if (state && state.videoId) updateNowPlayingUI();
    loadYouTubeAPI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
