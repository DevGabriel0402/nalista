import { useCallback, useEffect, useRef, useState } from "react";
import { useSync } from "../useSync.js";
import useDialogs from "./useDialogs.js";
import useListView from "./useListView.js";
import {
  CATEGORIES,
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
});

const itemKey = (item) => `${item.name.trim().toLocaleLowerCase()}|${item.unit}`;

function loadSavedState(userId) {
  try {
    const userKey = userId ? `nalista-v1-${userId}` : "nalista-v1";
    const stored = localStorage.getItem(userKey);
    const legacy = userId && !stored ? localStorage.getItem("nalista-v1") : null;
    const saved = JSON.parse(stored || legacy);
    return saved ? { ...createInitialState(), ...saved } : createInitialState();
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
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);
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

  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 4000);
  }, []);

  const { showAlert, showConfirm, showPrompt } = dialogs;

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("nalista-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle("market-mode-active", marketMode);
  }, [marketMode]);

  const { total, pendingPricesCount, checkedCount, groupedItems, marketGroupedItems, expiringPantryCount, budgetPercent, budgetColor, priceChanges, maxDelta } = useListView(state, { groupByCategory, itemSort, itemSearch, itemFilter });

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
      return showToast("Confira o nome e a quantidade do item.");
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
  const handleRemoveItem = (id) =>
    setState((previous) => ({
      ...previous,
      items: previous.items.filter((item) => item.id !== id),
      note: null,
    }));
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
      return showToast("Confira o nome e a quantidade.");
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
    showToast("Item atualizado!");
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
    if (Number.isNaN(value) || value < 0) return showToast("Informe um preço válido.");
    setState((previous) => ({
      ...previous,
      items: previous.items.map((entry) =>
        entry.id === id ? { ...entry, price: value, pricePending: false } : entry,
      ),
      note: null,
    }));
    triggerHaptic();
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
    showToast(
      value > 0
        ? `Meta ajustada para ${formatCurrency(value)}`
        : "Meta de orçamento removida.",
    );
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
    showToast("Compra finalizada e despensa abastecida!");
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
    showToast(`"${item.name}" adicionado à lista!`);
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
      return showToast("Quantidade inválida.");
    setState((previous) => ({
      ...previous,
      pantry: previous.pantry.map((entry, itemIndex) =>
        itemIndex === index
          ? { ...entry, qty: Math.max(0, entry.qty - quantity) }
          : entry,
      ),
    }));
    triggerHaptic();
  };
  const handleUpdatePantryExpiry = (index, expiry) =>
    setState((previous) => ({
      ...previous,
      pantry: previous.pantry.map((item, itemIndex) =>
        itemIndex === index ? { ...item, expiry } : item,
      ),
    }));
  const handleBackup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "na-lista-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        showToast("Backup restaurado com sucesso!");
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
    showToast("Campos preenchidos a partir da etiqueta!");
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
        showToast("QR Code reconhecido!");
      }
    } catch (error) {
      setScanStatus(error.message || "Erro ao processar imagem.");
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
      showToast("XML importado com sucesso!");
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
    toastMessage,
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
