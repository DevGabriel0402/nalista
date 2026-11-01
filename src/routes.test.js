import { describe, expect, it, afterEach, vi } from 'vitest';
import { getAccessRedirect, readRoute } from './routes.js';
import { navigateRoute } from './hooks/useAppRoute.js';

afterEach(() => vi.unstubAllGlobals());
describe('rotas e autenticação', () => {
  it.each([['/lista','lista',false],['/compras','historico',false],['/precos','precos',false],['/despensa','despensa',false],['/mercado','lista',true]])('resolve %s', (path,page,marketMode) => {
    expect(readRoute(path)).toMatchObject({ page, marketMode });
  });
  it('mantém um link protegido para depois do login', () => {
    const redirect = getAccessRedirect(readRoute('/despensa'), false);
    expect(redirect).toBe('/entrar?retorno=%2Fdespensa');
    expect(getAccessRedirect(readRoute(redirect), true)).toBe('/despensa');
  });
  it('restaura a compra em modo mercado após autenticação', () => {
    expect(getAccessRedirect(readRoute('/entrar?retorno=%2Fmercado'), true)).toBe('/mercado');
  });
  it.each(['https://outro-site.com','//outro-site.com','/nao-existe'])('recusa o retorno não permitido %s', (target) => {
    expect(getAccessRedirect(readRoute('/entrar?retorno='+encodeURIComponent(target)),true)).toBe('/lista');
  });
  it('identifica página inexistente sem esconder o erro de um usuário autenticado', () => {
    expect(readRoute('/nao-existe').page).toBeNull();
    expect(getAccessRedirect(readRoute('/nao-existe'), true)).toBeNull();
  });
  it('normaliza barra final e preserva parâmetros do login', () => {
    expect(readRoute('/entrar/?retorno=%2Fcompras')).toMatchObject({path:'/entrar',search:'?retorno=%2Fcompras'});
  });
  it('troca o endereço e notifica a navegação sem recarregar ou duplicar a mesma rota', () => {
    const target = new EventTarget();
    target.location = { pathname:'/lista',search:'' };
    const update = (_state,_title,path) => { const url = new URL(path,'https://nalista.local');target.location.pathname=url.pathname;target.location.search=url.search; };
    target.history = {pushState:vi.fn(update),replaceState:vi.fn(update)};
    vi.stubGlobal('window',target);
    const listener=vi.fn();target.addEventListener('nalista:navigate',listener);
    navigateRoute('/compras');navigateRoute('/compras');
    expect(target.history.pushState).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    navigateRoute('/lista',{replace:true});
    expect(target.history.replaceState).toHaveBeenCalledTimes(1);
    expect(readRoute(target.location.pathname).page).toBe('lista');
  });
});
