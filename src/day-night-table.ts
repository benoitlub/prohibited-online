const THEME_STORAGE_KEY = 'prohibited-table-theme';
type TableTheme = 'day' | 'night';

function getStoredTheme(): TableTheme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'day' ? 'day' : 'night';
}

function applyTheme(theme: TableTheme): void {
  document.body.classList.toggle('theme-day', theme === 'day');
  document.body.classList.toggle('theme-night', theme === 'night');
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  const toggle = document.querySelector<HTMLButtonElement>('.day-night-toggle');
  if (toggle) {
    toggle.textContent = theme === 'night' ? '☾' : '☀';
    toggle.setAttribute('aria-label', theme === 'night' ? 'Passer en mode jour' : 'Passer en mode nuit');
    toggle.setAttribute('title', theme === 'night' ? 'Mode nuit actif' : 'Mode jour actif');
  }
}

function toggleTheme(): void {
  const nextTheme: TableTheme = document.body.classList.contains('theme-night') ? 'day' : 'night';
  applyTheme(nextTheme);
}

function addSpotlight(): void {
  document.querySelectorAll<HTMLElement>('.table-surface').forEach(table => {
    if (table.querySelector('.table-overhead-spot')) return;
    const spot = document.createElement('div');
    spot.className = 'table-overhead-spot';
    spot.setAttribute('aria-hidden', 'true');
    table.prepend(spot);
  });
}

function addToggle(): void {
  const scoreStrip = document.querySelector<HTMLElement>('.game-screen .score-strip');
  if (!scoreStrip || scoreStrip.querySelector('.day-night-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'day-night-toggle';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleTheme();
  });

  const homeButton = scoreStrip.querySelector('.home-return-button');
  if (homeButton) {
    homeButton.insertAdjacentElement('afterend', button);
  } else {
    scoreStrip.prepend(button);
  }
  applyTheme(document.body.classList.contains('theme-day') ? 'day' : getStoredTheme());
}

function tickDayNight(): void {
  addToggle();
  addSpotlight();
}

applyTheme(getStoredTheme());
const dayNightObserver = new MutationObserver(tickDayNight);
dayNightObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', tickDayNight);
window.setInterval(tickDayNight, 1400);
