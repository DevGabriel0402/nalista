import { LuShoppingCart } from 'react-icons/lu';
import MarketMode from './components/MarketMode.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import DataPages from './components/DataPages.jsx';
import { DesktopSidebar, MobileIsland, MobileNavigation } from './components/Navigation.jsx';
import { DialogModal, EditItemModal, ReceiptModal, ScannerModal } from './components/Modals.jsx';
import AuthPage from './components/AuthPage.jsx';
import { CATEGORIES, detectCategory, formatCurrency, maskCurrency } from './utils.js';
import useAppState from './hooks/useAppState.js';
import useAuth from './hooks/useAuth.js';
import useWakeLock from './hooks/useWakeLock.js';
import './style.css';

function PageHeader({ page, onMarket }) {
  const titles = {
    lista: 'Lista de compras',
    historico: 'Histórico de compras',
    precos: 'Comparador de preços',
    despensa: 'Minha despensa'
  };

  return <header>
    <div><div className="eyebrow">CONTROLE TOTAL NO CARRINHO</div><h1>{titles[page]}</h1><p>Planeje, confira valores e controle a despensa sem surpresas.</p></div>
    <div className="header-badges">{page === 'lista' && <button type="button" className="market-mode-toggle" onClick={() => onMarket(true)}><LuShoppingCart size={16} /> Modo Mercado</button>}<span className="badge">✦ Simples &amp; Rápido</span></div>
  </header>;
}

export default function App() {
  const auth = useAuth();
  const app = useAppState(auth.user?.uid);
  useWakeLock(app.marketMode && app.page === 'lista');

  if (auth.loading) {
    return <div className="auth-loading"><div className="auth-loading-mark"><LuShoppingCart size={23} /></div><span>Carregando sua conta...</span></div>;
  }

  if (!auth.user) {
    return <AuthPage auth={auth} />;
  }
  const shoppingHandlers = {
    handleAddItem: app.handleAddItem,
    handleNameChange: app.handleNameChange,
    handleToggleItem: app.handleToggleItem,
    handleSetItemPrice: app.handleSetItemPrice,
    openEditItem: app.openEditItem,
    handleRemoveItem: app.handleRemoveItem,
    handleFinishPurchase: app.handleFinishPurchase,
    handleSetBudget: app.handleSetBudget,
    handleBackup: app.handleBackup,
    handleRestore: app.handleRestore,
    openScanner: app.openScanner,
    openReceipt: () => { app.setReceiptTotalDisplay(app.state.note?.total ? maskCurrency(Math.round(app.state.note.total * 100)) : ''); app.setReceiptTaxDisplay(app.state.note?.tax ? maskCurrency(Math.round(app.state.note.tax * 100)) : ''); app.setReconciliation(null); app.setIsReceiptOpen(true); },
    setState: app.setState,
    setGroupByCategory: app.setGroupByCategory,
    setItemSort: app.setItemSort,
    setItemSearch: app.setItemSearch,
    setItemFilter: app.setItemFilter,
    itemName: app.itemName,
    itemQty: app.itemQty,
    itemUnit: app.itemUnit,
    itemCategory: app.itemCategory,
    itemPriceDisplay: app.itemPriceDisplay,
    setItemQty: app.setItemQty,
    setItemUnit: app.setItemUnit,
    setItemCategory: app.setItemCategory,
    setItemPriceDisplay: app.setItemPriceDisplay
  };
  return <>
    <MobileIsland total={formatCurrency(app.total)} hasPendingPrices={app.pendingPricesCount > 0} onScan={() => app.openScanner('label')} />
    <DesktopSidebar page={app.page} darkMode={app.darkMode} syncStatus={app.syncStatus} expiringPantryCount={app.expiringPantryCount} onSelect={app.setPage} onToggleTheme={() => app.setDarkMode((value) => !value)} onSignOut={auth.signOut} />
    <main>
      {app.marketMode && app.page === 'lista' ? (
        <MarketMode state={app.state} total={formatCurrency(app.total)} checkedCount={app.checkedCount} pendingPricesCount={app.pendingPricesCount} budgetPercent={app.budgetPercent} budgetColor={app.budgetColor} groupedItems={app.marketGroupedItems} onToggleItem={app.handleToggleItem} onExit={() => app.setMarketMode(false)} onFinish={app.handleFinishPurchase} />
      ) : <><PageHeader page={app.page} onMarket={app.setMarketMode} />{app.page === 'lista' ? <ShoppingList state={app.state} total={app.total} budgetPercent={app.budgetPercent} budgetColor={app.budgetColor} pendingPricesCount={app.pendingPricesCount} checkedCount={app.checkedCount} groupedItems={app.groupedItems} groupByCategory={app.groupByCategory} itemSort={app.itemSort} itemSearch={app.itemSearch} itemFilter={app.itemFilter} refs={{ restoreInputRef: app.restoreInputRef }} handlers={shoppingHandlers} /> : <DataPages page={app.page} state={app.state} priceChanges={app.priceChanges} maxDelta={app.maxDelta} expiringPantryCount={app.expiringPantryCount} handlers={{ handleConsumePantry: app.handleConsumePantry, handleRestockPantry: app.handleRestockPantry, handleUpdatePantryExpiry: app.handleUpdatePantryExpiry }} />}</>}
    </main>
    <MobileNavigation page={app.page} marketMode={app.marketMode} expiringPantryCount={app.expiringPantryCount} onSelect={app.setPage} onMarket={app.setMarketMode} />
    <EditItemModal
      data={{ item: app.editItem, name: app.editName, qty: app.editQty, unit: app.editUnit, category: app.editCategory, price: app.editPriceDisplay, categories: Object.values(CATEGORIES), setName: app.setEditName, setQty: app.setEditQty, setUnit: app.setEditUnit, setCategory: app.setEditCategory, setPrice: app.setEditPriceDisplay, detectCategory, maskCurrency }}
      actions={{ setItem: app.setEditItem, save: app.handleSaveEdit }}
    />
    <DialogModal dialog={app.dialogState} input={app.dialogInput} setInput={app.setDialogInput} />
    <ReceiptModal
      data={{ open: app.isReceiptOpen, qrUrl: app.qrUrl, total: app.receiptTotalDisplay, tax: app.receiptTaxDisplay, reconciliation: app.reconciliation, xmlItems: app.xmlItems, setQrUrl: app.setQrUrl, setTotal: app.setReceiptTotalDisplay, setTax: app.setReceiptTaxDisplay, maskCurrency }}
        actions={{
          close: () => app.setIsReceiptOpen(false),
          openScanner: app.openScanner,
          openOfficialLink: () => {
            try {
              const url = new URL(app.qrUrl);
              if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
              window.open(url.href, '_blank', 'noopener,noreferrer');
            } catch {
              app.showAlert('Informe um link de consulta válido.', 'Link Inválido');
            }
          },
          uploadXml: app.handleXmlUpload,
          check: app.handleCheckReceipt
        }}
    />
    <ScannerModal
      data={{ open: app.isScannerOpen, mode: app.scannerMode, fileRef: app.fileInputRef, status: app.scanStatus, text: app.ocrText, showReview: app.showOcrReview, setText: app.setOcrText }}
      actions={{ close: () => app.setIsScannerOpen(false), capture: app.handlePhotoCapture, useOcr: app.handleUseOcr }}
    />
    {app.toastMessage && <div className="toast" role="status" aria-live="polite">{app.toastMessage}</div>}
  </>;
}
