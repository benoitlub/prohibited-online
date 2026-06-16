function addOnlineStub(): void {
  const configPanel = document.querySelector<HTMLElement>('.config-panel');
  if (!configPanel || configPanel.querySelector('.online-stub-panel')) return;

  const panel = document.createElement('section');
  panel.className = 'online-stub-panel';
  panel.setAttribute('aria-label', 'Online bientôt disponible');
  panel.innerHTML = `
    <div>
      <strong>Online</strong>
      <span>Créer une table / rejoindre avec un code</span>
    </div>
    <button type="button" disabled>Bientôt</button>
  `;

  configPanel.appendChild(panel);
}

const onlineStubObserver = new MutationObserver(addOnlineStub);
onlineStubObserver.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', addOnlineStub);
window.setInterval(addOnlineStub, 1500);
