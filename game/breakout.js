const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 420; canvas.height = 520;

const ROWS = 6, COLS = 9, BRICK_W = 40, BRICK_H = 16, GAP = 4, TOP = 50, LEFT = (canvas.width - (COLS*(BRICK_W+GAP)-GAP))/2;
const PADDLE_W = 80, PADDLE_H = 12;
const HUES = ['#FF8FA3','#FFB454','#FFD166','#7FD98A','#5CCFE6','#B9A3FF'];

let bricks, paddleX, ball, lives, score, alive, keys, launched;

function resetBall() {
  ball = { x: canvas.width/2, y: canvas.height - 60, vx: 3.4 * (Math.random()<0.5?-1:1), vy: -3.6, r: 7 };
  launched = false;
}

function reset() {
  bricks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      bricks.push({ x: LEFT + c*(BRICK_W+GAP), y: TOP + r*(BRICK_H+GAP), w: BRICK_W, h: BRICK_H, alive: true, hue: HUES[r % HUES.length] });

  paddleX = canvas.width/2 - PADDLE_W/2;
  lives = 3; score = 0; alive = true; keys = {};
  resetBall();
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('overlay').style.display = 'none';
}

function update() {
  if (!alive) return;

  if (keys['ArrowLeft'] || keys['a'] || keys['A']) paddleX -= 7;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) paddleX += 7;
  paddleX = Math.max(0, Math.min(canvas.width - PADDLE_W, paddleX));

  if (!launched) {
    ball.x = paddleX + PADDLE_W/2;
    ball.y = canvas.height - 60;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > canvas.width) { ball.x = canvas.width - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }

  const py = canvas.height - 40;
  if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + PADDLE_H + 6 &&
      ball.x >= paddleX && ball.x <= paddleX + PADDLE_W) {
    const hit = (ball.x - (paddleX + PADDLE_W/2)) / (PADDLE_W/2);
    ball.vx = hit * 5.4;
    ball.vy = -Math.abs(ball.vy) - 0.06;
    ball.vy = Math.max(-8.5, ball.vy);
  }

  if (ball.y - ball.r > canvas.height) {
    lives--;
    document.getElementById('lives').textContent = lives;
    if (lives <= 0) return gameOver(false);
    resetBall();
    return;
  }

  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
      b.alive = false;
      score += 10;
      document.getElementById('score').textContent = score;
      const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
      const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
      if (overlapX < overlapY) ball.vx *= -1; else ball.vy *= -1;
      break;
    }
  }

  if (bricks.every(b => !b.alive)) return gameOver(true);
}

function gameOver(won) {
  alive = false;
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = won ? `All bricks cleared! Score ${score}` : `Game over — score ${score}`;
  if (window.AJSubmitScore) window.AJSubmitScore('breakout', score);
}

function draw() {
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  bricks.forEach(b => { if (b.alive) { ctx.fillStyle = b.hue; ctx.fillRect(b.x, b.y, b.w, b.h); } });

  ctx.fillStyle = '#E7EAF0';
  ctx.fillRect(paddleX, canvas.height - 40, PADDLE_W, PADDLE_H);

  ctx.fillStyle = '#FFD166';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();

  if (!launched && alive) {
    ctx.fillStyle = 'rgba(231,234,240,0.6)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to launch', canvas.width/2, canvas.height - 80);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') { e.preventDefault(); if (!launched && alive) launched = true; }
  if (['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if (!alive && e.key === 'Enter') reset();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
document.getElementById('overlay').addEventListener('click', reset);

reset();
loop();
