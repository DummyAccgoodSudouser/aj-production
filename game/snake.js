const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const SIZE = 20, CELLS = 20;
canvas.width = SIZE * CELLS;
canvas.height = SIZE * CELLS;

let snake, dir, nextDir, food, score, best, alive, tickMs, timer;

function rnd(n) { return Math.floor(Math.random() * n); }

function placeFood() {
  let p;
  do { p = { x: rnd(CELLS), y: rnd(CELLS) }; }
  while (snake.some(s => s.x === p.x && s.y === p.y));
  food = p;
}

function reset() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  alive = true;
  tickMs = 130;
  placeFood();
  document.getElementById('score').textContent = score;
  document.getElementById('overlay').style.display = 'none';
  if (timer) clearInterval(timer);
  timer = setInterval(tick, tickMs);
}

function tick() {
  if (!alive) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    document.getElementById('score').textContent = score;
    placeFood();
    if (tickMs > 60) {
      tickMs -= 3;
      clearInterval(timer);
      timer = setInterval(tick, tickMs);
    }
  } else {
    snake.pop();
  }
  draw();
}

function gameOver() {
  alive = false;
  clearInterval(timer);
  best = Math.max(best || 0, score);
  localStorage && null; // no-op, storage not used
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `Game over — score ${score}`;
  if (window.AJSubmitScore) window.AJSubmitScore('snake', score);
  draw();
}

function draw() {
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FF8FA3';
  ctx.beginPath();
  ctx.arc(food.x * SIZE + SIZE / 2, food.y * SIZE + SIZE / 2, SIZE / 2.6, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#7FD98A' : 'rgba(127,217,138,0.65)';
    ctx.fillRect(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2);
  });
}

const keyMap = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
};

function setDir(x, y) {
  if (x === -dir.x && y === -dir.y) return;
  nextDir = { x, y };
  if (!alive) reset();
}

window.addEventListener('keydown', e => {
  const nd = keyMap[e.key];
  if (!nd) return;
  e.preventDefault();
  if (nd.x === -dir.x && nd.y === -dir.y) return; // no reversing
  nextDir = nd;
  if (!alive) reset();
});

document.getElementById('overlay').addEventListener('click', reset);

reset();
draw();
