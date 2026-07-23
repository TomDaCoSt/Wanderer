/* =====================================================
   EXPENSES.JS — Budget, Converter & Expenses (CRUD)
   ===================================================== */
import { appData, commitData, rerender } from '../app.js';
import { openModal, showToast } from '../utils/modal.js';
import { addItem, updateItem, deleteItem } from '../data.js';

const CATEGORIES = ['Food','Transport','Shopping','Activity','Accommodation','Other'];
const CAT_ICONS  = { Food:'🍼', Transport:'🚌', Shopping:'🛍️', Activity:'🎯', Accommodation:'🏨', Other:'💰' };
const CAT_COLORS = { Food:'#f97316', Transport:'#3b82f6', Shopping:'#ec4899', Activity:'#06b6d4', Accommodation:'#f5a623', Other:'#94a3b8' };

const EXPENSE_FIELDS = [
  { key:'date',        label:'Date',          type:'date',   required:true, row:true },
  { key:'description', label:'Description',   type:'text',   required:true,  placeholder:'Ramen Ichiran', row:true },
  { key:'amount',      label:'Montant',       type:'number', required:true,  placeholder:'1200', step:1, row:true },
  { key:'currency',    label:'Devise',        type:'select', required:true,  options:['JPY','EUR','USD'], row:true },
  { key:'category',    label:'Catégorie',      type:'select', required:true,  options:CATEGORIES },
  { key:'city',        label:'Ville',         type:'text',   required:false, placeholder:'Tokyo' },
];

let chartInstance = null;

export function renderExpenses(container) {
  const data     = appData;
  const expenses = (data.expenses||[]).sort((a,b)=>b.date.localeCompare(a.date));
  const settings = data.settings || {};
  const rate     = parseFloat(settings.jpyRate) || 162.5;
  const budget   = parseFloat(settings.budget)  || 4000;

  // Totals
  const totalEur = expenses.reduce((s,e) => s + toEur(e, rate), 0);
  const byCategory = {};
  CATEGORIES.forEach(c => { byCategory[c] = 0; });
  expenses.forEach(e => { if (byCategory[e.category]!==undefined) byCategory[e.category] += toEur(e,rate); });

  container.innerHTML = `
    <div class="view-enter">
      <div class="view-hd">
        <div><div class="view-hd-title">💴 Budget</div><div class="view-hd-sub">${expenses.length} dépense(s)</div></div>
        <button class="btn btn-primary btn-sm" id="add-exp-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
      </div>

      <!-- Converter -->
      <div class="converter-box" style="margin-bottom:var(--sp-5)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
          <span style="font-weight:700;color:var(--text-primary)">¥ Convertisseur</span>
          <button class="btn btn-ghost btn-sm" id="edit-rate-btn"><i class="fa-solid fa-pen"></i> ${rate} JPY/€</button>
        </div>
        <div class="converter-input-group">
          <span class="converter-currency-label" id="conv-from-label">¥</span>
          <input type="number" class="form-control" id="conv-input" value="1000" step="100" />
          <button class="converter-swap-btn" id="conv-swap-btn" title="Inverser"><i class="fa-solid fa-arrow-right-arrow-left"></i></button>
          <span class="converter-currency-label" id="conv-to-label">€</span>
        </div>
        <div class="converter-result">
          <div class="converter-result-value" id="conv-result">—</div>
          <div class="converter-result-label" id="conv-result-label">Résultat</div>
        </div>
      </div>

      <!-- Budget summary -->
      <div class="card" style="margin-bottom:var(--sp-5)">
        <div class="card-header">
          <span class="card-title">📊 Récapitulatif</span>
          <span class="fw-700 fs-xl" style="color:var(--color-primary)">${totalEur.toFixed(2)}€</span>
        </div>
        <div class="progress-bar" style="margin-bottom:0.5rem">
          <div class="progress-fill" style="width:${Math.min(100,totalEur/budget*100).toFixed(1)}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text-muted)">
          <span>Budget: ${budget}€</span>
          <span style="color:${totalEur>budget?'var(--color-error)':'var(--color-success)'}">
            ${totalEur>budget?'Dépassé de '+(totalEur-budget).toFixed(0)+'€':'Reste '+(budget-totalEur).toFixed(0)+'€'}
          </span>
        </div>

        <!-- Category breakdown -->
        <div style="margin-top:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-2)">
          ${CATEGORIES.filter(c=>byCategory[c]>0).map(c=>`
            <div style="display:flex;align-items:center;gap:var(--sp-2)">
              <span style="font-size:1rem;width:20px;text-align:center">${CAT_ICONS[c]||'💰'}</span>
              <span style="flex:1;font-size:var(--fs-xs);font-weight:600;color:var(--text-secondary)">${c}</span>
              <div style="flex:3">
                <div style="background:var(--border);border-radius:99px;height:5px;overflow:hidden">
                  <div style="height:100%;border-radius:99px;background:${CAT_COLORS[c]||'#94a3b8'};width:${Math.min(100,byCategory[c]/totalEur*100).toFixed(1)}%;transition:width .5s ease"></div>
                </div>
              </div>
              <span style="font-size:var(--fs-xs);font-weight:600;color:var(--text-primary);min-width:50px;text-align:right">${byCategory[c].toFixed(0)}€</span>
            </div>
          `).join('')}
        </div>

        <!-- Chart -->
        <div class="chart-wrapper">
          <canvas id="expense-chart"></canvas>
        </div>
      </div>

      <!-- Expense list -->
      <div class="section-hd">
        <h2>Détails des dépenses</h2>
      </div>
      <div class="card">
        <div id="expense-rows">
          ${expenses.length ? expenses.map(e => `
            <div class="expense-row">
              <div class="expense-cat-icon" style="background:${CAT_COLORS[e.category]||'#94a3b8'}22;color:${CAT_COLORS[e.category]||'#94a3b8'}">
                ${CAT_ICONS[e.category]||'💰'}
              </div>
              <div class="expense-info">
                <div class="expense-desc">${e.description}</div>
                <div class="expense-meta">${e.date?fmtDate(e.date):''} · ${e.city||''} · ${e.category}</div>
              </div>
              <div>
                <div class="expense-amount">${e.currency==='JPY'?'¥':'€'}${Number(e.amount).toLocaleString()}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted);text-align:right">≈${toEur(e,rate).toFixed(2)}€</div>
              </div>
              <button class="btn-icon btn-icon-sm" data-edit-exp="${e.id}" style="margin-left:var(--sp-1)"><i class="fa-solid fa-pen"></i></button>
            </div>
          `).join('') : `<div class="empty-state"><div class="empty-state-icon">💴</div><div class="empty-state-title">Aucune dépense</div></div>`}
        </div>
      </div>
    </div>
  `;

  // ---- Converter logic ----
  let fromJpy = true;
  const convInput = document.getElementById('conv-input');
  function updateConv() {
    const val = parseFloat(convInput.value)||0;
    const result = fromJpy ? (val/rate) : (val*rate);
    const resultEl = document.getElementById('conv-result');
    const labelEl  = document.getElementById('conv-result-label');
    if (resultEl) resultEl.textContent = fromJpy ? result.toFixed(2)+' €' : result.toFixed(0)+' ¥';
    if (labelEl)  labelEl.textContent  = fromJpy ? `${val.toLocaleString()} ¥ = ${result.toFixed(2)} €` : `${val} € = ${result.toFixed(0)} ¥`;
  }
  convInput?.addEventListener('input', updateConv);
  document.getElementById('conv-swap-btn')?.addEventListener('click', () => {
    fromJpy = !fromJpy;
    document.getElementById('conv-from-label').textContent = fromJpy ? '¥' : '€';
    document.getElementById('conv-to-label').textContent   = fromJpy ? '€' : '¥';
    updateConv();
  });
  updateConv();

  // Edit rate
  document.getElementById('edit-rate-btn')?.addEventListener('click', () => {
    openModal({
      title: '✏️ Taux de change',
      fields: [
        { key:'jpyRate', label:'1 EUR = X JPY', type:'number', required:true, placeholder:'162.5', step:0.1 },
        { key:'budget',  label:'Budget total (€)', type:'number', required:false, placeholder:'4000' },
      ],
      data: { jpyRate: rate, budget },
      onSave(d) {
        appData.settings = { ...settings, jpyRate: parseFloat(d.jpyRate)||162.5, budget: parseFloat(d.budget)||4000 };
        commitData();
        rerender();
        showToast('Taux mis à jour !', 'success');
      },
    });
  });

  // Add expense
  document.getElementById('add-exp-btn')?.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0,10);
    openModal({
      title: '➕ Nouvelle dépense',
      fields: EXPENSE_FIELDS,
      data: { date: today, currency:'JPY', category:'Food', city: (appData.cities||[])[0]||'' },
      onSave(d) {
        addItem(appData, 'expenses', d);
        rerender();
        showToast('Dépense ajoutée !', 'success');
      },
    });
  });

  // Edit expense
  document.getElementById('expense-rows')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-edit-exp]');
    if (!btn) return;
    const id = btn.dataset.editExp;
    const ex = (appData.expenses||[]).find(x=>x.id===id);
    if (!ex) return;
    openModal({
      title: '✏️ Modifier la dépense',
      fields: EXPENSE_FIELDS,
      data: ex,
      onSave(d) {
        updateItem(appData, 'expenses', id, d);
        rerender();
        showToast('Dépense mise à jour !', 'success');
      },
      onDelete() {
        deleteItem(appData, 'expenses', id);
        rerender();
        showToast('Dépense supprimée.', 'info');
      },
    });
  });

  // ---- Chart ----
  const ctx = document.getElementById('expense-chart');
  if (ctx && typeof Chart !== 'undefined') {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    const catData = CATEGORIES.filter(c=>byCategory[c]>0);
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: catData,
        datasets: [{
          data: catData.map(c=>byCategory[c].toFixed(2)),
          backgroundColor: catData.map(c=>CAT_COLORS[c]||'#94a3b8'),
          borderWidth: 0,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend: { position:'right', labels:{ color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()||'#94a3b8', font:{size:11}, boxWidth:12, padding:10 } },
          tooltip: { callbacks: { label: (ctx)=>`${ctx.label}: ${parseFloat(ctx.raw).toFixed(2)}€` } },
        }
      }
    });
  }
}

function toEur(expense, rate) {
  const a = parseFloat(expense.amount)||0;
  return expense.currency==='JPY' ? a/rate : a;
}
function fmtDate(s) {
  return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
}
