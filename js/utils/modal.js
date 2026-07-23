/* =====================================================
   MODAL.JS — Universal CRUD Modal & Toast System
   Japan Travel Dashboard
   ===================================================== */

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================
export function showToast(message, type = 'success') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;

  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

// =====================================================
// CONFIRM DIALOG
// =====================================================
export function openConfirm(message = 'Supprimer cet élément ?', title = 'Confirmation') {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('confirm-backdrop');
    document.getElementById('confirm-heading').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    backdrop.classList.add('active');

    function cleanup(result) {
      backdrop.classList.remove('active');
      document.getElementById('confirm-ok-btn').onclick = null;
      document.getElementById('confirm-cancel-btn').onclick = null;
      resolve(result);
    }
    document.getElementById('confirm-ok-btn').onclick     = () => cleanup(true);
    document.getElementById('confirm-cancel-btn').onclick = () => cleanup(false);
  });
}

// =====================================================
// FORM FIELD RENDERER
// =====================================================
function renderField(field, value) {
  const id  = `field-${field.key}`;
  const req = field.required ? '<span class="required">*</span>' : '';
  let input = '';

  switch (field.type) {
    case 'textarea':
      input = `<textarea class="form-control" id="${id}" name="${field.key}" rows="${field.rows||3}" placeholder="${field.placeholder||''}">${value ?? ''}</textarea>`;
      break;
    case 'select':
      input = `<select class="form-control" id="${id}" name="${field.key}">
        ${(field.options||[]).map(o =>
          typeof o === 'string'
            ? `<option value="${o}" ${value===o?'selected':''}>${o}</option>`
            : `<option value="${o.value}" ${value===o.value?'selected':''}>${o.label}</option>`
        ).join('')}
      </select>`;
      break;
    case 'checkbox':
      input = `<label class="form-check">
        <input type="checkbox" id="${id}" name="${field.key}" ${value?'checked':''} />
        <span class="form-check-label">${field.checkLabel || field.label}</span>
      </label>`;
      return `<div class="form-group">${input}</div>`;
    case 'color':
      input = `<input type="color" class="form-control" id="${id}" name="${field.key}" value="${value||'#e94560'}" />`;
      break;
    case 'number':
      input = `<input type="number" class="form-control" id="${id}" name="${field.key}" value="${value??''}" min="${field.min??''}" max="${field.max??''}" step="${field.step||1}" placeholder="${field.placeholder||''}" />`;
      break;
    default:
      input = `<input type="${field.type||'text'}" class="form-control" id="${id}" name="${field.key}" value="${value??''}" placeholder="${field.placeholder||''}" />`;
  }

  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${field.label}${req}</label>
      ${input}
      ${field.hint ? `<span class="form-hint">${field.hint}</span>` : ''}
    </div>
  `;
}

function renderForm(fields, data) {
  let html = '';
  let rowOpen = false;

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.row) {
      // Group two consecutive row-fields in a .form-row
      if (!rowOpen) { html += '<div class="form-row">'; rowOpen = true; }
      html += renderField(f, data[f.key]);
      const next = fields[i+1];
      if (!next || !next.row) { html += '</div>'; rowOpen = false; }
    } else {
      if (rowOpen) { html += '</div>'; rowOpen = false; }
      html += renderField(f, data[f.key]);
    }
  }
  if (rowOpen) html += '</div>';
  return html;
}

function collectData(fields, container) {
  const result = {};
  for (const f of fields) {
    const el = container.querySelector(`[name="${f.key}"]`);
    if (!el) continue;
    if (f.type === 'checkbox') result[f.key] = el.checked;
    else if (f.type === 'number') result[f.key] = el.value === '' ? null : Number(el.value);
    else result[f.key] = el.value;
  }
  return result;
}

function validateForm(fields, data, container) {
  let ok = true;
  for (const f of fields) {
    if (!f.required) continue;
    const el = container.querySelector(`[name="${f.key}"]`);
    if (!el) continue;
    const val = f.type === 'checkbox' ? el.checked : el.value.trim();
    if (!val) {
      el.classList.add('is-invalid');
      el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
      ok = false;
    }
  }
  return ok;
}

// =====================================================
// MAIN MODAL OPENER
// =====================================================
/**
 * Open the global CRUD modal.
 * @param {object} options
 *   title    — modal heading
 *   fields   — array of field definitions
 *   data     — initial values (for edit)
 *   onSave   — callback(formData) on save
 *   onDelete — callback() on delete (shows delete btn if provided)
 */
export function openModal({ title, fields, data = {}, onSave, onDelete }) {
  const backdrop = document.getElementById('modal-backdrop');
  const heading  = document.getElementById('modal-heading');
  const content  = document.getElementById('modal-content-area');
  const deleteBtn= document.getElementById('modal-delete-btn');

  heading.textContent = title;
  content.innerHTML   = renderForm(fields, data);
  deleteBtn.style.display = onDelete ? 'inline-flex' : 'none';

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Auto-focus first input
  requestAnimationFrame(() => {
    const first = content.querySelector('input:not([type="color"]):not([type="checkbox"]), select, textarea');
    if (first) first.focus();
  });

  function close() {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    cleanup();
  }

  function cleanup() {
    document.getElementById('modal-save-btn').onclick   = null;
    document.getElementById('modal-cancel-btn').onclick = null;
    document.getElementById('modal-close-btn').onclick  = null;
    deleteBtn.onclick = null;
    backdrop.onclick  = null;
    document.removeEventListener('keydown', escHandler);
  }

  // Save
  document.getElementById('modal-save-btn').onclick = () => {
    const formData = collectData(fields, content);
    if (!validateForm(fields, formData, content)) {
      showToast('Veuillez remplir tous les champs requis.', 'warning');
      return;
    }
    onSave(formData);
    close();
  };

  // Cancel / close
  document.getElementById('modal-cancel-btn').onclick = close;
  document.getElementById('modal-close-btn').onclick  = close;
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

  // Delete
  if (onDelete) {
    deleteBtn.onclick = async () => {
      const ok = await openConfirm('Supprimer cet élément définitivement ?');
      if (ok) { onDelete(); close(); }
    };
  }

  // ESC key
  const escHandler = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escHandler);
}
