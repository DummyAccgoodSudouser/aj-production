(function () {
  const loader = document.getElementById('bootLoader');
  const fill = document.getElementById('bootFill');
  const pct = document.getElementById('bootPct');
  if (!loader || !fill || !pct) return;

  let p = 0;
  const timer = setInterval(() => {
    p = Math.min(100, p + Math.floor(3 + Math.random() * 5));
    fill.style.width = p + '%';
    pct.textContent = String(p).padStart(2, '0') + '%';
    if (p >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        loader.classList.add('boot-done');
        setTimeout(() => loader.remove(), 400);
      }, 200);
    }
  }, 45);
})();
