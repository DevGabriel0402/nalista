import { Component } from 'react';
import { LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-page" role="alert">
        <LuTriangleAlert size={42} aria-hidden="true" />
        <h1>Ocorreu um erro inesperado</h1>
        <p>Seus dados salvos localmente foram preservados. Recarregue a página para tentar novamente.</p>
        <button type="button" className="primary" onClick={this.handleReload}>
          <LuRefreshCw size={17} aria-hidden="true" /> Recarregar aplicação
        </button>
      </main>
    );
  }
}
