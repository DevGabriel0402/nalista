export const PAGE_PATHS = { lista: '/lista', historico: '/compras', precos: '/precos', despensa: '/despensa' };
export const PAGE_TITLES = { lista: 'Lista de compras', historico: 'Minhas compras', precos: 'Comparar preços', despensa: 'Minha despensa' };
export function readRoute(address) {
  const url = new URL(address, 'https://nalista.local');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const page = Object.keys(PAGE_PATHS).find((key) => PAGE_PATHS[key] === path);
  return { path, page: path === '/mercado' ? 'lista' : page || null, marketMode: path === '/mercado', search: url.search };
}
export function getAccessRedirect(route, authenticated) {
  if (route.path === '/') return authenticated ? '/lista' : '/entrar';
  if (!authenticated && route.path !== '/entrar') {
    const target = route.page ? route.path : '/lista';
    return `/entrar?retorno=${encodeURIComponent(target)}`;
  }
  if (authenticated && route.path === '/entrar') {
    const target = new URLSearchParams(route.search).get('retorno');
    return [...Object.values(PAGE_PATHS), '/mercado'].includes(target) ? target : '/lista';
  }
  return null;
}
