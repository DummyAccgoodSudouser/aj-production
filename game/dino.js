const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 700; canvas.height = 260;

const GROUND_Y = 210;
let dino, obstacles, speed, score, best, alive, spawnTimer, frame, clouds;

// ---------- Day/night cycle ----------
const CYCLE_LEN = 2400; // frames per full day+night cycle (~40s at 60fps)
const stars = Array.from({ length: 40 }, () => ({
  x: Math.random() * 700,
  y: Math.random() * (GROUND_Y - 30),
  r: Math.random() * 1.4 + 0.4,
  phase: Math.random() * Math.PI * 2,
}));

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

const SKY_DAY = [46, 66, 96];
const SKY_NIGHT = [7, 9, 15];
const GROUND_DAY = [58, 44, 30];
const GROUND_NIGHT = [15, 12, 10];

function reset() {
  dino = { x: 60, y: GROUND_Y - 40, w: 34, h: 40, vy: 0, jumping: false, duckFrame: 0 };
  obstacles = [];
  clouds = [{x:150,y:40},{x:420,y:70},{x:600,y:30}];
  speed = 6.5;
  score = 0;
  alive = true;
  spawnTimer = 0;
  frame = 0;
  document.getElementById('score').textContent = '0';
  document.getElementById('overlay').style.display = 'none';
}

function jump() {
  if (!alive) return reset();
  if (!dino.jumping) {
    dino.jumping = true;
    dino.vy = -12.5;
  }
}

function spawnObstacle() {
  const isBird = Math.random() < 0.25 && score > 150;
  if (isBird) {
    obstacles.push({ x: canvas.width + 20, y: GROUND_Y - 70 - Math.random()*30, w: 32, h: 22, bird: true });
  } else {
    const tall = Math.random() < 0.4;
    obstacles.push({ x: canvas.width + 20, y: GROUND_Y - (tall?46:32), w: tall?24:30, h: tall?46:32, bird:false });
  }
}

function update() {
  if (!alive) return;
  frame++;
  score += 0.6;
  document.getElementById('score').textContent = Math.floor(score);
  speed = 6.5 + Math.floor(score / 100) * 0.5;

  dino.vy += 0.62;
  dino.y += dino.vy;
  if (dino.y > GROUND_Y - dino.h) { dino.y = GROUND_Y - dino.h; dino.vy = 0; dino.jumping = false; }

  spawnTimer -= 1;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 55 + Math.random() * 45 - Math.min(30, score/20);
  }

  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x + o.w > -10);

  clouds.forEach(c => { c.x -= speed * 0.25; if (c.x < -60) c.x = canvas.width + Math.random()*100; });

  for (const o of obstacles) {
    const pad = 6;
    if (dino.x + pad < o.x + o.w && dino.x + dino.w - pad > o.x &&
        dino.y + pad < o.y + o.h && dino.y + dino.h - pad > o.y) {
      return gameOver();
    }
  }
}

function gameOver() {
  alive = false;
  best = Math.max(best || 0, Math.floor(score));
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `Game over — score ${Math.floor(score)} (best ${best})`;
  if (window.AJSubmitScore) window.AJSubmitScore('dino', Math.floor(score));
}

function draw() {
  const cyclePos = (frame % CYCLE_LEN) / CYCLE_LEN; // 0..1, one full day+night
  const brightness = (Math.cos(cyclePos * Math.PI * 2) + 1) / 2; // 1=noon, 0=midnight
  const isDay = cyclePos < 0.5;

  const sky = lerpColor(SKY_NIGHT, SKY_DAY, brightness);
  const groundColor = lerpColor(GROUND_NIGHT, GROUND_DAY, brightness);

  ctx.fillStyle = `rgb(${sky[0]},${sky[1]},${sky[2]})`;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);
  ctx.fillStyle = `rgb(${groundColor[0]},${groundColor[1]},${groundColor[2]})`;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  // stars, fade in as night deepens
  const nightFactor = 1 - brightness;
  if (nightFactor > 0.15) {
    stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.05 + s.phase);
      ctx.fillStyle = `rgba(255,255,255,${(nightFactor - 0.15) * 1.2 * twinkle})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  // sun (first half of cycle) / moon (second half), arcing across the sky
  const half = isDay ? cyclePos / 0.5 : (cyclePos - 0.5) / 0.5;
  const bodyX = half * canvas.width;
  const bodyY = GROUND_Y - 30 - Math.sin(half * Math.PI) * 150;
  if (isDay) {
    const grad = ctx.createRadialGradient(bodyX, bodyY, 2, bodyX, bodyY, 26);
    grad.addColorStop(0, '#FFE9B8');
    grad.addColorStop(1, '#FFB454');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(bodyX, bodyY, 18, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#E7EAF0';
    ctx.beginPath(); ctx.arc(bodyX, bodyY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgb(${sky[0]},${sky[1]},${sky[2]})`;
    ctx.beginPath(); ctx.arc(bodyX + 6, bodyY - 4, 12, 0, Math.PI * 2); ctx.fill();
  }

  ctx.strokeStyle = `rgba(255,255,255,${0.1 + brightness * 0.15})`;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(canvas.width, GROUND_Y); ctx.stroke();

  ctx.fillStyle = `rgba(255,255,255,${0.05 + brightness * 0.08})`;
  clouds.forEach(c => { ctx.beginPath(); ctx.ellipse(c.x, c.y, 22, 9, 0, 0, Math.PI*2); ctx.fill(); });

  ctx.fillStyle = '#FFB454';
  ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
  ctx.fillStyle = `rgb(${sky[0]},${sky[1]},${sky[2]})`;
  ctx.fillRect(dino.x + dino.w - 12, dino.y + 8, 6, 6);

  obstacles.forEach(o => {
    ctx.fillStyle = o.bird ? '#5CCFE6' : '#7FD98A';
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener('pointerdown', jump);
document.getElementById('overlay').addEventListener('click', reset);

reset();
loop();
