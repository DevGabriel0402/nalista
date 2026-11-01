export default function SplashScreen({ checkingAccount = false }) {
  return <div className="splash-screen" role="status" aria-live="polite" aria-label="Abrindo Na Lista">
    <div className="splash-halo" aria-hidden="true" />
    <div className="splash-content">
      <div className="splash-icon"><img src="/icon.svg" width="88" height="88" alt="" /><span className="splash-icon-shine" aria-hidden="true" /></div>
      <h1>na<span>lista</span></h1>
      <p>Sua compra, mais leve.</p>
      <div className="splash-progress" aria-hidden="true"><span /></div>
      <small>{checkingAccount ? 'Preparando sua conta…' : 'Organizando seu dia…'}</small>
    </div>
    <span className="splash-footer">Planeje. Compre. Organize.</span>
  </div>;
}
