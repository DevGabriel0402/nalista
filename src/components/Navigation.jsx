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
  LuTrendingUp,
} from "react-icons/lu";

import Logo from "../../public/icon.svg";

const navigationItems = [
  { id: "lista", label: "Lista", Icon: LuClipboardList },
  { id: "historico", label: "Compras", Icon: LuHistory },
  { id: "precos", label: "Preços", Icon: LuTrendingUp },
  { id: "despensa", label: "Despensa", Icon: LuPackage },
];

// const Logo = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect width="192" height="192" rx="44" fill="#0a5a9c"/><rect x="57" y="43" width="78" height="111" rx="17" fill="none" stroke="#fff" stroke-width="8"/><path d="M79 43v-9h34v18H79z" fill="#fff"/><path d="m76 82 5 5 9-11m11 8h17m-42 26 5 5 9-11m11 8h17m-42 26h42" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
// `;

function SyncStatus({ status, showLabel = true }) {
  const icons = {
    saving: <LuLoader size={16} className="spin" />,
    saved: <LuCloud size={16} />,
    offline: <LuCloudOff size={16} />,
    error: <LuCloudOff size={16} />,
    idle: <LuCloudUpload size={16} />,
  };

  const labels = {
    saving: "Carregando...",
    saved: "Sincronizado",
    offline: "Offline",
    error: "Erro de sincronização",
    idle: "Sincronizando...",
  };

  const title = labels[status] || "Sincronização";

  return (
    <div
      className={`sync-status sync-${status} ${showLabel ? "sync-status--full" : "sync-status--icon-only"}`}
      title={title}
      aria-label={title}
    >
      {icons[status]}
      {showLabel && <span>{labels[status]}</span>}
    </div>
  );
}

function NavigationButton({ item, page, badge, onSelect }) {
  const { Icon, id, label } = item;
  return (
    <button
      type="button"
      className={page === id ? "active" : ""}
      onClick={() => onSelect(id)}
    >
      <span className="nav-symbol">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="nav-label">{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

export function DesktopSidebar({
  page,
  darkMode,
  syncStatus,
  expiringPantryCount,
  onSelect,
  onToggleTheme,
  onSignOut,
}) {
  return (
    <aside>
      <div className="logo">
        <img style={{ width: 32, height: 32 }} src={Logo} alt="Logo" />
        na<span>lista</span>
      </div>
      <p>SUPERMERCADO INTELIGENTE</p>
      <nav aria-label="Navegação principal">
        {navigationItems.map((item) => (
          <NavigationButton
            key={item.id}
            item={item}
            page={page}
            badge={item.id === "despensa" ? expiringPantryCount : 0}
            onSelect={onSelect}
          />
        ))}
      </nav>
      <div className="foot">
        <button type="button" className="theme-toggle-btn" onClick={onToggleTheme}>
          {darkMode ? (
            <>
              <LuSun size={14} /> Modo Claro
            </>
          ) : (
            <>
              <LuMoon size={14} /> Modo Escuro
            </>
          )}
        </button>
        <button type="button" className="theme-toggle-btn" onClick={onSignOut}>
          <LuLogOut size={14} /> Sair da conta
        </button>
        <SyncStatus status={syncStatus} showLabel={true} />
      </div>
    </aside>
  );
}

export function TopBar({ darkMode, syncStatus, onToggleTheme, onSignOut, onScan }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="logo">
          <img style={{ width: 32, height: 32 }} src={Logo} alt="Logo" />
          na<span>lista</span>
        </div>
      </div>
      <div className="topbar-actions">
        <SyncStatus status={syncStatus} showLabel={false} />
        <button
          type="button"
          className="topbar-btn"
          onClick={onScan}
          aria-label="Fotografar etiqueta"
        >
          <LuCamera size={16} />
        </button>
        <button
          type="button"
          className="topbar-btn"
          onClick={onToggleTheme}
          aria-label="Alternar tema"
        >
          {darkMode ? <LuSun size={16} /> : <LuMoon size={16} />}
        </button>
        <button
          type="button"
          className="topbar-btn signout-btn"
          onClick={onSignOut}
          aria-label="Sair da conta"
          title="Sair da conta"
        >
          <LuLogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export function MobileIsland({ total, hasPendingPrices }) {
  return (
    <div className="mobile-island">
      <span className="pulse"></span>
      <div className="island-copy">
        <small>{hasPendingPrices ? "Total parcial" : "Total da lista"}</small>
        <b>{total}</b>
      </div>
    </div>
  );
}

export function MobileNavigation({
  page,
  marketMode,
  expiringPantryCount,
  onSelect,
  onMarket,
}) {
  const selectPage = (nextPage) => {

    onSelect(nextPage);
  };

  return (
    <nav id="primaryNav" className="mobile-bottom-nav" aria-label="Navegação principal">
      <button
        type="button"
        className={page === "lista" && !marketMode ? "active" : ""}
        onClick={() => selectPage("lista")}
      >
        <span className="nav-symbol">
          <LuClipboardList size={22} strokeWidth={1.8} />
        </span>
        <span className="nav-label">Lista</span>
      </button>
      <button
        type="button"
        className={page === "historico" ? "active" : ""}
        onClick={() => selectPage("historico")}
      >
        <span className="nav-symbol">
          <LuHistory size={22} strokeWidth={1.8} />
        </span>
        <span className="nav-label">Compras</span>
      </button>
      <button
        type="button"
        className={`nav-market-btn ${marketMode ? "active" : ""}`}
        onClick={() => {

          onMarket(true);
        }}
        aria-label="Entrar no modo mercado"
      >
        <span className="nav-market-icon">
          <LuShoppingCart size={20} strokeWidth={2} color="#fafafa" />
        </span>
        <span className="nav-label">Mercado</span>
      </button>
      <button
        type="button"
        className={page === "precos" ? "active" : ""}
        onClick={() => selectPage("precos")}
      >
        <span className="nav-symbol">
          <LuTrendingUp size={22} strokeWidth={1.8} />
        </span>
        <span className="nav-label">Preços</span>
      </button>
      <button
        type="button"
        className={page === "despensa" ? "active" : ""}
        onClick={() => selectPage("despensa")}
      >
        <span className="nav-symbol" style={{ position: "relative" }}>
          <LuPackage size={22} strokeWidth={1.8} />
          {expiringPantryCount > 0 && (
            <span className="nav-badge">{expiringPantryCount}</span>
          )}
        </span>
        <span className="nav-label">Despensa</span>
      </button>
    </nav>
  );
}
