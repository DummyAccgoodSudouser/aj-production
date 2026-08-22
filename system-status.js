(function () {
  const PERMS = [
    { id: 'mic', label: 'Microphone', icon: '🎤', queryName: 'microphone' },
    { id: 'notif', label: 'Notifications', icon: '🔔', queryName: null }, // handled specially
    { id: 'cam', label: 'Camera', icon: '📷', queryName: 'camera' },
  ];

  function fmtTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // ---------- Session timer (wall-clock based, survives background throttling) ----------
  function startTimer() {
    const startedAt = Date.now();
    const el = document.getElementById('sessionTime');
    function tick() {
      if (el) el.textContent = fmtTime(Date.now() - startedAt);
      requestAnimationFrame(() => setTimeout(tick, 500));
    }
    tick();
  }

  // ---------- Permission status ----------
  async function getStatus(perm) {
    if (perm.id === 'notif') {
      if (!('Notification' in window)) return 'unsupported';
      return Notification.permission; // 'granted' | 'denied' | 'default'
    }
    if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
    try {
      const res = await navigator.permissions.query({ name: perm.queryName });
      return res.state; // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      return 'unknown'; // Safari doesn't support querying mic/camera state — this is expected there
    }
  }

  function statusMeta(state) {
    switch (state) {
      case 'granted': return { dot: 'good', text: 'Allowed' };
      case 'denied': return { dot: 'bad', text: 'Blocked' };
      case 'prompt': return { dot: 'wait', text: 'Not asked yet' };
      case 'unsupported': return { dot: 'wait', text: 'Not supported' };
      default: return { dot: 'wait', text: 'Tap to check' };
    }
  }

  async function refreshRow(perm) {
    const row = document.getElementById('perm-' + perm.id);
    if (!row) return;
    const state = await getStatus(perm);
    const meta = statusMeta(state);
    row.querySelector('.perm-dot').className = 'perm-dot ' + meta.dot;
    row.querySelector('.perm-status').textContent = meta.text;
  }

  async function requestPerm(perm) {
    try {
      if (perm.id === 'notif') {
        if (!('Notification' in window)) return;
        await Notification.requestPermission();
      } else if (perm.id === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // we only needed the permission prompt, not the stream
      } else if (perm.id === 'cam') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      // user denied or no device — status refresh below will reflect the real state either way
    }
    refreshRow(perm);
  }

  function render() {
    const mount = document.getElementById('systemStatus');
    if (!mount) return;
    mount.innerHTML = `
      <div class="sys-status-panel">
        <div class="sys-status-row sys-status-time">
          <span class="sys-status-icon">⏱️</span>
          <span class="sys-status-label">Time on this page</span>
          <span class="sys-status-value" id="sessionTime">00:00:00</span>
        </div>
        ${PERMS.map(p => `
          <div class="sys-status-row" id="perm-${p.id}">
            <span class="sys-status-icon">${p.icon}</span>
            <span class="sys-status-label">${p.label}</span>
            <span class="perm-dot wait" title="Status"></span>
            <span class="perm-status sys-status-value">Checking…</span>
            <button class="perm-req-btn" data-id="${p.id}">Request</button>
          </div>
        `).join('')}
      </div>
    `;
    mount.querySelectorAll('.perm-req-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const perm = PERMS.find(p => p.id === btn.dataset.id);
        if (perm) requestPerm(perm);
      });
    });
    PERMS.forEach(refreshRow);
    startTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
