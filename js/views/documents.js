/* =====================================================
   DOCUMENTS.JS — Docs, QR Codes & Emergency Numbers
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

const DOC_TYPES = [
  { value:'url',  label:'🔗 URL / QR Code' },
  { value:'text', label:'📝 Texte / Référence' },
];

const DOC_FIELDS = [
  { key:'title',   label:'Titre',          type:'text',   required:true,  placeholder:'Visit Japan Web' },
  { key:'type',    label:'Type',           type:'select', required:true,  options:DOC_TYPES },
  { key:'content', label:'Contenu (URL ou texte)', type:'text', required:true, placeholder:'https://... ou JRPASS-2026-FR-...' },
  { key:'notes',   label:'Notes',          type:'textarea', required:false, placeholder:'Instructions, infos pratiques...' },
];

const EMERGENCY_FIELDS = [
  { key:'label',  label:'Étiquette',  type:'text', required:true,  placeholder:'Police',      row:true },
  { key:'number', label:'Numéro',     type:'text', required:true,  placeholder:'110',         row:true },
  { key:'icon',   label:'Émoji',      type:'text', required:false, placeholder:'👮' },
];

export function renderDocuments(container) {
  const data      = appData;
  const documents = data.documents || [];
  const emergency = data.emergencyNumbers || [];

  container.innerHTML = `
    <div class="view-enter">
      <!-- Documents -->
      <div class="view-hd">
        <div><div class="view-hd-title">📁 Documents</div><div class="view-hd-sub">${documents.length} document(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-doc-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <div class="card-list" id="doc-list">
        ${documents.length
          ? documents.map(docCard).join('')
          : `<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-title">Aucun document</div><div class="empty-state-text">Ajoutez vos QR codes de réservation, numéros de dossier, etc.</div></div>`
        }
      </div>

      <div class="divider"></div>

      <!-- Emergency Numbers -->
      <div class="view-hd" style="margin-top:0">
        <div><div class="view-hd-title">🚨 Urgences</div><div class="view-hd-sub">Numéros importants</div></div>
        <button class="btn btn-danger-outline btn-sm" id="add-emergency-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <div class="emergency-grid" id="emergency-list">
        ${emergency.map(emCard).join('')}
        ${!emergency.length?`<div class="empty-state"><div class="empty-state-icon">🚨</div><div class="empty-state-title">Aucun numéro d\'urgence</div></div>`:''}
      </div>

      <!-- Japan quick numbers -->
      <div class="card" style="margin-top:var(--sp-4);background:var(--color-error-bg);border-color:rgba(239,68,68,0.2)">
        <div style="font-size:var(--fs-sm);font-weight:700;color:var(--color-error);margin-bottom:var(--sp-3)">🇯🇵 Numéros d\'urgence Japon</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);font-size:var(--fs-sm)">
          <div style="text-align:center;padding:var(--sp-2);background:var(--bg-card);border-radius:var(--r-md)">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-error)">110</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Police</div>
          </div>
          <div style="text-align:center;padding:var(--sp-2);background:var(--bg-card);border-radius:var(--r-md)">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-error)">119</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Pompiers/SAMU</div>
          </div>
          <div style="text-align:center;padding:var(--sp-2);background:var(--bg-card);border-radius:var(--r-md)">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-error)">118</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Garde-côtes</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- QR Code generation ----
  setTimeout(() => {
    documents.filter(d=>d.type==='url').forEach(d => {
      const el = document.getElementById(`qr-${d.id}`);
      if (!el || typeof QRCode === 'undefined') return;
      el.innerHTML = '';
      try {
        new QRCode(el, {
          text:        d.content,
          width:       120,
          height:      120,
          colorDark:   '#000000',
          colorLight:  '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });
      } catch(e) {
        el.innerHTML = `<a href="${d.content}" target="_blank" class="btn btn-ghost btn-sm">Ouvrir le lien</a>`;
      }
    });
  }, 100);

  // ---- Add document ----
  document.getElementById('add-doc-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Nouveau document',
      fields: DOC_FIELDS,
      data: { type: 'url' },
      onSave(d) {
        addItem(appData, 'documents', d);
        rerender();
        showToast('Document ajouté !', 'success');
      },
    });
  });

  // ---- Edit/delete document ----
  document.getElementById('doc-list').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-doc]');
    if (!editBtn) return;
    const id = editBtn.dataset.editDoc;
    const doc = (appData.documents||[]).find(x=>x.id===id);
    if (!doc) return;
    openModal({
      title: '✏️ Modifier le document',
      fields: DOC_FIELDS,
      data: doc,
      onSave(d) {
        updateItem(appData, 'documents', id, d);
        rerender();
        showToast('Document mis à jour !', 'success');
      },
      onDelete() {
        deleteItem(appData, 'documents', id);
        rerender();
        showToast('Document supprimé.', 'info');
      },
    });
  });

  // ---- Add emergency ----
  document.getElementById('add-emergency-btn').addEventListener('click', () => {
    openModal({
      title: '➕ Numéro d\'urgence',
      fields: EMERGENCY_FIELDS,
      data: { icon:'📞' },
      onSave(d) {
        addItem(appData, 'emergencyNumbers', d);
        rerender();
        showToast('Numéro ajouté !', 'success');
      },
    });
  });

  // ---- Edit emergency ----
  document.getElementById('emergency-list').addEventListener('click', e => {
    const card = e.target.closest('[data-edit-em]');
    if (!card) return;
    const id = card.dataset.editEm;
    const em = (appData.emergencyNumbers||[]).find(x=>x.id===id);
    if (!em) return;
    openModal({
      title: '✏️ Modifier le numéro',
      fields: EMERGENCY_FIELDS,
      data: em,
      onSave(d) {
        updateItem(appData, 'emergencyNumbers', id, d);
        rerender();
        showToast('Mis à jour !', 'success');
      },
      onDelete() {
        deleteItem(appData, 'emergencyNumbers', id);
        rerender();
        showToast('Supprimé.', 'info');
      },
    });
  });
}

function docCard(d) {
  const isUrl = d.type === 'url';
  return `
    <div class="doc-card">
      <div class="doc-card-header">
        <div>
          <div class="doc-card-title">${isUrl?'🔗':'📝'} ${d.title}</div>
        </div>
        <button class="btn-icon btn-icon-sm" data-edit-doc="${d.id}" title="Modifier">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
      ${isUrl ? `
        <div class="qr-container" id="qr-${d.id}">
          <span class="text-muted fs-xs">Génération QR...</span>
        </div>
        <a href="${d.content}" target="_blank" class="btn btn-ghost btn-sm btn-full" style="margin-top:0.5rem">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Ouvrir le lien
        </a>
      ` : `
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-3);margin:var(--sp-2) 0;font-family:monospace;font-size:var(--fs-sm);color:var(--text-primary);word-break:break-all;cursor:pointer" onclick="navigator.clipboard.writeText('${d.content}').then(()=>{})" title="Cliquer pour copier">
          ${d.content}
          <span style="float:right;color:var(--text-muted)"><i class="fa-regular fa-copy"></i></span>
        </div>
      `}
      ${d.notes?`<p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-2)">${d.notes}</p>`:''}
    </div>
  `;
}

function emCard(em) {
  return `
    <div class="emergency-card" data-edit-em="${em.id}">
      <div class="emergency-icon">${em.icon||'📞'}</div>
      <div class="emergency-number">${em.number}</div>
      <div class="emergency-label">${em.label}</div>
    </div>
  `;
}
