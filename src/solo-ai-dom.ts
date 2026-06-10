const SOLO_KEY = 'prohibited-solo-ai';
let aiBusy = false;
let lastAiSignature = '';

function isSoloEnabled(): boolean {
  return sessionStorage.getItem(SOLO_KEY) === '1';
}

function enableSolo(): void {
  sessionStorage.setItem(SOLO_KEY, '1');
}

function disableSolo(): void {
  sessionStorage.removeItem(SOLO_KEY);
}

function textOf(selector: string): string {
  return document.querySelector<HTMLElement>(selector)?.textContent?.trim() ?? '';
}

function addSoloButton(): void {
  const panel = document.querySelector<HTMLElement>('.config-panel');
  const startButton = document.querySelector<HTMLButtonElement>('.start-button');
  if (!panel || !startButton || document.querySelector('.solo-ai-button')) return;

  startButton.addEventListener('click', () => {
    if (!document.body.dataset.soloAiStart) disableSolo();
    delete document.body.dataset.soloAiStart;
  }, { capture: true });

  const soloButton = document.createElement('button');
  soloButton.type = 'button';
  soloButton.className = 'start-button solo-ai-button';
  soloButton.textContent = 'Solo vs IA';
  soloButton.addEventListener('click', () => {
    document.body.dataset.soloAiStart = '1';
    enableSolo();
    startButton.click();
  });

  startButton.insertAdjacentElement('afterend', soloButton);
}

function signature(): string {
  const turn = textOf('.score-strip');
  const active = textOf('.hand-heading h2');
  const hand = Array.from(document.querySelectorAll('.hand-grid .card strong'))
    .map(item => item.textContent?.trim() ?? '')
    .join('|');
  return `${turn}::${active}::${hand}`;
}

function currentPlayerLooksLikeAi(): boolean {
  const heading = textOf('.hand-heading h2');
  return /Joueur\s*2/i.test(heading);
}

function clickFirstEnabled(selector: string): boolean {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(selector));
  const button = buttons.find(item => !item.disabled && item.offsetParent !== null);
  if (!button) return false;
  button.click();
  return true;
}

function runAiOnce(): void {
  if (!isSoloEnabled() || aiBusy || !document.querySelector('.game-screen')) return;
  if (!currentPlayerLooksLikeAi()) return;

  const currentSignature = signature();
  if (currentSignature === lastAiSignature) return;
  lastAiSignature = currentSignature;
  aiBusy = true;

  window.setTimeout(() => {
    const played = clickFirstEnabled('.hand-grid .play-action[title="Jouer"]');
    if (!played) clickFirstEnabled('.hand-grid .discard-action');

    window.setTimeout(() => {
      clickFirstEnabled('.end-turn-button');
      aiBusy = false;
    }, 650);
  }, 700);
}

function addSoloBadge(): void {
  if (!isSoloEnabled() || document.querySelector('.solo-ai-badge') || !document.querySelector('.game-screen')) return;
  const badge = document.createElement('div');
  badge.className = 'solo-ai-badge';
  badge.textContent = 'SOLO VS IA';
  document.body.appendChild(badge);
}

function tick(): void {
  addSoloButton();
  addSoloBadge();
  runAiOnce();
}

const observer = new MutationObserver(() => tick());
observer.observe(document.body, { childList: true, subtree: true });
window.setInterval(tick, 900);
window.addEventListener('load', tick);
