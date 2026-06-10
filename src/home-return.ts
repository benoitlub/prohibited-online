function findNewGameButton(): HTMLButtonElement | null {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.score-strip button'))
    .find(button => /nouvelle\s+partie/i.test(button.textContent ?? '')) ?? null;
}

function goHome(): void {
  const button = findNewGameButton();
  if (button) button.click();
}

function wireTitleHome(): void {
  const title = document.querySelector<HTMLElement>('.game-screen .topbar h1');
  if (!title || title.dataset.homeReturnReady === '1') return;
  title.dataset.homeReturnReady = '1';
  title.setAttribute('role', 'button');
  title.setAttribute('tabindex', '0');
  title.setAttribute('title', 'Retour accueil');
  title.classList.add('home-title-return');
  title.addEventListener('click', goHome);
  title.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goHome();
    }
  });
}

function addHomeIcon(): void {
  const scoreStrip = document.querySelector<HTMLElement>('.game-screen .score-strip');
  const newGameButton = findNewGameButton();
  if (!scoreStrip || !newGameButton || scoreStrip.querySelector('.home-return-button')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-return-button';
  button.setAttribute('aria-label', 'Retour accueil');
  button.setAttribute('title', 'Retour accueil');
  button.textContent = '⌂';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    goHome();
  });

  scoreStrip.insertBefore(button, newGameButton);
}

function tickHomeReturn(): void {
  wireTitleHome();
  addHomeIcon();
}

const homeReturnObserver = new MutationObserver(tickHomeReturn);
homeReturnObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', tickHomeReturn);
window.setInterval(tickHomeReturn, 1200);
