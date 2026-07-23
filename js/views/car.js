/* =====================================================
   CAR.JS — Location de voiture (Full CRUD)
   Japan Travel Dashboard
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

const CAR_FIELDS = [
  { key:'agency',             label:'Agence de location',      type:'text',   required:true,  placeholder:'Toyota Rent a Car / Nissan Rent a Car' },
  { key:'model',              label:'Modèle / Catégorie',       type:'text',   required:false, placeholder:'Yaris Hybrid, Honda Fit...', row:true },
  { key:'bookingRef',         label:'N° de réservation',       type:'text',   required:false, placeholder:'TRC-982145', row:true },
  { key:'pickupLocation',     label:'Lieu de prise en charge',  type:'text',   required:true,  placeholder:'Gare de Shin-Yokohama' },
  { key:'pickupDate',         label:'Prise en charge (date+heure)', type:'datetime-local', required:true, row:true },
  { key:'dropoffLocation',    label:'Lieu de restitution',     type:'text',   required:true,  placeholder:'Gare de Kyoto Hachijo' },
  { key:'dropoffDate',        label:'Restitution (date+heure)',    type:'datetime-local', required:true, row:true },
  { key:'cost',               label:'Prix total',              type:'number', required:false, placeholder:'24000', row:true },
  { key:'currency',           label:'Devise',                  type:'select', required:true,  options:['JPY','EUR','USD'], row:true },
  { key:'driverName',         label:'Nom du conducteur',       type:'text',   required:false, placeholder:'Nom Prénom' },
  { key:'etcCardIncluded',    label:'Carte ETC (Télépéage)',   type:'checkbox', checkLabel:'Carte ETC réservée / incluse', required:false },
  { key:'licenseRequirement', label:'Permis requis / Papiers',  type:'text',   required:false, placeholder:'Permis int. 1949 / Traduction JAF + Permis FR + Passeport' },
  { key:'mapsUrl',            label:'Lien Google Maps agence', type:'url',    required:false, placeholder:'https://maps.google.com/...' },
  { key:'notes',              label:'Notes & Rappels',          type:'textarea', required:false, placeholder:'Assurance, sièges auto, règlement...' },
];

export function renderCar(container) {
  const data    = appData;
  const rentals = data.rentals || [];

  container.innerHTML = `
    <div class="view-enter">
      <!-- Header -->
      <div class="view-hd">
        <div>
          <div class="view-hd-title">🚗 Location de voiture</div>
          <div class="view-hd-sub">${rentals.length} réservation(s) de véhicule</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-car-btn">
          <i class="fa-solid fa-plus"></i> Ajouter
        </button>
      </div>

      <!-- Driving tips in Japan banner -->
      <div class="card" style="margin-bottom:var(--sp-5);background:linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12));border-color:rgba(59,130,246,0.3)">
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:var(--sp-2);display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1.2rem">🇯🇵</span> Aide-mémoire conduite au Japon
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-secondary)">
          <div>• <strong>Conduite à gauche</strong> (volant à droite)</div>
          <div>• <strong>Permis :</strong> Permis FR + Traduction Officielle JAF (ou Permis Int. 1949 selon pays)</div>
          <div>• <strong>Carte ETC :</strong> Indispensable pour péages autoroute (voies ETC bleues)</div>
          <div>• <strong>Alcool :</strong> Tolérance zéro stricte (0.0g)</div>
        </div>
      </div>

      <!-- Rental Cards List -->
      <div class="card-list" id="car-rentals-list">
        ${rentals.length ? rentals.map(carCard).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">🚗</div>
            <div class="empty-state-title">Aucune voiture de location</div>
            <div class="empty-state-text">Cliquez sur &laquo; Ajouter &raquo; pour saisir les détails de votre réservation auto.</div>
          </div>
        `}
      </div>
    </div>
  `;

  // Add Car Rental
  document.getElementById('add-car-btn').addEventListener('click', () => {
    openModal({
      title: '🚗 Nouvelle réservation auto',
      fields: CAR_FIELDS,
      data: { currency: 'JPY', etcCardIncluded: true },
      onSave(d) {
        addItem(appData, 'rentals', d);
        rerender();
        showToast('Réservation auto ajoutée !', 'success');
      },
    });
  });

  // Edit / Delete Car Rental (Event Delegation)
  document.getElementById('car-rentals-list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-car]');
    if (!editBtn) return;
    const id = editBtn.dataset.editCar;
    const item = (appData.rentals || []).find(x => x.id === id);
    if (!item) return;

    openModal({
      title: '✏️ Modifier la réservation auto',
      fields: CAR_FIELDS,
      data: item,
      onSave(d) {
        updateItem(appData, 'rentals', id, d);
        rerender();
        showToast('Réservation mise à jour !', 'success');
      },
      onDelete() {
        deleteItem(appData, 'rentals', id);
        rerender();
        showToast('Réservation supprimée.', 'info');
      },
    });
  });
}

function carCard(c) {
  const pDate = c.pickupDate ? new Date(c.pickupDate) : null;
  const dDate = c.dropoffDate ? new Date(c.dropoffDate) : null;
  const days  = pDate && dDate ? Math.max(1, Math.ceil((dDate - pDate) / 86400000)) : null;

  return `
    <div class="card card-gradient-border">
      <div class="card-header">
        <div>
          <div class="card-title" style="display:flex;align-items:center;gap:0.5rem">
            <span>🚗 ${c.agency}</span>
            ${c.bookingRef ? `<span class="badge badge-neutral">${c.bookingRef}</span>` : ''}
          </div>
          ${c.model ? `<div class="card-subtitle">${c.model}</div>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-icon-sm" data-edit-car="${c.id}" title="Modifier">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-3);background:var(--bg-input);padding:var(--sp-3);border-radius:var(--r-md)">
          <div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">PRISE EN CHARGE</div>
            <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-top:2px">${c.pickupLocation||'—'}</div>
            ${pDate ? `<div style="font-size:var(--fs-xs);color:var(--color-primary);font-weight:600;margin-top:2px">${fmtDateTime(pDate)}</div>` : ''}
          </div>
          <div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">RESTITUTION</div>
            <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-top:2px">${c.dropoffLocation||'—'}</div>
            ${dDate ? `<div style="font-size:var(--fs-xs);color:var(--color-primary);font-weight:600;margin-top:2px">${fmtDateTime(dDate)}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-2)">
          ${days ? `<span class="badge badge-primary"><i class="fa-solid fa-clock"></i> ${days} jour${days > 1 ? 's' : ''}</span>` : ''}
          ${c.cost ? `<span class="badge badge-accent"><i class="fa-solid fa-yen-sign"></i> ${Number(c.cost).toLocaleString()} ${c.currency||'JPY'}</span>` : ''}
          ${c.etcCardIncluded ? `<span class="badge badge-success"><i class="fa-solid fa-credit-card"></i> Carte ETC incluse</span>` : ''}
          ${c.driverName ? `<span class="badge badge-neutral"><i class="fa-solid fa-user"></i> ${c.driverName}</span>` : ''}
        </div>

        ${c.licenseRequirement ? `
          <div style="font-size:var(--fs-xs);color:var(--text-secondary);margin-top:var(--sp-2)">
            <i class="fa-solid fa-id-card" style="color:var(--color-warning);margin-right:4px"></i>
            <strong>Papiers :</strong> ${c.licenseRequirement}
          </div>
        ` : ''}

        ${c.notes ? `
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--border)">
            <i class="fa-solid fa-note-sticky" style="margin-right:4px"></i> ${c.notes}
          </div>
        ` : ''}
      </div>

      ${c.mapsUrl ? `
        <div class="card-footer" style="margin-top:var(--sp-2);padding-top:var(--sp-2)">
          <a href="${c.mapsUrl}" target="_blank" class="btn btn-ghost btn-sm btn-full" style="color:var(--color-primary)">
            <i class="fa-solid fa-map-location-dot"></i> Itinéraire Agence (Google Maps)
          </a>
        </div>
      ` : ''}
    </div>
  `;
}

function fmtDateTime(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
