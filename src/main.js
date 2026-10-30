import './style.css';
import { icons } from './icons.js';

// DOM utilities & formatting
const $ = (id) => document.getElementById(id);
const money = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (v) => Number(String(v).replace(',', '.'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));
const key = (i) => i.name.trim().toLocaleLowerCase() + '|' + i.unit;

// State management
const fresh = () => ({
  items: [],
  history: [],
  pantry: [],
  date: new Date().toLocaleDateString('en-CA'),
  market: '',
  note: null
});

let state;
try {
  state = JSON.parse(localStorage.getItem('nalista-v1')) || fresh();
} catch {
  state = fresh();
}

let mode = 'label';
let xmlItems = [];

// Toast notification
function toast(t) {
  const el = $('toast');
  if (!el) return;
  el.textContent = t;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 4500);
}

function save() {
  try {
    localStorage.setItem('nalista-v1', JSON.stringify(state));
  } catch {
    toast('Não foi possível salvar. Exporte um backup antes de fechar.');
  }
}

function total() {
  return Math.round(state.items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;
}

// Global Actions
window.toggleItem = function(id) {
  const i = state.items.find((item) => item.id === id);
  if (!i) return;
  i.checked = !i.checked;
  save();
  render();
  document.getElementById('check-' + id)?.focus({ preventScroll: true });
};

window.removeItem = function(id) {
  state.items = state.items.filter((i) => i.id !== id);
  state.note = null;
  save();
  render();
};

window.setItemPrice = function(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const answer = prompt(
    'Preço unitário de ' + item.name + ' (R$):',
    item.pricePending ? '' : String(item.price).replace('.', ',')
  );
  if (answer === null) return;
  const value = num(answer.trim());
  if (!answer.trim() || !Number.isFinite(value) || value < 0) {
    return toast('Informe um preço válido.');
  }
  item.price = value;
  item.pricePending = false;
  state.note = null;
  save();
  render();
};

window.consumePantry = function(n) {
  if (!state.pantry[n]) return;
  const v = prompt('Quantidade consumida (' + state.pantry[n].unit + '):', '1');
  if (v === null) return;
  const q = num(v);
  if (!Number.isFinite(q) || q <= 0 || q > state.pantry[n].qty) {
    return toast('Informe uma quantidade válida até o saldo disponível.');
  }
  state.pantry[n].qty = Math.max(0, state.pantry[n].qty - q);
  save();
  render();
};

window.setPantryExpiry = function(n, val) {
  if (!state.pantry[n]) return;
  state.pantry[n].expiry = val;
  save();
};

// Checklist rendering
function renderChecklist() {
  const itemsContainer = $('items');
  if (!itemsContainer) return;

  const done = state.items.filter((i) => i.checked).length;
  const pendingPrices = state.items.filter((i) => i.pricePending).length;

  itemsContainer.innerHTML = state.items.length
    ? state.items
        .map(
          (i) => `
      <div class="todo-row ${i.checked ? 'is-done' : ''}">
        <label class="todo-target" for="check-${i.id}">
          <input id="check-${i.id}" type="checkbox" ${i.checked ? 'checked' : ''} onchange="toggleItem('${i.id}')">
          <span class="todo-circle" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none"><path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="todo-copy">
            <b>${esc(i.name)}</b>
            ${i.qty !== 1 || i.unit !== 'un' ? `<small>${i.qty} ${esc(i.unit)}</small>` : ''}
          </span>
        </label>
        <button class="item-price" type="button" aria-label="${i.pricePending ? 'Adicionar' : 'Editar'} preço de ${esc(i.name)}" onclick="setItemPrice('${i.id}')">
          ${i.pricePending ? '+ preço' : money(i.qty * i.price)}
        </button>
        <button class="todo-remove" type="button" aria-label="Remover ${esc(i.name)}" onclick="removeItem('${i.id}')">×</button>
      </div>`
        )
        .join('') + `<p class="simple-status" role="status">${done} de ${state.items.length} marcados</p>`
    : '<div class="empty">Sua lista está vazia.<br>Adicione o primeiro produto acima.</div>';

  $('priceHint').textContent = pendingPrices
    ? `Total parcial · ${pendingPrices} ${pendingPrices === 1 ? 'item sem preço' : 'itens sem preço'}`
    : 'Total da lista';
}

// Render full application
function render() {
  const tot = total();
  $('total').textContent = money(tot);
  if ($('estimate')) $('estimate').textContent = money(tot);
  if ($('count')) $('count').textContent = state.items.length + ' itens';
  if ($('checked')) $('checked').textContent = state.items.filter((i) => i.checked).length + ' de ' + state.items.length;
  
  renderChecklist();

  // History section
  const historyContainer = $('history');
  if (historyContainer) {
    historyContainer.innerHTML = state.history.length
      ? state.history
          .slice()
          .reverse()
          .map(
            (h) => `
        <div class="panel history-card" style="margin-bottom:16px">
          <div class="row">
            <h2>${esc(h.market || 'Compra no mercado')}</h2>
            <b>${money(h.note ? h.note.total : h.total)}</b>
          </div>
          <small class="muted">${esc(h.date)} · ${h.items.length} produtos · ${h.note ? 'Nota registrada' : 'Sem nota conferida'}</small>
          <p style="margin:10px 0">${h.items.map((i) => esc(i.name) + ' (' + i.qty + ' ' + esc(i.unit) + ')').join(' · ')}</p>
          ${
            h.note
              ? `<p class="muted">Tributos aproximados: ${h.note.tax === null ? 'não informados' : money(h.note.tax)} · Diferença da lista: ${money(h.note.total - h.total)}</p>`
              : ''
          }
        </div>`
          )
          .join('')
      : '<div class="panel empty">Suas compras concluídas aparecerão aqui.</div>';
  }

  // Price comparison section
  const chartContainer = $('chart');
  if (chartContainer) {
    const latest = state.history.at(-1);
    const prev = state.history.at(-2);
    const changes = [];
    if (latest && prev) {
      const aggregate = (items) => {
        const m = new Map();
        items.forEach((i) => {
          const k = key(i);
          const a = m.get(k) || { name: i.name, qty: 0, cost: 0 };
          a.qty += i.qty;
          a.cost += i.qty * i.price;
          m.set(k, a);
        });
        return m;
      };
      const a = aggregate(latest.items);
      const b = aggregate(prev.items);
      a.forEach((v, k) => {
        const p = b.get(k);
        if (p && p.cost > 0) {
          changes.push({
            name: v.name,
            old: p.cost / p.qty,
            now: v.cost / v.qty,
            delta: ((v.cost / v.qty) / (p.cost / p.qty) - 1) * 100
          });
        }
      });
    }
    changes.sort((a, b) => b.delta - a.delta);
    const max = Math.max(1, ...changes.map((c) => Math.abs(c.delta)));

    chartContainer.innerHTML = changes.length
      ? changes
          .map(
            (c) => `
        <div class="chartrow">
          <span>
            ${esc(c.name)}
            <small class="muted" style="display:block">${money(c.old)} → ${money(c.now)}</small>
          </span>
          <div class="bar" style="width:${(Math.abs(c.delta) / max) * 100}%;background:${c.delta > 0 ? '#bc7358' : '#719961'}"></div>
          <b>${c.delta > 0 ? '+' : ''}${c.delta.toFixed(1)}%</b>
        </div>`
          )
          .join('')
      : '<div class="empty">Conclua duas compras com produtos em comum para ver o gráfico.</div>';
  }

  // Pantry section
  const pantryContainer = $('pantry');
  if (pantryContainer) {
    pantryContainer.innerHTML = state.pantry.length
      ? state.pantry
          .map(
            (i, n) => `
        <div class="item">
          <span class="icon">▦</span>
          <div class="desc">
            <b>${esc(i.name)}</b>
            <small>${i.qty.toFixed(3).replace(/\.?0+$/, '')} ${esc(i.unit)} disponíveis</small>
            <label>Validade</label>
            <input aria-label="Validade de ${esc(i.name)}" type="date" value="${esc(i.expiry || '')}" onchange="setPantryExpiry(${n}, this.value)">
            ${i.expiry && i.expiry < new Date().toLocaleDateString('en-CA') ? '<small style="color:var(--color-danger)">Validade vencida</small>' : ''}
          </div>
          <button type="button" onclick="consumePantry(${n})">Consumir</button>
        </div>`
          )
          .join('')
      : '<div class="empty">Conclua uma compra para abastecer sua despensa.</div>';
  }

  // Update Dynamic Island on Mobile
  updateIsland();
}

function updateIsland() {
  const islandTotal = $('islandTotal');
  const islandStatus = $('islandStatus');
  if (islandTotal && islandStatus) {
    islandTotal.textContent = $('total').textContent;
    islandStatus.textContent = state.items.some((i) => i.pricePending) ? 'Total parcial' : 'Total da lista';
  }
}

// Scanner handling
function scan(m) {
  mode = m;
  $('scanTitle').textContent = m === 'qr' ? 'Ler QR Code' : 'Ler etiqueta';
  $('scanStatus').textContent = '';
  $('ocrReview').hidden = true;
  $('photo').value = '';
  $('scanner').showModal();
}

function openReceipt() {
  $('receiptTotal').value = state.note?.total ?? '';
  $('tax').value = state.note?.tax ?? '';
  $('reconciliation').innerHTML = '';
  $('receipt').showModal();
}

function checkReceipt() {
  if (state.items.some((i) => i.pricePending)) {
    return toast('Preencha os preços da lista antes de comparar com a nota.');
  }
  const t = num($('receiptTotal').value);
  const tax = $('tax').value.trim() === '' ? null : num($('tax').value);

  if (
    !$('receiptTotal').value.trim() ||
    !Number.isFinite(t) ||
    t < 0 ||
    (tax !== null && (!Number.isFinite(tax) || tax < 0 || tax > t))
  ) {
    return toast('Confira os valores da nota e dos tributos.');
  }

  state.note = { total: t, tax, url: $('qrurl').value };
  save();

  const diff = Math.round((t - total()) * 100) / 100;
  $('reconciliation').innerHTML = `
    <div class="summary">
      <b>${Math.abs(diff) < 0.01 ? '✓ Total confere' : 'Diferença: ' + money(diff)}</b>
      <p>Total da nota: ${money(t)}<br>
      ${tax === null ? 'Tributos não informados' : `Tributos aproximados: ${money(tax)}<br>Valor estimado sem tributos: ${money(t - tax)}`}</p>
      <small>A conferência do total não garante que cada item está correto.</small>
    </div>
  `;
  render();
}

function finish() {
  if (!state.items.length) return toast('Adicione pelo menos um produto.');
  if (state.items.some((i) => i.pricePending)) {
    return toast('Toque em + preço e preencha os valores antes de concluir.');
  }
  if (!state.date) return toast('Escolha a data da compra.');
  if (!confirm('Concluir esta compra e adicionar os produtos à despensa?')) return;

  state.history.push({
    date: state.date,
    market: state.market,
    items: structuredClone(state.items),
    total: total(),
    note: state.note
  });

  state.items.forEach((i) => {
    let p = state.pantry.find((p) => key(p) === key(i) && !p.expiry);
    if (p) {
      p.qty += i.qty;
    } else {
      state.pantry.push({ name: i.name, unit: i.unit, qty: i.qty, expiry: '' });
    }
  });

  state.items = [];
  state.note = null;
  save();
  render();
  toast('Compra salva e despensa atualizada!');
}

function backup() {
  const u = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = u;
  a.download = 'na-lista-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

// Initial setup and listeners
document.addEventListener('DOMContentLoaded', () => {
  // Sync inputs with state
  $('date').value = state.date;
  $('market').value = state.market;
  $('date').onchange = (e) => {
    state.date = e.target.value;
    save();
  };
  $('market').oninput = (e) => {
    state.market = e.target.value;
    save();
  };

  // Nav icons setup
  document.querySelectorAll('nav [data-icon]').forEach((el) => {
    const iconName = el.dataset.icon;
    if (icons[iconName]) {
      el.innerHTML = icons[iconName];
    }
  });

  // Page switching
  document.querySelectorAll('[data-page]').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('main section').forEach((s) => {
        s.hidden = s.id !== b.dataset.page;
      });
      document.querySelectorAll('nav button').forEach((x) => {
        x.classList.toggle('active', x === b);
      });
      $('title').textContent = {
        lista: 'Lista de compras',
        historico: 'Compras que contam histórias',
        precos: 'De olho nos preços',
        despensa: 'O que já tem em casa'
      }[b.dataset.page];
      render();
    };
  });

  // Add Item form
  $('add').onsubmit = (e) => {
    e.preventDefault();
    const priceVal = $('price').value.trim();
    const price = priceVal === '' ? 0 : num(priceVal);
    const qty = num($('qty').value);
    const name = $('name').value.trim();

    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty <= 0) {
      return toast('Confira nome, quantidade e preço.');
    }

    state.items.push({
      id: crypto.randomUUID(),
      name,
      qty,
      unit: $('unit').value,
      price,
      pricePending: priceVal === '',
      checked: false
    });
    state.note = null;
    save();
    render();

    $('name').value = '';
    $('price').value = '';
    $('qty').value = 1;
    $('productDetails').open = false;
    $('name').focus();
  };

  // Buttons
  $('finishBtn')?.addEventListener('click', finish);
  $('scanLabelBtn')?.addEventListener('click', () => scan('label'));
  $('openReceiptBtn')?.addEventListener('click', openReceipt);
  $('backupBtn')?.addEventListener('click', backup);
  $('triggerRestoreBtn')?.addEventListener('click', () => $('restore').click());
  $('closeReceiptBtn')?.addEventListener('click', () => $('receipt').close());
  $('scanQrBtn')?.addEventListener('click', () => scan('qr'));
  $('closeScannerBtn')?.addEventListener('click', () => $('scanner').close());
  $('checkReceiptBtn')?.addEventListener('click', checkReceipt);

  // Restore file input
  $('restore').onchange = async (e) => {
    try {
      const s = JSON.parse(await e.target.files[0].text());
      const valid = (i) => typeof i.name === 'string' && ['un', 'kg', 'L'].includes(i.unit) && Number.isFinite(i.qty) && i.qty >= 0;
      const priced = (i) => valid(i) && Number.isFinite(i.price) && i.price >= 0 && typeof i.id === 'string';

      if (
        !Array.isArray(s.items) ||
        !s.items.every(priced) ||
        !Array.isArray(s.history) ||
        !Array.isArray(s.pantry) ||
        !s.pantry.every(valid)
      ) {
        throw new Error();
      }

      if (confirm('Substituir os dados atuais por este backup?')) {
        state = s;
        save();
        location.reload();
      }
    } catch {
      toast('Backup inválido. Os dados atuais foram preservados.');
    }
    e.target.value = '';
  };

  // OCR and QR Code photo capture
  $('photo').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      $('scanStatus').textContent = 'Lendo imagem…';
      if (mode === 'label') {
        const tesseract = window.Tesseract;
        if (!tesseract) throw new Error('Leitor OCR indisponível.');
        const result = await tesseract.recognize(file, 'por');
        $('ocrText').value = result.data.text;
        $('ocrReview').hidden = false;
        $('scanStatus').textContent = 'Leitura concluída. Revise o resultado.';
      } else {
        const bmp = await createImageBitmap(file);
        const c = document.createElement('canvas');
        const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
        c.width = bmp.width * scale;
        c.height = bmp.height * scale;
        const ctx = c.getContext('2d');
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        bmp.close();

        const data = ctx.getImageData(0, 0, c.width, c.height);
        const jsQR = window.jsQR;
        if (!jsQR) throw new Error('Leitor de QR indisponível.');
        const qr = jsQR(data.data, c.width, c.height);
        if (!qr) throw new Error('QR Code não encontrado. Tente uma foto mais próxima.');

        const u = new URL(qr.data);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') {
          throw new Error('O QR Code não contém um link de consulta.');
        }

        $('qrurl').value = u.href;
        $('scanner').close();
        toast('QR Code lido. Abra a consulta e confira os valores.');
      }
    } catch (err) {
      $('scanStatus').textContent = err.message || 'Não foi possível ler esta imagem. Tente novamente.';
    }
  };

  // Use OCR
  $('useOcrBtn')?.addEventListener('click', () => {
    $('productDetails').open = true;
    const text = $('ocrText').value;
    const prices = [...text.matchAll(/\d+[,.]\d{2}\b/g)];
    $('name').value = text.split('\n').find((l) => /[a-zÀ-ú]{3}/i.test(l))?.trim() || '';
    if (prices.length) $('price').value = prices[0][0];
    $('scanner').close();
    toast('Sugestão preenchida. Revise nome e preço antes de adicionar.');
  });

  // Visit receipt URL
  $('visitReceiptBtn')?.addEventListener('click', () => {
    try {
      const u = new URL($('qrurl').value);
      if (!['https:', 'http:'].includes(u.protocol)) throw new Error();
      window.open(u.href, '_blank', 'noopener,noreferrer');
    } catch {
      toast('Informe um link válido de consulta da nota.');
    }
  });

  // XML Import
  $('xml')?.addEventListener('change', async (e) => {
    try {
      const doc = new DOMParser().parseFromString(await e.target.files[0].text(), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error();
      const find = (node, name) => [...node.getElementsByTagNameNS('*', name)][0];
      const tot = find(doc, 'ICMSTot');
      if (!tot || !find(tot, 'vNF')) throw new Error();

      $('receiptTotal').value = find(tot, 'vNF').textContent;
      $('tax').value = find(tot, 'vTotTrib')?.textContent || '';

      xmlItems = [...doc.getElementsByTagNameNS('*', 'det')].map((d) => {
        const p = find(d, 'prod');
        return {
          name: find(p, 'xProd')?.textContent || '',
          qty: Number(find(p, 'qCom')?.textContent),
          price: Number(find(p, 'vUnCom')?.textContent),
          unit: find(p, 'uCom')?.textContent || ''
        };
      });

      $('xmlitems').innerHTML =
        '<h2 style="margin-top:24px">Itens da nota — confira com sua lista</h2>' +
        xmlItems
          .map(
            (i) => `
        <div class="item">
          <div class="desc">${esc(i.name)}<small>${i.qty} ${esc(i.unit)} × ${money(i.price)}</small></div>
          <b>${money(i.qty * i.price)}</b>
        </div>`
          )
          .join('');

      checkReceipt();
    } catch {
      toast('XML inválido ou sem total de NF-e/NFC-e.');
    }
    e.target.value = '';
  });

  // Dynamic Island creation for Mobile
  const island = document.createElement('div');
  island.className = 'mobile-island';
  island.innerHTML = `
    <span class="pulse"></span>
    <div class="island-copy">
      <small id="islandStatus">Sua compra, ao vivo</small>
      <b id="islandTotal">R$ 0,00</b>
    </div>
    <button type="button" id="islandScanBtn" aria-label="Fotografar etiqueta">${icons.camera}</button>
  `;
  document.body.append(island);
  island.querySelector('#islandScanBtn')?.addEventListener('click', () => scan('label'));

  render();
});
