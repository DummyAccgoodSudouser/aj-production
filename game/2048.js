const SIZE = 4;
let grid, score, best, alive;

const boardEl = document.getElementById('board');

const COLORS = {
  2:'#1E2530', 4:'#243040', 8:'#5CCFE6', 16:'#4AB8CE', 32:'#FFB454',
  64:'#FF9F3D', 128:'#7FD98A', 256:'#5FCB6E', 512:'#B9A3FF', 1024:'#9B7CFF', 2048:'#FFD166',
};

function emptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

function addRandomTile() {
  const empties = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empties.push([r, c]);
  if (!empties.length) return;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function reset() {
  grid = emptyGrid();
  score = 0;
  alive = true;
  addRandomTile();
  addRandomTile();
  document.getElementById('score').textContent = score;
  document.getElementById('overlay').style.display = 'none';
  render();
}

function slideRowLeft(row) {
  let vals = row.filter(v => v !== 0);
  let gained = 0;
  for (let i = 0; i < vals.length - 1; i++) {
    if (vals[i] === vals[i+1]) {
      vals[i] *= 2;
      gained += vals[i];
      vals.splice(i+1, 1);
    }
  }
  while (vals.length < SIZE) vals.push(0);
  return { vals, gained };
}

function rotateGrid(g) {
  const out = emptyGrid();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      out[c][SIZE-1-r] = g[r][c];
  return out;
}

function move(dir) {
  if (!alive) return;
  let g = grid;
  let rotations = { left:0, up:3, right:2, down:1 }[dir];
  for (let i = 0; i < rotations; i++) g = rotateGrid(g);

  let moved = false, gainedTotal = 0;
  const newG = [];
  for (let r = 0; r < SIZE; r++) {
    const { vals, gained } = slideRowLeft(g[r]);
    if (vals.join(',') !== g[r].join(',')) moved = true;
    gainedTotal += gained;
    newG.push(vals);
  }

  let result = newG;
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateGrid(result);

  if (moved) {
    grid = result;
    score += gainedTotal;
    document.getElementById('score').textContent = score;
    addRandomTile();
    render();
    if (grid.flat().includes(2048)) return win();
    if (!hasMoves()) return gameOver();
  }
}

function hasMoves() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE-1 && grid[r][c] === grid[r][c+1]) return true;
      if (r < SIZE-1 && grid[r][c] === grid[r+1][c]) return true;
    }
  return false;
}

function win() {
  alive = false;
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `You reached 2048! Score ${score}`;
  if (window.AJSubmitScore) window.AJSubmitScore('2048', score);
}

function gameOver() {
  alive = false;
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `No more moves — score ${score}`;
  if (window.AJSubmitScore) window.AJSubmitScore('2048', score);
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (v) {
        cell.textContent = v;
        cell.style.background = COLORS[v] || '#FFD166';
        cell.style.color = v <= 4 ? '#8993A6' : '#0A0D12';
        cell.style.fontSize = v >= 1000 ? '20px' : '26px';
      }
      boardEl.appendChild(cell);
    }
  }
}

const keyDir = { ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right', ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down' };

window.addEventListener('keydown', e => {
  if (keyDir[e.key]) { e.preventDefault(); move(keyDir[e.key]); }
  else if (!alive && e.key === 'Enter') reset();
});

let touchStart = null;
boardEl.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive:true });
boardEl.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }
  touchStart = null;
});

document.getElementById('overlay').addEventListener('click', reset);

reset();
