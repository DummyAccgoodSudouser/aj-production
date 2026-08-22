const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');

const COLS = 10, ROWS = 20, CELL = 24;
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
nextCanvas.width = nextCanvas.height = 96;

const COLORS = {
  I: '#5CCFE6', O: '#FFB454', T: '#B9A3FF',
  S: '#7FD98A', Z: '#FF8FA3', J: '#7A9EFF', L: '#FFD166',
};

// Each shape given as 4 rotation states, each a 4x4 array of 0/1.
const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
  ],
  T: [
    [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  S: [
    [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  Z: [
    [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
  ],
  J: [
    [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
  ],
  L: [
    [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
};
const NAMES = Object.keys(SHAPES);

let board, cur, next, score, lines, level, alive, dropMs, dropTimer, paused;

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randPiece() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return { name, rot: 0, x: 3, y: name === 'I' ? -1 : 0 };
}

function cells(piece) {
  const shape = SHAPES[piece.name][piece.rot];
  const out = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (shape[r][c]) out.push({ x: piece.x + c, y: piece.y + r });
  return out;
}

function collides(piece) {
  return cells(piece).some(p =>
    p.x < 0 || p.x >= COLS || p.y >= ROWS ||
    (p.y >= 0 && board[p.y][p.x])
  );
}

function lockPiece() {
  cells(cur).forEach(p => {
    if (p.y >= 0) board[p.y][p.x] = cur.name;
  });
  clearLines();
  cur = next;
  next = randPiece();
  drawNext();
  if (collides(cur)) {
    alive = false;
    clearInterval(dropTimer);
    const ov = document.getElementById('overlay');
    ov.style.display = 'flex';
    ov.querySelector('.msg').textContent = `Game over — score ${score}`;
    if (window.AJSubmitScore) window.AJSubmitScore('tetris', score);
  }
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(c => c)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    const points = [0, 100, 300, 500, 800][cleared] * level;
    score += points;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    dropMs = Math.max(120, 700 - (level - 1) * 60);
    clearInterval(dropTimer);
    dropTimer = setInterval(drop, dropMs);
    updateHud();
  }
}

function updateHud() {
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = lines;
  document.getElementById('level').textContent = level;
}

function move(dx) {
  const p = { ...cur, x: cur.x + dx };
  if (!collides(p)) cur = p;
  draw();
}

function rotate() {
  const p = { ...cur, rot: (cur.rot + 1) % 4 };
  if (!collides(p)) { cur = p; return draw(); }
  // simple wall kicks
  for (const dx of [-1, 1, -2, 2]) {
    const kicked = { ...p, x: p.x + dx };
    if (!collides(kicked)) { cur = kicked; return draw(); }
  }
}

function drop() {
  if (!alive || paused) return;
  const p = { ...cur, y: cur.y + 1 };
  if (!collides(p)) { cur = p; }
  else { lockPiece(); }
  draw();
}

function hardDrop() {
  if (!alive || paused) return;
  let p = { ...cur };
  while (!collides({ ...p, y: p.y + 1 })) p.y++;
  cur = p;
  lockPiece();
  draw();
}

function draw() {
  ctx.fillStyle = '#0A0D12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawCell(c, r, COLORS[board[r][c]]);

  // ghost piece
  let ghost = { ...cur };
  while (!collides({ ...ghost, y: ghost.y + 1 })) ghost.y++;
  cells(ghost).forEach(p => { if (p.y >= 0) drawCell(p.x, p.y, COLORS[cur.name], true); });

  cells(cur).forEach(p => { if (p.y >= 0) drawCell(p.x, p.y, COLORS[cur.name]); });
}

function drawCell(x, y, color, ghost) {
  if (ghost) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function drawNext() {
  nctx.fillStyle = '#0A0D12';
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = SHAPES[next.name][0];
  const s = 20;
  const offX = (nextCanvas.width - 4 * s) / 2, offY = (nextCanvas.height - 4 * s) / 2;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (shape[r][c]) {
        nctx.fillStyle = COLORS[next.name];
        nctx.fillRect(offX + c * s + 1, offY + r * s + 1, s - 2, s - 2);
      }
}

function reset() {
  board = emptyBoard();
  cur = randPiece();
  next = randPiece();
  score = 0; lines = 0; level = 1; alive = true; paused = false;
  dropMs = 700;
  document.getElementById('overlay').style.display = 'none';
  updateHud();
  drawNext();
  if (dropTimer) clearInterval(dropTimer);
  dropTimer = setInterval(drop, dropMs);
  draw();
}

window.addEventListener('keydown', e => {
  if (!alive) { if (e.key === 'Enter') reset(); return; }
  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A': move(-1); break;
    case 'ArrowRight': case 'd': case 'D': move(1); break;
    case 'ArrowDown': case 's': case 'S': drop(); break;
    case 'ArrowUp': case 'w': case 'W': rotate(); break;
    case ' ': e.preventDefault(); hardDrop(); break;
    case 'p': case 'P':
      paused = !paused;
      document.getElementById('pauseTag').style.display = paused ? 'block' : 'none';
      break;
    default: return;
  }
  e.preventDefault();
});

document.getElementById('overlay').addEventListener('click', reset);

reset();
