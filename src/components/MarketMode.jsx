import { useState } from "react";
import { LuArrowLeft, LuCheck, LuRoute, LuShoppingCart, LuStore, LuTarget } from "react-icons/lu";
import { CATEGORIES, formatCurrency } from "../utils.js";

export default function MarketMode({ state, total, checkedCount, pendingPricesCount, budgetPercent, budgetColor, groupedItems, onToggleItem, onExit, onFinish, onOpenRoute, onSetPrice }) {
  const [onlyPending, setOnlyPending] = useState(false);
  const count = state.items.length;
  const remaining = Math.max(0, count - checkedCount);
  const progress = count ? Math.min(100, (checkedCount / count) * 100) : 0;
  const groups = Object.entries(groupedItems);
  const nextGroup = groups.find(([, items]) => items.some((item) => !item.checked));
  const nextCategory = nextGroup && (CATEGORIES[nextGroup[0]]?.label || "Geral");

  return (
    <div className="market-mode-ui">
      <header className="market-header">
        <div className="market-header-summary">
          <div className="market-header-left">
            <span className="market-mode-label">MODO MERCADO</span>
            <h1 className="market-store-name"><LuStore size={19} aria-hidden="true" />{state.market || "Sua compra"}</h1>
            <p className="market-progress-info" role="status">{count === 0 ? "Vamos preparar sua lista?" : remaining ? `${checkedCount} de ${count} no carrinho · faltam ${remaining}` : "Tudo no carrinho!"}</p>
          </div>
          <div className="market-total-display"><small>{pendingPricesCount ? "Total parcial da lista" : "Total da lista"}</small><strong>{total}</strong></div>
        </div>
        <div className="market-header-actions" aria-label="Ações do modo mercado">
          {onOpenRoute && <button type="button" className="market-action-btn market-route-btn" onClick={onOpenRoute} disabled={!count} aria-haspopup="dialog"><LuRoute size={20} aria-hidden="true" /><span>Organizar rota<small>Ordem dos corredores</small></span></button>}
          <button type="button" className="market-action-btn market-back-btn" onClick={onExit} title="Voltar à lista sem encerrar a compra"><LuArrowLeft size={20} aria-hidden="true" /><span>Voltar à lista<small>Continuar depois</small></span></button>
        </div>
        <div className="market-progress-bar" role="progressbar" aria-label="Produtos no carrinho" aria-valuenow={checkedCount} aria-valuemin={0} aria-valuemax={count || 1}><div className="market-progress-fill" style={{ width: `${progress}%` }} /></div>
      </header>
      {state.budget > 0 && <div className="market-budget-strip"><LuTarget size={16} aria-hidden="true" /><span>Limite {formatCurrency(state.budget)}</span><div className="market-budget-track"><div className="market-budget-fill" style={{ width: `${Math.max(0, Math.min(100, budgetPercent))}%`, background: budgetColor }} /></div><b style={{ color: budgetColor }}>{budgetPercent}%</b></div>}
      {count > 0 && <div className="market-list-tools"><div><strong>{nextCategory ? `Próximo: ${nextCategory}` : "Lista completa"}</strong><span>Toque no produto para marcar ou desmarcar.</span></div><button type="button" className="market-filter-btn" aria-pressed={onlyPending} onClick={() => setOnlyPending((value) => !value)}>{onlyPending ? "Ver todos" : "Só faltantes"}</button></div>}
      <div className="market-items">
        {!count ? <div className="market-empty"><LuShoppingCart size={48} aria-hidden="true" /><h2>Sua lista está vazia</h2><p>Adicione os produtos e volte para acompanhar a compra.</p><button type="button" className="market-action-btn" onClick={onExit}><LuArrowLeft size={18} aria-hidden="true" />Preparar minha lista</button></div> : onlyPending && !remaining ? <div className="market-empty market-complete"><LuCheck size={42} aria-hidden="true" /><h2>Tudo no carrinho!</h2><p>Você pegou todos os produtos da lista.</p><button type="button" className="market-action-btn" onClick={() => setOnlyPending(false)}>Revisar produtos</button></div> : groups.map(([catKey, items]) => {
          const category = CATEGORIES[catKey] || { label: "Geral", icon: "🛒" };
          const visible = onlyPending ? items.filter((item) => !item.checked) : items;
          if (!visible.length) return null;
          const done = items.filter((item) => item.checked).length;
          return <section key={catKey} className={`market-category-section ${done === items.length ? "all-checked" : ""}`} aria-label={category.label}>
            <div className="market-category-header"><span className="market-cat-icon" aria-hidden="true">{category.icon}</span><h2 className="market-cat-label">{category.label}</h2><span className="market-cat-count">{done}/{items.length}</span></div>
            {visible.map((item) => <div key={item.id} className={`market-product ${item.checked ? "market-item-checked" : ""}`}>
              <button type="button" className="market-item-row" onClick={() => onToggleItem(item.id)} aria-pressed={item.checked} aria-label={`${item.checked ? "Desmarcar" : "Marcar"} ${item.name}`}>
                <span className={`market-item-circle ${item.checked ? "checked" : ""}`} aria-hidden="true">{item.checked && <LuCheck size={18} strokeWidth={2.5} />}</span>
                <span className="market-item-info"><span className="market-item-name">{item.name}</span><span className="market-item-detail">{item.qty} {item.unit}{!item.pricePending && ` · ${formatCurrency(item.price)}/${item.unit}`}</span></span>
              </button>
              {onSetPrice ? <button type="button" className={`market-item-price market-price-button ${item.pricePending ? "pending" : ""}`} onClick={() => onSetPrice(item.id)} aria-label={`${item.pricePending ? "Adicionar" : "Editar"} preço de ${item.name}`}>{item.pricePending ? "+ preço" : formatCurrency(item.qty * item.price)}</button> : <span className="market-item-price">{item.pricePending ? "Sem preço" : formatCurrency(item.qty * item.price)}</span>}
            </div>)}
          </section>;
        })}
      </div>
      {count > 0 && <footer className="market-footer"><div className="market-footer-total"><span>{pendingPricesCount ? `${pendingPricesCount} ${pendingPricesCount === 1 ? "produto sem preço" : "produtos sem preço"}` : remaining ? `${remaining} ${remaining === 1 ? "produto para pegar" : "produtos para pegar"}` : "Pronto para conferir e concluir"}</span><strong>{total}</strong></div><button type="button" className="market-finish-btn" onClick={onFinish}><LuCheck size={19} aria-hidden="true" />Concluir compra</button></footer>}
    </div>
  );
}
