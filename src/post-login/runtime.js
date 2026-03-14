(function attachPostLoginRuntime(globalObject) {
  let currentRoutes = null;
  let pendingRouteCall = null;

  function resolveViewFromHash(hashValue) {
    return hashValue && String(hashValue).startsWith('#/dashboard')
      ? 'dashboard'
      : 'controle';
  }

  function listen(eventName, handler) {
    globalObject.addEventListener(eventName, handler);
    return function cleanup() {
      globalObject.removeEventListener(eventName, handler);
    };
  }

  function registerRoutes(handlers) {
    currentRoutes = {
      mes: ({ ano, mes } = {}) => handlers?.mes?.({ ano, mes }),
      relatorios: () => handlers?.relatorios?.(),
      dashboard: () => handlers?.dashboard?.()
    };

    globalObject.AppRoutes = currentRoutes;

    if (pendingRouteCall && typeof currentRoutes[pendingRouteCall.routeName] === 'function') {
      currentRoutes[pendingRouteCall.routeName](pendingRouteCall.payload);
      pendingRouteCall = null;
    }

    return function cleanup() {
      if (globalObject.AppRoutes === currentRoutes) {
        delete globalObject.AppRoutes;
      }
      currentRoutes = null;
    };
  }

  function invokeRoute(routeName, payload) {
    const routeHandler = currentRoutes?.[routeName];
    if (typeof routeHandler === 'function') {
      routeHandler(payload);
      return true;
    }

    const legacyRouteHandler = globalObject.AppRoutes?.[routeName];
    if (typeof legacyRouteHandler === 'function') {
      legacyRouteHandler(payload);
      return true;
    }

    pendingRouteCall = { routeName, payload };

    return false;
  }

  function goToMonth(year, month) {
    const hash = `#/mes?ano=${year}&mes=${month}`;
    if (globalObject.Router?.go) {
      globalObject.Router.go(hash);
      return;
    }
    globalObject.location.hash = hash;
  }

  function goToDashboard() {
    if (globalObject.Router?.go) {
      globalObject.Router.go('#/dashboard');
      return;
    }
    globalObject.location.hash = '#/dashboard';
  }

  function clearToastTimer(timerRef) {
    if (!timerRef?.current) return;
    globalObject.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function showTemporaryToast(timerRef, setToast, msg, type = 'ok', duration = 1800) {
    clearToastTimer(timerRef);
    setToast({ msg, type });
    timerRef.current = globalObject.setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, duration);
  }

  globalObject.PostLoginRuntime = {
    resolveViewFromHash,
    listen,
    registerRoutes,
    invokeRoute,
    goToMonth,
    goToDashboard,
    clearToastTimer,
    showTemporaryToast
  };
})(window);
