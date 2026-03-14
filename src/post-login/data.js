// Runtime data gateway for the post-login shell.
// Keep Supabase/DataAdapter orchestration here so the main shell can focus on
// state transitions, routing and visual composition.

(function attachPostLoginData(globalObject) {
  const {
    previousYearMonth,
    accountIdentityKey,
    buildContaDraft
  } = globalObject.PostLoginHelpers;
  const normalizeTheme = globalObject.ThemeCatalog?.normalizeTheme || ((value) => value || 'gunmetal');

  async function loadAvailablePeriods() {
    const years = await globalObject.SupabaseQueries.listYears();
    const monthEntries = await Promise.all((years || []).map(async (year) => {
      const months = await globalObject.SupabaseQueries.listMonthsByYear(year);
      return [year, months];
    }));

    return {
      years: years || [],
      monthsByYear: Object.fromEntries(monthEntries)
    };
  }

  async function loadProfile(defaultTheme) {
    const fallbackTheme = normalizeTheme(defaultTheme);
    try {
      const profile = await globalObject.SupabaseQueries.getProfile();
      if (profile) {
        return {
          ...profile,
          theme: normalizeTheme(profile.theme || fallbackTheme)
        };
      }
    } catch (error) {
      console.warn('[perfil] erro ao carregar:', error);
    }

    return {
      email: '',
      theme: fallbackTheme,
      payers_default: [],
      chart_accounts: []
    };
  }

  async function saveProfile(profileDraft) {
    const sanitizedProfile = {
      ...profileDraft,
      theme: normalizeTheme(profileDraft.theme)
    };
    const ok = await globalObject.SupabaseQueries.upsertProfile(sanitizedProfile);
    if (!ok) throw new Error('Falha ao salvar perfil');

    const savedProfile = {
      email: sanitizedProfile.email ?? '',
      theme: sanitizedProfile.theme,
      chart_accounts: Array.isArray(sanitizedProfile.chart_accounts)
        ? sanitizedProfile.chart_accounts.slice(0, 7)
        : [],
    };

    globalObject.AppShellRuntime?.commitProfileSnapshot?.(savedProfile);
    return savedProfile;
  }

  async function loadDistinctAccounts() {
    const list = await globalObject.SupabaseQueries.contasDistinctUltimos12?.();
    return Array.isArray(list) ? list : [];
  }

  async function loadPayers() {
    const list = await globalObject.SupabaseQueries.payersDistinct();
    return list || [];
  }

  async function loadMonthItems(year, month) {
    return globalObject.DataAdapter.fetchMes(year, month);
  }

  async function loadPendingItems(year, month) {
    const previousPair = previousYearMonth(year, month);
    const [currentItems, previousItems] = await Promise.all([
      loadMonthItems(year, month),
      loadMonthItems(previousPair.year, previousPair.month)
    ]);

    const currentKeys = new Set((currentItems || []).map(accountIdentityKey));
    return (previousItems || []).filter((item) => !currentKeys.has(accountIdentityKey(item)));
  }

  async function saveConta(mode, initialId, form, context) {
    const draft = buildContaDraft(form, context);
    const mutations = globalObject.SupabaseMutations || globalObject.SupabaseQueries;
    if (!mutations) throw new Error('SupabaseMutations/Queries nao carregados');

    const ok = mode === 'new'
      ? await mutations.insertConta(draft)
      : await mutations.updateConta(initialId, draft);

    if (!ok) throw new Error('Falha no Supabase');
    return true;
  }

  async function deleteConta(id) {
    const mutations = globalObject.SupabaseMutations || globalObject.SupabaseQueries;
    if (!mutations) throw new Error('SupabaseMutations/Queries nao carregados');

    const ok = await mutations.deleteConta(id);
    if (!ok) throw new Error('Falha no Supabase');
    return true;
  }

  globalObject.PostLoginData = {
    loadAvailablePeriods,
    loadProfile,
    saveProfile,
    loadDistinctAccounts,
    loadPayers,
    loadMonthItems,
    loadPendingItems,
    saveConta,
    deleteConta
  };
})(window);
