/* =====================================================
   APP.JS — SPA Router, Theme, App Init
   Japan Travel Dashboard
   ===================================================== */

import { loadData, saveData, pullFromCloud } from './data.js';
import { getCurrentUser, refreshCurrentUser } from './auth.js';
import { renderDashboard  } from './views/dashboard.js';
import { renderFlights    } from './views/flights.js';
import { renderMap        } from './views/map.js';
import { renderItinerary  } from './views/itinerary.js';
import { renderActivities } from './views/activities.js';
import { renderExpenses   } from './views/expenses.js';
import { renderDocuments  } from './views/documents.js';

const APP_BUILD = '2026.07.23-1';

// =====================================================
// APP STATE
// =====================================================
let currentView = 'dashboard';
export let appData = loadData();
export let currentUser = getCurrentUser();

export function refreshData() {
  appData = loadData();
}

export async function refreshUser() {
  currentUser = await refreshCurrentUser();
  return currentUser;
}

// =====================================================
// VIEW REGISTRY
// =====================================================
const VIEW_TITLES = {
  dashboard:  'Dashboard',
  flights:    'Transports',
  map:        'Carte',
  itinerary:  'Planning',
  activities: 'Activités',
  expenses:   'Budget',
  documents:  'Documents',
};

const VIEW_RENDERERS = {
  dashboard:  renderDashboard,
  flights:    renderFlights,
  map:        renderMap,
  itinerary:  renderItinerary,
  activities: renderActivities,
  expenses:   renderExpenses,
  documents:  renderDocuments,
};

function updateVersionBadge() {
  const versionBadge = document.getElementById('app-version-badge');
  if (versionBadge) {
    versionBadge.textContent = `Build ${APP_BUILD}`;
  }
}

// =====================================================
// ROUTER
// =====================================================
function navigateTo(view) {
  if (!VIEW_RENDERERS[view]) view = 'dashboard';
  currentView = view;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Update header
  document.getElementById('header-view-name').textContent  = VIEW_TITLES[view] || view;
  document.getElementById('header-trip-name').textContent  = appData.trip?.name || 'Voyage Japon';

  // Render view
  const container = document.getElementById('view-container');
  container.innerHTML = '';
  container.className = 'view-container view-enter';

  VIEW_RENDERERS[view](container);

  // Scroll to top
  container.scrollTop = 0;
  window.scrollTo(0, 0);
}

// =====================================================
// THEME MANAGEMENT
// =====================================================
function initTheme() {
  const saved = localStorage.getItem('voyage_theme') || 'dark';
  applyTheme(saved);

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('voyage_theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

// =====================================================
// NAVIGATION EVENTS
// =====================================================
function initNav() {
  document.getElementById('bottom-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) navigateTo(btn.dataset.view);
  });
}

// =====================================================
// GLOBAL DATA UPDATE HELPER
// (call this from views after any mutation)
// =====================================================
export function commitData() {
  appData = JSON.parse(JSON.stringify(appData));
  saveData(appData);
}

export function rerender() {
  navigateTo(currentView);
}

let appBooted = false;

async function bootApp() {
  if (appBooted) return;
  appBooted = true;

  // 1. Vérifier la session utilisateur
  const user = await refreshUser();
  if (!user) {
    const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/api/auth/google/login?returnTo=${returnTo}`;
    return;
  }

  updateVersionBadge();
  initTheme();
  initNav();

  // 2. Afficher un loader pendant la sync cloud initiale
  showSyncLoader();

  try {
    // 3. Pull cloud EN PREMIER, avant le rendu initial
    const cloudData = await pullFromCloud();
    if (cloudData) {
      Object.assign(appData, cloudData);
      // persistWorkspace() est déjà appelé dans pullFromCloud()
    }
  } catch (e) {
    console.warn('[boot] Initial cloud sync failed:', e);
    // Continuer avec les données locales si le cloud est inaccessible
  } finally {
    hideSyncLoader();
  }

  // 4. Rendu final avec les données fraîches (cloud ou local)
  navigateTo('dashboard');

  // 5. Re-sync automatique quand l'utilisateur revient sur l'onglet
  setupVisibilitySync();
}

/** Affiche un overlay de chargement pendant la sync cloud initiale */
function showSyncLoader() {
  if (document.getElementById('sync-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'sync-loader';
  loader.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:9999',
    'background:var(--bg-primary,#0f172a)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'flex-direction:column',
    'gap:14px',
    'font-family:inherit',
    'color:var(--text-secondary,#94a3b8)',
    'font-size:14px',
    'transition:opacity 0.3s',
  ].join(';');
  loader.innerHTML = `
    <div style="
      width:36px;height:36px;
      border:3px solid rgba(255,255,255,0.08);
      border-top-color:#6366f1;
      border-radius:50%;
      animation:_spin 0.75s linear infinite;
    "></div>
    <span>Synchronisation en cours…</span>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(loader);
}

/** Masque et supprime l'overlay de chargement */
function hideSyncLoader() {
  const loader = document.getElementById('sync-loader');
  if (!loader) return;
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 300);
}

/** Re-sync en arrière-plan quand l'utilisateur revient sur l'onglet */
function setupVisibilitySync() {
  let lastSyncAt = Date.now();
  const MIN_SYNC_INTERVAL_MS = 30_000; // 30 secondes minimum entre deux syncs automatiques

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;

    const now = Date.now();
    if (now - lastSyncAt < MIN_SYNC_INTERVAL_MS) return;
    lastSyncAt = now;

    try {
      const cloudData = await pullFromCloud();
      if (cloudData) {
        const prevJson = JSON.stringify(appData);
        Object.assign(appData, cloudData);
        // Re-render seulement si les données ont réellement changé
        if (JSON.stringify(appData) !== prevJson) {
          console.info('[sync] Nouvelles données cloud détectées → mise à jour de l\'affichage');
          rerender();
        }
      }
    } catch (e) {
      // Silencieux — ne pas perturber l'utilisateur avec une erreur de sync en arrière-plan
    }
  });
}

// =====================================================
// APP INIT
// =====================================================
async function init() {
  updateVersionBadge();
  await bootApp();
}

document.addEventListener('DOMContentLoaded', init);

updateVersionBadge();
