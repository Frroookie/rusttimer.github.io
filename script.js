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
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function getBand(pop) {
  if (pop <= 100) return 'Low';
  if (pop <= 300) return 'Medium';
  if (pop <= 600) return 'High';
  return 'Very High';
}

function getRangeForMonument(monument, pop) {
  const band = getBand(pop);
  if (band === 'Low') return { min: 25, max: 40 };
  if (band === 'Medium') return { min: 15, max: 30 };
  if (band === 'High') return { min: 10, max: 25 };
  return { min: 8, max: 20 };
}

function midpoint(min, max) {
  return (min + max) / 2;
}

function getEstimatedCycle(monument, pop) {
  if (monument.isChinook) {
    return 15 * 60;
  }
  const range = getRangeForMonument(monument, pop);
  return midpoint(range.min, range.max) * 60;
}

function getEstimatedText(monument, pop) {
  if (monument.isChinook) {
    return '~15 min';
  }
  const range = getRangeForMonument(monument, pop);
  return `${range.min}-${range.max} min range`;
}

function createTimerState(monument) {
  return {
    name: monument.name,
    icon: monument.icon,
    isChinook: !!monument.isChinook,
    remainingSeconds: getEstimatedCycle(monument, state.population),
    running: false,
    lastTick: 0
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      population: state.population,
      selectedIndex: state.selectedIndex,
      timers: state.timers
    })
  );
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return;

    state.population = Math.max(0, Math.min(1000, Number(parsed.population) || 100));
    state.selectedIndex = Math.max(0, Math.min(monuments.length - 1, Number(parsed.selectedIndex) || 0));

    if (Array.isArray(parsed.timers) && parsed.timers.length === monuments.length) {
      state.timers = parsed.timers.map((timer, index) => ({
        ...createTimerState(monuments[index]),
        ...timer,
        remainingSeconds: Math.max(0, Number(timer.remainingSeconds) || getEstimatedCycle(monuments[index], state.population)),
        running: Boolean(timer.running),
        lastTick: Number(timer.lastTick) || 0
      }));

      state.timers.forEach(timer => {
        if (timer.running && timer.lastTick) {
          const elapsed = Math.max(0, (Date.now() - timer.lastTick) / 1000);
          timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
          if (timer.remainingSeconds <= 0) {
            timer.remainingSeconds = 0;
            timer.running = false;
          }
          timer.lastTick = Date.now();
        }
      });
    } else {
      state.timers = monuments.map(monument => createTimerState(monument));
    }
  } catch (e) {
    console.warn('Unable to load timer state.', e);
    state.timers = monuments.map(monument => createTimerState(monument));
  }
}

function updatePopulationUI() {
  populationValue.textContent = state.population;
  populationInput.value = state.population;
  metaText.textContent = `${getBand(state.population)} population • ${getEstimatedText(monuments[state.selectedIndex], state.population)}`;
}

function renderCards() {
  cardsGrid.innerHTML = '';
  state.timers.forEach((timer, index) => {
    const card = document.createElement('button');
    card.className = 'card' + (index === state.selectedIndex ? ' selected' : '');
    card.innerHTML = `
      <div class="card-icon">${timer.icon}</div>
      <h4>${timer.name}</h4>
      <small>${timer.running ? formatTime(timer.remainingSeconds) : '~' + formatTime(timer.remainingSeconds)}</small>
    `;
    card.addEventListener('click', () => selectMonument(index));
    cardsGrid.appendChild(card);
  });
}

function selectMonument(index) {
  state.selectedIndex = index;
  updateUI();
}

function updateUI() {
  const timer = state.timers[state.selectedIndex];
  selectedName.textContent = timer.name;
  countdown.textContent = formatTime(timer.remainingSeconds);

  if (timer.running) {
    timerLabel.textContent = 'Reset In';
  } else if (timer.remainingSeconds === 0) {
    timerLabel.textContent = 'Complete';
  } else {
    timerLabel.textContent = 'Ready';
  }

  updatePopulationUI();
  renderCards();
  startBtn.textContent = timer.running ? 'Running' : 'Start Timer';
}

function tick() {
  let ended = false;
  state.timers.forEach(timer => {
    if (!timer.running) return;

    const now = Date.now();
    const elapsed = (now - timer.lastTick) / 1000;
    if (elapsed > 0) {
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
      timer.lastTick = now;

      if (timer.remainingSeconds === 0) {
        timer.running = false;
        ended = true;
        showToast(`${timer.name} timer finished!`);
      }
    }
  });

  if (ended || state.timers.some(timer => timer.running)) {
    updateUI();
  }
  saveState();
}

function startTimer() {
  const timer = state.timers[state.selectedIndex];
  if (timer.running) return;
  timer.running = true;
  timer.lastTick = Date.now();
  updateUI();
  saveState();
}

function resetTimer() {
  const timer = state.timers[state.selectedIndex];
  timer.remainingSeconds = getEstimatedCycle(timer, state.population);
  timer.running = false;
  timer.lastTick = 0;
  updateUI();
  saveState();
}

populationInput.addEventListener('input', (e) => {
  state.population = Math.max(0, Math.min(1000, Number(e.target.value) || 0));

  state.timers.forEach(timer => {
    if (!timer.running) {
      timer.remainingSeconds = getEstimatedCycle(timer, state.population);
      timer.lastTick = 0;
    }
  });

  updateUI();
  saveState();
});

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

loadState();
updateUI();
setInterval(tick, 250);
