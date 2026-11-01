import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSync } from "../useSync.js";
import useDialogs from "./useDialogs.js";
import useListView from "./useListView.js";
import {
  CATEGORIES,
  DEFAULT_CATEGORY_ORDER,
  detectCategory,
  formatCurrency,
  maskCurrency,
  parseCurrencyInput,
  triggerHaptic,
} from "../utils.js";

export const createInitialState = () => ({
  items: [],
  history: [],
  pantry: [],
  budget: 0,
  date: new Date().toLocaleDateString("en-CA"),
  market: "",
  note: null,
  categoryOrder: [...DEFAULT_CATEGORY_ORDER],
});

const itemKey = (item) => `${item.name.trim().toLocaleLowerCase()}|${item.unit}`;

function loadSavedState(userId) {
  try {
    const userKey = userId ? `nalista-v1-${userId}` : "nalista-v1";
    const stored = localStorage.getItem(userKey);
    const legacy = userId && !stored ? localStorage.getItem("nalista-v1") : null;
    const saved = JSON.parse(stored || legacy);
    return saved
      ? {
        ...createInitialState(),
        ...saved,
        categoryOrder: saved.categoryOrder && Array.isArray(saved.categoryOrder)
          ? saved.categoryOrder
          : [...DEFAULT_CATEGORY_ORDER],
      }
      : createInitialState();
  } catch {
    return createInitialState();
  }
}

export default function useAppState(userId) {
  const [state, setState] = useState(() => loadSavedState(userId));
  const [page, setPage] = useState("lista");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("nalista-dark") === "true",
  );
  const [marketMode, setMarketMode] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [itemSort, setItemSort] = useState("added");
  const [itemSearch, setItemSearch] = useState("");
  const [itemFilter, setItemFilter] = useState("all");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const { userId: syncedUserId } = useSync(state, setState, setSyncStatus, userId);

  useEffect(() => {
    setState(loadSavedState(userId));
  }, [userId]);

  const dialogs = useDialogs();
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState("label");
  const [scanStatus, setScanStatus] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("1");
  const [editUnit, setEditUnit] = useState("un");
  const [editCategory, setEditCategory] = useState("outros");
  const [editPriceDisplay, setEditPriceDisplay] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnit, setItemUnit] = useState("un");
  const [itemCategory, setItemCategory] = useState("outros");
  const [itemPriceDisplay, setItemPriceDisplay] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [receiptTotalDisplay, setReceiptTotalDisplay] = useState("");
  const [receiptTaxDisplay, setReceiptTaxDisplay] = useState("");
  const [xmlItems, setXmlItems] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);

  const showToast = useCallback((message, options = {}) => {
    if (options.type === "error") {
      toast.error(message);
    } else if (options.type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  }, []);

  const { showAlert, showConfirm, showPrompt } = dialogs;

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("nalista-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle("market-mode-active", marketMode);
  }, [marketMode]);

  const categoryOrder = state.categoryOrder || DEFAULT_CATEGORY_ORDER;

  const { total, pendingPricesCount, checkedCount, groupedItems, marketGroupedItems, expiringPantryCount, budgetPercent, budgetColor, priceChanges, maxDelta } = useListView(state, { groupByCategory, itemSort, itemSearch, itemFilter, categoryOrder });

  const handleNameChange = (value) => {
    setItemName(value);
    setItemCategory(detectCategory(value));
  };

  const handleAddItem = (event) => {
    event.preventDefault();
    const price = parseCurrencyInput(itemPriceDisplay);
    const qty = Number(String(itemQty).replace(",", "."));
    const name = itemName.trim();
    if (!name || Number.isNaN(qty) || qty <= 0)
      return toast.error("Confira o nome e a quantidade do item.");
    setState((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          id: crypto.randomUUID(),
          name,
          qty,
          unit: itemUnit,
          category: itemCategory,
          price,
          pricePending: !itemPriceDisplay.trim(),
          checked: false,
        },
      ],
      note: null,
    }));
    setItemName("");
    setItemPriceDisplay("");
    setItemQty("1");
    triggerHaptic();
    toast.success(`"${name}" adicionado à lista!`);
  };

  const handleToggleItem = (id) => {
    triggerHaptic();
    setState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  // Remove com suporte a Desfazer (Undo) via react-hot-toast
  const handleRemoveItem = (id) => {
    const itemToRemove = state.items.find((item) => item.id === id);
    if (!itemToRemove) return;

    const previousItems = state.items;
    const removedIndex = previousItems.findIndex((item) => item.id === id);

    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      note: null,
    }));
    triggerHaptic();

    toast(
      (t) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", width: "100%" }}>
          <span style={{ fontSize: 13 }}>
            <strong>{itemToRemove.name}</strong> removido.
          </span>
          <button
            type="button"
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              background: "#2563eb",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              cursor: "pointer",
            }}
            onClick={() => {
              toast.dismiss(t.id);
              setState((current) => {
                // Evita duplicidade caso clique mais de uma vez
                if (current.items.some((item) => item.id === itemToRemove.id)) {
                  return current;
                }
                const restored = [...current.items];
                const safeIndex = Math.min(Math.max(0, removedIndex), restored.length);
                restored.splice(safeIndex, 0, itemToRemove);
                return { ...current, items: restored };
              });
              toast.success(`"${itemToRemove.name}" restaurado!`, { id: `restored-${id}` });
              triggerHaptic();
            }}
          >
            Desfazer
          </button>
        </div>
      ),
      { duration: 5000, id: `undo-item-${id}` }
    );
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setEditName(item.name);
    setEditQty(String(item.qty));
    setEditUnit(item.unit);
    setEditCategory(item.category || detectCategory(item.name));
    setEditPriceDisplay(
      item.pricePending ? "" : maskCurrency(Math.round(item.price * 100)),
    );
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    const name = editName.trim();
    const qty = Number(String(editQty).replace(",", "."));
    if (!name || Number.isNaN(qty) || qty <= 0)
      return toast.error("Confira o nome e a quantidade.");
    const price = parseCurrencyInput(editPriceDisplay);
    setState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === editItem.id
          ? {
            ...item,
            name,
            qty,
            unit: editUnit,
            category: editCategory,
            price,
            pricePending: !editPriceDisplay.trim(),
          }
          : item,
      ),
    }));
    setEditItem(null);
    triggerHaptic();
    toast.success("Item atualizado!");
  };

  const handleSetItemPrice = async (id) => {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;
    const answer = await showPrompt(
      `Valor unitário para "${item.name}":`,
      item.pricePending ? "" : maskCurrency(Math.round(item.price * 100)),
      "Preço do Produto",
    );
    if (answer === null) return;
    const value = parseCurrencyInput(answer);
    if (Number.isNaN(value) || value < 0) return toast.error("Informe um preço válido.");
    setState((previous) => ({
      ...previous,
      items: previous.items.map((entry) =>
        entry.id === id ? { ...entry, price: value, pricePending: false } : entry,
      ),
      note: null,
    }));
    triggerHaptic();
    toast.success("Preço atualizado!");
  };

  const handleSetBudget = async () => {
    const answer = await showPrompt(
      "Valor limite de orçamento para esta compra:",
      state.budget ? maskCurrency(Math.round(state.budget * 100)) : "",
      "Meta de Orçamento",
    );
    if (answer === null) return;
    const value = parseCurrencyInput(answer);
    setState((previous) => ({ ...previous, budget: value }));
    if (value > 0) {
      toast.success(`Meta ajustada para ${formatCurrency(value)}`);
    } else {
      toast("Meta de orçamento removida.");
    }
  };

  const handleFinishPurchase = async () => {
    if (!state.items.length)
      return showAlert(
        "Adicione pelo menos um produto antes de concluir.",
        "Lista Vazia",
      );
    if (state.items.some((item) => item.pricePending))
      return showAlert(
        "Preencha os preços pendentes antes de concluir.",
        "Preços Pendentes",
      );
    if (!state.date) return showAlert("Escolha a data da compra.", "Data Obrigatória");
    if (
      !(await showConfirm(
        "Deseja concluir esta compra? Os itens serão adicionados à sua despensa.",
        "Concluir Compra",
      ))
    )
      return;
    setState((previous) => {
      const pantry = [...previous.pantry];
      previous.items.forEach((item) => {
        const existing = pantry.find(
          (entry) => itemKey(entry) === itemKey(item) && !entry.expiry,
        );
        if (existing) existing.qty += item.qty;
        else
          pantry.push({
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            category: item.category || detectCategory(item.name),
            expiry: "",
          });
      });
      return {
        ...previous,
        history: [
          ...previous.history,
          {
            date: previous.date,
            market: previous.market,
            items: structuredClone(previous.items),
            total,
            note: previous.note,
          },
        ],
        pantry,
        items: [],
        note: null,
      };
    });
    setMarketMode(false);
    toast.success("Compra finalizada e despensa abastecida! 🛒🎉");
  };

  const handleRestockPantry = (item) => {
    setState((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          id: crypto.randomUUID(),
          name: item.name,
          qty: 1,
          unit: item.unit,
          category: item.category || detectCategory(item.name),
          price: 0,
          pricePending: true,
          checked: false,
        },
      ],
    }));
    triggerHaptic();
    toast.success(`"${item.name}" adicionado à lista!`);
  };

  const handleConsumePantry = async (index) => {
    const item = state.pantry[index];
    if (!item) return;
    const value = await showPrompt(
      `Quantidade consumida de "${item.name}" (${item.unit}):`,
      "1",
      "Consumir Produto",
    );
    if (value === null) return;
    const quantity = Number(String(value).replace(",", "."));
    if (Number.isNaN(quantity) || quantity <= 0 || quantity > item.qty)
      return toast.error("Quantidade inválida.");
    setState((previous) => ({
      ...previous,
      pantry: previous.pantry.map((entry, itemIndex) =>
        itemIndex === index
          ? { ...entry, qty: Math.max(0, entry.qty - quantity) }
          : entry,
      ),
    }));
    triggerHaptic();
    toast.success(`Baixa registrada para "${item.name}"!`);
  };

  const handleUpdatePantryExpiry = (index, expiry) => {
    setState((previous) => ({
      ...previous,
      pantry: previous.pantry.map((item, itemIndex) =>
        itemIndex === index ? { ...item, expiry } : item,
      ),
    }));
    toast.success("Validade salva!");
  };

  const handleClearPantry = async () => {
    if (!state.pantry || state.pantry.length === 0) return;
    const answer = await showPrompt(
      "Esta ação removerá TODOS os itens da sua despensa de forma definitiva.",
      "",
      "Esvaziar Despensa",
      {
        danger: true,
        requiredKeyword: "excluir",
        confirmLabel: "Excluir Tudo",
      },
    );
    if (!answer) return;
    if (answer.trim().toLowerCase() === "excluir") {
      setState((previous) => ({
        ...previous,
        pantry: [],
      }));
      triggerHaptic();
      toast.success("Despensa esvaziada com sucesso!");
    }
  };

  const handleDeleteHistoryItem = async (originalIndex) => {
    const item = state.history[originalIndex];
    if (!item) return;
    const answer = await showPrompt(
      `Deseja realmente excluir a compra de ${item.date} (${item.market || "Mercado"})? Esta ação não pode ser desfeita.`,
      "",
      "Excluir Registro de Compra",
      {
        danger: true,
        requiredKeyword: "excluir",
        confirmLabel: "Excluir Registro",
      },
    );
    if (!answer) return;
    if (answer.trim().toLowerCase() === "excluir") {
      setState((previous) => ({
        ...previous,
        history: previous.history.filter((_, i) => i !== originalIndex),
      }));
      triggerHaptic();
      toast.success("Compra excluída do histórico!");
    }
  };

  // Mover categoria para cima/baixo na ordem da rota
  const handleMoveCategoryOrder = (catKey, direction) => {
    const order = [...(state.categoryOrder || DEFAULT_CATEGORY_ORDER)];
    const index = order.indexOf(catKey);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    // Troca
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;

    setState((prev) => ({ ...prev, categoryOrder: order }));
    triggerHaptic();
  };

  const handleResetCategoryOrder = () => {
    setState((prev) => ({ ...prev, categoryOrder: [...DEFAULT_CATEGORY_ORDER] }));
    toast.success("Ordem dos corredores restaurada para o padrão!");
  };

  // Compartilhamento via WhatsApp
  const handleShareWhatsApp = () => {
    if (!state.items || state.items.length === 0) {
      return toast.error("Sua lista está vazia!");
    }

    const title = `🛒 *Lista de Compras${state.market ? ` - ${state.market}` : ""}*`;
    const order = state.categoryOrder || DEFAULT_CATEGORY_ORDER;
    const grouped = order.reduce((acc, catKey) => {
      const items = state.items.filter((item) => (item.category || detectCategory(item.name)) === catKey);
      if (items.length > 0) acc[catKey] = items;
      return acc;
    }, {});

    // Agrupa itens restantes se houver
    state.items.forEach((item) => {
      const cat = item.category || detectCategory(item.name);
      if (!grouped[cat]) {
        grouped[cat] = [item];
      }
    });

    let text = `${title}\n📅 ${new Date().toLocaleDateString("pt-BR")}\n\n`;

    Object.entries(grouped).forEach(([catKey, items]) => {
      const catInfo = CATEGORIES[catKey] || { label: "Outros", icon: "📦" };
      text += `${catInfo.icon} *${catInfo.label.toUpperCase()}*\n`;
      items.forEach((item) => {
        const check = item.checked ? "✅" : "⬜";
        const priceStr = item.price > 0 ? ` - ${formatCurrency(item.price * item.qty)}` : "";
        text += `${check} ${item.name} (${item.qty} ${item.unit}${priceStr})\n`;
      });
      text += "\n";
    });

    text += `💰 *Total Previsto:* ${formatCurrency(total)}\n`;
    text += `_Gerado por naLista_`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  const handleBackup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "na-lista-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Backup exportado!");
  };

  const handleRestore = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      const parsed = JSON.parse(await file.text());
      const valid = (item) =>
        typeof item.name === "string" &&
        ["un", "kg", "L"].includes(item.unit) &&
        Number.isFinite(item.qty) &&
        item.qty >= 0;
      const priced = (item) =>
        valid(item) &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        typeof item.id === "string";
      const validHistory = (purchase) =>
        purchase &&
        typeof purchase.date === "string" &&
        Array.isArray(purchase.items) &&
        purchase.items.every(priced) &&
        (purchase.market === undefined || typeof purchase.market === "string");
      if (
        !Array.isArray(parsed.items) ||
        !parsed.items.every(priced) ||
        !Array.isArray(parsed.history) ||
        !parsed.history.every(validHistory) ||
        !Array.isArray(parsed.pantry) ||
        !parsed.pantry.every(valid)
      )
        throw new Error();
      if (
        await showConfirm(
          "Substituir todos os dados atuais por este backup?",
          "Restaurar Backup",
        )
      ) {
        setState({ ...createInitialState(), ...parsed });
        toast.success("Backup restaurado com sucesso!");
      }
    } catch {
      showAlert("Arquivo de backup inválido.", "Erro no Backup");
    }
    event.target.value = "";
  };

  const openScanner = (mode) => {
    setScannerMode(mode);
    setScanStatus("");
    setOcrText("");
    setShowOcrReview(false);
    setIsScannerOpen(true);
  };

  const handleUseOcr = () => {
    const detectedName = ocrText
      .split("\n")
      .find((line) => /[a-zÀ-ú]{3}/i.test(line))
      ?.trim();
    const detectedPrice = ocrText.match(/\d+[,.]\d{2}\b/);
    if (detectedName) handleNameChange(detectedName);
    if (detectedPrice)
      setItemPriceDisplay(
        maskCurrency(Math.round(Number(detectedPrice[0].replace(",", ".")) * 100)),
      );
    setIsScannerOpen(false);
    toast.success("Campos preenchidos a partir da etiqueta!");
  };

  const handlePhotoCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setScanStatus("Processando imagem…");
      if (scannerMode === "label") {
        const { recognize } = await import("tesseract.js");
        const result = await recognize(file, "por");
        setOcrText(result.data.text);
        setShowOcrReview(true);
        setScanStatus("Leitura concluída!");
      } else {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
        canvas.width = bitmap.width * scale;
        canvas.height = bitmap.height * scale;
        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const { default: jsQR } = await import("jsqr");
        const result = jsQR(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
          canvas.width,
          canvas.height,
        );
        if (!result) throw new Error("QR Code não detectado.");
        const url = new URL(result.data);
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error("QR sem link válido.");
        setQrUrl(url.href);
        setIsScannerOpen(false);
        toast.success("QR Code reconhecido!");
      }
    } catch (error) {
      setScanStatus(error.message || "Erro ao processar imagem.");
      toast.error("Erro ao ler código ou etiqueta.");
    }
  };

  const handleCheckReceipt = () => {
    if (state.items.some((item) => item.pricePending))
      return showAlert(
        "Preencha os preços da lista antes de conferir.",
        "Preços Pendentes",
      );
    const receiptTotal = parseCurrencyInput(receiptTotalDisplay);
    const tax = receiptTaxDisplay.trim() ? parseCurrencyInput(receiptTaxDisplay) : null;
    if (!receiptTotalDisplay.trim() || receiptTotal <= 0)
      return showAlert("Informe o total da nota fiscal.", "Valor da Nota");
    setState((previous) => ({
      ...previous,
      note: { total: receiptTotal, tax, url: qrUrl },
    }));
    setReconciliation({
      diff: Math.round((receiptTotal - total) * 100) / 100,
      total: receiptTotal,
      tax,
    });
    toast.success("Nota conferida com a lista!");
  };

  const handleXmlUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      const documentXml = new DOMParser().parseFromString(
        await file.text(),
        "application/xml",
      );
      if (documentXml.querySelector("parsererror")) throw new Error();
      const find = (node, tag) => [...node.getElementsByTagNameNS("*", tag)][0];
      const totals = find(documentXml, "ICMSTot");
      if (!totals || !find(totals, "vNF")) throw new Error();
      const totalValue = Number(find(totals, "vNF").textContent);
      const taxValue = find(totals, "vTotTrib")?.textContent;
      setReceiptTotalDisplay(maskCurrency(Math.round(totalValue * 100)));
      if (taxValue)
        setReceiptTaxDisplay(maskCurrency(Math.round(Number(taxValue) * 100)));
      setXmlItems(
        [...documentXml.getElementsByTagNameNS("*", "det")].map((detail) => {
          const product = find(detail, "prod");
          return {
            name: find(product, "xProd")?.textContent || "",
            qty: Number(find(product, "qCom")?.textContent),
            price: Number(find(product, "vUnCom")?.textContent),
            unit: find(product, "uCom")?.textContent || "",
          };
        }),
      );
      toast.success("XML importado com sucesso!");
    } catch {
      showAlert("Arquivo XML inválido.", "Erro no XML");
    }
    event.target.value = "";
  };

  return {
    state,
    setState,
    page,
    setPage,
    darkMode,
    setDarkMode,
    marketMode,
    setMarketMode,
    groupByCategory,
    setGroupByCategory,
    itemSort,
    setItemSort,
    itemSearch,
    setItemSearch,
    itemFilter,
    setItemFilter,
    syncStatus,
    categoryOrder,
    isRouteModalOpen,
    setIsRouteModalOpen,
    total,
    pendingPricesCount,
    checkedCount,
    groupedItems,
    marketGroupedItems,
    expiringPantryCount,
    budgetPercent,
    budgetColor,
    priceChanges,
    maxDelta,
    restoreInputRef,
    fileInputRef,
    ...dialogs,
    isReceiptOpen,
    setIsReceiptOpen,
    isScannerOpen,
    setIsScannerOpen,
    scannerMode,
    scanStatus,
    ocrText,
    setOcrText,
    showOcrReview,
    editItem,
    setEditItem,
    editName,
    setEditName,
    editQty,
    setEditQty,
    editUnit,
    setEditUnit,
    editCategory,
    setEditCategory,
    editPriceDisplay,
    setEditPriceDisplay,
    itemName,
    itemQty,
    itemUnit,
    itemCategory,
    itemPriceDisplay,
    qrUrl,
    setQrUrl,
    receiptTotalDisplay,
    setReceiptTotalDisplay,
    receiptTaxDisplay,
    setReceiptTaxDisplay,
    xmlItems,
    reconciliation,
    setReconciliation,
    handleNameChange,
    handleAddItem,
    handleToggleItem,
    handleRemoveItem,
    openEditItem,
    handleSaveEdit,
    handleSetItemPrice,
    handleSetBudget,
    handleFinishPurchase,
    handleRestockPantry,
    handleConsumePantry,
    handleUpdatePantryExpiry,
    handleClearPantry,
    handleDeleteHistoryItem,
    handleMoveCategoryOrder,
    handleResetCategoryOrder,
    handleShareWhatsApp,
    handleBackup,
    handleRestore,
    openScanner,
    handleUseOcr,
    handlePhotoCapture,
    handleCheckReceipt,
    handleXmlUpload,
    setItemQty,
    setItemUnit,
    setItemCategory,
    setItemPriceDisplay,
    showAlert,
    showConfirm,
    showPrompt,
  };
}
