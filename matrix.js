(function () {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CHARS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let cols, drops, fontSize;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fontSize = 15;
    cols = Math.ceil(canvas.width / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }
  resize();
  window.addEventListener('resize', resize);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // respect accessibility preference, leave canvas blank

  function draw() {
    ctx.fillStyle = 'rgba(10,13,18,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < cols; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      const leadBright = Math.random() > 0.93;
      ctx.fillStyle = leadBright ? 'rgba(190,255,230,0.9)' : 'rgba(92,230,199,0.35)';
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
