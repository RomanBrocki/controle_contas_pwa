(function attachPostLoginWorkflows(globalObject) {
  const postLoginData = globalObject.PostLoginData;

  function isCurrentMonth(year, month, referenceDate = new Date()) {
    return Number(year) === referenceDate.getFullYear()
      && Number(month) === (referenceDate.getMonth() + 1);
  }

  async function loadShellBootstrap(defaultTheme) {
    const [periods, profile] = await Promise.all([
      postLoginData.loadAvailablePeriods(),
      postLoginData.loadProfile(defaultTheme)
    ]);

    return {
      years: periods.years || [],
      monthsByYear: periods.monthsByYear || {},
      profile,
      theme: profile?.theme || defaultTheme
    };
  }

  async function loadDistinctAccountsSnapshot() {
    return postLoginData.loadDistinctAccounts();
  }

  async function saveProfileSnapshot(profileDraft) {
    return postLoginData.saveProfile(profileDraft);
  }

  async function loadPayersSnapshot() {
    return postLoginData.loadPayers();
  }

  async function loadMonthSnapshot(year, month) {
    return postLoginData.loadMonthItems(year, month);
  }

  async function loadPendingSnapshot(year, month) {
    const pendingItems = await postLoginData.loadPendingItems(year, month);
    return {
      pendingItems,
      shouldAutoOpen: isCurrentMonth(year, month) && pendingItems.length > 0
    };
  }

  async function saveContaAndReloadMonth(context) {
    await postLoginData.saveConta(context.mode, context.initialId, context.form, {
      year: context.year,
      month: context.month
    });
    return loadMonthSnapshot(context.year, context.month);
  }

  async function deleteContaAndReloadMonth(context) {
    await postLoginData.deleteConta(context.id);
    return loadMonthSnapshot(context.year, context.month);
  }

  globalObject.PostLoginWorkflows = {
    isCurrentMonth,
    loadShellBootstrap,
    loadDistinctAccountsSnapshot,
    saveProfileSnapshot,
    loadPayersSnapshot,
    loadMonthSnapshot,
    loadPendingSnapshot,
    saveContaAndReloadMonth,
    deleteContaAndReloadMonth
  };
})(window);
