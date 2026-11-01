import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { PAGE_PATHS, PAGE_TITLES, readRoute } from '../routes.js';
const ROUTE_EVENT = 'nalista:navigate';
function subscribe(callback) {
  window.addEventListener('popstate', callback);
  window.addEventListener(ROUTE_EVENT, callback);
  return () => { window.removeEventListener('popstate', callback); window.removeEventListener(ROUTE_EVENT, callback); };
}
const snapshot = () => window.location.pathname + window.location.search;
export function navigateRoute(path, { replace = false } = {}) {
  if (snapshot() === path) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}
export default function useAppRoute() {
  const address = useSyncExternalStore(subscribe, snapshot, () => '/');
  const route = readRoute(address);
  useEffect(() => {
    document.title = `${route.marketMode ? 'Modo Mercado' : PAGE_TITLES[route.page] || (route.path === '/entrar' ? 'Entrar' : 'Página não encontrada')} · Na Lista`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [address]);
  const setPage = useCallback((page) => { if (PAGE_PATHS[page]) navigateRoute(PAGE_PATHS[page]); }, []);
  const setMarketMode = useCallback((enabled) => {
    if (enabled) navigateRoute('/mercado');
    else if (readRoute(snapshot()).marketMode) navigateRoute('/lista');
  }, []);
  return { ...route, setPage, setMarketMode, navigate: navigateRoute };
}
