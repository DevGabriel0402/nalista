import React, { useState, useEffect, useMemo, useRef } from 'react';
import { icons } from './icons.js';
import {
  formatCurrency,
  parseCurrencyInput,
  maskCurrency,
  CATEGORIES,
  detectCategory,
  triggerHaptic
} from './utils.js';

const key = (i) => i.name.trim().toLocaleLowerCase() + '|' + i.unit;

const fresh = () => ({
  items: [],
  history: [],
  pantry: [],
  budget: 0,
  date: new Date().toLocaleDateString('en-CA'),
  market: '',
  note: null
});

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nalista-v1'));
      return saved ? { ...fresh(), ...saved } : fresh();
    } catch {
      return fresh();
    }
  });

  const [page, setPage] = useState('lista');
  const [toastMessage, setToastMessage] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nalista-dark') === 'true');
  const [marketMode, setMarketMode] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Custom Interactive Dialog Modal (replaces window.alert, window.confirm, window.prompt)
  const [dialogState, setDialogState] = useState(null); // { type: 'alert'|'confirm'|'prompt', title, message, defaultValue, onConfirm, onCancel }
  const [dialogInput, setDialogInput] = useState('');

  // Modals
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('label'); // 'label' | 'qr'
  const [scanStatus, setScanStatus] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [showOcrReview, setShowOcrReview] = useState(false);

  // Form input states
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('un');
  const [itemCategory, setItemCategory] = useState('outros');
  const [itemPriceDisplay, setItemPriceDisplay] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Receipt Modal form
  const [qrUrl, setQrUrl] = useState('');
  const [receiptTotalDisplay, setReceiptTotalDisplay] = useState('');
  const [receiptTaxDisplay, setReceiptTaxDisplay] = useState('');
  const [xmlItems, setXmlItems] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);

  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Helpers to show custom modals instead of native browser popups
  function showAlert(message, title = 'Aviso') {
    return new Promise((resolve) => {
      setDialogState({
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          setDialogState(null);
          resolve(true);
        }
      });
    });
  }

  function showConfirm(message, title = 'Confirmação') {
    return new Promise((resolve) => {
      setDialogState({
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setDialogState(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogState(null);
          resolve(false);
        }
      });
    });
  }

  function showPrompt(message, defaultValue = '', title = 'Preencher Informação') {
    return new Promise((resolve) => {
      setDialogInput(defaultValue);
      setDialogState({
        type: 'prompt',
        title,
        message,
        defaultValue,
        onConfirm: (val) => {
          setDialogState(null);
          resolve(val);
        },
        onCancel: () => {
          setDialogState(null);
          resolve(null);
        }
      });
    });
  }

  // Dark mode & Market mode class toggling
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('nalista-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle('market-mode-active', marketMode);
  }, [marketMode]);

  // Auto-save state
  useEffect(() => {
    try {
      localStorage.setItem('nalista-v1', JSON.stringify(state));
    } catch {
      showToast('Não foi possível salvar os dados localmente.');
    }
  }, [state]);

  function showToast(msg) {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 4000);
  }

  function handleNameChange(text) {
    setItemName(text);
    const cat = detectCategory(text);
    setItemCategory(cat);
  }

  function handlePriceInputChange(e) {
    const raw = e.target.value;
    setItemPriceDisplay(maskCurrency(raw));
  }

  // Derived values
  const total = useMemo(() => {
    return Math.round(state.items.reduce((s, i) => s + i.qty * (i.price || 0), 0) * 100) / 100;
  }, [state.items]);

  const pendingPricesCount = useMemo(() => {
    return state.items.filter((i) => i.pricePending).length;
  }, [state.items]);

  const checkedCount = useMemo(() => {
    return state.items.filter((i) => i.checked).length;
  }, [state.items]);

  const groupedItems = useMemo(() => {
    if (!groupByCategory) return { all: state.items };
    const groups = {};
    state.items.forEach((item) => {
      const cat = item.category || detectCategory(item.name);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [state.items, groupByCategory]);

  const expiringPantryCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const limitDate = futureDate.toLocaleDateString('en-CA');

    return state.pantry.filter((p) => p.expiry && p.expiry <= limitDate).length;
  }, [state.pantry]);

  const budgetPercent = useMemo(() => {
    if (!state.budget || state.budget <= 0) return 0;
    return Math.min(100, Math.round((total / state.budget) * 100));
  }, [total, state.budget]);

  const budgetColor = useMemo(() => {
    if (budgetPercent > 100) return '#ef4444';
    if (budgetPercent > 80) return '#f59e0b';
    return '#2563eb';
  }, [budgetPercent]);

  // Actions: Checklist
  function handleAddItem(e) {
    e.preventDefault();
    const price = parseCurrencyInput(itemPriceDisplay);
    const qty = Number(String(itemQty).replace(',', '.'));
    const name = itemName.trim();

    if (!name || isNaN(qty) || qty <= 0) {
      return showToast('Confira o nome e a quantidade do item.');
    }

    const newItem = {
      id: crypto.randomUUID(),
      name,
      qty,
      unit: itemUnit,
      category: itemCategory,
      price,
      pricePending: !itemPriceDisplay.trim(),
      checked: false
    };

    setState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      note: null
    }));

    setItemName('');
    setItemPriceDisplay('');
    setItemQty('1');
    setIsDetailsOpen(false);
    triggerHaptic();
  }

  function handleToggleItem(id) {
    triggerHaptic();
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    }));
  }

  function handleRemoveItem(id) {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
      note: null
    }));
  }

  async function handleSetItemPrice(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    const initialVal = item.pricePending ? '' : maskCurrency(Math.round(item.price * 100));
    const answer = await showPrompt(
      `Digite o valor unitário para "${item.name}":`,
      initialVal,
      'Preço do Produto'
    );
    if (answer === null) return;

    const value = parseCurrencyInput(answer);
    if (isNaN(value) || value < 0) {
      return showToast('Informe um preço válido.');
    }

    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, price: value, pricePending: false } : i)),
      note: null
    }));
    triggerHaptic();
  }

  async function handleSetBudget() {
    const current = state.budget ? maskCurrency(Math.round(state.budget * 100)) : '';
    const answer = await showPrompt(
      'Defina o valor limite de orçamento para esta compra:',
      current,
      'Meta de Orçamento'
    );
    if (answer === null) return;
    const value = parseCurrencyInput(answer);
    setState((prev) => ({ ...prev, budget: value }));
    showToast(value > 0 ? `Meta de orçamento ajustada para ${formatCurrency(value)}` : 'Meta de orçamento removida.');
  }

  async function handleFinishPurchase() {
    if (!state.items.length) {
      return showAlert('Adicione pelo menos um produto na lista antes de concluir.', 'Lista Vazia');
    }
    if (state.items.some((i) => i.pricePending)) {
      return showAlert('Preencha os preços pendentes (+ preço) antes de concluir a compra.', 'Preços Pendentes');
    }
    if (!state.date) {
      return showAlert('Escolha a data da compra.', 'Data Obrigatória');
    }

    const confirmed = await showConfirm(
      'Deseja concluir esta compra? Os produtos adquiridos serão adicionados à sua despensa.',
      'Concluir Compra'
    );
    if (!confirmed) return;

    setState((prev) => {
      const updatedPantry = [...prev.pantry];
      prev.items.forEach((item) => {
        const existing = updatedPantry.find((p) => key(p) === key(item) && !p.expiry);
        if (existing) {
          existing.qty += item.qty;
        } else {
          updatedPantry.push({
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            category: item.category || detectCategory(item.name),
            expiry: ''
          });
        }
      });

      return {
        ...prev,
        history: [
          ...prev.history,
          {
            date: prev.date,
            market: prev.market,
            items: structuredClone(prev.items),
            total,
            note: prev.note
          }
        ],
        pantry: updatedPantry,
        items: [],
        note: null
      };
    });

    setMarketMode(false);
    showToast('Compra finalizada e despensa abastecida!');
  }

  function handleRestockPantry(item) {
    const newItem = {
      id: crypto.randomUUID(),
      name: item.name,
      qty: 1,
      unit: item.unit,
      category: item.category || detectCategory(item.name),
      price: 0,
      pricePending: true,
      checked: false
    };

    setState((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    triggerHaptic();
    showToast(`"${item.name}" adicionado à lista de compras!`);
  }

  async function handleConsumePantry(index) {
    const item = state.pantry[index];
    if (!item) return;

    const val = await showPrompt(
      `Informe a quantidade consumida de "${item.name}" (${item.unit}):`,
      '1',
      'Consumir Produto'
    );
    if (val === null) return;

    const q = Number(String(val).replace(',', '.'));
    if (isNaN(q) || q <= 0 || q > item.qty) {
      return showToast('Informe uma quantidade válida até o saldo disponível.');
    }

    setState((prev) => {
      const newPantry = [...prev.pantry];
      newPantry[index] = {
        ...newPantry[index],
        qty: Math.max(0, newPantry[index].qty - q)
      };
      return { ...prev, pantry: newPantry };
    });
    triggerHaptic();
  }

  function handleUpdatePantryExpiry(index, expiryDate) {
    setState((prev) => {
      const newPantry = [...prev.pantry];
      newPantry[index] = { ...newPantry[index], expiry: expiryDate };
      return { ...prev, pantry: newPantry };
    });
  }

  function handleBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'na-lista-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleRestore(e) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);

      const valid = (i) =>
        typeof i.name === 'string' && ['un', 'kg', 'L'].includes(i.unit) && Number.isFinite(i.qty) && i.qty >= 0;
      const priced = (i) => valid(i) && Number.isFinite(i.price) && i.price >= 0 && typeof i.id === 'string';

      if (
        !Array.isArray(parsed.items) ||
        !parsed.items.every(priced) ||
        !Array.isArray(parsed.history) ||
        !Array.isArray(parsed.pantry) ||
        !parsed.pantry.every(valid)
      ) {
        throw new Error();
      }

      const confirmed = await showConfirm(
        'Tem certeza que deseja substituir todos os dados atuais por este arquivo de backup?',
        'Restaurar Backup'
      );

      if (confirmed) {
        setState({ ...fresh(), ...parsed });
        showToast('Backup restaurado com sucesso!');
      }
    } catch {
      showAlert('Arquivo de backup inválido. Os dados atuais foram preservados.', 'Erro no Backup');
    }
    e.target.value = '';
  }

  function openScanner(mode) {
    setScannerMode(mode);
    setScanStatus('');
    setOcrText('');
    setShowOcrReview(false);
    setIsScannerOpen(true);
  }

  async function handlePhotoCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanStatus('Processando imagem…');
      if (scannerMode === 'label') {
        const tesseract = window.Tesseract;
        if (!tesseract) throw new Error('Leitor OCR indisponível.');
        const result = await tesseract.recognize(file, 'por');
        setOcrText(result.data.text);
        setShowOcrReview(true);
        setScanStatus('Leitura concluída com sucesso!');
      } else {
        const bmp = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
        canvas.width = bmp.width * scale;
        canvas.height = bmp.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        bmp.close();

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const jsQR = window.jsQR;
        if (!jsQR) throw new Error('Leitor de QR indisponível.');
        const qr = jsQR(data.data, canvas.width, canvas.height);
        if (!qr) throw new Error('QR Code não detectado. Tente aproximar a câmera.');

        const u = new URL(qr.data);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') {
          throw new Error('O QR Code não possui um link de consulta válido.');
        }

        setQrUrl(u.href);
        setIsScannerOpen(false);
        showToast('QR Code reconhecido com sucesso!');
      }
    } catch (err) {
      setScanStatus(err.message || 'Erro ao processar imagem.');
    }
  }

  function handleUseOcr() {
    setIsDetailsOpen(true);
    const prices = [...ocrText.matchAll(/\d+[,.]\d{2}\b/g)];
    const detectedName = ocrText.split('\n').find((l) => /[a-zÀ-ú]{3}/i.test(l))?.trim() || '';

    if (detectedName) handleNameChange(detectedName);
    if (prices.length) {
      const cleanVal = prices[0][0].replace(',', '.');
      setItemPriceDisplay(maskCurrency(Math.round(Number(cleanVal) * 100)));
    }

    setIsScannerOpen(false);
    showToast('Campos preenchidos a partir da etiqueta!');
  }

  function handleCheckReceipt() {
    if (state.items.some((i) => i.pricePending)) {
      return showAlert('Preencha os preços da lista antes de conferir a nota.', 'Preços Pendentes');
    }
    const t = parseCurrencyInput(receiptTotalDisplay);
    const tax = receiptTaxDisplay.trim() ? parseCurrencyInput(receiptTaxDisplay) : null;

    if (!receiptTotalDisplay.trim() || t <= 0) {
      return showAlert('Informe o total da nota fiscal para realizar a conferência.', 'Valor da Nota');
    }

    setState((prev) => ({
      ...prev,
      note: { total: t, tax, url: qrUrl }
    }));

    const diff = Math.round((t - total) * 100) / 100;
    setReconciliation({ diff, total: t, tax });
  }

  async function handleXmlUpload(e) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const doc = new DOMParser().parseFromString(await file.text(), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error();

      const find = (node, tag) => [...node.getElementsByTagNameNS('*', tag)][0];
      const tot = find(doc, 'ICMSTot');
      if (!tot || !find(tot, 'vNF')) throw new Error();

      const vNf = Number(find(tot, 'vNF').textContent);
      const vTotTrib = find(tot, 'vTotTrib')?.textContent;

      setReceiptTotalDisplay(maskCurrency(Math.round(vNf * 100)));
      if (vTotTrib) {
        setReceiptTaxDisplay(maskCurrency(Math.round(Number(vTotTrib) * 100)));
      }

      const items = [...doc.getElementsByTagNameNS('*', 'det')].map((d) => {
        const prod = find(d, 'prod');
        return {
          name: find(prod, 'xProd')?.textContent || '',
          qty: Number(find(prod, 'qCom')?.textContent),
          price: Number(find(prod, 'vUnCom')?.textContent),
          unit: find(prod, 'uCom')?.textContent || ''
        };
      });

      setXmlItems(items);
      showToast('XML importado com sucesso!');
    } catch {
      showAlert('Arquivo XML inválido ou fora do formato padrão de NF-e / NFC-e.', 'Erro no XML');
    }
    e.target.value = '';
  }

  const priceChanges = useMemo(() => {
    const latest = state.history.at(-1);
    const prev = state.history.at(-2);
    if (!latest || !prev) return [];

    const aggregate = (items) => {
      const map = new Map();
      items.forEach((i) => {
        const k = key(i);
        const a = map.get(k) || { name: i.name, qty: 0, cost: 0 };
        a.qty += i.qty;
        a.cost += i.qty * i.price;
        map.set(k, a);
      });
      return map;
    };

    const mapA = aggregate(latest.items);
    const mapB = aggregate(prev.items);
    const list = [];

    mapA.forEach((v, k) => {
      const p = mapB.get(k);
      if (p && p.cost > 0) {
        list.push({
          name: v.name,
          old: p.cost / p.qty,
          now: v.cost / v.qty,
          delta: ((v.cost / v.qty) / (p.cost / p.qty) - 1) * 100
        });
      }
    });

    list.sort((a, b) => b.delta - a.delta);
    return list;
  }, [state.history]);

  const maxDelta = useMemo(() => {
    return Math.max(1, ...priceChanges.map((c) => Math.abs(c.delta)));
  }, [priceChanges]);

  return (
    <>
      {/* Mobile Dynamic Island */}
      <div className="mobile-island">
        <span className="pulse"></span>
        <div className="island-copy">
          <small>{pendingPricesCount > 0 ? 'Total parcial' : 'Total da lista'}</small>
          <b>{formatCurrency(total)}</b>
        </div>
        <button
          type="button"
          onClick={() => openScanner('label')}
          aria-label="Fotografar etiqueta"
          dangerouslySetInnerHTML={{ __html: icons.camera }}
        ></button>
      </div>

      {/* Sidebar Desktop */}
      <aside>
        <div className="logo">
          ▧ na<span>lista</span>
        </div>
        <p>SUPERMERCADO INTELIGENTE</p>

        <nav id="primaryNav" aria-label="Navegação principal">
          <button
            type="button"
            className={page === 'lista' ? 'active' : ''}
            onClick={() => setPage('lista')}
          >
            <span className="nav-symbol" dangerouslySetInnerHTML={{ __html: icons.lista }}></span>
            <span className="nav-label">Lista</span>
          </button>
          <button
            type="button"
            className={page === 'historico' ? 'active' : ''}
            onClick={() => setPage('historico')}
          >
            <span className="nav-symbol" dangerouslySetInnerHTML={{ __html: icons.historico }}></span>
            <span className="nav-label">Compras</span>
          </button>
          <button
            type="button"
            className={page === 'precos' ? 'active' : ''}
            onClick={() => setPage('precos')}
          >
            <span className="nav-symbol" dangerouslySetInnerHTML={{ __html: icons.precos }}></span>
            <span className="nav-label">Preços</span>
          </button>
          <button
            type="button"
            className={page === 'despensa' ? 'active' : ''}
            onClick={() => setPage('despensa')}
          >
            <span className="nav-symbol" dangerouslySetInnerHTML={{ __html: icons.despensa }}></span>
            <span className="nav-label">Despensa</span>
            {expiringPantryCount > 0 && <span className="nav-badge">{expiringPantryCount}</span>}
          </button>
        </nav>

        <div className="foot">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>
          <span>● Dados salvos neste navegador</span>
        </div>
      </aside>

      {/* Main Container */}
      <main>
        <header>
          <div>
            <div className="eyebrow">CONTROLE TOTAL NO CARRINHO</div>
            <h1>
              {page === 'lista' && (marketMode ? 'Modo Mercado 🛒' : 'Lista de compras')}
              {page === 'historico' && 'Histórico de compras'}
              {page === 'precos' && 'Comparador de preços'}
              {page === 'despensa' && 'Minha despensa'}
            </h1>
            <p>
              {marketMode
                ? 'Visualização ampliada para fácil marcação no corredor.'
                : 'Planeje, confira valores e controle a despensa sem surpresas.'}
            </p>
          </div>

          <div className="header-badges">
            {page === 'lista' && (
              <button
                type="button"
                className="market-mode-toggle"
                onClick={() => setMarketMode(!marketMode)}
              >
                {marketMode ? 'Sair do Modo Mercado' : 'Modo Mercado 🛒'}
              </button>
            )}
            <span className="badge">✦ Simples & Rápido</span>
          </div>
        </header>

        {/* TAB 1: LISTA */}
        {page === 'lista' && (
          <section id="lista">
            <div className="panel simple-list">
              {/* Barra de Orçamento (Budget) */}
              <div className="budget-card">
                <div className="budget-header">
                  <span>
                    Meta de Orçamento{' '}
                    <button type="button" className="budget-edit-btn" onClick={handleSetBudget}>
                      (ajustar)
                    </button>
                  </span>
                  <b>
                    {formatCurrency(total)}{' '}
                    <small style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      / {state.budget ? formatCurrency(state.budget) : 'sem limite'}
                    </small>
                  </b>
                </div>
                {state.budget > 0 && (
                  <>
                    <div className="budget-track">
                      <div
                        className="budget-fill"
                        style={{
                          width: `${budgetPercent}%`,
                          background: budgetColor
                        }}
                      ></div>
                    </div>
                    <div className="budget-status">
                      <span>{budgetPercent}% do limite atingido</span>
                      <b style={{ color: budgetColor }}>
                        {total > state.budget
                          ? `Excedido em ${formatCurrency(total - state.budget)}`
                          : `Restam ${formatCurrency(state.budget - total)}`}
                      </b>
                    </div>
                  </>
                )}
              </div>

              {/* Form de Adicionar Item */}
              {!marketMode && (
                <form id="add" onSubmit={handleAddItem}>
                  <div className="simple-entry">
                    <input
                      value={itemName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      aria-label="Produto"
                      placeholder="O que precisa comprar? (Ex: Leite integral)"
                      autoComplete="off"
                    />
                    <button className="primary" type="submit">
                      Adicionar
                    </button>
                  </div>

                  <details
                    open={isDetailsOpen}
                    onToggle={(e) => setIsDetailsOpen(e.currentTarget.open)}
                  >
                    <summary>Quantidade, categoria e preço (opcional)</summary>
                    <div className="fields">
                      <div>
                        <label htmlFor="qty">Quantidade</label>
                        <input
                          id="qty"
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="unit">Unidade</label>
                        <select
                          id="unit"
                          value={itemUnit}
                          onChange={(e) => setItemUnit(e.target.value)}
                        >
                          <option value="un">un</option>
                          <option value="kg">kg</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="category">Categoria (corredor)</label>
                        <select
                          id="category"
                          value={itemCategory}
                          onChange={(e) => setItemCategory(e.target.value)}
                        >
                          {Object.values(CATEGORIES).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="price">Preço unitário (R$)</label>
                        <input
                          id="price"
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={itemPriceDisplay}
                          onChange={handlePriceInputChange}
                        />
                      </div>
                    </div>
                  </details>
                </form>
              )}

              {/* Filtro / Agrupamento por Corredor */}
              {state.items.length > 0 && !marketMode && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0 6px' }}>
                  <button
                    type="button"
                    style={{ fontSize: 11, padding: '4px 10px', background: 'transparent' }}
                    onClick={() => setGroupByCategory(!groupByCategory)}
                  >
                    {groupByCategory ? '📂 Desagrupar categorias' : '📁 Agrupar por corredor'}
                  </button>
                </div>
              )}

              {/* Items List */}
              <div id="items">
                {state.items.length === 0 ? (
                  <div className="empty">
                    Sua lista está vazia.<br />Adicione o primeiro produto acima.
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedItems).map(([catKey, items]) => {
                      const catInfo = CATEGORIES[catKey] || { label: 'Geral', icon: '🛒' };
                      return (
                        <div key={catKey} className={groupByCategory ? 'category-group' : ''}>
                          {groupByCategory && items.length > 0 && (
                            <div className="category-group-header">
                              <span>{catInfo.icon}</span>
                              <h3>{catInfo.label}</h3>
                              <span className="category-group-count">{items.length}</span>
                            </div>
                          )}

                          {items.map((i) => (
                            <div
                              key={i.id}
                              className={`todo-row ${i.checked ? 'is-done' : ''}`}
                            >
                              <label className="todo-target" htmlFor={`check-${i.id}`}>
                                <input
                                  id={`check-${i.id}`}
                                  type="checkbox"
                                  checked={i.checked}
                                  onChange={() => handleToggleItem(i.id)}
                                />
                                <span className="todo-circle" aria-hidden="true">
                                  <svg viewBox="0 0 20 20" fill="none">
                                    <path
                                      d="m5 10 3 3 7-7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                                <span className="todo-copy">
                                  <b>{i.name}</b>
                                  <small>
                                    {i.qty} {i.unit}
                                    {i.price > 0 && ` · ${formatCurrency(i.price)}/${i.unit}`}
                                  </small>
                                </span>
                              </label>

                              <button
                                className="item-price"
                                type="button"
                                onClick={() => handleSetItemPrice(i.id)}
                              >
                                {i.pricePending ? '+ preço' : formatCurrency(i.qty * i.price)}
                              </button>

                              {!marketMode && (
                                <button
                                  className="todo-remove"
                                  type="button"
                                  aria-label={`Remover ${i.name}`}
                                  onClick={() => handleRemoveItem(i.id)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    <p className="simple-status" role="status">
                      {checkedCount} de {state.items.length} produtos marcados
                    </p>
                  </>
                )}
              </div>

              {/* Total Summary */}
              <div className="simple-total">
                <span>
                  {pendingPricesCount > 0
                    ? `Total parcial · ${pendingPricesCount} ${pendingPricesCount === 1 ? 'item sem preço' : 'itens sem preço'}`
                    : 'Total da compra'}
                </span>
                <b>{formatCurrency(total)}</b>
              </div>

              <button
                className="primary finish-btn"
                type="button"
                onClick={handleFinishPurchase}
              >
                Concluir compra e abastecer despensa
              </button>

              {/* Opções e Backup */}
              {!marketMode && (
                <details className="simple-options">
                  <summary>Data, nota fiscal e opções de backup</summary>
                  <div className="fields">
                    <div>
                      <label htmlFor="date">Data da compra</label>
                      <input
                        type="date"
                        id="date"
                        value={state.date}
                        onChange={(e) => setState((p) => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="market">Mercado / Estabelecimento</label>
                      <input
                        id="market"
                        placeholder="Ex: Pão de Açúcar, Atacadão"
                        value={state.market}
                        onChange={(e) => setState((p) => ({ ...p, market: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="actions">
                    <button type="button" onClick={() => openScanner('label')}>
                      📸 Ler etiqueta (OCR)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptTotalDisplay(
                          state.note?.total ? maskCurrency(Math.round(state.note.total * 100)) : ''
                        );
                        setReceiptTaxDisplay(
                          state.note?.tax ? maskCurrency(Math.round(state.note.tax * 100)) : ''
                        );
                        setReconciliation(null);
                        setIsReceiptOpen(true);
                      }}
                    >
                      🧾 Conferir nota fiscal
                    </button>
                  </div>

                  <p style={{ marginTop: 14, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Seus dados ficam 100% salvos neste dispositivo. Exporte backups para guardá-los com segurança.
                  </p>

                  <div className="actions">
                    <button type="button" onClick={handleBackup}>
                      Exportar backup (.json)
                    </button>
                    <button type="button" onClick={() => restoreInputRef.current?.click()}>
                      Importar backup
                    </button>
                  </div>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleRestore}
                    hidden
                  />
                </details>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: HISTÓRICO */}
        {page === 'historico' && (
          <section id="historico">
            {state.history.length === 0 ? (
              <div className="panel empty">Suas compras concluídas aparecerão aqui.</div>
            ) : (
              state.history
                .slice()
                .reverse()
                .map((h, idx) => (
                  <div key={idx} className="panel history-card">
                    <div className="row">
                      <h2>{h.market || 'Compra no mercado'}</h2>
                      <b style={{ fontSize: 20 }}>{formatCurrency(h.note ? h.note.total : h.total)}</b>
                    </div>
                    <small className="muted">
                      {h.date} · {h.items.length} produtos ·{' '}
                      {h.note ? 'Nota fiscal conferida' : 'Sem nota conferida'}
                    </small>
                    <p style={{ margin: '12px 0' }}>
                      {h.items
                        .map((i) => `${i.name} (${i.qty} ${i.unit} · ${formatCurrency(i.price)})`)
                        .join(' · ')}
                    </p>
                    {h.note && (
                      <p className="muted">
                        Tributos informados:{' '}
                        {h.note.tax === null ? 'não informados' : formatCurrency(h.note.tax)} · Diferença da lista:{' '}
                        {formatCurrency(h.note.total - h.total)}
                      </p>
                    )}
                  </div>
                ))
            )}
          </section>
        )}

        {/* TAB 3: COMPARAR PREÇOS */}
        {page === 'precos' && (
          <section id="precos">
            <div className="panel">
              <h2>O que mudou desde a última compra?</h2>
              <p style={{ margin: '8px 0 20px', color: 'var(--color-text-muted)' }}>
                Comparação automática do preço unitário dos mesmos produtos nas duas compras mais recentes.
                Azul indica economia/queda; vermelho indica aumento.
              </p>

              {priceChanges.length === 0 ? (
                <div className="empty">
                  Conclua duas compras com produtos em comum para visualizar a evolução de preços.
                </div>
              ) : (
                priceChanges.map((c, i) => (
                  <div key={i} className="chartrow">
                    <span>
                      <b>{c.name}</b>
                      <small className="muted" style={{ display: 'block' }}>
                        {formatCurrency(c.old)} → {formatCurrency(c.now)}
                      </small>
                    </span>
                    <div
                      className="bar"
                      style={{
                        width: `${(Math.abs(c.delta) / maxDelta) * 100}%`,
                        background: c.delta > 0 ? '#ef4444' : '#2563eb'
                      }}
                    ></div>
                    <b style={{ color: c.delta > 0 ? '#ef4444' : '#2563eb' }}>
                      {c.delta > 0 ? '+' : ''}
                      {c.delta.toFixed(1)}%
                    </b>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 4: DESPENSA */}
        {page === 'despensa' && (
          <section id="despensa">
            <div className="panel">
              <div className="row">
                <h2>Minha Despensa</h2>
                {expiringPantryCount > 0 && (
                  <span className="badge" style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                    {expiringPantryCount} item(s) próximo(s) do vencimento
                  </span>
                )}
              </div>
              <p style={{ margin: '8px 0 20px', color: 'var(--color-text-muted)' }}>
                Ao concluir compras, os itens vêm para cá automaticamente. Dê baixa conforme consumir ou adicione novamente à lista em 1 clique.
              </p>

              {state.pantry.length === 0 ? (
                <div className="empty">Conclua uma compra para abastecer sua despensa.</div>
              ) : (
                state.pantry.map((item, n) => {
                  const today = new Date().toLocaleDateString('en-CA');
                  const isExpired = item.expiry && item.expiry < today;
                  const catInfo = CATEGORIES[item.category] || { icon: '▦' };

                  return (
                    <div key={n} className="pantry-item">
                      <div className="pantry-icon">{catInfo.icon}</div>
                      <div className="pantry-desc">
                        <b>{item.name}</b>
                        <small
                          style={{
                            display: 'block',
                            color: 'var(--color-text-muted)',
                            margin: '3px 0'
                          }}
                        >
                          {item.qty.toFixed(3).replace(/\.?0+$/, '')} {item.unit} em estoque
                        </small>
                        <label htmlFor={`exp-${n}`}>Data de Validade</label>
                        <input
                          id={`exp-${n}`}
                          type="date"
                          value={item.expiry || ''}
                          onChange={(e) => handleUpdatePantryExpiry(n, e.target.value)}
                        />
                        {isExpired && (
                          <small
                            style={{
                              color: 'var(--color-danger)',
                              display: 'block',
                              marginTop: 4,
                              fontWeight: 700
                            }}
                          >
                            ⚠️ Validade vencida!
                          </small>
                        )}
                      </div>

                      <div className="pantry-actions">
                        <button type="button" onClick={() => handleConsumePantry(n)}>
                          Consumir
                        </button>
                        <button
                          type="button"
                          className="primary"
                          title="Adicionar à lista de compras"
                          onClick={() => handleRestockPantry(item)}
                        >
                          + Lista
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {/* CUSTOM DIALOG MODAL (Alert / Confirm / Prompt) */}
      {dialogState && (
        <div className="modal-overlay" onClick={() => (dialogState.type === 'alert' ? dialogState.onConfirm() : dialogState.onCancel?.())}>
          <div className="dialog-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-modal-header">
              <span className="dialog-modal-icon">
                {dialogState.type === 'alert' ? 'ℹ️' : dialogState.type === 'confirm' ? '❓' : '✏️'}
              </span>
              <h3 className="dialog-modal-title">{dialogState.title}</h3>
            </div>

            <p className="dialog-modal-message">{dialogState.message}</p>

            {dialogState.type === 'prompt' && (
              <input
                className="dialog-modal-input"
                autoFocus
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') dialogState.onConfirm(dialogInput);
                  if (e.key === 'Escape') dialogState.onCancel?.();
                }}
              />
            )}

            <div className="dialog-modal-buttons">
              {dialogState.type !== 'alert' && (
                <button type="button" onClick={() => dialogState.onCancel?.()}>
                  Cancelar
                </button>
              )}
              <button
                type="button"
                className="primary"
                onClick={() => {
                  if (dialogState.type === 'prompt') {
                    dialogState.onConfirm(dialogInput);
                  } else {
                    dialogState.onConfirm();
                  }
                }}
              >
                {dialogState.type === 'confirm' ? 'Confirmar' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFERIR NOTA FISCAL */}
      {isReceiptOpen && (
        <div className="modal-overlay" onClick={() => setIsReceiptOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Conferir nota fiscal</h2>
              <button
                className="modal-close"
                type="button"
                onClick={() => setIsReceiptOpen(false)}
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={() => openScanner('qr')}
            >
              📸 Ler QR Code da nota fiscal
            </button>

            <label htmlFor="qrurl">Link da consulta da nota</label>
            <input
              id="qrurl"
              placeholder="https://…"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
            />

            <button
              type="button"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => {
                try {
                  const u = new URL(qrUrl);
                  if (!['https:', 'http:'].includes(u.protocol)) throw new Error();
                  window.open(u.href, '_blank', 'noopener,noreferrer');
                } catch {
                  showAlert('Informe um link de consulta válido.', 'Link Inválido');
                }
              }}
            >
              Abrir consulta oficial no navegador ↗
            </button>

            <p className="muted" style={{ margin: '14px 0' }}>
              Importe o XML da NF-e para preenchimento instantâneo ou digite o total abaixo:
            </p>

            <label htmlFor="xml">Importar arquivo XML (.xml)</label>
            <input type="file" id="xml" accept=".xml" onChange={handleXmlUpload} />

            <label htmlFor="receiptTotal">Total final da nota (R$)</label>
            <input
              id="receiptTotal"
              inputMode="numeric"
              placeholder="0,00"
              value={receiptTotalDisplay}
              onChange={(e) => setReceiptTotalDisplay(maskCurrency(e.target.value))}
            />

            <label htmlFor="tax">Tributos aproximados da nota (R$)</label>
            <input
              id="tax"
              inputMode="numeric"
              placeholder="0,00 (deixe vazio se não informado)"
              value={receiptTaxDisplay}
              onChange={(e) => setReceiptTaxDisplay(maskCurrency(e.target.value))}
            />

            {reconciliation && (
              <div className="summary">
                <b>
                  {Math.abs(reconciliation.diff) < 0.01
                    ? '✓ Total confere perfeitamente com a lista!'
                    : `Diferença da lista: ${formatCurrency(reconciliation.diff)}`}
                </b>
                <p style={{ marginTop: 6 }}>
                  Total da nota: {formatCurrency(reconciliation.total)}
                  <br />
                  {reconciliation.tax === null
                    ? 'Tributos não informados'
                    : `Tributos informados: ${formatCurrency(reconciliation.tax)} | Estimativa líquida: ${formatCurrency(reconciliation.total - reconciliation.tax)}`}
                </p>
              </div>
            )}

            <button
              className="primary"
              type="button"
              style={{ width: '100%', marginTop: 16 }}
              onClick={handleCheckReceipt}
            >
              Conferir valores
            </button>

            {xmlItems.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3>Itens importados da nota ({xmlItems.length})</h3>
                {xmlItems.map((item, idx) => (
                  <div key={idx} className="pantry-item">
                    <div className="pantry-desc">
                      <b>{item.name}</b>
                      <small className="muted" style={{ display: 'block' }}>
                        {item.qty} {item.unit} × {formatCurrency(item.price)}
                      </small>
                    </div>
                    <b>{formatCurrency(item.qty * item.price)}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {isScannerOpen && (
        <div className="modal-overlay" onClick={() => setIsScannerOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{scannerMode === 'qr' ? 'Ler QR Code da Nota' : 'Ler Etiqueta de Preço'}</h2>
              <button
                className="modal-close"
                type="button"
                onClick={() => setIsScannerOpen(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ marginBottom: 14, color: 'var(--color-text-muted)' }}>
              Tire uma foto nítida e com boa iluminação da etiqueta ou do QR Code.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
            />

            {scanStatus && (
              <p
                style={{
                  margin: '14px 0',
                  fontWeight: 600,
                  color: 'var(--color-primary)'
                }}
              >
                {scanStatus}
              </p>
            )}

            {showOcrReview && (
              <div style={{ marginTop: 14 }}>
                <label htmlFor="ocrText">Texto reconhecido na imagem:</label>
                <textarea
                  id="ocrText"
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  style={{ minHeight: 120, marginTop: 6 }}
                />
                <button
                  className="primary"
                  type="button"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={handleUseOcr}
                >
                  Usar dados na lista
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
}
