/* =====================================================
   MAP.JS — Interactive Leaflet Map & GitHub-Style Heatmap Calendar
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

let mapInstance = null;

const ACCOM_FIELDS = [
  { key:'name',         label:'Nom de l\'établissement', type:'text',   required:true,  placeholder:'COTO Tokyo' },
  { key:'city',         label:'Ville',                   type:'text',   required:true,  placeholder:'Tokyo' },
  { key:'address',      label:'Adresse complète',         type:'text',   required:true,  placeholder:'1-chōme-52-6 Oshiage, Sumida City' },
  { key:'lat',          label:'Latitude',                type:'number', required:false, placeholder:'35.7107', step:0.0001, hint:'Google Maps (clic droit)', row:true },
  { key:'lng',          label:'Longitude',               type:'number', required:false, placeholder:'139.8130', step:0.0001, row:true },
  { key:'checkIn',      label:'Date Check-in',           type:'date',   required:true,  row:true },
  { key:'checkOut',     label:'Date Check-out',          type:'date',   required:true,  row:true },
  { key:'pricePerNight',label:'Prix / nuit (€)',         type:'number', required:false, placeholder:'95', step:0.01, row:true },
  { key:'currency',     label:'Devise',                  type:'select', required:true,  options:['EUR','JPY','USD'], row:true },
  { key:'bookingRef',   label:'N° de réservation',       type:'text',   required:false, placeholder:'HMKC83JSCF', row:true },
  { key:'accessInfo',   label:'Horaires / Heures',       type:'text',   required:false, placeholder:'Check-in: 16:00 | Check-out: 11:00', row:true },
  { key:'color',        label:'Couleur de l\'épingle',    type:'color',  required:false },
  { key:'notes',        label:'Notes / Remarques',       type:'textarea', required:false, placeholder:'Prix total, accès, code d\'entrée...' },
];

export function renderMap(container) {
  const data           = appData;
  const trip           = data.trip || {};
  const accommodations = data.accommodations || [];
  const activities     = data.activities     || [];

  const githubCalendarHtml = renderGitHubMonthlyCalendar(trip, accommodations);

  container.innerHTML = `
    <div class="view-enter">
      <!-- Header -->
      <div class="view-hd">
        <div>
          <div class="view-hd-title">🗺️ Carte & Hébergements</div>
          <div class="view-hd-sub">${accommodations.length} hébergement(s) enregistré(s) · ${activities.length} activité(s)</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-accom-btn"><i class="fa-solid fa-plus"></i> Hébergement</button>
      </div>

      <!-- Split Layout: Map & Cards on Left, GitHub Monthly Cubes on Right -->
      <div class="map-view-split">
        <!-- LEFT COLUMN: MAP & ACCOMMODATION CARDS -->
        <div>
          <!-- Interactive Map -->
          <div class="map-wrapper" style="margin-bottom:var(--sp-5)">
            <div id="leaflet-map"></div>
            <div class="map-controls">
              <button class="btn btn-sm" id="layer-accom" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary)">🏨 Hébergements</button>
              <button class="btn btn-sm" id="layer-act"   style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary)">⭐ Activités</button>
            </div>
          </div>

          <!-- Accommodation Cards -->
          <div class="section-hd">
            <h2>Liste des hébergements</h2>
          </div>
          <div class="card-list" id="accom-list">
            ${accommodations.length
              ? accommodations.map(accomCard).join('')
              : `<div class="empty-state"><div class="empty-state-icon">🏨</div><div class="empty-state-title">Aucun hébergement</div><div class="empty-state-text">Ajoutez vos hôtels, ryokans et auberges.</div></div>`
            }
          </div>
        </div>

        <!-- RIGHT COLUMN: GITHUB-STYLE MONTHLY HEATMAP CUBES -->
        <div>
          <div class="github-calendar-box">
            <div class="github-calendar-header">
              <span>📅 Nuitées réservées</span>
              <span class="fs-xs text-muted">Vue Mois</span>
            </div>

            <div id="github-calendar-container">
              ${githubCalendarHtml}
            </div>

            <div class="github-legend">
              <span>Non réservé</span>
              <div class="legend-square" style="background:#161b22;border:1px dashed var(--color-error)"></div>
              <div class="legend-square" style="background:#2ea043"></div>
              <span>Réservé (Cliquer pour voir)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- Init Leaflet Map ----
  initMap(accommodations, activities);

  // ---- Calendar Cubes Click Events ----
  document.getElementById('github-calendar-container').addEventListener('click', (e) => {
    const cube = e.target.closest('[data-cube-date]');
    if (!cube || cube.classList.contains('outside-trip') || cube.classList.contains('empty-day')) return;

    const dateStr = cube.dataset.cubeDate;
    const accomId = cube.dataset.accomId;

    if (accomId) {
      const accom = accommodations.find(a => a.id === accomId);
      if (accom) openAccomDetailModal(accom);
    } else {
      // Uncovered date: prompt to add accommodation prefilled with check-in date
      openModal({
        title: `🏨 Nouvel hébergement (${fmtDateFull(dateStr)})`,
        fields: ACCOM_FIELDS,
        data: { checkIn: dateStr, currency: 'EUR', color: '#e94560' },
        onSave(d) {
          d.lat = d.lat ? parseFloat(d.lat) : null;
          d.lng = d.lng ? parseFloat(d.lng) : null;
          d.pricePerNight = d.pricePerNight ? parseFloat(d.pricePerNight) : null;
          addItem(appData, 'accommodations', d);
          rerender();
          showToast('Hébergement ajouté !', 'success');
        },
      });
    }
  });

  // ---- Add Accommodation Button ----
  document.getElementById('add-accom-btn').addEventListener('click', () => {
    openModal({
      title: '🏨 Nouvel hébergement',
      fields: ACCOM_FIELDS,
      data: { currency:'EUR', color:'#e94560' },
      onSave(d) {
        d.lat = d.lat ? parseFloat(d.lat) : null;
        d.lng = d.lng ? parseFloat(d.lng) : null;
        d.pricePerNight = d.pricePerNight ? parseFloat(d.pricePerNight) : null;
        addItem(appData, 'accommodations', d);
        rerender();
        showToast('Hébergement ajouté !', 'success');
      },
    });
  });

  // ---- Accommodations List Delegation ----
  document.getElementById('accom-list').addEventListener('click', (e) => {
    // Edit button
    const editBtn = e.target.closest('[data-edit-accom]');
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.dataset.editAccom;
      const a  = accommodations.find(x => x.id === id);
      if (!a) return;
      openModal({
        title: '✏️ Modifier l\'hébergement',
        fields: ACCOM_FIELDS,
        data: a,
        onSave(d) {
          d.lat = d.lat ? parseFloat(d.lat) : null;
          d.lng = d.lng ? parseFloat(d.lng) : null;
          d.pricePerNight = d.pricePerNight ? parseFloat(d.pricePerNight) : null;
          updateItem(appData, 'accommodations', id, d);
          rerender();
          showToast('Hébergement mis à jour !', 'success');
        },
        onDelete() {
          deleteItem(appData, 'accommodations', id);
          rerender();
          showToast('Hébergement supprimé.', 'info');
        },
      });
      return;
    }

    // Direct Detail pop-up on card click
    const card = e.target.closest('[data-view-accom]');
    if (card) {
      const id = card.dataset.viewAccom;
      const a  = accommodations.find(x => x.id === id);
      if (a) openAccomDetailModal(a);
    }
  });
}

// =====================================================
// GITHUB MONTHLY CUBES HEATMAP RENDERER
// =====================================================
function renderGitHubMonthlyCalendar(trip, accommodations) {
  const startStr = trip.startDate || '2026-07-28';
  const endStr   = trip.endDate   || '2026-08-20';

  const tripStart = new Date(startStr + 'T00:00:00');
  const tripEnd   = new Date(endStr   + 'T00:00:00');

  if (isNaN(tripStart.getTime()) || isNaN(tripEnd.getTime())) {
    return `<div class="fs-xs text-muted">Dates non définies</div>`;
  }

  // Determine months covered (e.g. July 2026, August 2026)
  const months = [];
  const curr = new Date(tripStart.getFullYear(), tripStart.getMonth(), 1);
  const last = new Date(tripEnd.getFullYear(), tripEnd.getMonth(), 1);

  while (curr <= last) {
    months.push(new Date(curr));
    curr.setMonth(curr.getMonth() + 1);
  }

  let html = '';

  months.forEach(mDate => {
    const year  = mDate.getFullYear();
    const month = mDate.getMonth();
    const monthName = mDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    html += `
      <div class="github-month-section">
        <div class="github-month-title">${monthName}</div>
        <div class="month-table-header">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div class="month-table-days">
    `;

    // Blank padding cubes before 1st day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      html += `<div class="github-cube empty-day"></div>`;
    }

    // Days 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const yyyy = dayDate.getFullYear();
      const mm   = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd   = String(d).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isInsideTrip = dayDate >= tripStart && dayDate <= tripEnd;

      if (!isInsideTrip) {
        html += `
          <div class="github-cube outside-trip" data-cube-date="${dateStr}">
            <span>${d}</span>
          </div>
        `;
        continue;
      }

      // Check if accommodation covers this date
      const accom = accommodations.find(a => {
        if (!a.checkIn || !a.checkOut) return false;
        return dateStr >= a.checkIn && dateStr < a.checkOut;
      });

      if (accom) {
        const customBg = accom.color ? `background:${accom.color}` : '';
        html += `
          <div class="github-cube covered-custom"
               style="${customBg}"
               data-cube-date="${dateStr}"
               data-accom-id="${accom.id}"
               title="${d} ${monthName.slice(0,3)} : ${accom.name} (${accom.city})">
            <span>${d}</span>
          </div>
        `;
      } else {
        html += `
          <div class="github-cube uncovered-alert"
               data-cube-date="${dateStr}"
               title="${d} ${monthName.slice(0,3)} : Nuitée non réservée (Cliquer pour ajouter)">
            <span>${d}</span>
          </div>
        `;
      }
    }

    html += `
        </div>
      </div>
    `;
  });

  return html;
}

// =====================================================
// DEDICATED ACCOMMODATION DETAIL OVERLAY POP-UP
// =====================================================
export function openAccomDetailModal(accom) {
  const backdrop = document.getElementById('modal-backdrop');
  const heading  = document.getElementById('modal-heading');
  const content  = document.getElementById('modal-content-area');
  const deleteBtn= document.getElementById('modal-delete-btn');

  heading.textContent = '🏨 Détails de l\'hébergement';
  deleteBtn.style.display = 'none';

  const nights = accom.checkIn && accom.checkOut
    ? Math.max(0, Math.round((new Date(accom.checkOut) - new Date(accom.checkIn)) / 86400000))
    : 0;

  const mapsQuery = encodeURIComponent(accom.address || `${accom.name} ${accom.city}`);
  const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
      <!-- Top Banner with Color & Name -->
      <div style="background:${accom.color || '#e94560'};margin:-var(--sp-5) -var(--sp-5) 0 -var(--sp-5);padding:var(--sp-5);color:#fff">
        <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;margin-bottom:var(--sp-2)">${accom.city}</span>
        <h2 style="font-size:var(--fs-xl);font-weight:800;line-height:1.2;margin-top:2px">${accom.name}</h2>
        ${accom.bookingRef ? `<div style="font-size:var(--fs-xs);opacity:0.9;margin-top:4px"><i class="fa-solid fa-hashtag"></i> Réservation : ${accom.bookingRef}</div>` : ''}
      </div>

      <!-- Primary Action: Google Maps Directions Button -->
      <div>
        <a href="${mapsDirUrl}" target="_blank" class="btn btn-primary btn-lg btn-full" style="box-shadow:0 6px 20px var(--color-primary-glow)">
          <i class="fa-solid fa-map-location-dot" style="font-size:1.2rem"></i>
          Ouvrir l'itinéraire sur Google Maps
        </a>
        <div style="font-size:var(--fs-xs);color:var(--text-muted);text-align:center;margin-top:6px">
          Ouvre directement l'application Maps pour lancer la navigation
        </div>
      </div>

      <!-- Key Details Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);background:var(--bg-input);padding:var(--sp-4);border-radius:var(--r-md);border:1px solid var(--border)">
        <div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">CHECK-IN</div>
          <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-top:2px">
            <i class="fa-solid fa-calendar-check" style="color:var(--color-success);margin-right:4px"></i>
            ${fmtDate(accom.checkIn)}
          </div>
        </div>
        <div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">CHECK-OUT</div>
          <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-top:2px">
            <i class="fa-solid fa-calendar-xmark" style="color:var(--color-error);margin-right:4px"></i>
            ${fmtDate(accom.checkOut)}
          </div>
        </div>
      </div>

      <!-- Address -->
      ${accom.address ? `
        <div style="font-size:var(--fs-sm);color:var(--text-primary)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;margin-bottom:2px">ADRESSE</div>
          <i class="fa-solid fa-location-dot" style="color:var(--color-primary);margin-right:6px"></i>
          <strong>${accom.address}</strong>
        </div>
      ` : ''}

      <!-- Access / Check-in info -->
      ${accom.accessInfo ? `
        <div style="font-size:var(--fs-sm);color:var(--text-primary)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;margin-bottom:2px">ACCÈS & HORAIRES</div>
          <i class="fa-solid fa-clock" style="color:var(--color-accent);margin-right:6px"></i>
          ${accom.accessInfo}
        </div>
      ` : ''}

      <!-- Price Breakdown -->
      ${accom.pricePerNight ? `
        <div style="font-size:var(--fs-sm);color:var(--text-primary);background:var(--bg-card);padding:var(--sp-3);border-radius:var(--r-md);border:1px solid var(--border)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600">TARIF</div>
          <span class="fw-700" style="color:var(--color-primary);font-size:var(--fs-base)">${accom.pricePerNight} ${accom.currency||'EUR'}</span> / nuit
          ${nights ? ` · <strong>Total ≈ ${(accom.pricePerNight * nights).toFixed(2)} ${accom.currency||'EUR'}</strong> (${nights} nuit${nights>1?'s':''})` : ''}
        </div>
      ` : ''}

      <!-- Notes -->
      ${accom.notes ? `
        <div style="font-size:var(--fs-xs);color:var(--text-muted);background:var(--bg-input);padding:var(--sp-3);border-radius:var(--r-md)">
          <i class="fa-solid fa-note-sticky" style="margin-right:4px"></i> ${accom.notes}
        </div>
      ` : ''}
    </div>
  `;

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';

  function close() {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    cleanup();
  }

  function cleanup() {
    document.getElementById('modal-save-btn').onclick   = null;
    document.getElementById('modal-cancel-btn').onclick = null;
    document.getElementById('modal-close-btn').onclick  = null;
    backdrop.onclick  = null;
  }

  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.innerHTML = `<i class="fa-solid fa-pen"></i> Modifier`;
  saveBtn.onclick = () => {
    close();
    openModal({
      title: '✏️ Modifier l\'hébergement',
      fields: ACCOM_FIELDS,
      data: accom,
      onSave(d) {
        d.lat = d.lat ? parseFloat(d.lat) : null;
        d.lng = d.lng ? parseFloat(d.lng) : null;
        d.pricePerNight = d.pricePerNight ? parseFloat(d.pricePerNight) : null;
        updateItem(appData, 'accommodations', accom.id, d);
        rerender();
        showToast('Hébergement mis à jour !', 'success');
      },
      onDelete() {
        deleteItem(appData, 'accommodations', accom.id);
        rerender();
        showToast('Hébergement supprimé.', 'info');
      },
    });
  };

  const cancelBtn = document.getElementById('modal-cancel-btn');
  cancelBtn.textContent = 'Fermer';
  cancelBtn.onclick = close;
  document.getElementById('modal-close-btn').onclick = close;
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
}

// =====================================================
// ACCOMMODATION CARD ITEM
// =====================================================
function accomCard(a) {
  const nights = a.checkIn && a.checkOut
    ? Math.max(0, Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 86400000))
    : 0;

  return `
    <div class="accom-card" data-view-accom="${a.id}" style="cursor:pointer">
      <div class="accom-card-banner" style="background:${a.color||'#e94560'}"></div>
      <div class="accom-card-body">
        <div class="card-header">
          <div>
            <div class="accom-card-name">${a.name}</div>
            <span class="badge badge-primary">${a.city}</span>
          </div>
          <div style="display:flex;gap:var(--sp-1)">
            <button class="btn-icon btn-icon-sm" data-edit-accom="${a.id}" title="Modifier">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </div>

        <div class="accom-info-row"><i class="fa-solid fa-calendar"></i>
          ${a.checkIn?fmtDate(a.checkIn):''} → ${a.checkOut?fmtDate(a.checkOut):''}
          ${nights?` <span class="badge badge-neutral">${nights} nuit${nights>1?'s':''}</span>`:''}
        </div>

        ${a.address?`<div class="accom-info-row"><i class="fa-solid fa-location-dot"></i>${a.address}</div>`:''}
        ${a.accessInfo?`<div class="accom-info-row"><i class="fa-solid fa-clock"></i>${a.accessInfo}</div>`:''}
        ${a.bookingRef?`<div class="accom-info-row"><i class="fa-solid fa-hashtag"></i>Réf: ${a.bookingRef}</div>`:''}

        <div class="card-footer" style="margin-top:var(--sp-3);padding-top:var(--sp-3)">
          <span style="font-size:var(--fs-xs);color:var(--color-primary);font-weight:600">
            <i class="fa-solid fa-circle-info"></i> Voir détails & Itinéraire
          </span>
          <i class="fa-solid fa-chevron-right" style="font-size:0.8rem;color:var(--text-muted)"></i>
        </div>
      </div>
    </div>
  `;
}

// =====================================================
// LEAFLET MAP INITIALIZER
// =====================================================
function initMap(accommodations, activities) {
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mapInstance  = L.map('leaflet-map', { zoomControl: true, scrollWheelZoom: false });

  L.tileLayer(
    isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    { attribution: '© OSM © CARTO', maxZoom: 19 }
  ).addTo(mapInstance);

  const allMarkers = [];

  // Accommodations markers
  accommodations.forEach(a => {
    if (!a.lat || !a.lng) return;
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${a.color||'#e94560'}">🏨</div>`,
      iconSize: [36,36], iconAnchor: [18,36],
    });
    const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.address || a.name)}`;

    const m = L.marker([a.lat, a.lng], { icon })
      .addTo(mapInstance)
      .bindPopup(`
        <div class="popup-name">${a.name}</div>
        <div class="popup-detail">${a.city} · ${a.checkIn?fmtDate(a.checkIn):''} → ${a.checkOut?fmtDate(a.checkOut):''}</div>
        ${a.address?`<div class="popup-detail">📍 ${a.address}</div>`:''}
        ${a.accessInfo?`<div class="popup-detail">🔑 ${a.accessInfo}</div>`:''}
        <a class="popup-link" href="${mapsDirUrl}" target="_blank">
          <i class='fa-solid fa-map-location-dot'></i> Itinéraire Google Maps
        </a>
      `);
    allMarkers.push([a.lat, a.lng]);
  });

  // Activities markers
  activities.filter(a=>a.lat&&a.lng).forEach(a => {
    const catColors = { Culture:'#8b5cf6', Food:'#f97316', Shopping:'#ec4899', Nature:'#22c55e', Activity:'#06b6d4' };
    const color = catColors[a.category] || '#e94560';
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${color};width:28px;height:28px;font-size:0.75rem">⭐</div>`,
      iconSize: [28,28], iconAnchor: [14,28],
    });
    L.marker([a.lat, a.lng], { icon })
      .addTo(mapInstance)
      .bindPopup(`
        <div class="popup-name">${a.name}</div>
        <div class="popup-detail">${a.city} · ${a.category}</div>
        ${a.mapsUrl?`<a class="popup-link" href="${a.mapsUrl}" target="_blank"><i class='fa-solid fa-map-location-dot'></i> Google Maps</a>`:''}
      `);
    allMarkers.push([a.lat, a.lng]);
  });

  if (allMarkers.length > 0) {
    mapInstance.fitBounds(allMarkers, { padding: [36, 36], maxZoom: 12 });
  } else {
    mapInstance.setView([36.5, 136.5], 5.5);
  }
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
}

function fmtDateFull(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
}
