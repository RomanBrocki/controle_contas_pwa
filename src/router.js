// ================================================
// 🧭 SPA Router por Hash - Controle de Contas PWA
// ================================================
//
// Este módulo controla a navegação entre telas do app
// com base no hash da URL (#/mes, #/relatorios, etc.).
// Não há reload — ele apenas chama o callback correto.
//
// -----------------------------------------------
// 🔧 COMO USAR:
// 1. Importe este arquivo no index.html (ou main.html):
//    <script type="module" src="./src/router.js"></script>
//
// 2. Registre as rotas:
//    Router.register('#/mes', renderMes);
//    Router.register('#/relatorios', renderRelatorios);
//
// 3. Inicie o roteador:
//    Router.start();
//
// 4. Use `Router.go('#/mes')` para navegar via código.
// -----------------------------------------------

export const Router = (() => {
  // ----------------------------
  // 🔹 Mapa de rotas registradas
  // ----------------------------
  const routes = new Map();

  // ----------------------------
  // 🧩 Registrar uma rota
  // ----------------------------
  function register(path, handler) {
    routes.set(path, handler);
  }

  // ----------------------------
  // 🚀 Navegar manualmente
  // ----------------------------
  function go(path) {
    if (window.location.hash !== path) {
      window.location.hash = path;
    } else {
      // Se já estiver na mesma rota, forçar render
      handleRouteChange();
    }
  }

  // ----------------------------
  // 🧭 Handler principal
  // ----------------------------
  function handleRouteChange() {
    const hash = window.location.hash || '#/';
    const [path, query] = hash.split('?');
    const handler = routes.get(path);

    if (handler) {
      // Converte query string (ex: ano=2025&mes=10) em objeto
      const params = {};
      if (query) {
        query.split('&').forEach((kv) => {
          const [k, v] = kv.split('=');
          params[k] = decodeURIComponent(v);
        });
      }
      handler(params);
    } else {
      // Se rota não registrada, redireciona pro default
      const defaultHandler = routes.get('#/');
      if (defaultHandler) defaultHandler();
    }
  }

  // ----------------------------
  // 🏁 Inicialização
  // ----------------------------
  function start() {
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); // executa rota inicial
  }

  // ----------------------------
  // 🔙 API pública
  // ----------------------------
  return { register, start, go };
})();
