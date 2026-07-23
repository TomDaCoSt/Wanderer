/* =====================================================
   DATA.JS — localStorage CRUD + Default Travel Data
   Japan Travel Dashboard
   ===================================================== */

const WORKSPACE_STORAGE_KEY = 'voyage_workspace_v1';
const LEGACY_STORAGE_KEY = 'voyage_japon_data';

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
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
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

  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(normalized));
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

  void pushWorkspaceToCloud(workspace);
}

/** Reset active project to default data */
export function resetData() {
  const fresh = cloneDefaults();
  saveData(fresh);
  return fresh;
}

async function pushWorkspaceToCloud(workspace) {
  try {
    const res = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace }),
    });
    return res.ok;
  } catch (error) {
    console.warn('Cloud workspace push error:', error);
    return false;
  }
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

/** Pull full workspace from authenticated cloud and update local storage */
export async function pullFromCloud() {
  try {
    const res = await fetch('/api/projects', { method: 'GET' });
    if (!res.ok) return null;

    const payload = await res.json();
    if (!payload || !payload.workspace) return null;

    const workspace = normalizeWorkspace(payload.workspace);
    persistWorkspace(workspace);
    const activeProject = workspace.projects.find((project) => project.id === workspace.activeProjectId);
    return activeProject?.data || null;
  } catch (error) {
    console.warn('Cloud workspace pull error:', error);
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
