import {
  LuCamera,
  LuClipboardList,
  LuCloud,
  LuCloudOff,
  LuCloudUpload,
  LuHistory,
  LuLoader,
  LuLogOut,
  LuMoon,
  LuPackage,
  LuShoppingCart,
  LuSun,
  LuTrendingUp
} from 'react-icons/lu';

const navigationItems = [
  { id: 'lista', label: 'Lista', Icon: LuClipboardList },
  { id: 'historico', label: 'Compras', Icon: LuHistory },
  { id: 'precos', label: 'Preços', Icon: LuTrendingUp },
  { id: 'despensa', label: 'Despensa', Icon: LuPackage }
];

function SyncStatus({ status }) {
  const statuses = {
    saving: <><LuLoader size={13} className="spin" /> Salvando…</>,
    saved: <><LuCloud size={13} /> Sincronizado</>,
    offline: <><LuCloudOff size={13} /> Modo offline</>,
    error: <><LuCloudOff size={13} /> Erro ao sincronizar</>,
    idle: <><LuCloudUpload size={13} /> Aguardando…</>
  };

  return <div className={`sync-status sync-${status}`}>{statuses[status]}</div>;
}

function NavigationButton({ item, page, badge, onSelect }) {
  const { Icon, id, label } = item;
  return (
    <button type="button" className={page === id ? 'active' : ''} onClick={() => onSelect(id)}>
      <span className="nav-symbol"><Icon size={20} strokeWidth={1.8} /></span>
      <span className="nav-label">{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

export function DesktopSidebar({ page, darkMode, syncStatus, expiringPantryCount, onSelect, onToggleTheme, onSignOut }) {
  return (
    <aside>
      <div className="logo">▧ na<span>lista</span></div>
      <p>SUPERMERCADO INTELIGENTE</p>
      <nav aria-label="Navegação principal">
        {navigationItems.map((item) => (
          <NavigationButton
            key={item.id}
            item={item}
            page={page}
            badge={item.id === 'despensa' ? expiringPantryCount : 0}
            onSelect={onSelect}
          />
        ))}
      </nav>
      <div className="foot">
        <button type="button" className="theme-toggle-btn" onClick={onToggleTheme}>
          {darkMode ? <><LuSun size={14} /> Modo Claro</> : <><LuMoon size={14} /> Modo Escuro</>}
        </button>
        <button type="button" className="theme-toggle-btn" onClick={onSignOut}>
          <LuLogOut size={14} /> Sair da conta
        </button>
        <SyncStatus status={syncStatus} />
      </div>
    </aside>
  );
}

export function MobileIsland({ total, hasPendingPrices, onScan }) {
  return (
    <div className="mobile-island">
      <span className="pulse"></span>
      <div className="island-copy">
        <small>{hasPendingPrices ? 'Total parcial' : 'Total da lista'}</small>
        <b>{total}</b>
      </div>
      <button type="button" onClick={onScan} aria-label="Fotografar etiqueta">
        <LuCamera size={17} />
      </button>
    </div>
  );
}

export function MobileNavigation({ page, marketMode, expiringPantryCount, onSelect, onMarket }) {
  const selectPage = (nextPage) => {
    onMarket(false);
    onSelect(nextPage);
  };

  return (
    <nav id="primaryNav" className="mobile-bottom-nav" aria-label="Navegação principal">
      <button type="button" className={page === 'lista' && !marketMode ? 'active' : ''} onClick={() => selectPage('lista')}>
        <span className="nav-symbol"><LuClipboardList size={22} strokeWidth={1.8} /></span>
        <span className="nav-label">Lista</span>
      </button>
      <button type="button" className={page === 'historico' ? 'active' : ''} onClick={() => selectPage('historico')}>
        <span className="nav-symbol"><LuHistory size={22} strokeWidth={1.8} /></span>
        <span className="nav-label">Compras</span>
      </button>
      <button type="button" className={`nav-market-btn ${marketMode ? 'active' : ''}`} onClick={() => { onSelect('lista'); onMarket(true); }} aria-label="Entrar no modo mercado">
        <span className="nav-market-icon"><LuShoppingCart size={20} strokeWidth={2} /></span>
        <span className="nav-label">Mercado</span>
      </button>
      <button type="button" className={page === 'precos' ? 'active' : ''} onClick={() => selectPage('precos')}>
        <span className="nav-symbol"><LuTrendingUp size={22} strokeWidth={1.8} /></span>
        <span className="nav-label">Preços</span>
      </button>
      <button type="button" className={page === 'despensa' ? 'active' : ''} onClick={() => selectPage('despensa')}>
        <span className="nav-symbol" style={{ position: 'relative' }}>
          <LuPackage size={22} strokeWidth={1.8} />
          {expiringPantryCount > 0 && <span className="nav-badge">{expiringPantryCount}</span>}
        </span>
        <span className="nav-label">Despensa</span>
      </button>
    </nav>
  );
}
