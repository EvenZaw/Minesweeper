const LEVELS = {
  beginner:     { rows: 9,  cols: 9,  mines: 10, size: 36 },
  intermediate: { rows: 16, cols: 16, mines: 40, size: 32 },
  expert:       { rows: 16, cols: 30, mines: 99, size: 28 },
};

let levelName = 'beginner';
let ROWS = 9;
let COLS = 9;
let MINES = 10;

const boardEl = document.getElementById('board');
const minesLeftEl = document.getElementById('mines-left');
const messageEl = document.getElementById('message');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const flagModeBtn = document.getElementById('flag-mode');

let cells = [];
let gameOver = false;
let firstClick = true;
let flags = 0;
let flagMode = false;
let timer = null;
let startTime = 0;

/* ---------- timer and best time ---------- */

function startTimer() {
  startTime = Date.now();
  timer = setInterval(() => {
    timeEl.textContent = String(Math.min(999, elapsed())).padStart(3, '0');
  }, 250);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function elapsed() {
  return Math.floor((Date.now() - startTime) / 1000);
}

function loadBest() {
  const saved = localStorage.getItem('best-' + levelName);
  bestEl.textContent = saved ? saved + 's' : '--';
}

/* ---------- difficulty ---------- */

function setLevel(name) {
  levelName = name;
  const level = LEVELS[name];
  ROWS = level.rows;
  COLS = level.cols;
  MINES = level.mines;

  boardEl.style.setProperty('--cell', level.size + 'px');
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, var(--cell))`;

  document.querySelectorAll('#levels button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.level === name);
  });

  newGame();
}

/* ---------- game ---------- */

function newGame() {
  stopTimer();
  cells = [];
  gameOver = false;
  firstClick = true;
  flags = 0;
  boardEl.innerHTML = '';
  minesLeftEl.textContent = MINES;
  timeEl.textContent = '000';
  messageEl.textContent = '';
  loadBest();

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

  // Flag mode: clicking places a flag instead of opening
  if (flagMode) {
    toggleFlag(i);
    return;
  }

  const cell = cells[i];
  if (cell.open || cell.flag) return;

  if (firstClick) {
    placeMines(i);
    firstClick = false;
    startTimer();
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
  if (safeLeft > 0) return;

  gameOver = true;
  stopTimer();
  const time = elapsed();
  timeEl.textContent = String(Math.min(999, time)).padStart(3, '0');
  messageEl.textContent = `You win! ${time} seconds.`;

  const saved = parseInt(localStorage.getItem('best-' + levelName), 10);
  if (!saved || time < saved) {
    localStorage.setItem('best-' + levelName, String(time));
    messageEl.textContent += ' New best!';
    loadBest();
  }
}

function lose() {
  gameOver = true;
  stopTimer();
  cells.forEach((c) => {
    if (c.mine) {
      c.el.classList.add('mine');
      c.el.textContent = '💣';
    }
  });
  messageEl.textContent = 'Boom. You hit a mine.';
}

/* ---------- buttons ---------- */

document.querySelectorAll('#levels button').forEach((btn) => {
  btn.addEventListener('click', () => setLevel(btn.dataset.level));
});

flagModeBtn.addEventListener('click', () => {
  flagMode = !flagMode;
  flagModeBtn.classList.toggle('active', flagMode);
  flagModeBtn.textContent = 'Flag mode: ' + (flagMode ? 'on' : 'off');
});

document.getElementById('reset').addEventListener('click', newGame);

setLevel('beginner');
