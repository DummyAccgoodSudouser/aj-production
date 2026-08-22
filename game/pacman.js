const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const CELL = 22, COLS = 17, ROWS = 15;
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

// WALL=1, PATH=0, DOT=2, POWER=3
function buildGrid() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(2));
  for (let c = 0; c < COLS; c++) { g[0][c] = 1; g[ROWS - 1][c] = 1; }
  for (let r = 0; r < ROWS; r++) { g[r][0] = 1; g[r][COLS - 1] = 1; }

  const blocks = [
    [2, 2, 4, 4], [2, 12, 4, 14],
    [6, 7, 8, 9],
    [10, 2, 12, 4], [10, 12, 12, 14],
  ];
  blocks.forEach(([r1, c1, r2, c2]) => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        g[r][c] = 1;
  });

  const corners = [[1, 1], [1, COLS - 2], [ROWS - 2, 1], [ROWS - 2, COLS - 2]];
  corners.forEach(([r, c]) => g[r][c] = 3);

  return g;
}

let grid, pac, dir, nextDir, ghosts, dotsLeft, score, lives, frightTimer, alive, win, timer;

function reset() {
  grid = buildGrid();
  pac = { r: ROWS - 2, c: 1, ...pixelInit(ROWS - 2, 1) };
  dir = { r: 0, c: 0 };
  nextDir = { r: 0, c: 0 };
  ghosts = [
    { r: 7, c: 7, color: '#FF8FA3', dir: { r: 0, c: 1 } },
    { r: 7, c: 8, color: '#5CCFE6', dir: { r: 0, c: -1 } },
    { r: 7, c: 9, color: '#B9A3FF', dir: { r: 0, c: 1 } },
  ];
  dotsLeft = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === 2 || grid[r][c] === 3) dotsLeft++;

  score = 0; lives = 3; frightTimer = 0; alive = true; win = false;
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  document.getElementById('overlay').style.display = 'none';
  if (timer) clearInterval(timer);
  timer = setInterval(tick, 150);
  draw();
}

function pixelInit(r, c) { return {}; }

function passable(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return grid[r][c] !== 1;
}

function tick() {
  if (!alive || win) return;

  // try buffered direction first
  if (passable(pac.r + nextDir.r, pac.c + nextDir.c)) dir = nextDir;
  if (passable(pac.r + dir.r, pac.c + dir.c)) {
    pac.r += dir.r; pac.c += dir.c;
  }

  const cell = grid[pac.r][pac.c];
  if (cell === 2 || cell === 3) {
    if (cell === 3) { frightTimer = 30; score += 50; } else { score += 10; }
    grid[pac.r][pac.c] = 0;
    dotsLeft--;
    document.getElementById('score').textContent = score;
    if (dotsLeft <= 0) { win = true; return endGame(true); }
  }

  if (frightTimer > 0) frightTimer--;

  ghosts.forEach(g => moveGhost(g));

  for (const g of ghosts) {
    if (g.r === pac.r && g.c === pac.c) {
      if (frightTimer > 0) {
        score += 200;
        document.getElementById('score').textContent = score;
        g.r = 7; g.c = 8;
      } else {
        loseLife();
      }
    }
  }

  draw();
}

function moveGhost(g) {
  const options = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }]
    .filter(d => passable(g.r + d.r, g.c + d.c) && !(d.r === -g.dir.r && d.c === -g.dir.c));

  if (options.length === 0) { g.dir = { r: -g.dir.r, c: -g.dir.c }; return; }

  let choice;
  const chase = frightTimer <= 0 && Math.random() < 0.55;
  const flee = frightTimer > 0 && Math.random() < 0.7;

  if (chase || flee) {
    options.sort((a, b) => {
      const da = Math.abs((g.r + a.r) - pac.r) + Math.abs((g.c + a.c) - pac.c);
      const db = Math.abs((g.r + b.r) - pac.r) + Math.abs((g.c + b.c) - pac.c);
      return flee ? db - da : da - db;
    });
    choice = options[0];
  } else {
    choice = options[Math.floor(Math.random() * options.length)];
  }
  g.dir = choice;
  g.r += choice.r; g.c += choice.c;
}

function loseLife() {
  lives--;
  document.getElementById('lives').textContent = lives;
  if (lives <= 0) return endGame(false);
  pac.r = ROWS - 2; pac.c = 1; dir = { r: 0, c: 0 }; nextDir = { r: 0, c: 0 };
  ghosts[0].r = 7; ghosts[0].c = 7;
  ghosts[1].r = 7; ghosts[1].c = 8;
  ghosts[2].r = 7; ghosts[2].c = 9;
}

function endGame(won) {
  alive = false;
  clearInterval(timer);
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = won ? `Maze cleared! Score ${score}` : `Game over — score ${score}`;
  if (window.AJSubmitScore) window.AJSubmitScore('pacman', score);
}

function draw() {
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      const x = c * CELL, y = r * CELL;
      if (v === 1) {
        ctx.fillStyle = '#1E2530';
        ctx.fillRect(x, y, CELL, CELL);
      } else if (v === 2) {
        ctx.fillStyle = '#8993A6';
        ctx.beginPath(); ctx.arc(x + CELL/2, y + CELL/2, 2.4, 0, Math.PI*2); ctx.fill();
      } else if (v === 3) {
        ctx.fillStyle = '#FFB454';
        ctx.beginPath(); ctx.arc(x + CELL/2, y + CELL/2, 6, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  ctx.fillStyle = '#FFD166';
  ctx.beginPath();
  ctx.arc(pac.c * CELL + CELL/2, pac.r * CELL + CELL/2, CELL/2.4, 0.25*Math.PI, 1.75*Math.PI);
  ctx.lineTo(pac.c * CELL + CELL/2, pac.r * CELL + CELL/2);
  ctx.fill();

  ghosts.forEach(g => {
    ctx.fillStyle = frightTimer > 0 ? '#5CCFE6' : g.color;
    const x = g.c * CELL, y = g.r * CELL;
    ctx.beginPath();
    ctx.arc(x + CELL/2, y + CELL/2 - 2, CELL/2.6, Math.PI, 0);
    ctx.lineTo(x + CELL - 3, y + CELL - 3);
    ctx.lineTo(x + 3, y + CELL - 3);
    ctx.closePath();
    ctx.fill();
  });
}

const keyMap = {
  ArrowUp: { r: -1, c: 0 }, w: { r: -1, c: 0 }, W: { r: -1, c: 0 },
  ArrowDown: { r: 1, c: 0 }, s: { r: 1, c: 0 }, S: { r: 1, c: 0 },
  ArrowLeft: { r: 0, c: -1 }, a: { r: 0, c: -1 }, A: { r: 0, c: -1 },
  ArrowRight: { r: 0, c: 1 }, d: { r: 0, c: 1 }, D: { r: 0, c: 1 },
};

function setDir(r, c) {
  nextDir = { r, c };
  if (!alive) reset();
}

window.addEventListener('keydown', e => {
  const nd = keyMap[e.key];
  if (!nd) return;
  e.preventDefault();
  nextDir = nd;
  if (!alive) reset();
});

document.getElementById('overlay').addEventListener('click', reset);

reset();
