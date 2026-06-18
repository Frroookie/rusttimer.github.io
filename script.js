const STORAGE_KEY = 'rust-monument-timer-state-v2';

const monuments = [
  { name: 'Airfield', icon: '✈️' },
  { name: 'Train Yard', icon: '🚆' },
  { name: 'Water Treatment', icon: '💧' },
  { name: 'Power Plant', icon: '⚡' },
  { name: 'Sewer Branch', icon: '🧻' },
  { name: 'Launch Site', icon: '🚀' },
  { name: 'Military Tunnels', icon: '🛤️' },
  { name: 'Satellite Dish', icon: '📡' },
  { name: 'Harbor', icon: '⚓' },
  { name: 'Oil Rigs', icon: '🛢️' },
  { name: 'Chinook crate', icon: '🪂', isChinook: true }
];

const state = {
  population: 100,
  selectedIndex: 0,
  timers: []
};

// DOM
const cardsGrid = document.getElementById('cardsGrid');
const selectedName = document.getElementById('selectedName');
const countdown = document.getElementById('countdown');
const timerLabel = document.getElementById('timerLabel');
const metaText = document.getElementById('metaText');
const populationInput = document.getElementById('population');
const populationValue = document.getElementById('populationValue');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

function getBand(pop) {
  if (pop <= 100) return 'Low';
  if (pop <= 300) return 'Medium';
  if (pop <= 600) return 'High';
  return 'Very High';
}

function getRange(monument, pop) {
  if (monument.isChinook) return { min: 90, max: 120 };

  const band = getBand(pop);
  if (band === 'Low') return { min: 25, max: 40 };
  if (band === 'Medium') return { min: 15, max: 30 };
  if (band === 'High') return { min: 10, max: 25 };
  return { min: 8, max: 20 };
}

function mid(min, max) {
  return (min + max) / 2;
}

function getCycle(monument, pop) {
  const r = getRange(monument, pop);
  return mid(r.min, r.max) * 60;
}

function createTimer(monument) {
  return {
    name: monument.name,
    icon: monument.icon,
    isChinook: monument.isChinook || false,
    remaining: getCycle(monument, state.population),
    running: false,
    lastTick: 0
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const data = localStorage.getItem(STORAGE_KEY);
  state.timers = monuments.map(createTimer);

  if (!data) return;

  try {
    const parsed = JSON.parse(data);

    state.population = parsed.population ?? 100;
    state.selectedIndex = parsed.selectedIndex ?? 0;

    if (Array.isArray(parsed.timers)) {
      state.timers = parsed.timers.map((t, i) => ({
        ...createTimer(monuments[i]),
        ...t
      }));
    }
  } catch (e) {
    console.warn('Load error', e);
  }
}

function updateUI() {
  const t = state.timers[state.selectedIndex];

  selectedName.textContent = t.name;
  countdown.textContent = formatTime(t.remaining);

  timerLabel.textContent =
    t.running ? 'Reset In' :
    t.remaining === 0 ? 'Complete' : 'Ready';

  populationValue.textContent = state.population;
  populationInput.value = state.population;

  metaText.textContent = `${getBand(state.population)} population`;

  startBtn.textContent = t.running ? 'Running' : 'Start Timer';

  renderCards();
}

function renderCards() {
  cardsGrid.innerHTML = '';

  state.timers.forEach((t, i) => {
    const card = document.createElement('button');
    card.className = 'card' + (i === state.selectedIndex ? ' selected' : '');

    card.innerHTML = `
      <div class="card-icon">${t.icon}</div>
      <h4>${t.name}</h4>
      <small>${formatTime(t.remaining)}</small>
    `;

    card.onclick = () => {
      state.selectedIndex = i;
      updateUI();
    };

    cardsGrid.appendChild(card);
  });
}

function tick() {
  const now = Date.now();
  let changed = false;

  state.timers.forEach(t => {
    if (!t.running) return;

    const elapsed = (now - t.lastTick) / 1000;
    t.lastTick = now;

    t.remaining = Math.max(0, t.remaining - elapsed);

    if (t.remaining === 0) {
      t.running = false;
      showToast(`${t.name} ready`);
    }

    changed = true;
  });

  if (changed) {
    save();
    updateUI();
  }
}

// EVENTS
startBtn.onclick = () => {
  const t = state.timers[state.selectedIndex];
  if (t.running) return;

  t.running = true;
  t.lastTick = Date.now();

  updateUI();
  save();
};

resetBtn.onclick = () => {
  const t = state.timers[state.selectedIndex];

  t.running = false;
  t.remaining = getCycle(t, state.population);
  t.lastTick = 0;

  updateUI();
  save();
};

populationInput.addEventListener('input', e => {
  state.population = Math.max(0, Math.min(1000, Number(e.target.value) || 0));

  state.timers.forEach(t => {
    if (!t.running) {
      t.remaining = getCycle(t, state.population);
    }
  });

  updateUI();
  save();
});

// INIT
load();
updateUI();
setInterval(tick, 1000);
