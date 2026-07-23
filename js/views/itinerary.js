/* =====================================================
   ITINERARY.JS — Day-by-day Planning (Full CRUD)
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, openConfirm, showToast } from '../utils/modal.js';
import { addItineraryEvent, updateItineraryEvent, deleteItineraryEvent,
         updateItineraryDay, deleteItineraryDay, genId, saveData } from '../data.js';

const EVENT_TYPES = [
  {value:'transport', label:'🚌 Transport'},
  {value:'activity',  label:'🎯 Activité'},
  {value:'food',      label:'🍽️ Repas'},
  {value:'accom',     label:'🏨 Hébergement'},
  {value:'other',     label:'📅 Autre'},
];
const EVENT_ICONS = { transport:'🚌', activity:'🎯', food:'🍽️', accom:'🏨', other:'📅' };

const DAY_FIELDS = [
  { key:'date',  label:'Date',  type:'date', required:true },
  { key:'city',  label:'Ville', type:'text', required:false, placeholder:'Tokyo', row:true },
  { key:'emoji', label:'Émoji', type:'text', required:false, placeholder:'📅',   row:true },
];
const EVENT_FIELDS = [
  { key:'time',    label:'Heure',   type:'time',     required:true,  row:true },
  { key:'title',   label:'Titre',   type:'text',     required:true,  placeholder:'Visite du temple', row:true },
  { key:'type',    label:'Type',    type:'select',   required:true,  options:EVENT_TYPES },
  { key:'notes',   label:'Notes',   type:'textarea', required:false, placeholder:'Détails...' },
  { key:'mapsUrl', label:'Google Maps (lien)', type:'url', required:false, placeholder:'https://maps.google.com/...' },
];

let selectedDate = null;

export function renderItinerary(container) {
  const data      = appData;
  const itinerary = (data.itinerary||[]).sort((a,b)=>a.date.localeCompare(b.date));
  const todayStr  = new Date().toISOString().slice(0,10);

  if (!selectedDate || !itinerary.find(d=>d.date===selectedDate)) {
    selectedDate = itinerary.find(d=>d.date===todayStr)?.date || itinerary[0]?.date || null;
  }
  const currentDay = itinerary.find(d=>d.date===selectedDate);

  container.innerHTML = `
    <div class="view-enter">
      <div class="view-hd">
        <div><div class="view-hd-title">📅 Planning</div><div class="view-hd-sub">${itinerary.length} jour(s) programmé(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-day-btn"><i class="fa-solid fa-plus"></i> Jour</button>
      </div>

      <!-- Day selector chips -->
      <div class="day-selector" id="day-selector">
        ${itinerary.map(d => {
          const dd = new Date(d.date+'T00:00:00');
          const isToday = d.date===todayStr;
          return `
            <div class="day-chip ${d.date===selectedDate?'active':''}" data-day="${d.date}">
              <span class="day-chip-day">${dd.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3).toUpperCase()}</span>
              <span class="day-chip-num">${dd.getDate()}</span>
              ${isToday?'<span class="day-chip-today-dot"></span>':''}
            </div>
          `;
        }).join('')}
        <div class="day-chip" id="new-day-chip" style="border-style:dashed;color:var(--text-muted)">
          <span style="font-size:1.3rem">+</span>
        </div>
      </div>

      <!-- Day detail panel -->
      ${currentDay ? `
        <div class="card" style="margin-bottom:var(--sp-4)">
          <div class="card-header">
            <div style="display:flex;align-items:center;gap:0.6rem">
              <span style="font-size:1.6rem">${currentDay.emoji||'📅'}</span>
              <div>
                <div style="font-weight:700;color:var(--text-primary)">${currentDay.city||'Jour'} &mdash; ${fmtDate(currentDay.date)}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">${(currentDay.events||[]).length} événement(s)</div>
              </div>
            </div>
            <div style="display:flex;gap:var(--sp-1)">
              <button class="btn-icon btn-icon-sm" id="edit-day-btn" title="Modifier le jour"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon btn-icon-sm" id="delete-day-btn" style="color:var(--color-error)" title="Supprimer le jour"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline" id="events-timeline">
          ${(currentDay.events||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(ev=>`
            <div class="timeline-item">
              <div class="timeline-side">
                <div class="timeline-dot dot-${ev.type||'other'}"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-body">
                <div class="card" style="padding:var(--sp-3) var(--sp-4)">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem">
                    <div style="flex:1;min-width:0">
                      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
                        <span style="font-size:var(--fs-xs);font-weight:700;color:var(--color-primary);min-width:42px">${ev.time||''}</span>
                        <span style="font-size:0.9rem">${EVENT_ICONS[ev.type]||'📅'}</span>
                        <span style="font-size:var(--fs-sm);font-weight:600;color:var(--text-primary)">${ev.title}</span>
                      </div>
                      ${ev.notes?`<p style="font-size:var(--fs-xs);color:var(--text-muted);margin-left:2.4rem;line-height:1.5">${ev.notes}</p>`:''}
                    </div>
                    <div style="display:flex;align-items:center;gap:0.3rem;flex-shrink:0">
                      ${ev.mapsUrl?`<a href="${ev.mapsUrl}" target="_blank" class="btn-icon btn-icon-sm" style="color:var(--color-primary);border:1px solid var(--border)" title="Google Maps"><i class="fa-solid fa-map-location-dot"></i></a>`:''}
                      <button class="btn-icon btn-icon-sm" data-edit-event="${ev.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-ghost btn-full" style="margin-top:var(--sp-3)" id="add-event-btn">
          <i class="fa-solid fa-plus"></i> Ajouter un événement
        </button>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Aucun jour sélectionné</div>
          <div class="empty-state-text">Ajoutez votre premier jour de voyage ci-dessus.</div>
        </div>
      `}
    </div>
  `;

  // Day selector
  document.getElementById('day-selector').addEventListener('click', e => {
    const chip = e.target.closest('[data-day]');
    if (chip) { selectedDate = chip.dataset.day; rerender(); return; }
    if (e.target.closest('#new-day-chip')) document.getElementById('add-day-btn').click();
  });

  // Add day
  document.getElementById('add-day-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouveau jour',
      fields: DAY_FIELDS,
      data: { date: todayStr, emoji: '📅' },
      onSave(d) {
        if (!appData.itinerary.find(x=>x.date===d.date)) {
          if (!appData.itinerary) appData.itinerary = [];
          appData.itinerary.push({ date:d.date, city:d.city||'', emoji:d.emoji||'📅', events:[] });
          appData.itinerary.sort((a,b)=>a.date.localeCompare(b.date));
          saveData(appData);
        }
        selectedDate = d.date;
        rerender();
        showToast('Jour ajouté !', 'success');
      },
    });
  });

  if (!currentDay) return;

  // Edit day
  document.getElementById('edit-day-btn').addEventListener('click', () => {
    openModal({
      title: '✏️ Modifier le jour',
      fields: DAY_FIELDS,
      data: currentDay,
      onSave(d) {
        updateItineraryDay(appData, selectedDate, { city:d.city, emoji:d.emoji });
        if (d.date !== selectedDate) {
          const day = appData.itinerary.find(x=>x.date===selectedDate);
          if (day) { day.date = d.date; selectedDate = d.date; }
          appData.itinerary.sort((a,b)=>a.date.localeCompare(b.date));
          saveData(appData);
        }
        rerender();
        showToast('Jour mis à jour !', 'success');
      },
    });
  });

  // Delete day
  document.getElementById('delete-day-btn').addEventListener('click', async () => {
    const ok = await openConfirm('Supprimer ce jour et tous ses événements ?');
    if (ok) {
      deleteItineraryDay(appData, selectedDate);
      selectedDate = null;
      rerender();
      showToast('Jour supprimé.', 'info');
    }
  });

  // Add event
  document.getElementById('add-event-btn')?.addEventListener('click', () => {
    openModal({
      title: '➕ Nouvel événement',
      fields: EVENT_FIELDS,
      data: { type:'activity' },
      onSave(d) {
        d.id = genId('evt');
        addItineraryEvent(appData, selectedDate, d);
        rerender();
        showToast('Événement ajouté !', 'success');
      },
    });
  });

  // Edit/delete event
  document.getElementById('events-timeline')?.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-event]');
    if (!editBtn) return;
    const evId = editBtn.dataset.editEvent;
    const ev   = (currentDay.events||[]).find(x=>x.id===evId);
    if (!ev) return;
    openModal({
      title: '✏️ Modifier l\'événement',
      fields: EVENT_FIELDS,
      data: ev,
      onSave(d) {
        updateItineraryEvent(appData, selectedDate, evId, d);
        rerender();
        showToast('Événement mis à jour !', 'success');
      },
      onDelete() {
        deleteItineraryEvent(appData, selectedDate, evId);
        rerender();
        showToast('Événement supprimé.', 'info');
      },
    });
  });
}

function fmtDate(s) {
  return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'});
}
