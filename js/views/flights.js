/* =====================================================
   FLIGHTS.JS — Transports View (Vols, Trains & Voiture - Full CRUD)
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

const STATUS_OPTIONS = ['confirmed','pending','cancelled'];
const STATUS_FR = { confirmed:'Confirmé', pending:'En attente', cancelled:'Annulé' };
const STATUS_BADGE = { confirmed:'badge-success', pending:'badge-warning', cancelled:'badge-error' };

const FLIGHT_FIELDS = [
  { key:'direction',    label:'Direction',         type:'select', required:true,  options:[{value:'aller',label:'Aller ✈️'},{value:'retour',label:'Retour 🛬'}] },
  { key:'airline',      label:'Compagnie',         type:'text',   required:true,  placeholder:'Air France', row:true },
  { key:'flightNumber', label:'N° de vol',         type:'text',   required:true,  placeholder:'AF275',      row:true },
  { key:'fromCity',     label:'Ville départ',      type:'text',   required:true,  placeholder:'Paris',      row:true },
  { key:'fromAirport',  label:'Code aéroport',     type:'text',   required:true,  placeholder:'CDG',        row:true },
  { key:'fromTerminal', label:'Terminal',           type:'text',   required:false, placeholder:'2E',         row:true },
  { key:'toCity',       label:'Ville arrivée',     type:'text',   required:true,  placeholder:'Tokyo',      row:true },
  { key:'toAirport',    label:'Code aéroport arr.',type:'text',   required:true,  placeholder:'HND',        row:true },
  { key:'toTerminal',   label:'Terminal arr.',     type:'text',   required:false, placeholder:'3',          row:true },
  { key:'departure',    label:'Départ (date+heure)', type:'datetime-local', required:true,  row:true },
  { key:'arrival',      label:'Arrivée (date+heure)', type:'datetime-local', required:true, row:true },
  { key:'status',       label:'Statut',            type:'select', required:true,  options:STATUS_OPTIONS.map(s=>({value:s,label:STATUS_FR[s]})) },
  { key:'notes',        label:'Notes',             type:'textarea', required:false, placeholder:'Infos utiles...' },
];

const TRAIN_FIELDS = [
  { key:'from',          label:'Gare départ',   type:'text',  required:true,  placeholder:'Tokyo',         row:true },
  { key:'to',            label:'Gare arrivée',  type:'text',  required:true,  placeholder:'Kyoto',         row:true },
  { key:'date',          label:'Date',          type:'date',  required:true,  row:true },
  { key:'departureTime', label:'Heure départ',  type:'time',  required:true,  row:true },
  { key:'arrivalTime',   label:'Heure arrivée', type:'time',  required:true,  row:true },
  { key:'trainName',     label:'Nom du train',  type:'text',  required:false, placeholder:'Nozomi 15' },
  { key:'passCovered',   label:'JR Pass',       type:'checkbox', checkLabel:'Inclus dans le JR Pass', required:false },
  { key:'notes',         label:'Notes',         type:'textarea', required:false, placeholder:'Siège, voiture...' },
];

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

export function renderFlights(container) {
  const data     = appData;
  const flights  = data.flights || [];
  const trains   = data.trains  || [];
  const rentals  = data.rentals || [];

  function flightCard(f) {
    const dep = f.departure ? new Date(f.departure) : null;
    const arr = f.arrival   ? new Date(f.arrival)   : null;
    const dur = dep && arr  ? calcDuration(dep, arr) : '';
    return `
      <div class="flight-card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:var(--fs-sm);font-weight:600;color:var(--text-secondary)">${f.airline||''}</span>
            <span class="badge badge-neutral">${f.flightNumber||''}</span>
            <span class="badge ${STATUS_BADGE[f.status]||'badge-neutral'}">${STATUS_FR[f.status]||f.status||''}</span>
          </div>
          <div class="card-actions">
            <button class="btn-icon btn-icon-sm" data-edit-flight="${f.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
          </div>
        </div>
        <div class="flight-route">
          <div class="flight-airport">
            <div class="flight-airport-code">${f.fromAirport||'—'}</div>
            <div class="flight-airport-city">${f.fromCity||''}</div>
            ${f.fromTerminal?`<div style="font-size:var(--fs-xs);color:var(--text-muted)">Terminal ${f.fromTerminal}</div>`:''}
            ${dep?`<div style="font-size:var(--fs-xs);font-weight:600;color:var(--color-primary);margin-top:4px">${fmtTime(dep)}</div>`:''}
            ${dep?`<div style="font-size:var(--fs-xs);color:var(--text-muted)">${fmtDate(dep)}</div>`:''}
          </div>
          <div class="flight-arrow">
            <div class="flight-arrow-line"><i class="fa-solid fa-plane"></i></div>
            <div class="flight-duration">${dur}</div>
          </div>
          <div class="flight-airport">
            <div class="flight-airport-code">${f.toAirport||'—'}</div>
            <div class="flight-airport-city">${f.toCity||''}</div>
            ${f.toTerminal?`<div style="font-size:var(--fs-xs);color:var(--text-muted)">Terminal ${f.toTerminal}</div>`:''}
            ${arr?`<div style="font-size:var(--fs-xs);font-weight:600;color:var(--color-primary);margin-top:4px">${fmtTime(arr)}</div>`:''}
            ${arr?`<div style="font-size:var(--fs-xs);color:var(--text-muted)">${fmtDate(arr)}</div>`:''}
          </div>
        </div>
        ${f.notes?`<div style="font-size:var(--fs-xs);color:var(--text-muted);border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.25rem"><i class="fa-solid fa-note-sticky" style="margin-right:4px"></i>${f.notes}</div>`:''}
      </div>
    `;
  }

  function trainCard(t) {
    return `
      <div class="train-card">
        <div class="train-stations">
          <div class="train-station-name">${t.from}</div>
          <i class="fa-solid fa-arrow-right train-arrow"></i>
          <div class="train-station-name">${t.to}</div>
        </div>
        <div class="train-meta">
          <div class="train-time">${t.departureTime||''} → ${t.arrivalTime||''}</div>
          <div class="train-date">${t.date?fmtDateStr(t.date):''}</div>
          ${t.trainName?`<div style="font-size:var(--fs-xs);color:var(--text-muted)">${t.trainName}</div>`:''}
          ${t.passCovered?`<span class="badge badge-success" style="margin-top:4px"><i class="fa-solid fa-check"></i> JR Pass</span>`:''}
        </div>
        <button class="btn-icon btn-icon-sm" style="margin-left:var(--sp-2)" data-edit-train="${t.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
      </div>
    `;
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
              ${pDate ? `<div style="font-size:var(--fs-xs);color:var(--color-primary);font-weight:600;margin-top:2px">${fmtDateTimeFull(pDate)}</div>` : ''}
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">RESTITUTION</div>
              <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-top:2px">${c.dropoffLocation||'—'}</div>
              ${dDate ? `<div style="font-size:var(--fs-xs);color:var(--color-primary);font-weight:600;margin-top:2px">${fmtDateTimeFull(dDate)}</div>` : ''}
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

  const allerFlights  = flights.filter(f=>f.direction==='aller');
  const retourFlights = flights.filter(f=>f.direction==='retour');

  container.innerHTML = `
    <div class="view-enter">
      <!-- Vols section -->
      <div class="view-hd">
        <div><div class="view-hd-title">✈️ Vols</div><div class="view-hd-sub">${flights.length} vol(s) enregistré(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-flight-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      ${allerFlights.length ? `
        <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-muted);margin-bottom:var(--sp-2);text-transform:uppercase;letter-spacing:.05em">Aller</div>
        <div class="card-list" id="aller-list">${allerFlights.map(flightCard).join('')}</div>
      ` : ''}
      ${retourFlights.length ? `
        <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-muted);margin:var(--sp-4) 0 var(--sp-2);text-transform:uppercase;letter-spacing:.05em">Retour</div>
        <div class="card-list" id="retour-list">${retourFlights.map(flightCard).join('')}</div>
      ` : ''}
      ${!flights.length ? `<div class="empty-state"><div class="empty-state-icon">✈️</div><div class="empty-state-title">Aucun vol enregistré</div><div class="empty-state-text">Cliquez sur &laquo; Ajouter &raquo; pour saisir votre premier vol.</div></div>` : ''}

      <div class="divider"></div>

      <!-- Trains section -->
      <div class="view-hd">
        <div><div class="view-hd-title">🚄 Trains / Shinkansen</div><div class="view-hd-sub">${trains.length} trajet(s) enregistré(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-train-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <div class="card-list" id="trains-list">
        ${trains.length ? trains.map(trainCard).join('') : `<div class="empty-state"><div class="empty-state-icon">🚄</div><div class="empty-state-title">Aucun train enregistré</div></div>`}
      </div>

      <div class="divider"></div>

      <!-- Car Rental section -->
      <div class="view-hd">
        <div><div class="view-hd-title">🚗 Location de voiture</div><div class="view-hd-sub">${rentals.length} réservation(s) auto</div></div>
        <button class="btn btn-primary btn-sm" id="add-car-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <div class="card-list" id="cars-list">
        ${rentals.length ? rentals.map(carCard).join('') : `<div class="empty-state"><div class="empty-state-icon">🚗</div><div class="empty-state-title">Aucune voiture de location</div></div>`}
      </div>
    </div>
  `;

  // ---- Event delegation ----
  container.addEventListener('click', (e) => {
    // Edit flight
    const editFlightBtn = e.target.closest('[data-edit-flight]');
    if (editFlightBtn) {
      const id = editFlightBtn.dataset.editFlight;
      const f  = (appData.flights||[]).find(x=>x.id===id);
      if (!f) return;
      openModal({
        title: '✏️ Modifier le vol',
        fields: FLIGHT_FIELDS,
        data: f,
        onSave(d) {
          updateItem(appData, 'flights', id, d);
          rerender(); showToast('Vol mis à jour !', 'success');
        },
        onDelete() {
          deleteItem(appData, 'flights', id);
          rerender(); showToast('Vol supprimé.', 'info');
        },
      });
    }

    // Edit train
    const editTrainBtn = e.target.closest('[data-edit-train]');
    if (editTrainBtn) {
      const id = editTrainBtn.dataset.editTrain;
      const t  = (appData.trains||[]).find(x=>x.id===id);
      if (!t) return;
      openModal({
        title: '✏️ Modifier le trajet',
        fields: TRAIN_FIELDS,
        data: t,
        onSave(d) {
          updateItem(appData, 'trains', id, d);
          rerender(); showToast('Trajet mis à jour !', 'success');
        },
        onDelete() {
          deleteItem(appData, 'trains', id);
          rerender(); showToast('Trajet supprimé.', 'info');
        },
      });
    }

    // Edit car rental
    const editCarBtn = e.target.closest('[data-edit-car]');
    if (editCarBtn) {
      const id = editCarBtn.dataset.editCar;
      const c  = (appData.rentals||[]).find(x=>x.id===id);
      if (!c) return;
      openModal({
        title: '✏️ Modifier la réservation auto',
        fields: CAR_FIELDS,
        data: c,
        onSave(d) {
          updateItem(appData, 'rentals', id, d);
          rerender(); showToast('Réservation auto mise à jour !', 'success');
        },
        onDelete() {
          deleteItem(appData, 'rentals', id);
          rerender(); showToast('Réservation supprimée.', 'info');
        },
      });
    }
  });

  // Add flight
  document.getElementById('add-flight-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouveau vol',
      fields: FLIGHT_FIELDS,
      data: { direction:'aller', status:'confirmed' },
      onSave(d) {
        addItem(appData, 'flights', d);
        rerender(); showToast('Vol ajouté !', 'success');
      },
    });
  });

  // Add train
  document.getElementById('add-train-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouveau trajet',
      fields: TRAIN_FIELDS,
      data: { passCovered: true },
      onSave(d) {
        addItem(appData, 'trains', d);
        rerender(); showToast('Trajet ajouté !', 'success');
      },
    });
  });

  // Add car rental
  document.getElementById('add-car-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouvelle réservation auto',
      fields: CAR_FIELDS,
      data: { currency:'JPY', etcCardIncluded: true },
      onSave(d) {
        addItem(appData, 'rentals', d);
        rerender(); showToast('Réservation auto ajoutée !', 'success');
      },
    });
  });
}

// ---- Helpers ----
function fmtTime(d) {
  return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function fmtDate(d) {
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtDateStr(s) {
  return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtDateTimeFull(d) {
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function calcDuration(d1, d2) {
  const mins = Math.round((d2-d1)/60000);
  const h = Math.floor(mins/60), m = mins%60;
  return `${h}h${m>0?m+'min':''}`;
}
