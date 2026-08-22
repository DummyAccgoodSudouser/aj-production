const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 360; canvas.height = 560;

const ROAD_X = 40, ROAD_W = canvas.width - 80;
const LANES = 3, LANE_W = ROAD_W / LANES;

let player, traffic, speed, maxSpeed, dist, alive, spawnTimer, keys, dashOffset;

function reset() {
  player = { x: canvas.width / 2, vx: 0, y: canvas.height - 110, w: 34, h: 58 };
  traffic = [];
  speed = 0;
  maxSpeed = 12;
  dist = 0;
  alive = true;
  spawnTimer = 0;
  dashOffset = 0;
  keys = {};
  document.getElementById('score').textContent = '0';
  document.getElementById('speed').textContent = '0';
  document.getElementById('overlay').style.display = 'none';
}

function laneCenter(i) { return ROAD_X + LANE_W * i + LANE_W / 2; }

function spawnTraffic() {
  const lane = Math.floor(Math.random() * LANES);
  const w = 32;
  traffic.push({ x: laneCenter(lane) - w / 2, y: -90, w, h: 56, lane, hue: Math.floor(Math.random()*4) });
}

function update() {
  if (!alive) return;

  // acceleration / brake
  if (keys['ArrowUp'] || keys['w'] || keys['W']) speed = Math.min(maxSpeed, speed + 0.18);
  else if (keys['ArrowDown'] || keys['s'] || keys['S']) speed = Math.max(-2, speed - 0.35);
  else speed = Math.max(0, speed - 0.05); // natural drag

  // steering
  const steerForce = 0.55;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.vx -= steerForce;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx += steerForce;
  player.vx *= 0.85;
  player.x += player.vx * (0.4 + speed / maxSpeed * 0.8);
  player.x = Math.max(ROAD_X + player.w/2 + 4, Math.min(ROAD_X + ROAD_W - player.w/2 - 4, player.x));

  dist += speed;
  document.getElementById('score').textContent = Math.floor(dist / 10);
  document.getElementById('speed').textContent = Math.round(speed * 12);

  dashOffset = (dashOffset + speed) % 40;

  spawnTimer -= 1;
  const spawnRate = Math.max(28, 70 - speed * 3);
  if (spawnTimer <= 0) { spawnTraffic(); spawnTimer = spawnRate + Math.random()*20; }

  traffic.forEach(t => t.y += 3 + speed);
  traffic = traffic.filter(t => t.y < canvas.height + 80);

  for (const t of traffic) {
    if (player.x + player.w/2 - 5 > t.x + 5 && player.x - player.w/2 + 5 < t.x + t.w - 5 &&
        player.y + player.h/2 - 5 > t.y + 5 && player.y - player.h/2 + 5 < t.y + t.h - 5) {
      return gameOver();
    }
  }
}

function gameOver() {
  alive = false;
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `Crashed — distance ${Math.floor(dist/10)}m`;
  if (window.AJSubmitScore) window.AJSubmitScore('car', Math.floor(dist / 10));
}

function draw() {
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // roadside
  ctx.fillStyle = '#10141B';
  ctx.fillRect(ROAD_X, 0, ROAD_W, canvas.height);
  ctx.strokeStyle = '#1E2530';
  ctx.lineWidth = 4;
  ctx.strokeRect(ROAD_X, 0, ROAD_W, canvas.height);

  // lane dashes
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 18]);
  ctx.lineDashOffset = -dashOffset;
  for (let i = 1; i < LANES; i++) {
    const x = ROAD_X + LANE_W * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  ctx.setLineDash([]);

  // traffic
  const hues = ['#FF8FA3', '#5CCFE6', '#B9A3FF', '#FFD166'];
  traffic.forEach(t => {
    ctx.fillStyle = hues[t.hue];
    roundRect(t.x, t.y, t.w, t.h, 7);
  });

  // player
  ctx.fillStyle = '#7FD98A';
  roundRect(player.x - player.w/2, player.y - player.h/2, player.w, player.h, 8);
  ctx.fillStyle = 'rgba(10,13,18,0.6)';
  ctx.fillRect(player.x - player.w/2 + 5, player.y - player.h/2 + 8, player.w - 10, 14);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (!alive && e.key === 'Enter') reset();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
document.getElementById('overlay').addEventListener('click', reset);

reset();
loop();
