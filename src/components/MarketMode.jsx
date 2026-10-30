import { LuCheck, LuLogOut, LuShoppingCart, LuStore, LuTarget } from 'react-icons/lu';
import { CATEGORIES, formatCurrency } from '../utils.js';

export default function MarketMode({ state, total, checkedCount, pendingPricesCount, budgetPercent, budgetColor, groupedItems, onToggleItem, onExit, onFinish }) {
  return (
    <div className="market-mode-ui">
      <div className="market-header">
        <div className="market-header-left">
          <div className="market-store-name"><LuStore size={18} style={{ opacity: 0.6, marginRight: 6 }} />{state.market || 'No Mercado'}</div>
          <div className="market-progress-info"><span className="market-checked">{checkedCount}</span><span className="market-sep"> / </span><span>{state.items.length} itens</span></div>
        </div>
        <div className="market-header-right">
          <div className="market-total-display"><small>{pendingPricesCount > 0 ? 'parcial' : 'total'}</small><strong>{total}</strong></div>
          <button type="button" className="market-exit-btn" onClick={onExit}><LuLogOut size={15} /> Sair</button>
        </div>
      </div>
      <div className="market-progress-bar"><div className="market-progress-fill" style={{ width: state.items.length > 0 ? `${(checkedCount / state.items.length) * 100}%` : '0%' }} /></div>
      {state.budget > 0 && (
        <div className="market-budget-strip">
          <LuTarget size={13} /><span>Orçamento</span>
          <div className="market-budget-track"><div className="market-budget-fill" style={{ width: `${budgetPercent}%`, background: budgetColor }} /></div>
          <b style={{ color: budgetColor }}>{budgetPercent}%</b>
        </div>
      )}
      <div className="market-items">
        {state.items.length === 0 ? (
          <div className="market-empty"><LuShoppingCart size={48} opacity={0.3} /><p>Lista vazia. Adicione itens antes de ir ao mercado.</p><button type="button" className="market-exit-btn" onClick={onExit}>Voltar à lista</button></div>
        ) : Object.entries(groupedItems).map(([catKey, items]) => {
          const catInfo = CATEGORIES[catKey] || { label: 'Geral', icon: '🛒' };
          const allChecked = items.every((item) => item.checked);
          return (
            <div key={catKey} className={`market-category-section ${allChecked ? 'all-checked' : ''}`}>
              <div className="market-category-header"><span className="market-cat-icon">{catInfo.icon}</span><span className="market-cat-label">{catInfo.label}</span><span className="market-cat-count">{items.filter((item) => item.checked).length}/{items.length}</span></div>
              {items.map((item) => (
                <div key={item.id} className={`market-item-row ${item.checked ? 'market-item-checked' : ''}`} onClick={() => onToggleItem(item.id)}>
                  <div className={`market-item-circle ${item.checked ? 'checked' : ''}`}>{item.checked && <LuCheck size={18} strokeWidth={2.5} />}</div>
                  <div className="market-item-info"><span className="market-item-name">{item.name}</span><span className="market-item-detail">{item.qty} {item.unit}{item.price > 0 && ` · ${formatCurrency(item.price)}/${item.unit}`}</span></div>
                  <div className={`market-item-price ${item.pricePending ? 'pending' : ''}`}>{item.pricePending ? '—' : formatCurrency(item.qty * item.price)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {state.items.length > 0 && (
        <div className="market-footer">
          <div className="market-footer-total"><span>{pendingPricesCount > 0 ? `${pendingPricesCount} item(s) sem preço` : `${checkedCount} de ${state.items.length} marcados`}</span><strong>{total}</strong></div>
          <button type="button" className="market-finish-btn" onClick={onFinish}><LuCheck size={17} /> Concluir compra</button>
        </div>
      )}
    </div>
  );
}
