(function attachAppShellRuntime(globalObject) {
  let cachedAuthSnapshot = globalObject.MOCK_AUTH || null;
  let cachedProfileSnapshot = globalObject.AppState?.profile || null;

  function resolveSectionFromHash(hashValue) {
    return hashValue && String(hashValue).startsWith('#/dashboard')
      ? 'dashboard'
      : 'controle';
  }

  function ensureControlRoute() {
    if (globalObject.location.hash !== '#/mes') {
      globalObject.location.hash = '#/mes';
    }
  }

  function buildAuthSnapshot(user) {
    if (!user || !user.id) return null;
    return {
      user_id: user.id,
      email: user.email || ''
    };
  }

  function commitAuthSnapshot(authSnapshot) {
    cachedAuthSnapshot = authSnapshot || null;
    globalObject.MOCK_AUTH = cachedAuthSnapshot;
    globalObject.SupabaseClient = globalObject.SupabaseClient || {};
    globalObject.SupabaseClient.__lastAuthUid = cachedAuthSnapshot?.user_id || null;

    if (!cachedAuthSnapshot) {
      cachedProfileSnapshot = null;
      globalObject.AppState = globalObject.AppState || {};
      globalObject.AppState.profile = null;
    }

    return cachedAuthSnapshot;
  }

  function getAuthSnapshot() {
    return cachedAuthSnapshot;
  }

  function hasAuthSnapshot() {
    return Boolean(cachedAuthSnapshot?.user_id);
  }

  function commitProfileSnapshot(profile) {
    cachedProfileSnapshot = profile || null;
    globalObject.AppState = globalObject.AppState || {};
    globalObject.AppState.profile = cachedProfileSnapshot;
    return cachedProfileSnapshot;
  }

  function getProfileSnapshot() {
    return cachedProfileSnapshot;
  }

  async function syncAuthFromSupabaseSession() {
    const { supabase } = globalObject.SupabaseClient || {};
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const user = data?.session?.user;
    if (!user) return null;

    const authSnapshot = commitAuthSnapshot(buildAuthSnapshot(user));
    ensureControlRoute();
    return authSnapshot;
  }

  async function signOut() {
    const { supabase } = globalObject.SupabaseClient || {};
    if (supabase) {
      await supabase.auth.signOut();
    }
    commitAuthSnapshot(null);
  }

  async function loadProfile() {
    const profile = await globalObject.SupabaseQueries.getProfile();
    return commitProfileSnapshot(profile);
  }

  function emitUiEvent(eventName) {
    globalObject.dispatchEvent(new CustomEvent(eventName));
  }

  globalObject.AppShellRuntime = {
    resolveSectionFromHash,
    ensureControlRoute,
    buildAuthSnapshot,
    commitAuthSnapshot,
    getAuthSnapshot,
    hasAuthSnapshot,
    commitProfileSnapshot,
    getProfileSnapshot,
    syncAuthFromSupabaseSession,
    signOut,
    loadProfile,
    emitUiEvent
  };
})(window);
