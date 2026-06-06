const CONTACT_EMAIL = 'benoitlubert@gmail.com';
const BLACKLACE_URL = 'https://benoitlub.github.io/blacklace-echo/';

export function CreatorRibbon() {
  return (
    <aside className="creator-ribbon" aria-label="Blacklace Island creator signature">
      <div className="creator-ribbon-title">Boutique de Rotas · Blacklace Island</div>
      <div className="creator-ribbon-name">Benoît Lubert</div>
      <div className="creator-ribbon-note">Béni · BL comme Blacklace · Lubert comme Liberty</div>
      <div className="creator-ribbon-actions">
        <a href={BLACKLACE_URL} target="_blank" rel="noreferrer">Explorer l'île</a>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Collaboration%20Pro.Hibited%20Online`}>Collaborer</a>
      </div>
    </aside>
  );
}
