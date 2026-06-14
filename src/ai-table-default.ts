function findConfigButtons(): { tableButton: HTMLButtonElement | null; aiButton: HTMLButtonElement | null } {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.config-panel .start-button'));
  const aiButton = buttons.find(button => button.classList.contains('solo-ai-native-button')) ?? null;
  const tableButton = buttons.find(button => !button.classList.contains('solo-ai-native-button')) ?? null;
  return { tableButton, aiButton };
}

function wireAiDefaultTable(): void {
  const { tableButton, aiButton } = findConfigButtons();
  if (!tableButton || !aiButton || tableButton.dataset.aiDefaultReady === '1') return;

  tableButton.dataset.aiDefaultReady = '1';
  tableButton.classList.add('ai-table-default-button');
  tableButton.textContent = 'Table IA';
  tableButton.setAttribute('title', 'Lancer la table choisie avec des adversaires IA');
  tableButton.setAttribute('aria-label', 'Lancer la table choisie avec des adversaires IA');

  aiButton.textContent = 'Duel IA';
  aiButton.setAttribute('title', 'Mode IA avec le nombre de seats choisi');

  tableButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    aiButton.click();
  }, true);
}

function tickAiDefaultTable(): void {
  wireAiDefaultTable();
}

const aiDefaultObserver = new MutationObserver(tickAiDefaultTable);
aiDefaultObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', tickAiDefaultTable);
window.setInterval(tickAiDefaultTable, 1200);
