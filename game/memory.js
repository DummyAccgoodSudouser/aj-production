const SYMBOLS = ['◆','●','▲','■','★','✚','◈','☾'];
const boardEl = document.getElementById('board');

let cards, flipped, matched, moves, locked, startTime, timerInt;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function reset() {
  const pairs = shuffle([...SYMBOLS, ...SYMBOLS]);
  cards = pairs.map((sym, i) => ({ id: i, sym, flippedUp: false, done: false }));
  flipped = []; matched = 0; moves = 0; locked = false;
  document.getElementById('moves').textContent = '0';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('time').textContent = '0s';
  startTime = Date.now();
  if (timerInt) clearInterval(timerInt);
  timerInt = setInterval(() => {
    document.getElementById('time').textContent = `${Math.floor((Date.now()-startTime)/1000)}s`;
  }, 500);
  render();
}

function flip(card) {
  if (locked || card.flippedUp || card.done) return;
  card.flippedUp = true;
  flipped.push(card);
  render();

  if (flipped.length === 2) {
    moves++;
    document.getElementById('moves').textContent = moves;
    locked = true;
    const [a, b] = flipped;
    if (a.sym === b.sym) {
      a.done = true; b.done = true;
      matched += 2;
      flipped = [];
      locked = false;
      if (matched === cards.length) return win();
      render();
    } else {
      setTimeout(() => {
        a.flippedUp = false; b.flippedUp = false;
        flipped = [];
        locked = false;
        render();
      }, 650);
    }
  }
}

function win() {
  clearInterval(timerInt);
  const secs = Math.floor((Date.now()-startTime)/1000);
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.querySelector('.msg').textContent = `Cleared in ${moves} moves, ${secs}s`;
  render();
  const rankScore = Math.max(0, 1000 - moves * 8 - secs * 2);
  if (window.AJSubmitScore) window.AJSubmitScore('memory', rankScore);
}

function render() {
  boardEl.innerHTML = '';
  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card' + (card.flippedUp || card.done ? ' up' : '') + (card.done ? ' done' : '');
    el.textContent = (card.flippedUp || card.done) ? card.sym : '';
    el.addEventListener('click', () => flip(card));
    boardEl.appendChild(el);
  });
}

document.getElementById('overlay').addEventListener('click', reset);

reset();
