import {
  LuCamera,
  LuCheck,
  LuChevronDown,
  LuDownload,
  LuPlus,
  LuReceipt,
  LuUpload,
  LuPencil,
  LuX,
} from "react-icons/lu";
import { CATEGORIES, formatCurrency, maskCurrency } from "../utils.js";

export default function ShoppingList({
  state,
  total,
  budgetPercent,
  budgetColor,
  pendingPricesCount,
  checkedCount,
  groupedItems,
  groupByCategory,
  itemSort,
  itemSearch,
  itemFilter,
  refs,
  handlers,
}) {
  const {
    handleAddItem,
    handleNameChange,
    handleToggleItem,
    handleSetItemPrice,
    openEditItem,
    handleRemoveItem,
    handleFinishPurchase,
    handleSetBudget,
    handleBackup,
    handleRestore,
    openScanner,
    openReceipt,
    setState,
    setGroupByCategory,
    setItemSort,
    setItemSearch,
    setItemFilter,
  } = handlers;
  const {
    itemName,
    itemQty,
    itemUnit,
    itemCategory,
    itemPriceDisplay,
    setItemQty,
    setItemUnit,
    setItemCategory,
    setItemPriceDisplay,
  } = handlers;

  return (
    <section id="lista">
      <div className="panel simple-list">
        <div className="budget-card">
          <div className="budget-header">
            <span>
              Meta de Orçamento{" "}
              <button type="button" className="budget-edit-btn" onClick={handleSetBudget}>
                (ajustar)
              </button>
            </span>
            <b>
              {formatCurrency(total)}{" "}
              <small style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                / {state.budget ? formatCurrency(state.budget) : "sem limite"}
              </small>
            </b>
          </div>
          {state.budget > 0 && (
            <>
              <div className="budget-track">
                <div
                  className="budget-fill"
                  style={{ width: `${budgetPercent}%`, background: budgetColor }}
                />
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
              <LuPlus size={16} /> Adicionar
            </button>
          </div>
          <details className="details">
            <summary>
              <LuChevronDown size={13} /> Detalhes do item (quantidade, unidade, preço)
            </summary>
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
                <label htmlFor="category">Categoria</label>
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
                  onChange={(e) => setItemPriceDisplay(maskCurrency(e.target.value))}
                />
              </div>
            </div>
          </details>
        </form>
        {state.items.length > 0 && (
          <div className="list-toolbar">
            <input className="list-search" type="search" value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Buscar item..." aria-label="Buscar item" />
            <select aria-label="Filtrar itens" value={itemFilter} onChange={(event) => setItemFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="unchecked">Pendentes</option>
              <option value="checked">Marcados</option>
              <option value="pending-price">Sem preço</option>
            </select>
            <label htmlFor="item-sort">Ordenar:</label>
            <select id="item-sort" value={itemSort} onChange={(event) => setItemSort(event.target.value)}>
              <option value="added">Adição</option>
              <option value="price-desc">Maior preço</option>
              <option value="price-asc">Menor preço</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
            </select>
            <button
              type="button"
              style={{ fontSize: 11, padding: "4px 10px", background: "transparent" }}
              onClick={() => setGroupByCategory(!groupByCategory)}
            >
              {groupByCategory ? "📂 Desagrupar" : "📁 Agrupar por corredor"}
            </button>
          </div>
        )}
        <div id="items">
          {state.items.length === 0 ? (
            <div className="empty">
              Sua lista está vazia.
              <br />
              Adicione o primeiro produto acima.
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([catKey, items]) => {
                const catInfo = CATEGORIES[catKey] || { label: "Geral", icon: "🛒" };
                return (
                  <div key={catKey} className={groupByCategory ? "category-group" : ""}>
                    {groupByCategory && (
                      <div className="category-group-header">
                        <span>{catInfo.icon}</span>
                        <h3>{catInfo.label}</h3>
                        <span className="category-group-count">{items.length}</span>
                      </div>
                    )}
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`todo-row ${item.checked ? "is-done" : ""}`}
                      >
                        <label className="todo-target" htmlFor={`check-${item.id}`}>
                          <input
                            id={`check-${item.id}`}
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleItem(item.id)}
                          />
                          <span className="todo-circle" aria-hidden="true">
                            <LuCheck size={14} />
                          </span>
                          <span className="todo-copy">
                            <b>{item.name}</b>
                            <small>
                              {item.qty} {item.unit}
                              {item.price > 0 &&
                                ` · ${formatCurrency(item.price)}/${item.unit}`}
                            </small>
                          </span>
                        </label>
                        <button
                          className="item-price"
                          type="button"
                          onClick={() => handleSetItemPrice(item.id)}
                        >
                          {item.pricePending ? (
                            <>
                              <LuPlus size={11} /> preço
                            </>
                          ) : (
                            formatCurrency(item.qty * item.price)
                          )}
                        </button>
                        <button
                          className="todo-edit"
                          type="button"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => openEditItem(item)}
                          title="Editar"
                        >
                          <LuPencil size={15} />
                        </button>
                        <button
                          className="todo-remove"
                          type="button"
                          aria-label={`Remover ${item.name}`}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <LuX size={17} />
                        </button>
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
        <div className="simple-total">
          <span>
            {pendingPricesCount > 0
              ? `Total parcial · ${pendingPricesCount} ${pendingPricesCount === 1 ? "item sem preço" : "itens sem preço"}`
              : "Total da compra"}
          </span>
          <b>{formatCurrency(total)}</b>
        </div>
        <button
          className="primary finish-btn"
          type="button"
          onClick={handleFinishPurchase}
        >
          <LuCheck size={16} /> Concluir compra e abastecer despensa
        </button>
        <details className="simple-options">
          <summary>
            <LuChevronDown size={13} /> Data, nota fiscal e opções de backup
          </summary>
          <div className="fields">
            <div>
              <label htmlFor="date">Data da compra</label>
              <input
                type="date"
                id="date"
                value={state.date}
                onChange={(e) => setState((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="market">Mercado / Estabelecimento</label>
              <input
                id="market"
                placeholder="Ex: Pão de Açúcar, Atacadão"
                value={state.market}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, market: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="actions">
            <button type="button" onClick={() => openScanner("label")}>
              <LuCamera size={15} /> Ler etiqueta (OCR)
            </button>
            <button type="button" onClick={openReceipt}>
              <LuReceipt size={15} /> Conferir nota fiscal
            </button>
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: "var(--color-text-muted)" }}>
            Seus dados ficam 100% salvos neste dispositivo.
          </p>
          <div className="actions">
            <button type="button" onClick={handleBackup}>
              <LuDownload size={15} /> Exportar backup
            </button>
            <button type="button" onClick={() => refs.restoreInputRef.current?.click()}>
              <LuUpload size={15} /> Importar backup
            </button>
          </div>
          <input
            ref={refs.restoreInputRef}
            type="file"
            accept="application/json"
            onChange={handleRestore}
            hidden
          />
        </details>
      </div>
    </section>
  );
}
