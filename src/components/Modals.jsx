import { LuCamera, LuCheck, LuCircleHelp, LuInfo, LuPencil, LuReceipt, LuScanLine, LuTrash2, LuX } from 'react-icons/lu';
import { formatCurrency } from '../utils.js';

const stopPropagation = (event) => event.stopPropagation();

export function EditItemModal({ data, actions }) {
  if (!data.item) return null;
  return <div className="modal-overlay"><div className="modal-content edit-modal" onClick={stopPropagation}>
    <div className="modal-header"><h2><LuPencil size={18} style={{ marginRight: 8 }} />Editar item</h2><button className="modal-close" type="button" onClick={() => actions.setItem(null)}><LuX size={16} /></button></div>
    <div className="edit-modal-body">
      <label htmlFor="edit-name">Nome do produto</label>
      <input id="edit-name" autoFocus value={data.name} onChange={(event) => { data.setName(event.target.value); data.setCategory(data.detectCategory(event.target.value)); }} placeholder="Nome do produto" />
      <div className="fields" style={{ marginTop: 4 }}>
        <div><label htmlFor="edit-qty">Quantidade</label><input id="edit-qty" type="number" min="0.001" step="0.001" value={data.qty} onChange={(event) => data.setQty(event.target.value)} /></div>
        <div><label htmlFor="edit-unit">Unidade</label><select id="edit-unit" value={data.unit} onChange={(event) => data.setUnit(event.target.value)}><option value="un">un</option><option value="kg">kg</option><option value="L">L</option></select></div>
        <div><label htmlFor="edit-category">Categoria</label><select id="edit-category" value={data.category} onChange={(event) => data.setCategory(event.target.value)}>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.label}</option>)}</select></div>
        <div><label htmlFor="edit-price">Preço unitário (R$)</label><input id="edit-price" type="text" inputMode="numeric" placeholder="0,00" value={data.price} onChange={(event) => data.setPrice(data.maskCurrency(event.target.value))} /></div>
      </div>
      <div className="edit-modal-actions"><button type="button" onClick={() => actions.setItem(null)}>Cancelar</button><button type="button" className="primary" onClick={actions.save}><LuCheck size={15} /> Salvar</button></div>
    </div>
  </div></div>;
}

export function DialogModal({ dialog, input, setInput }) {
  if (!dialog) return null;
  const isDanger = Boolean(dialog.danger);
  const keywordMatches = !dialog.requiredKeyword || input.trim().toLowerCase() === dialog.requiredKeyword.trim().toLowerCase();
  const canConfirm = dialog.type === 'prompt' ? (dialog.requiredKeyword ? keywordMatches : true) : true;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (dialog.type === 'prompt') {
      dialog.onConfirm(input);
    } else {
      dialog.onConfirm();
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`dialog-modal-card ${isDanger ? 'dialog-modal-card--danger' : ''}`} onClick={stopPropagation}>
        <div className="dialog-modal-header">
          <span className="dialog-modal-icon">
            {isDanger ? (
              <LuTrash2 size={24} color="#ef4444" />
            ) : dialog.type === 'alert' ? (
              <LuInfo size={22} color="#3b82f6" />
            ) : dialog.type === 'confirm' ? (
              <LuCircleHelp size={22} color="#f59e0b" />
            ) : (
              <LuPencil size={22} color="#8b5cf6" />
            )}
          </span>
          <h3 className="dialog-modal-title">{dialog.title}</h3>
        </div>
        <p className="dialog-modal-message">{dialog.message}</p>
        {dialog.type === 'prompt' && (
          <div className="dialog-modal-prompt-wrap">
            {dialog.requiredKeyword && (
              <div className="dialog-modal-keyword-hint">
                Digite exatamente <strong>{dialog.requiredKeyword}</strong> para confirmar:
              </div>
            )}
            <input
              className={`dialog-modal-input ${isDanger ? 'dialog-modal-input--danger' : ''}`}
              autoFocus
              value={input}
              placeholder={dialog.requiredKeyword ? `Digite "${dialog.requiredKeyword}"` : ''}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleConfirm();
              }}
            />
          </div>
        )}
        <div className="dialog-modal-buttons">
          {dialog.type !== 'alert' && (
            <button type="button" onClick={dialog.onCancel}>
              Cancelar
            </button>
          )}
          <button
            type="button"
            className={isDanger ? 'danger-btn' : 'primary'}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {dialog.confirmLabel || (dialog.type === 'confirm' ? 'Confirmar' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ data, actions }) {
  if (!data.open) return null;
  return <div className="modal-overlay"><div className="modal-content" onClick={stopPropagation}>
    <div className="modal-header"><h2><LuReceipt size={18} style={{ marginRight: 8 }} />Conferir nota fiscal</h2><button className="modal-close" type="button" onClick={actions.close}><LuX size={16} /></button></div>
    <button type="button" style={{ width: '100%', marginBottom: 12 }} onClick={() => actions.openScanner('qr')}><LuScanLine size={15} /> Ler QR Code da nota fiscal</button>
    <label htmlFor="qrurl">Link da consulta da nota</label><input id="qrurl" placeholder="https://…" value={data.qrUrl} onChange={(event) => data.setQrUrl(event.target.value)} />
    <button type="button" style={{ marginTop: 10, width: '100%' }} onClick={actions.openOfficialLink}>Abrir consulta oficial ↗</button>
    <p className="muted" style={{ margin: '14px 0' }}>Importe o XML da NF-e ou digite o total abaixo:</p>
    <label htmlFor="xml">Importar XML (.xml)</label><input type="file" id="xml" accept=".xml" onChange={actions.uploadXml} />
    <label htmlFor="receiptTotal">Total final da nota (R$)</label><input id="receiptTotal" inputMode="numeric" placeholder="0,00" value={data.total} onChange={(event) => data.setTotal(data.maskCurrency(event.target.value))} />
    <label htmlFor="tax">Tributos (R$)</label><input id="tax" inputMode="numeric" placeholder="0,00 (vazio = não informado)" value={data.tax} onChange={(event) => data.setTax(data.maskCurrency(event.target.value))} />
    {data.reconciliation && <div className="summary"><b>{Math.abs(data.reconciliation.diff) < 0.01 ? '✓ Total confere com a lista!' : `Diferença: ${formatCurrency(data.reconciliation.diff)}`}</b><p style={{ marginTop: 6 }}>Total da nota: {formatCurrency(data.reconciliation.total)}<br />{data.reconciliation.tax === null ? 'Tributos não informados' : `Tributos: ${formatCurrency(data.reconciliation.tax)} | Líquido: ${formatCurrency(data.reconciliation.total - data.reconciliation.tax)}`}</p></div>}
    <button className="primary" type="button" style={{ width: '100%', marginTop: 16 }} onClick={actions.check}><LuCheck size={15} /> Conferir valores</button>
    {data.xmlItems.length > 0 && <div style={{ marginTop: 24 }}><h3>Itens importados ({data.xmlItems.length})</h3>{data.xmlItems.map((item, index) => <div key={index} className="pantry-item"><div className="pantry-desc"><b>{item.name}</b><small className="muted" style={{ display: 'block' }}>{item.qty} {item.unit} × {formatCurrency(item.price)}</small></div><b>{formatCurrency(item.qty * item.price)}</b></div>)}</div>}
  </div></div>;
}

export function ScannerModal({ data, actions }) {
  if (!data.open) return null;
  return <div className="modal-overlay"><div className="modal-content" onClick={stopPropagation}>
    <div className="modal-header"><h2>{data.mode === 'qr' ? <><LuScanLine size={18} style={{ marginRight: 8 }} />Ler QR Code</> : <><LuCamera size={18} style={{ marginRight: 8 }} />Ler Etiqueta</>}</h2><button className="modal-close" type="button" onClick={actions.close}><LuX size={16} /></button></div>
    <p style={{ marginBottom: 14, color: 'var(--color-text-muted)' }}>Tire uma foto nítida com boa iluminação.</p>
    <input ref={data.fileRef} type="file" accept="image/*" capture="environment" onChange={actions.capture} />
    {data.status && <p style={{ margin: '14px 0', fontWeight: 600, color: 'var(--color-primary)' }}>{data.status}</p>}
    {data.showReview && <div style={{ marginTop: 14 }}><label htmlFor="ocrText">Texto reconhecido:</label><textarea id="ocrText" value={data.text} onChange={(event) => data.setText(event.target.value)} style={{ minHeight: 120, marginTop: 6 }} /><button className="primary" type="button" style={{ width: '100%', marginTop: 12 }} onClick={actions.useOcr}><LuCheck size={15} /> Usar dados na lista</button></div>}
  </div></div>;
}
