// Dashboard runtime orchestration helpers.
// Keep view-state transitions here so DashboardView.jsx can stay focused on
// loading, composition and explicit UI wiring.

(function attachDashboardOrchestration(globalObject) {
  const {
    normalizeSelection,
    filtersKey
  } = globalObject.DashboardHelpers;

  function createDefaultFilters(baseYear, baseMonth) {
    return {
      years: [Number(baseYear)],
      months: [Number(baseMonth)],
      accounts: null,
      payers: null,
      divided: null
    };
  }

  function normalizeFilters(filters, optionsByField) {
    return {
      years: normalizeSelection(filters?.years == null ? null : filters.years, optionsByField?.years || []),
      months: normalizeSelection(filters?.months == null ? null : filters.months, optionsByField?.months || []),
      accounts: normalizeSelection(filters?.accounts == null ? null : filters.accounts, optionsByField?.accounts || []),
      payers: normalizeSelection(filters?.payers == null ? null : filters.payers, optionsByField?.payers || []),
      divided: normalizeSelection(filters?.divided == null ? null : filters.divided, optionsByField?.divided || [])
    };
  }

  function filtersMatch(leftFilters, rightFilters, optionsByField) {
    return filtersKey(leftFilters, optionsByField) === filtersKey(rightFilters, optionsByField);
  }

  function buildEmptyFilterLabels(items) {
    return (items || [])
      .filter((item) => item.summary === 'Nenhum')
      .map((item) => item.label);
  }

  function clampPage(page, pageCount) {
    const totalPages = Math.max(Number(pageCount || 1), 1);
    return Math.min(Math.max(Number(page || 0), 0), totalPages - 1);
  }

  function cyclePage(page, pageCount, direction) {
    const totalPages = Math.max(Number(pageCount || 1), 1);
    if (totalPages <= 1) return 0;
    if (direction < 0) return page <= 0 ? totalPages - 1 : page - 1;
    return page >= totalPages - 1 ? 0 : page + 1;
  }

  function cycleIndex(index, itemCount, direction) {
    const totalItems = Math.max(Number(itemCount || 0), 0);
    if (!totalItems) return 0;
    if (direction < 0) return index <= 0 ? totalItems - 1 : index - 1;
    return index >= totalItems - 1 ? 0 : index + 1;
  }

  function resolveFocusedAccount(config) {
    const name = config?.name;
    const currentName = config?.currentName || '';
    const validNames = Array.isArray(config?.validNames) ? config.validNames : [];
    const toggleIfSame = config?.toggleIfSame !== false;

    if (!name || name === 'Outros') return currentName;
    if (!validNames.includes(name)) return currentName;
    if (toggleIfSame && currentName === name) return '';
    return name;
  }

  function buildLinkedFocusState(config) {
    const nextState = {
      trendAccountIndex: Number(config?.trendAccountIndex || 0),
      singleMonthPage: Number(config?.singleMonthPage || 0),
      rankingPage: Number(config?.rankingPage || 0),
      timelinePage: Number(config?.timelinePage || 0)
    };
    const selectedName = config?.selectedName || '';

    if (!selectedName) return nextState;

    const trendAccounts = Array.isArray(config?.trendAccounts) ? config.trendAccounts : [];
    const singleMonthItems = Array.isArray(config?.singleMonthItems) ? config.singleMonthItems : [];
    const rankingItems = Array.isArray(config?.rankingItems) ? config.rankingItems : [];
    const timelineItems = Array.isArray(config?.timelineItems) ? config.timelineItems : [];

    const trendIndex = trendAccounts.indexOf(selectedName);
    if (trendIndex >= 0) {
      nextState.trendAccountIndex = trendIndex;
    }

    const singleMonthIndex = singleMonthItems.findIndex((item) => item.name === selectedName);
    if (singleMonthIndex >= 0) {
      nextState.singleMonthPage = Math.floor(singleMonthIndex / 3);
    }

    const rankingIndex = rankingItems.findIndex((item) => item.name === selectedName);
    if (rankingIndex >= 0) {
      nextState.rankingPage = Math.floor(rankingIndex / 5);
    }

    const timelineIndex = timelineItems.findIndex((item) => item.name === selectedName);
    if (timelineIndex >= 0) {
      nextState.timelinePage = Math.floor(timelineIndex / 3);
    }

    return nextState;
  }

  globalObject.DashboardOrchestration = {
    createDefaultFilters,
    normalizeFilters,
    filtersMatch,
    buildEmptyFilterLabels,
    clampPage,
    cyclePage,
    cycleIndex,
    resolveFocusedAccount,
    buildLinkedFocusState
  };
})(window);
