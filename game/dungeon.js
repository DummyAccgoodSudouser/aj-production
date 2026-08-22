const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 19, H = 13, CELL = 26;
canvas.width = W * CELL;
canvas.height = H * CELL;

const VIEW_RADIUS = 3.4;

const THEMES = [
  { name: 'The Overgrown Crypt', floor: '#171F19', floorLit: '#233326', wall: '#0E1512', wallLit: '#16221C',
    enemies: [
      { name: 'Rat', hp: 6, atk: 2, color: '#8993A6', xp: 4 },
      { name: 'Skeleton', hp: 10, atk: 3, color: '#C7CEDB', xp: 7 },
    ] },
  { name: 'Frozen Caverns', floor: '#131A24', floorLit: '#1D2E40', wall: '#0B1119', wallLit: '#132234',
    enemies: [
      { name: 'Ice Wolf', hp: 12, atk: 4, color: '#5CCFE6', xp: 9 },
      { name: 'Frost Sprite', hp: 8, atk: 3, color: '#A6E8F5', xp: 6 },
    ] },
  { name: 'Ember Depths', floor: '#221513', floorLit: '#3A211C', wall: '#160D0C', wallLit: '#241512',
    enemies: [
      { name: 'Fire Imp', hp: 11, atk: 4, color: '#FF8FA3', xp: 8 },
      { name: 'Lava Golem', hp: 20, atk: 6, color: '#FFB454', xp: 15 },
    ] },
];

// tile codes: 0 wall, 1 floor, 2 stairs, 3 merchant
let grid, seenGrid, player, monsters, items, log, levelIndex, theme, alive;

function rnd(n) { return Math.floor(Math.random() * n); }
function chebyshev(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function addLog(msg, cls) {
  log.unshift({ msg, cls: cls || '' });
  log = log.slice(0, 40);
  renderLog();
}

function renderLog() {
  const el = document.getElementById('log');
  el.innerHTML = log.slice(0, 7).map(l => `<div class="${l.cls}">${l.msg}</div>`).join('');
}

function generateLevel(idx) {
  levelIndex = idx;
  theme = THEMES[idx % THEMES.length];
  const diff = 1 + Math.floor(idx / THEMES.length) * 0.35;

  grid = Array.from({ length: H }, () => Array(W).fill(0));
  let cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  grid[cy][cx] = 1;
  const floors = [{ x: cx, y: cy }];
  let x = cx, y = cy;
  const steps = 260;
  for (let i = 0; i < steps; i++) {
    const dir = rnd(4);
    if (dir === 0 && x > 1) x--;
    else if (dir === 1 && x < W - 2) x++;
    else if (dir === 2 && y > 1) y--;
    else if (dir === 3 && y < H - 2) y++;
    if (grid[y][x] !== 1) { grid[y][x] = 1; floors.push({ x, y }); }
  }

  // stairs far from start
  let stairs = floors[0];
  floors.forEach(p => { if (dist(p, { x: cx, y: cy }) > dist(stairs, { x: cx, y: cy })) stairs = p; });
  grid[stairs.y][stairs.x] = 2;

  // merchant on a different distant tile
  const candidates = floors.filter(p => dist(p, { x: cx, y: cy }) > 4 && !(p.x === stairs.x && p.y === stairs.y));
  const merchantPos = candidates.length ? candidates[rnd(candidates.length)] : floors[floors.length - 1];
  grid[merchantPos.y][merchantPos.x] = 3;

  seenGrid = Array.from({ length: H }, () => Array(W).fill(false));

  player = player || { x: cx, y: cy, hp: 20, maxHp: 20, atk: 4, gold: 6, potions: 1 };
  player.x = cx; player.y = cy;

  const openFloors = floors.filter(p => !(p.x === cx && p.y === cy) && !(p.x === stairs.x && p.y === stairs.y) && !(p.x === merchantPos.x && p.y === merchantPos.y));

  monsters = [];
  const monsterCount = 5 + idx;
  for (let i = 0; i < monsterCount && openFloors.length; i++) {
    const pos = openFloors.splice(rnd(openFloors.length), 1)[0];
    if (dist(pos, { x: cx, y: cy }) < 3) { i--; continue; }
    const base = theme.enemies[rnd(theme.enemies.length)];
    monsters.push({
      x: pos.x, y: pos.y, name: base.name, color: base.color,
      hp: Math.round(base.hp * diff), maxHp: Math.round(base.hp * diff),
      atk: Math.round(base.atk * diff), xp: base.xp, alive: true,
    });
  }

  items = [];
  const itemCount = 6;
  for (let i = 0; i < itemCount && openFloors.length; i++) {
    const pos = openFloors.splice(rnd(openFloors.length), 1)[0];
    const type = Math.random() < 0.5 ? 'potion' : 'gem';
    items.push({ x: pos.x, y: pos.y, type, amount: type === 'gem' ? 2 + rnd(5) : 1 });
  }

  document.getElementById('levelName').textContent = `${theme.name} — Lv.${idx + 1}`;
  addLog(`You descend into ${theme.name}.`, 'sys');
}

function inBounds(x, y) { return x >= 0 && x < W && y >= 0 && y < H; }
function passable(x, y) { return inBounds(x, y) && grid[y][x] !== 0; }

function monsterAt(x, y) { return monsters.find(m => m.alive && m.x === x && m.y === y); }
function itemAt(x, y) { return items.find(it => it.x === x && it.y === y); }

function updateHud() {
  document.getElementById('hp').textContent = `${player.hp}/${player.maxHp}`;
  document.getElementById('atk').textContent = player.atk;
  document.getElementById('gold').textContent = player.gold;
  document.getElementById('potions').textContent = player.potions;
  document.getElementById('hpBar').style.width = `${Math.max(0, player.hp / player.maxHp * 100)}%`;
}

function tryMove(dx, dy) {
  if (!alive) return;
  const nx = player.x + dx, ny = player.y + dy;
  if (!passable(nx, ny)) return;

  const m = monsterAt(nx, ny);
  if (m) { playerAttack(m); monstersTurn(); draw(); return; }

  player.x = nx; player.y = ny;

  const tile = grid[ny][nx];
  if (tile === 2) { generateLevel(levelIndex + 1); updateHud(); draw(); return; }
  if (tile === 3) addLog('The merchant eyes your gold. Press B to trade.', 'sys');

  const it = itemAt(nx, ny);
  if (it) {
    items = items.filter(i => i !== it);
    if (it.type === 'potion') { player.potions++; addLog('You found a health potion.', 'good'); }
    else { player.gold += it.amount; addLog(`You found ${it.amount} gems.`, 'good'); }
  }

  monstersTurn();
  updateHud();
  draw();
}

function playerAttack(m) {
  const dmg = player.atk + rnd(3);
  m.hp -= dmg;
  addLog(`You hit the ${m.name} for ${dmg}.`, 'dmg');
  if (m.hp <= 0) {
    m.alive = false;
    addLog(`You defeated the ${m.name}!`, 'good');
    if (Math.random() < 0.5) {
      items.push({ x: m.x, y: m.y, type: Math.random() < 0.6 ? 'gem' : 'potion', amount: 2 + rnd(4) });
    }
  } else {
    const back = m.atk + rnd(2);
    player.hp -= back;
    addLog(`The ${m.name} hits you for ${back}.`, 'bad');
    if (player.hp <= 0) return die();
  }
}

function monstersTurn() {
  if (!alive) return;
  let sensedNearby = false;
  monsters.forEach(m => {
    if (!m.alive) return;
    const d = chebyshev(m, player);
    if (d <= 1 && (m.x === player.x || m.y === player.y || Math.abs(m.x-player.x)+Math.abs(m.y-player.y)===2)) {
      const dmg = m.atk + rnd(2);
      player.hp -= dmg;
      addLog(`The ${m.name} attacks you for ${dmg}.`, 'bad');
      if (player.hp <= 0) { die(); return; }
    } else if (d <= 5) {
      sensedNearby = true;
      if (d <= 4) {
        const dx = Math.sign(player.x - m.x), dy = Math.sign(player.y - m.y);
        let mx = m.x, my = m.y;
        if (Math.abs(player.x - m.x) > Math.abs(player.y - m.y)) {
          if (passable(m.x + dx, m.y) && !monsterAt(m.x + dx, m.y)) mx += dx;
          else if (passable(m.x, m.y + dy) && !monsterAt(m.x, m.y + dy)) my += dy;
        } else {
          if (passable(m.x, m.y + dy) && !monsterAt(m.x, m.y + dy)) my += dy;
          else if (passable(m.x + dx, m.y) && !monsterAt(m.x + dx, m.y)) mx += dx;
        }
        if (!(mx === player.x && my === player.y)) { m.x = mx; m.y = my; }
      }
    } else if (Math.random() < 0.3) {
      const opts = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d2 => passable(m.x+d2.x, m.y+d2.y) && !monsterAt(m.x+d2.x, m.y+d2.y));
      if (opts.length) { const o = opts[rnd(opts.length)]; m.x += o.x; m.y += o.y; }
    }
  });

  if (sensedNearby && Math.random() < 0.12) {
    const flavor = ['You sense something moving in the dark...', 'A low growl echoes nearby.', 'There is a monster somewhere close.'];
    addLog(flavor[rnd(flavor.length)], 'sys');
  }
  updateHud();
}

function die() {
  alive = false;
  addLog('You have fallen. The dungeon claims another.', 'bad');
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `You died on ${theme.name} — ${player.gold} gems collected`;
  if (window.AJSubmitScore) window.AJSubmitScore('dungeon', player.gold);
}

function usePotion() {
  if (!alive || player.potions <= 0) return;
  player.potions--;
  const heal = 8 + rnd(5);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  addLog(`You drink a potion, healing ${heal}.`, 'good');
  updateHud();
  draw();
}

function tryTrade() {
  if (!alive) return;
  const adjacentMerchant = [[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => inBounds(player.x+dx, player.y+dy) && grid[player.y+dy][player.x+dx] === 3);
  if (!adjacentMerchant) { addLog('No merchant nearby.', 'sys'); return; }
  const cost = 5;
  if (player.gold < cost) { addLog(`You need ${cost} gems for a potion.`, 'sys'); return; }
  player.gold -= cost;
  player.potions++;
  addLog(`Traded ${cost} gems for a potion.`, 'good');
  updateHud();
}

function visibility() {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (dist({x,y}, player) <= VIEW_RADIUS) seenGrid[y][x] = true;
    }
  }
}

function draw() {
  visibility();
  ctx.fillStyle = '#050607';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!seenGrid[y][x]) continue;
      const lit = dist({x,y}, player) <= VIEW_RADIUS;
      const tile = grid[y][x];
      const isWall = tile === 0;
      ctx.fillStyle = isWall ? (lit ? theme.wallLit : theme.wall) : (lit ? theme.floorLit : theme.floor);
      ctx.fillRect(x*CELL, y*CELL, CELL, CELL);

      if (!isWall && lit) {
        if (tile === 2) { ctx.fillStyle = '#FFB454'; ctx.fillRect(x*CELL+7, y*CELL+7, CELL-14, CELL-14); }
        if (tile === 3) { ctx.fillStyle = '#7FD98A'; ctx.beginPath(); ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, 8, 0, Math.PI*2); ctx.fill(); }
      }

      if (!lit) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x*CELL, y*CELL, CELL, CELL); }
    }
  }

  items.forEach(it => {
    if (!seenGrid[it.y][it.x] || dist(it, player) > VIEW_RADIUS) return;
    ctx.fillStyle = it.type === 'potion' ? '#FF8FA3' : '#5CCFE6';
    ctx.beginPath(); ctx.arc(it.x*CELL+CELL/2, it.y*CELL+CELL/2, 5, 0, Math.PI*2); ctx.fill();
  });

  monsters.forEach(m => {
    if (!m.alive || dist(m, player) > VIEW_RADIUS) return;
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(m.x*CELL+CELL/2, m.y*CELL+CELL/2, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0A0D12';
    ctx.fillRect(m.x*CELL+4, m.y*CELL-2, CELL-8, 3);
    ctx.fillStyle = '#FF8FA3';
    ctx.fillRect(m.x*CELL+4, m.y*CELL-2, (CELL-8)*Math.max(0,m.hp/m.maxHp), 3);
  });

  ctx.fillStyle = '#FFD166';
  ctx.beginPath(); ctx.arc(player.x*CELL+CELL/2, player.y*CELL+CELL/2, 9, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#0A0D12'; ctx.lineWidth = 2; ctx.stroke();

  // vignette for limited visibility feel
  const grad = ctx.createRadialGradient(
    player.x*CELL+CELL/2, player.y*CELL+CELL/2, CELL*1.5,
    player.x*CELL+CELL/2, player.y*CELL+CELL/2, CELL*VIEW_RADIUS*1.4
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function reset() {
  player = null;
  log = [];
  alive = true;
  document.getElementById('overlay').style.display = 'none';
  generateLevel(0);
  updateHud();
  draw();
}

const moveKeys = {
  ArrowUp: [0,-1], w: [0,-1], W: [0,-1],
  ArrowDown: [0,1], s: [0,1], S: [0,1],
  ArrowLeft: [-1,0], a: [-1,0], A: [-1,0],
  ArrowRight: [1,0], d: [1,0], D: [1,0],
};

window.addEventListener('keydown', e => {
  if (!alive) { if (e.key === 'Enter') reset(); return; }
  if (moveKeys[e.key]) { e.preventDefault(); tryMove(moveKeys[e.key][0], moveKeys[e.key][1]); return; }
  if (e.key === 'u' || e.key === 'U') usePotion();
  if (e.key === 'b' || e.key === 'B') tryTrade();
});

document.getElementById('overlay').addEventListener('click', reset);
document.getElementById('useBtn').addEventListener('click', usePotion);
document.getElementById('tradeBtn').addEventListener('click', tryTrade);

reset();
