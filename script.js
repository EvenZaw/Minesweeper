const ROWS = 9;
const COLS = 9;
const MINES = 10;

const boardEl = document.getElementById('board');
const minesLeftEl = document.getElementById('mines-left');
const messageEl = document.getElementById('message');

let cells = [];
let gameOver = false;
let firstClick = true;
let flags = 0;

function newGame() {
  cells = [];
  gameOver = false;
  firstClick = true;
  flags = 0;
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 36px)`;
  minesLeftEl.textContent = MINES;
  messageEl.textContent = '';

  for (let i = 0; i < ROWS * COLS; i++) {
    const el = document.createElement('button');
    el.className = 'cell';
    el.addEventListener('click', () => handleClick(i));
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      toggleFlag(i);
    });
    boardEl.appendChild(el);
    cells.push({ el, mine: false, open: false, flag: false, count: 0 });
  }
}

function neighbors(i) {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        out.push(nr * COLS + nc);
      }
    }
  }
  return out;
}

function placeMines(safe) {
  let placed = 0;
  while (placed < MINES) {
    const i = Math.floor(Math.random() * cells.length);
    if (i === safe || cells[i].mine) continue;
    cells[i].mine = true;
    placed++;
  }
  cells.forEach((cell, i) => {
    cell.count = neighbors(i).filter((n) => cells[n].mine).length;
  });
}

function handleClick(i) {
  if (gameOver) return;
  const cell = cells[i];
  if (cell.open || cell.flag) return;

  if (firstClick) {
    placeMines(i);
    firstClick = false;
  }
  if (cell.mine) {
    lose();
    return;
  }
  reveal(i);
  checkWin();
}

function reveal(start) {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    const cell = cells[i];
    if (cell.open || cell.flag) continue;
    cell.open = true;
    cell.el.classList.add('open');
    if (cell.count > 0) {
      cell.el.textContent = cell.count;
      cell.el.dataset.n = cell.count;
    } else {
      neighbors(i).forEach((n) => stack.push(n));
    }
  }
}

function toggleFlag(i) {
  if (gameOver) return;
  const cell = cells[i];
  if (cell.open) return;
  cell.flag = !cell.flag;
  cell.el.textContent = cell.flag ? '🚩' : '';
  flags += cell.flag ? 1 : -1;
  minesLeftEl.textContent = MINES - flags;
}

function checkWin() {
  const safeLeft = cells.filter((c) => !c.mine && !c.open).length;
  if (safeLeft === 0) {
    gameOver = true;
    messageEl.textContent = 'You win!';
  }
}

function lose() {
  gameOver = true;
  cells.forEach((c) => {
    if (c.mine) {
      c.el.classList.add('mine');
      c.el.textContent = '💣';
    }
  });
  messageEl.textContent = 'Boom. You hit a mine.';
}

document.getElementById('reset').addEventListener('click', newGame);
newGame();