/* =====================================================
   DASHBOARD.JS — Home View
   ===================================================== */
import { appData, commitData, currentUser, refreshData, rerender } from '../app.js';
import { openModal, openConfirm, showToast } from '../utils/modal.js';
import {
  createProject,
  deleteProject,
  getActiveProjectId,
  getProjects,
  pullFromCloud,
  pushToCloud,
  renameProject,
  resetData,
  saveData,
  setActiveProject,
} from '../data.js';
import { logout } from '../auth.js';

export function renderDashboard(container) {
  const data     = appData;
  const trip     = data.trip     || {};
  const settings = data.settings || {};
  const projects = getProjects();
  const activeProjectId = getActiveProjectId();

  // Countdown
  const today     = new Date();
  today.setHours(0,0,0,0);
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end   = trip.endDate   ? new Date(trip.endDate)   : null;

  let countdownHtml = '';
  if (start) {
    const diff = Math.ceil((start - today) / 86400000);
    if (diff > 0) {
      countdownHtml = `
        <div class="countdown-widget" id="countdown-widget">
          <div style="font-size:var(--fs-sm);color:rgba(255,255,255,0.75);font-weight:500;margin-bottom:0.25rem;">DÉPART DANS</div>
          <div class="countdown-number">${diff}</div>
          <div class="countdown-label">jour${diff>1?'s':''} — ${formatDate(trip.startDate)}</div>
        </div>
      `;
    } else if (end && today <= end) {
      const dayNum = Math.ceil((today - start) / 86400000) + 1;
      const totalDays = Math.ceil((end - start) / 86400000) + 1;
      countdownHtml = `
        <div class="countdown-widget" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
          <div style="font-size:var(--fs-sm);color:rgba(255,255,255,0.8);font-weight:500;">EN VOYAGE 🇯🇵</div>
          <div class="countdown-number">J+${dayNum}</div>
          <div class="countdown-label">Jour ${dayNum} sur ${totalDays}</div>
        </div>
      `;
    } else {
      countdownHtml = `
        <div class="countdown-widget" style="background:linear-gradient(135deg,#475569,#334155)">
          <div style="font-size:var(--fs-sm);color:rgba(255,255,255,0.8);">VOYAGE TERMINÉ</div>
          <div class="countdown-number">🎌</div>
          <div class="countdown-label">Itadakimashita !</div>
        </div>
      `;
    }
  }

  // Stats
  const totalActivities = (data.activities||[]).length;
  const doneActivities  = (data.activities||[]).filter(a=>a.status==='done').length;
  const totalExpenses   = (data.expenses||[]).reduce((s,e) => {
    const eur = e.currency==='JPY' ? e.amount/(settings.jpyRate||162.5) : e.amount;
    return s + eur;
  }, 0);
  const budget = settings.budget || 4000;
  const totalNights = (data.accommodations||[]).reduce((s,a) => {
    if (!a.checkIn||!a.checkOut) return s;
    return s + Math.max(0, Math.ceil((new Date(a.checkOut)-new Date(a.checkIn))/86400000));
  },0);

  // Today's city + events
  const todayStr = today.toISOString().slice(0,10);
  const todayDay = (data.itinerary||[]).find(d=>d.date===todayStr);

  // Next flight
  const nextFlight = (data.flights||[]).find(f => {
    const d = new Date(f.departure); return d >= today;
  });

  container.innerHTML = `
    <div class="view-enter">
      <!-- Trip title + edit -->
      <div class="view-hd" style="margin-bottom:var(--sp-4)">
        <div class="view-hd-left">
          <div class="view-hd-title">${trip.name||'Mon Voyage'}</div>
          <div class="view-hd-sub">${trip.startDate ? formatDate(trip.startDate) : ''}${trip.endDate?' → '+formatDate(trip.endDate):''}</div>
        </div>
        <div style="display:flex;gap:var(--sp-2)">
          <button class="btn btn-ghost btn-sm" id="save-project-btn" title="Sauvegarder immédiatement"><i class="fa-solid fa-floppy-disk"></i> Sauver</button>
          <button class="btn btn-ghost btn-sm" id="edit-trip-btn"><i class="fa-solid fa-pen"></i> Modifier</button>
          <button class="btn btn-ghost btn-sm" id="reset-data-btn" title="Recharger les données par défaut"><i class="fa-solid fa-rotate"></i> Reset</button>
        </div>
      </div>

      <!-- Account + Projects -->
      <div class="card" style="margin-bottom:var(--sp-4);padding:var(--sp-3) var(--sp-4);background:linear-gradient(135deg, rgba(59,130,246,0.1), rgba(34,197,94,0.1));border:1px solid rgba(59,130,246,0.25);display:flex;flex-direction:column;gap:0.7rem;align-items:stretch">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.7rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:0.7rem;flex-wrap:wrap;min-width:0">
            <span style="font-size:1.2rem;color:var(--color-info)">👤</span>
            <div style="min-width:0">
              <div style="font-size:var(--fs-xs);font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${currentUser?.name || 'Compte Google'}</div>
              <div style="font-size:0.68rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${currentUser?.email || ''}</div>
            </div>
          </div>
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" id="cloud-sync-btn" style="color:var(--color-info);border:1px solid rgba(59,130,246,0.3)">
              <i class="fa-solid fa-cloud-arrow-up"></i> Sync
            </button>
            <button class="btn btn-ghost btn-sm" id="logout-btn">
              <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
            </button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;flex:1;min-width:0">
            <select id="project-select" class="input" style="height:32px;padding:0 0.5rem;min-width:0;flex:1;max-width:220px">
              ${projects.map((project) => `<option value="${project.id}" ${project.id === activeProjectId ? 'selected' : ''}>${project.name}</option>`).join('')}
            </select>
            <button class="btn btn-ghost btn-sm" id="add-project-btn" title="Créer un projet"><i class="fa-solid fa-plus"></i></button>
            <button class="btn btn-ghost btn-sm" id="rename-project-btn" title="Renommer le projet"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-ghost btn-sm" id="delete-project-btn" title="Supprimer le projet"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>

      <!-- Countdown -->
      ${countdownHtml}

      <!-- Stats grid -->
      <div class="dashboard-stats" style="margin-top:var(--sp-5)">
        <div class="stat-card">
          <div class="stat-card-icon" style="background:var(--color-primary-glow);color:var(--color-primary)">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-card-value">${doneActivities}/${totalActivities}</div>
          <div class="stat-card-label">Activités</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon" style="background:var(--color-accent-glow);color:var(--color-accent)">
            <i class="fa-solid fa-yen-sign"></i>
          </div>
          <div class="stat-card-value">${Math.round(totalExpenses)}€</div>
          <div class="stat-card-label">Dépensé</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon" style="background:var(--color-success-bg);color:var(--color-success)">
            <i class="fa-solid fa-moon"></i>
          </div>
          <div class="stat-card-value">${totalNights}</div>
          <div class="stat-card-label">Nuits</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon" style="background:var(--color-info-bg);color:var(--color-info)">
            <i class="fa-solid fa-plane"></i>
          </div>
          <div class="stat-card-value">${(data.flights||[]).length}</div>
          <div class="stat-card-label">Vols</div>
        </div>
      </div>

      <!-- Budget bar -->
      <div class="card" style="margin-top:var(--sp-4)">
        <div class="card-header">
          <span class="card-title">💰 Budget</span>
          <span class="fw-700" style="color:var(--color-primary)">${Math.round(totalExpenses)}€ / ${budget}€</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.min(100,Math.round(totalExpenses/budget*100))}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:0.35rem;">
          <span class="text-muted fs-xs">${Math.round(totalExpenses/budget*100)}% utilisé</span>
          <span class="fs-xs" style="color:var(--color-success)">${budget-Math.round(totalExpenses)}€ restant</span>
        </div>
      </div>

      <!-- Today section -->
      ${todayDay ? `
        <div class="today-card" style="margin-top:var(--sp-5)">
          <div class="today-card-banner">
            <span class="today-city-emoji">${todayDay.emoji||'📅'}</span>
            <div>
              <div style="font-weight:700;color:var(--text-primary);font-size:var(--fs-base)">${todayDay.city||'Aujourd\'hui'}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">Aujourd\'hui · ${formatDate(todayDay.date)}</div>
            </div>
          </div>
          <div class="today-card-body">
            ${(todayDay.events||[]).map(ev=>`
              <div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid var(--border)">
                <span style="font-size:var(--fs-xs);font-weight:600;color:var(--color-primary);min-width:40px;padding-top:2px">${ev.time||''}</span>
                <div style="flex:1">
                  <div style="font-size:var(--fs-sm);font-weight:600;color:var(--text-primary)">${ev.title}</div>
                  ${ev.notes?`<div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px">${ev.notes}</div>`:''}
                </div>
                ${ev.mapsUrl?`<a href="${ev.mapsUrl}" target="_blank" style="color:var(--color-primary);font-size:0.8rem" title="Maps"><i class="fa-solid fa-map-pin"></i></a>`:''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="card" style="margin-top:var(--sp-5);text-align:center;padding:var(--sp-6)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-2)">📅</div>
          <div style="font-size:var(--fs-sm);color:var(--text-muted)">Aucun événement prévu aujourd\'hui.<br>Ajoutez-en dans la section Planning !</div>
        </div>
      `}

      <!-- Next flight -->
      ${nextFlight ? `
        <div class="card" style="margin-top:var(--sp-4)">
          <div class="card-header">
            <span class="card-title">✈️ Prochain vol</span>
            <span class="badge badge-success">${nextFlight.status||'confirmé'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-2)">
            <div style="text-align:center;flex:1">
              <div style="font-size:var(--fs-xl);font-weight:800;color:var(--text-primary)">${nextFlight.fromAirport}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${nextFlight.fromCity}</div>
            </div>
            <div style="flex:2;text-align:center;color:var(--text-muted);font-size:var(--fs-sm)">
              <i class="fa-solid fa-plane" style="color:var(--color-primary)"></i><br>
              <span class="fs-xs">${nextFlight.flightNumber}</span>
            </div>
            <div style="text-align:center;flex:1">
              <div style="font-size:var(--fs-xl);font-weight:800;color:var(--text-primary)">${nextFlight.toAirport}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${nextFlight.toCity}</div>
            </div>
          </div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-2);text-align:center">${formatDateTime(nextFlight.departure)}</div>
        </div>
      ` : ''}

      <!-- Cities quick nav -->
      <div style="margin-top:var(--sp-5)">
        <div style="font-size:var(--fs-sm);font-weight:700;color:var(--text-primary);margin-bottom:var(--sp-3)">🌏 Villes du voyage</div>
        <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">
          ${(data.cities||[]).map(c=>`<span class="badge badge-primary" style="font-size:var(--fs-sm);padding:0.35rem 0.85rem">${c}</span>`).join('')}
          <button class="btn btn-ghost btn-sm" id="edit-cities-btn"><i class="fa-solid fa-plus"></i> Gérer</button>
        </div>
      </div>
    </div>
  `;

  // Edit trip modal
  document.getElementById('edit-trip-btn').addEventListener('click', () => {
    openModal({
      title: '✏️ Paramètres du voyage',
      fields: [
        { key: 'name',      label: 'Nom du voyage',  type: 'text',   required: true,  placeholder: 'Voyage Japon 2026' },
        { key: 'startDate', label: 'Date de départ', type: 'date',   required: true,  row: true },
        { key: 'endDate',   label: 'Date de retour', type: 'date',   required: true,  row: true },
        { key: 'budget',    label: 'Budget total (€)', type: 'number', required: false, placeholder: '4000', row: true },
        { key: 'jpyRate',   label: 'Taux JPY/EUR',   type: 'number', required: false, placeholder: '162.5', hint: '1 EUR = X JPY', step: 0.1, row: true },
      ],
      data: { ...trip, budget: settings.budget, jpyRate: settings.jpyRate },
      onSave(d) {
        appData.trip = { ...trip, name: d.name, startDate: d.startDate, endDate: d.endDate };
        appData.settings = { ...settings, budget: d.budget||4000, jpyRate: d.jpyRate||162.5 };
        commitData();
        rerender();
        showToast('Voyage mis à jour !', 'success');
      },
    });
  });

  // Manage cities
  document.getElementById('edit-cities-btn').addEventListener('click', () => {
    const citiesStr = (data.cities||[]).join(', ');
    openModal({
      title: '🌏 Gérer les villes',
      fields: [
        { key: 'cities', label: 'Villes (séparées par des virgules)', type: 'text', required: true, placeholder: 'Tokyo, Kyoto, Osaka, Nara', hint: 'Exemple : Tokyo, Hakone, Kyoto, Nara, Osaka' },
      ],
      data: { cities: citiesStr },
      onSave(d) {
        appData.cities = d.cities.split(',').map(c=>c.trim()).filter(Boolean);
        commitData();
        rerender();
        showToast('Villes mises à jour !', 'success');
      },
    });
  });

  document.getElementById('save-project-btn')?.addEventListener('click', () => {
    commitData();
    showToast('Projet sauvegardé.', 'success');
  });

  // Reset data button
  document.getElementById('reset-data-btn')?.addEventListener('click', async () => {
    const ok = await openConfirm('Réinitialiser toutes les données avec vos vrais hébergements et dates ?', 'Réinitialisation');
    if (ok) {
      const fresh = resetData();
      Object.assign(appData, fresh);
      rerender();
      showToast('Données réinitialisées avec succès ! 🇯🇵', 'success');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logout();
  });

  document.getElementById('project-select')?.addEventListener('change', (event) => {
    const projectId = event.target.value;
    setActiveProject(projectId);
    refreshData();
    rerender();
    showToast('Projet chargé.', 'success');
  });

  document.getElementById('add-project-btn')?.addEventListener('click', () => {
    openModal({
      title: '➕ Nouveau projet',
      fields: [
        { key: 'name', label: 'Nom du projet', type: 'text', required: true, placeholder: 'Voyage Corée 2027' },
      ],
      data: { name: 'Nouveau projet' },
      onSave(formData) {
        const projectName = (formData.name || '').trim() || 'Nouveau projet';
        createProject(projectName);
        refreshData();
        rerender();
        showToast('Projet créé.', 'success');
      },
    });
  });

  document.getElementById('rename-project-btn')?.addEventListener('click', () => {
    const active = getProjects().find((project) => project.id === getActiveProjectId());
    if (!active) return;

    openModal({
      title: '✏️ Renommer le projet',
      fields: [
        { key: 'name', label: 'Nom du projet', type: 'text', required: true },
      ],
      data: { name: active.name },
      onSave(formData) {
        renameProject(active.id, formData.name);
        refreshData();
        rerender();
        showToast('Projet renommé.', 'success');
      },
    });
  });

  document.getElementById('delete-project-btn')?.addEventListener('click', async () => {
    const active = getProjects().find((project) => project.id === getActiveProjectId());
    if (!active) return;
    if (getProjects().length <= 1) {
      showToast('Vous devez conserver au moins un projet.', 'warning');
      return;
    }

    const ok = await openConfirm(`Supprimer le projet "${active.name}" ?`, 'Suppression');
    if (!ok) return;
    deleteProject(active.id);
    refreshData();
    rerender();
    showToast('Projet supprimé.', 'success');
  });

  // Cloud Sync button
  document.getElementById('cloud-sync-btn')?.addEventListener('click', () => {
    showToast('Synchronisation en cours...', 'info');
    pushToCloud(appData)
      .then(() => pullFromCloud())
      .then((cloudData) => {
        if (cloudData && cloudData.trip) {
          Object.assign(appData, cloudData);
          saveData(appData);
          rerender();
        }
        showToast('Synchronisation terminée ☁️', 'success');
      })
      .catch(() => {
        showToast('Échec de la synchronisation cloud.', 'error');
      });
  });
}

// ---- Helpers ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDateTime(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) + ' · ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
