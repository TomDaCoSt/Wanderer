/* =====================================================
   DATA.JS — localStorage CRUD + Default Travel Data
   Japan Travel Dashboard
   ===================================================== */

// Clé dynamique par utilisateur — isole les données entre comptes sur le même navigateur
const WORKSPACE_KEY_PREFIX = 'voyage_workspace_v1';
const LEGACY_STORAGE_KEY = 'voyage_japon_data';

// userId de l'utilisateur actuellement connecté (initialisé au boot via initUserStorage)
let _currentUserId = null;

function getWorkspaceKey() {
  return _currentUserId
    ? `${WORKSPACE_KEY_PREFIX}_${_currentUserId}`
    : WORKSPACE_KEY_PREFIX;
}

/**
 * À appeler au boot après avoir récupéré l'identité de l'utilisateur.
 * Vide le localStorage si un autre utilisateur était connecté avant.
 */
export function initUserStorage(userId) {
  if (!userId) return;
  const prevUserId = localStorage.getItem('wanderer_active_user');
  if (prevUserId && prevUserId !== userId) {
    // Nettoyer les données de l'ancien utilisateur
    localStorage.removeItem(`${WORKSPACE_KEY_PREFIX}_${prevUserId}`);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.info('[storage] Ancien utilisateur détecté — données locales nettoyées.');
  }
  _currentUserId = userId;
  localStorage.setItem('wanderer_active_user', userId);
}

// =====================================================
// DEFAULT SAMPLE DATA
// =====================================================
const DEFAULT_DATA = {
  version: 2,
  trip: {
    name: '',
    startDate: '',
    endDate: '',
  },
  settings: {
    jpyRate: 162.5,
    homeCurrency: 'EUR',
    budget: 0,
  },
  cities: [],

  flights: [],
  trains: [],
  accommodations: [],
  itinerary: [],
  activities: [],
  expenses: [],
  documents: [],
  emergencyNumbers: [],
  rentals: [],
};

// DATA LAYER — local projects + authenticated cloud sync
// =====================================================

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function createDefaultProject() {
  return {
    id: 'project-default',
    name: DEFAULT_DATA.trip?.name || 'Mon voyage',
    updatedAt: new Date().toISOString(),
    data: cloneDefaults(),
  };
}

function createDefaultWorkspace() {
  const project = createDefaultProject();
  return {
    version: 1,
    activeProjectId: project.id,
    projects: [project],
  };
}

function normalizeWorkspace(rawWorkspace) {
  if (!rawWorkspace || typeof rawWorkspace !== 'object') return createDefaultWorkspace();
  const projects = Array.isArray(rawWorkspace.projects)
    ? rawWorkspace.projects
      .filter((project) => project && typeof project === 'object' && project.id)
      .map((project) => ({
        id: project.id,
        name: project.name || project.data?.trip?.name || 'Projet voyage',
        updatedAt: project.updatedAt || new Date().toISOString(),
        data: project.data || cloneDefaults(),
      }))
    : [];

  if (!projects.length) return createDefaultWorkspace();

  const activeProjectId = projects.some((project) => project.id === rawWorkspace.activeProjectId)
    ? rawWorkspace.activeProjectId
    : projects[0].id;

  return {
    version: 1,
    activeProjectId,
    projects,
  };
}

function migrateLegacyData() {
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;

    const legacyData = JSON.parse(stored);
    if (!legacyData || typeof legacyData !== 'object') return null;

    const migratedWorkspace = {
      version: 1,
      activeProjectId: 'project-default',
      projects: [{
        id: 'project-default',
        name: legacyData.trip?.name || 'Mon voyage',
        updatedAt: new Date().toISOString(),
        data: legacyData,
      }],
    };

    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(migratedWorkspace));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migratedWorkspace;
  } catch (error) {
    return null;
  }
}

function readLocalWorkspace() {
  try {
    const stored = localStorage.getItem(getWorkspaceKey());
    if (!stored) {
      const migrated = migrateLegacyData();
      if (migrated) return ensureActiveProject(normalizeWorkspace(migrated));
      return createDefaultWorkspace();
    }
    return ensureActiveProject(normalizeWorkspace(JSON.parse(stored)));
  } catch (error) {
    const migrated = migrateLegacyData();
    if (migrated) return ensureActiveProject(normalizeWorkspace(migrated));
    return createDefaultWorkspace();
  }
}

function persistWorkspace(workspace) {
  const normalized = ensureActiveProject(normalizeWorkspace(workspace));
  const activeProject = normalized.projects.find((project) => project.id === normalized.activeProjectId);

  localStorage.setItem(getWorkspaceKey(), JSON.stringify(normalized));
  if (activeProject) {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(activeProject.data));
  }
}

function loadWorkspace() {
  const workspace = readLocalWorkspace();
  persistWorkspace(workspace);
  return workspace;
}

function updateWorkspace(mutator) {
  const workspace = loadWorkspace();
  const nextWorkspace = ensureActiveProject(normalizeWorkspace(mutator(workspace) || workspace));
  persistWorkspace(nextWorkspace);
  return nextWorkspace;
}

function buildProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function hasMeaningfulData(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.trip?.name) return true;
  if (data.trip?.startDate || data.trip?.endDate) return true;
  if (data.settings?.budget > 0) return true;
  if (Array.isArray(data.cities) && data.cities.length) return true;
  if (Array.isArray(data.flights) && data.flights.length) return true;
  if (Array.isArray(data.trains) && data.trains.length) return true;
  if (Array.isArray(data.accommodations) && data.accommodations.length) return true;
  if (Array.isArray(data.itinerary) && data.itinerary.length) return true;
  if (Array.isArray(data.activities) && data.activities.length) return true;
  if (Array.isArray(data.expenses) && data.expenses.length) return true;
  if (Array.isArray(data.documents) && data.documents.length) return true;
  if (Array.isArray(data.emergencyNumbers) && data.emergencyNumbers.length) return true;
  if (Array.isArray(data.rentals) && data.rentals.length) return true;
  return false;
}

function ensureActiveProject(workspace) {
  if (!workspace || typeof workspace !== 'object') return createDefaultWorkspace();
  if (!Array.isArray(workspace.projects) || workspace.projects.length === 0) {
    return createDefaultWorkspace();
  }

  const normalizedProjects = workspace.projects.filter((project) => project && typeof project === 'object' && project.id);
  if (!normalizedProjects.length) return createDefaultWorkspace();

  const activeProjectExists = normalizedProjects.some((project) => project.id === workspace.activeProjectId);
  return {
    ...workspace,
    activeProjectId: activeProjectExists ? workspace.activeProjectId : normalizedProjects[0].id,
    projects: normalizedProjects.map((project) => ({
      id: project.id,
      name: project.name || project.data?.trip?.name || 'Projet voyage',
      updatedAt: project.updatedAt || new Date().toISOString(),
      data: project.data || cloneDefaults(),
    })),
  };
}

export function getProjects() {
  const workspace = loadWorkspace();
  return workspace.projects.map((project) => ({
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
  }));
}

export function getActiveProjectId() {
  return loadWorkspace().activeProjectId;
}

export function setActiveProject(projectId) {
  updateWorkspace((workspace) => ({
    ...workspace,
    activeProjectId: workspace.projects.some((project) => project.id === projectId)
      ? projectId
      : workspace.activeProjectId,
  }));
}

export function createProject(name = 'Nouveau projet') {
  const workspace = updateWorkspace((currentWorkspace) => {
    const newProject = {
      id: buildProjectId(),
      name,
      updatedAt: new Date().toISOString(),
      data: cloneDefaults(),
    };
    return {
      ...currentWorkspace,
      activeProjectId: newProject.id,
      projects: [newProject, ...currentWorkspace.projects],
    };
  });

  void pushWorkspaceToCloud(workspace);
  return workspace.activeProjectId;
}

export function renameProject(projectId, nextName) {
  const trimmedName = (nextName || '').trim();
  if (!trimmedName) return;

  const workspace = updateWorkspace((currentWorkspace) => ({
    ...currentWorkspace,
    projects: currentWorkspace.projects.map((project) => (
      project.id === projectId ? { ...project, name: trimmedName, updatedAt: new Date().toISOString() } : project
    )),
  }));

  void pushWorkspaceToCloud(workspace);
}

export function deleteProject(projectId) {
  const workspace = updateWorkspace((currentWorkspace) => {
    if (currentWorkspace.projects.length <= 1) return currentWorkspace;

    const nextProjects = currentWorkspace.projects.filter((project) => project.id !== projectId);
    if (!nextProjects.length) return currentWorkspace;

    const nextActive = currentWorkspace.activeProjectId === projectId
      ? nextProjects[0].id
      : currentWorkspace.activeProjectId;

    return {
      ...currentWorkspace,
      activeProjectId: nextActive,
      projects: nextProjects,
    };
  });

  void pushWorkspaceToCloud(workspace);
}

/** Load active project data from localStorage, falling back to defaults */
export function loadData() {
  const workspace = loadWorkspace();
  const activeProject = workspace.projects.find((project) => project.id === workspace.activeProjectId);
  return activeProject?.data || cloneDefaults();
}

/** Save active project and trigger authenticated cloud sync */
export function saveData(data) {
  const workspace = updateWorkspace((currentWorkspace) => {
    const normalizedCurrentWorkspace = ensureActiveProject(currentWorkspace);
    const activeProjectId = normalizedCurrentWorkspace.activeProjectId;
    return {
      ...normalizedCurrentWorkspace,
      projects: normalizedCurrentWorkspace.projects.map((project) => (
        project.id === activeProjectId
          ? {
            ...project,
            name: data.trip?.name || project.name,
            updatedAt: new Date().toISOString(),
            data,
          }
          : project
      )),
    };
  });

  // Sync workspace privé
  void pushWorkspaceToCloud(workspace);

  // Si un projet partagé est actif, propager les modifications aux collaborateurs
  const activeShareId = sessionStorage.getItem('active_share_id');
  if (activeShareId) {
    void updateSharedProject(activeShareId, data);
  }
}

/** Reset active project to default data */
export function resetData() {
  const fresh = cloneDefaults();
  saveData(fresh);
  return fresh;
}

// File d'attente : évite les requêtes PUT simultanées
let _syncQueue = Promise.resolve();
let _pendingWorkspace = null;

async function pushWorkspaceToCloud(workspace) {
  _pendingWorkspace = workspace;

  _syncQueue = _syncQueue.then(async () => {
    if (!_pendingWorkspace) return;
    const toSync = _pendingWorkspace;
    _pendingWorkspace = null;

    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: toSync }),
      });
      if (res.ok) {
        console.info('[sync] Workspace synchronisé avec le cloud ✓');
      } else {
        console.warn('[sync] Échec push cloud:', res.status);
      }
    } catch (error) {
      console.warn('[sync] Erreur réseau push cloud:', error.message);
      // Pas de retry agressif — la prochaine modification déclenchera un nouveau push
    }
  });

  return _syncQueue;
}

/** Retourne le updatedAt le plus récent parmi tous les projets du workspace */
function getMostRecentUpdatedAt(workspace) {
  if (!workspace?.projects?.length) return null;
  const dates = workspace.projects
    .map((p) => p.updatedAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !isNaN(t));
  if (!dates.length) return null;
  return new Date(Math.max(...dates)).toISOString();
}

/** Push current active project data to authenticated cloud workspace */
export async function pushToCloud(data) {
  const workspace = updateWorkspace((currentWorkspace) => {
    const normalizedCurrentWorkspace = ensureActiveProject(currentWorkspace);
    const activeProjectId = normalizedCurrentWorkspace.activeProjectId;
    return {
      ...normalizedCurrentWorkspace,
      projects: normalizedCurrentWorkspace.projects.map((project) => (
        project.id === activeProjectId
          ? {
            ...project,
            name: data.trip?.name || project.name,
            updatedAt: new Date().toISOString(),
            data,
          }
          : project
      )),
    };
  });
  return pushWorkspaceToCloud(workspace);
}

/** Pull full workspace from authenticated cloud and merge intelligently by updatedAt */
export async function pullFromCloud() {
  try {
    const localWorkspace = readLocalWorkspace();
    const localUpdatedAt = getMostRecentUpdatedAt(localWorkspace);

    // Envoi de If-Modified-Since pour éviter le download si rien n'a changé
    const headers = {};
    if (localUpdatedAt) {
      headers['If-Modified-Since'] = new Date(localUpdatedAt).toUTCString();
    }

    const res = await fetch('/api/projects', { method: 'GET', headers });

    // 304 Not Modified → données locales déjà à jour
    if (res.status === 304) {
      console.info('[sync] Cloud non modifié, données locales conservées.');
      return loadData();
    }

    if (!res.ok) return null;

    const payload = await res.json();
    if (!payload?.workspace) return null;

    const remoteWorkspace = normalizeWorkspace(payload.workspace);
    const remoteUpdatedAt = getMostRecentUpdatedAt(remoteWorkspace);

    const localActiveProject = localWorkspace.projects.find((p) => p.id === localWorkspace.activeProjectId);
    const remoteActiveProject = remoteWorkspace.projects.find((p) => p.id === remoteWorkspace.activeProjectId);
    const localHasData = hasMeaningfulData(localActiveProject?.data);
    const remoteHasData = hasMeaningfulData(remoteActiveProject?.data);

    // Local a des données, cloud est vide → on push le local vers le cloud
    if (localHasData && !remoteHasData) {
      console.info('[sync] Local a des données, cloud vide → push vers cloud');
      void pushWorkspaceToCloud(localWorkspace);
      return loadData();
    }

    // Cloud plus récent que local → écraser local avec cloud
    if (remoteUpdatedAt && localUpdatedAt && remoteUpdatedAt > localUpdatedAt) {
      console.info('[sync] Cloud plus récent → mise à jour locale');
      persistWorkspace(remoteWorkspace);
      return remoteActiveProject?.data || null;
    }

    // Local plus récent que cloud → on push le local vers le cloud
    if (localUpdatedAt && remoteUpdatedAt && localUpdatedAt > remoteUpdatedAt) {
      console.info('[sync] Local plus récent → push vers cloud');
      void pushWorkspaceToCloud(localWorkspace);
      return loadData();
    }

    // Cas par défaut : utiliser le cloud s'il a des données
    if (remoteHasData) {
      persistWorkspace(remoteWorkspace);
      return remoteActiveProject?.data || null;
    }

    return loadData();
  } catch (error) {
    console.warn('[sync] Cloud pull error:', error);
    return null;
  }
}

/** Generate a short unique ID */
export function genId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Generic entity CRUD helpers ---- //

/** Add an item to an array field */
export function addItem(data, field, item) {
  if (!data[field]) data[field] = [];
  data[field].push({ ...item, id: item.id || genId(field) });
  saveData(data);
}

/** Update an item by id in an array field */
export function updateItem(data, field, id, updates) {
  const idx = data[field].findIndex(i => i.id === id);
  if (idx !== -1) data[field][idx] = { ...data[field][idx], ...updates };
  saveData(data);
}

/** Delete an item by id from an array field */
export function deleteItem(data, field, id) {
  data[field] = data[field].filter(i => i.id !== id);
  saveData(data);
}

/** Find an item by id in an array field */
export function findItem(data, field, id) {
  return (data[field] || []).find(i => i.id === id);
}

// ---- Itinerary event helpers ---- //

export function addItineraryEvent(data, date, event) {
  let day = data.itinerary.find(d => d.date === date);
  if (!day) {
    day = { date, city: '', emoji: '📅', events: [] };
    data.itinerary.push(day);
    data.itinerary.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (!day.events) day.events = [];
  day.events.push({ ...event, id: event.id || genId('evt') });
  day.events.sort((a, b) => a.time.localeCompare(b.time));
  saveData(data);
}

export function updateItineraryDay(data, date, updates) {
  const day = data.itinerary.find(d => d.date === date);
  if (day) Object.assign(day, updates);
  saveData(data);
}

export function deleteItineraryDay(data, date) {
  data.itinerary = data.itinerary.filter(d => d.date !== date);
  saveData(data);
}

export function updateItineraryEvent(data, date, eventId, updates) {
  const day = data.itinerary.find(d => d.date === date);
  if (!day) return;
  const idx = day.events.findIndex(e => e.id === eventId);
  if (idx !== -1) day.events[idx] = { ...day.events[idx], ...updates };
  saveData(data);
}

export function deleteItineraryEvent(data, date, eventId) {
  const day = data.itinerary.find(d => d.date === date);
  if (day) day.events = day.events.filter(e => e.id !== eventId);
  saveData(data);
}

// =====================================================
// PARTAGE DE VOYAGES — Cloud Share API
// =====================================================

const SHARED_STORAGE_KEY_PREFIX = 'voyage_shared_v1';

function getSharedStorageKey() {
  return _currentUserId
    ? `${SHARED_STORAGE_KEY_PREFIX}_${_currentUserId}`
    : SHARED_STORAGE_KEY_PREFIX;
}

/** Lit les projets partagés depuis le localStorage local */
export function getSharedProjects() {
  try {
    const raw = localStorage.getItem(getSharedStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSharedProjects(sharedProjects) {
  localStorage.setItem(getSharedStorageKey(), JSON.stringify(sharedProjects));
}

/**
 * Crée un partage : envoie le projet courant au cloud et invite un collaborateur par email.
 * @param {string} projectId - ID du projet à partager
 * @param {string} inviteeEmail - email de la personne invitée
 * @returns {Promise<{shareId: string}|null>}
 */
export async function shareProject(projectId, inviteeEmail) {
  const workspace = loadWorkspace();
  const project = workspace.projects.find((p) => p.id === projectId);
  if (!project) return null;

  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, project, inviteeEmail }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erreur ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('[share] shareProject error:', error);
    throw error;
  }
}

/**
 * Met à jour un projet partagé (last-write-wins).
 */
export async function updateSharedProject(shareId, projectData) {
  try {
    const res = await fetch(`/api/share/${shareId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: projectData }),
    });
    return res.ok;
  } catch (error) {
    console.warn('[share] updateSharedProject error:', error);
    return false;
  }
}

/**
 * Révoque un partage (seul le propriétaire peut supprimer).
 */
export async function revokeShare(shareId) {
  try {
    const res = await fetch(`/api/share/${shareId}`, { method: 'DELETE' });
    if (res.ok) {
      persistSharedProjects(getSharedProjects().filter((s) => s.shareId !== shareId));
    }
    return res.ok;
  } catch (error) {
    console.warn('[share] revokeShare error:', error);
    return false;
  }
}

/**
 * Tire tous les projets partagés accessibles depuis le cloud.
 * Met à jour le cache local et retourne la liste.
 */
export async function pullSharedProjects() {
  try {
    const res = await fetch('/api/share', { method: 'GET' });
    if (!res.ok) return getSharedProjects();
    const payload = await res.json();
    const shared = Array.isArray(payload.shares) ? payload.shares : [];
    persistSharedProjects(shared);
    return shared;
  } catch (error) {
    console.warn('[share] pullSharedProjects error:', error);
    return getSharedProjects();
  }
}

