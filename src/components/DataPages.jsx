import { LuMinus, LuPlus, LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { CATEGORIES, formatCurrency } from '../utils.js';

export default function DataPages({ page, state, priceChanges, maxDelta, expiringPantryCount, handlers }) {
  if (page === 'historico') {
    return (
      <section id="historico">
        {state.history.length === 0 ? (
          <div className="panel empty">Suas compras concluídas aparecerão aqui.</div>
        ) : (
          state.history
            .map((history, originalIndex) => ({ history, originalIndex }))
            .reverse()
            .map(({ history, originalIndex }) => (
              <div key={originalIndex} className="panel history-card">
                <div className="row history-card-header">
                  <div>
                    <h2>{history.market || 'Compra no mercado'}</h2>
                    <small className="muted">
                      {history.date} · {history.items.length} produtos · {history.note ? 'Nota conferida' : 'Sem nota'}
                    </small>
                  </div>
                  <div className="history-card-header-right">
                    <b style={{ fontSize: 20 }}>
                      {formatCurrency(history.note ? history.note.total : history.total)}
                    </b>
                    <button
                      type="button"
                      className="history-delete-btn"
                      onClick={() => handlers.handleDeleteHistoryItem(originalIndex)}
                      title="Excluir esta compra do histórico"
                      aria-label="Excluir compra"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>
                <p style={{ margin: '12px 0' }}>
                  {history.items
                    .map((item) => `${item.name} (${item.qty} ${item.unit} · ${formatCurrency(item.price)})`)
                    .join(' · ')}
                </p>
                {history.note && (
                  <p className="muted">
                    Tributos: {history.note.tax === null ? 'não informados' : formatCurrency(history.note.tax)} · Diferença: {formatCurrency(history.note.total - history.total)}
                  </p>
                )}
              </div>
            ))
        )}
      </section>
    );
  }

  if (page === 'precos') {
    return (
      <section id="precos">
        <div className="panel">
          <h2>O que mudou desde a última compra?</h2>
          <p style={{ margin: '8px 0 20px', color: 'var(--color-text-muted)' }}>
            Comparação automática entre as duas compras mais recentes. Azul = queda, vermelho = aumento.
          </p>
          {priceChanges.length === 0 ? (
            <div className="empty">Conclua duas compras com produtos em comum para visualizar.</div>
          ) : (
            priceChanges.map((change, index) => (
              <div key={index} className="chartrow">
                <span>
                  <b>{change.name}</b>
                  <small className="muted" style={{ display: 'block' }}>
                    {formatCurrency(change.old)} → {formatCurrency(change.now)}
                  </small>
                </span>
                <div
                  className="bar"
                  style={{
                    width: `${(Math.abs(change.delta) / maxDelta) * 100}%`,
                    background: change.delta > 0 ? '#ef4444' : '#2563eb',
                  }}
                ></div>
                <b style={{ color: change.delta > 0 ? '#ef4444' : '#2563eb' }}>
                  {change.delta > 0 ? '+' : ''}
                  {change.delta.toFixed(1)}%
                </b>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  if (page !== 'despensa') return null;

  return (
    <section id="despensa">
      <div className="pantry-section-header">
        <div className="pantry-title-group">
          <h2>Minha Despensa</h2>
          {expiringPantryCount > 0 && (
            <span
              className="badge"
              style={{
                background: '#ef4444',
                color: '#fff',
                borderColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <LuTriangleAlert size={13} /> {expiringPantryCount} vencendo
            </span>
          )}
        </div>
        {state.pantry.length > 0 && (
          <button
            type="button"
            className="pantry-clear-all-btn"
            onClick={handlers.handleClearPantry}
            title="Esvaziar toda a despensa"
          >
            <LuTrash2 size={15} /> Esvaziar despensa
          </button>
        )}
      </div>
      <p className="pantry-subtitle">
        Ao concluir compras, os itens vêm para cá automaticamente. Dê baixa conforme consumir.
      </p>
      {state.pantry.length === 0 ? (
        <div className="panel empty">Conclua uma compra para abastecer sua despensa.</div>
      ) : (
        <div className="pantry-grid">
          {state.pantry.map((item, index) => {
            const today = new Date().toLocaleDateString('en-CA');
            const expired = item.expiry && item.expiry < today;
            const catInfo = CATEGORIES[item.category] || { icon: '▦' };
            return (
              <div key={index} className={`pantry-card${expired ? ' pantry-card--expired' : ''}`}>
                <div className="pantry-card-top">
                  <div className="pantry-card-icon">{catInfo.icon}</div>
                  {expired && (
                    <span className="pantry-card-expired-badge">
                      <LuTriangleAlert size={11} /> Vencido
                    </span>
                  )}
                </div>
                <b className="pantry-card-name">{item.name}</b>
                <small className="pantry-card-qty">
                  {item.qty.toFixed(3).replace(/\.?0+$/, '')} {item.unit} em estoque
                </small>
                <div className="pantry-card-expiry">
                  <label htmlFor={`exp-${index}`}>Validade</label>
                  <input
                    id={`exp-${index}`}
                    type="date"
                    value={item.expiry || ''}
                    onChange={(e) => handlers.handleUpdatePantryExpiry(index, e.target.value)}
                  />
                </div>
                <div className="pantry-card-actions">
                  <button type="button" onClick={() => handlers.handleConsumePantry(index)}>
                    <LuMinus size={13} /> Consumir
                  </button>
                  <button type="button" className="primary" onClick={() => handlers.handleRestockPantry(item)}>
                    <LuPlus size={13} /> Lista
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
