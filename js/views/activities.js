/* =====================================================
   ACTIVITIES.JS — Activities per City (Full CRUD)
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

const CATEGORIES = ['Culture','Food','Shopping','Nature','Activity'];
const STATUS_CYCLE = { todo:'done', done:'optional', optional:'todo' };
const STATUS_FR    = { todo:'\u00c0 faire', done:'Fait \u2713', optional:'Optionnel' };
const STATUS_CLS   = { todo:'status-todo', done:'status-done', optional:'status-optional' };
const CAT_BADGE    = {
  Culture:'badge-culture', Food:'badge-food', Shopping:'badge-shopping',
  Nature:'badge-nature',   Activity:'badge-activity'
};
const CAT_EMOJI = { Culture:'\u26e9\ufe0f', Food:'\ud83c\udf7c', Shopping:'\ud83d\udecd\ufe0f', Nature:'\ud83c\udf3f', Activity:'\ud83c\udfaf' };

const ACT_FIELDS = [
  { key:'name',          label:'Nom',               type:'text',   required:true,  placeholder:'Senso-ji Temple' },
  { key:'city',          label:'Ville',              type:'text',   required:true,  placeholder:'Tokyo', row:true },
  { key:'category',      label:'Catégorie',          type:'select', required:true,  options:CATEGORIES, row:true },
  { key:'status',        label:'Statut',             type:'select', required:true,  options:[
    {value:'todo',label:'\u00c0 faire'},{value:'done',label:'Fait'},{value:'optional',label:'Optionnel'}
  ] },
  { key:'priority',      label:'Priorité',           type:'select', required:false, options:[
    {value:'must',label:'\u26a0\ufe0f Incontournable'},{value:'should',label:'\ud83d\udfe1 Recommandé'},{value:'optional',label:'\u26aa Optionnel'}
  ] },
  { key:'estimatedCost', label:'Coût estimé (JPY)',  type:'number', required:false, placeholder:'0', row:true },
  { key:'address',       label:'Adresse',            type:'text',   required:false, placeholder:'2-3-1 Asakusa, Taito' },
  { key:'mapsUrl',       label:'Lien Google Maps',   type:'url',    required:false, placeholder:'https://maps.google.com/...' },
  { key:'notes',         label:'Notes',              type:'textarea', required:false, placeholder:'Infos pratiques...' },
];

let activeCity   = null;
let activeFilter = 'all';

export function renderActivities(container) {
  const data       = appData;
  const activities = data.activities || [];
  const cities     = [...new Set(activities.map(a=>a.city))].filter(Boolean);
  const allCities  = [...new Set([...(data.cities||[]), ...cities])];

  if (!activeCity || !allCities.includes(activeCity)) {
    activeCity = allCities[0] || null;
  }

  const filtered = activities.filter(a => {
    if (activeCity && a.city !== activeCity) return false;
    if (activeFilter !== 'all' && a.category !== activeFilter) return false;
    return true;
  });

  const doneCount  = filtered.filter(a=>a.status==='done').length;
  const totalCount = filtered.length;

  container.innerHTML = `
    <div class="view-enter">
      <div class="view-hd">
        <div><div class="view-hd-title">⭐ Activités</div><div class="view-hd-sub">${doneCount}/${totalCount} effectuée(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-act-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <!-- City tabs -->
      <div class="tabs" id="city-tabs" style="margin-bottom:var(--sp-3)">
        ${allCities.map(c=>`<button class="tab ${c===activeCity?'active':''}" data-city="${c}">${c}</button>`).join('')}
      </div>

      <!-- Category filters -->
      <div class="filter-row" id="cat-filters" style="margin-bottom:var(--sp-4)">
        <button class="filter-pill ${activeFilter==='all'?'active':''}" data-filter="all">🌏 Tout</button>
        ${CATEGORIES.map(c=>`<button class="filter-pill ${activeFilter===c?'active':''}" data-filter="${c}">${CAT_EMOJI[c]||''} ${c}</button>`).join('')}
      </div>

      <!-- Progress bar -->
      ${totalCount > 0 ? `
        <div style="margin-bottom:var(--sp-4)">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
            <span class="fs-xs fw-600" style="color:var(--text-muted)">${activeCity||'Toutes les villes'}</span>
            <span class="fs-xs fw-600" style="color:var(--color-success)">${doneCount}/${totalCount}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(doneCount/totalCount*100)}%"></div></div>
        </div>
      ` : ''}

      <!-- Activities list -->
      <div class="card-list" id="activities-list">
        ${filtered.length ? filtered.map(actCard).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">⭐</div>
            <div class="empty-state-title">Aucune activité</div>
            <div class="empty-state-text">Ajoutez des lieux à visiter pour ${activeCity||'cette ville'}.</div>
          </div>
        `}
      </div>
    </div>
  `;

  // ---- Event listeners ----

  // City tabs
  document.getElementById('city-tabs').addEventListener('click', e => {
    const t = e.target.closest('[data-city]');
    if (t) { activeCity = t.dataset.city; rerender(); }
  });

  // Category filters
  document.getElementById('cat-filters').addEventListener('click', e => {
    const t = e.target.closest('[data-filter]');
    if (t) { activeFilter = t.dataset.filter; rerender(); }
  });

  // Add activity
  document.getElementById('add-act-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouvelle activité',
      fields: ACT_FIELDS,
      data: { city: activeCity||'', status:'todo', priority:'should', category:'Culture', estimatedCost:0 },
      onSave(d) {
        addItem(appData, 'activities', d);
        rerender();
        showToast('Activité ajoutée !', 'success');
      },
    });
  });

  // Activity list delegation
  document.getElementById('activities-list').addEventListener('click', e => {
    // Toggle status
    const statusBtn = e.target.closest('[data-toggle-status]');
    if (statusBtn) {
      const id = statusBtn.dataset.toggleStatus;
      const a  = (appData.activities||[]).find(x=>x.id===id);
      if (a) {
        updateItem(appData, 'activities', id, { status: STATUS_CYCLE[a.status]||'todo' });
        rerender();
        showToast('Statut mis à jour !', 'success');
      }
      return;
    }
    // Edit
    const editBtn = e.target.closest('[data-edit-act]');
    if (editBtn) {
      const id = editBtn.dataset.editAct;
      const a  = (appData.activities||[]).find(x=>x.id===id);
      if (!a) return;
      openModal({
        title: '✏️ Modifier l\'activité',
        fields: ACT_FIELDS,
        data: a,
        onSave(d) {
          updateItem(appData, 'activities', id, d);
          rerender();
          showToast('Activité mise à jour !', 'success');
        },
        onDelete() {
          deleteItem(appData, 'activities', id);
          rerender();
          showToast('Activité supprimée.', 'info');
        },
      });
    }
    // Open maps
    const mapsBtn = e.target.closest('[data-maps-url]');
    if (mapsBtn) {
      window.open(mapsBtn.dataset.mapsUrl, '_blank');
    }
  });
}

function actCard(a) {
  const statusIcon = { todo:'', done:'<i class="fa-solid fa-check"></i>', optional:'<i class="fa-solid fa-minus"></i>' };
  return `
    <div class="activity-card ${a.status==='done'?'activity-done':''}">
      <button class="activity-status-btn ${a.status}" data-toggle-status="${a.id}" title="Changer le statut">
        ${statusIcon[a.status]||''}
      </button>
      <div class="activity-info">
        <div class="activity-name">${a.name}</div>
        <div class="activity-meta">
          <span class="badge ${CAT_BADGE[a.category]||'badge-neutral'}">${CAT_EMOJI[a.category]||''} ${a.category}</span>
          <span class="badge ${STATUS_CLS[a.status]||'status-todo'}">${STATUS_FR[a.status]||a.status}</span>
          ${a.estimatedCost?`<span class="fs-xs text-muted">${a.estimatedCost.toLocaleString()}¥</span>`:''}
        </div>
        ${a.notes?`<div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">${a.notes}</div>`:''}
      </div>
      <div style="display:flex;gap:var(--sp-1);flex-shrink:0">
        ${a.mapsUrl?`<button class="btn-icon btn-icon-sm" data-maps-url="${a.mapsUrl}" title="Google Maps" style="color:var(--color-primary)"><i class="fa-solid fa-map-location-dot"></i></button>`:''}
        <button class="btn-icon btn-icon-sm" data-edit-act="${a.id}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
      </div>
    </div>
  `;
}
