/* =====================================================
   APP.JS — SPA Router, Theme, App Init
   Japan Travel Dashboard
   ===================================================== */

import { loadData, saveData, pullFromCloud, pushToCloud } from './data.js';
import { renderDashboard  } from './views/dashboard.js';
import { renderFlights    } from './views/flights.js';
import { renderMap        } from './views/map.js';
import { renderItinerary  } from './views/itinerary.js';
import { renderActivities } from './views/activities.js';
import { renderExpenses   } from './views/expenses.js';
import { renderDocuments  } from './views/documents.js';

// =====================================================
// APP STATE
// =====================================================
let currentView = 'dashboard';
export let appData = loadData();

export function refreshData() {
  appData = loadData();
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
  saveData(appData);
}

export function rerender() {
  navigateTo(currentView);
}

// =====================================================
// APP INIT
// =====================================================
async function init() {
  initTheme();
  initNav();
  navigateTo('dashboard');

  // Asynchronously check cloud for updates on startup
  try {
    const cloudData = await pullFromCloud();
    if (cloudData && cloudData.trip) {
      Object.assign(appData, cloudData);
      localStorage.setItem('voyage_japon_data', JSON.stringify(appData));
      rerender();
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);
