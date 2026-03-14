const {
  monthNamePT: dashboardMonthNamePT,
  brl: dashboardBrl,
  sum: dashboardSum,
  groupAndSort: dashboardGroupAndSort,
  filterRows: dashboardFilterRows,
  prevYearMonth: dashboardPrevYearMonth,
  pairLabel: dashboardPairLabel,
  pairLabelLong: dashboardPairLabelLong,
  sortPairs: dashboardSortPairs,
  buildPairs: dashboardBuildPairs,
  resolveSelection: dashboardResolveSelection,
  selectionSummary: dashboardSelectionSummary,
  rollingPairs: dashboardRollingPairs,
  fetchRowsForPairs: dashboardFetchRowsForPairs,
  monthOptionsForYears: dashboardMonthOptionsForYears,
  makeSeries: dashboardMakeSeries,
  categorySeries: dashboardCategorySeries,
  buildTopFiveSegments: dashboardBuildTopFiveSegments,
  buildParetoItems: dashboardBuildParetoItems,
  buildAccountComparison: dashboardBuildAccountComparison,
  computeSettlement: dashboardComputeSettlement
} = window.DashboardHelpers;
const {
  createDefaultFilters: dashboardCreateDefaultFilters,
  normalizeFilters: dashboardNormalizeFilters,
  filtersMatch: dashboardFiltersMatch,
  buildEmptyFilterLabels: dashboardBuildEmptyFilterLabels,
  clampPage: dashboardClampPage,
  cyclePage: dashboardCyclePage,
  cycleIndex: dashboardCycleIndex,
  resolveFocusedAccount: dashboardResolveFocusedAccount,
  buildLinkedFocusState: dashboardBuildLinkedFocusState
} = window.DashboardOrchestration;

// Tela ativa do dashboard BI.
// A referencia anterior permanece congelada em src/dashboard/legacy/DashboardViewLegacy.jsx.
function DashboardView(props) {
  const monthsByYear = props.monthsByYear || {};
  const baseYear = Number(props.currentYear || new Date().getFullYear());
  const baseMonth = Number(props.currentMonth || (new Date().getMonth() + 1));
  const yearOptions = React.useMemo(() => (
    (props.years && props.years.length ? [...props.years] : [baseYear])
      .sort((left, right) => right - left)
      .map((year) => ({ value: Number(year), label: String(year) }))
  ), [props.years, baseYear]);
  const dividedOptions = React.useMemo(() => ([
    { value: 'yes', label: 'Sim' },
    { value: 'no', label: 'Nao' }
  ]), []);
  const defaultFilters = React.useMemo(
    () => dashboardCreateDefaultFilters(baseYear, baseMonth),
    [baseYear, baseMonth]
  );

  const [draftFilters, setDraftFilters] = React.useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = React.useState(defaultFilters);
  const [previewRows, setPreviewRows] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [compareRows, setCompareRows] = React.useState([]);
  const [previousMonthRows, setPreviousMonthRows] = React.useState([]);
  const [rollingRows, setRollingRows] = React.useState([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [trendAccountIndex, setTrendAccountIndex] = React.useState(0);
  const [singleMonthPage, setSingleMonthPage] = React.useState(0);
  const [timelinePage, setTimelinePage] = React.useState(0);
  const [rankingPage, setRankingPage] = React.useState(0);
  const [rankingMode, setRankingMode] = React.useState('total');

  function resetDraftFilters() {
    setDraftFilters(dashboardCreateDefaultFilters(baseYear, baseMonth));
  }

  const draftSelectedYears = React.useMemo(
    () => dashboardResolveSelection(draftFilters.years, yearOptions),
    [draftFilters.years, yearOptions]
  );
  const draftMonthOptions = React.useMemo(
    () => dashboardMonthOptionsForYears(monthsByYear, draftSelectedYears),
    [monthsByYear, draftSelectedYears]
  );
  const draftSelectedMonths = React.useMemo(
    () => dashboardResolveSelection(draftFilters.months, draftMonthOptions),
    [draftFilters.months, draftMonthOptions]
  );
  const draftSelectedPairs = React.useMemo(
    () => dashboardSortPairs(dashboardBuildPairs(draftSelectedYears, draftSelectedMonths, monthsByYear)),
    [draftSelectedYears, draftSelectedMonths, monthsByYear]
  );

  React.useEffect(() => {
    setDraftFilters((prev) => {
      const next = {
        ...prev,
        ...dashboardNormalizeFilters(prev, {
          years: yearOptions,
          months: draftMonthOptions,
          accounts: [],
          payers: [],
          divided: []
        })
      };

      if (dashboardFiltersMatch(prev, next, { years: yearOptions, months: draftMonthOptions, accounts: [], payers: [], divided: [] })) {
        return prev;
      }

      return next;
    });
  }, [yearOptions, draftMonthOptions]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setPreviewLoading(true);
        const previewRowsLoaded = await dashboardFetchRowsForPairs(draftSelectedPairs);
        if (!alive) return;
        setPreviewRows(previewRowsLoaded);
      } catch (previewError) {
        console.warn('[dashboard] erro ao carregar opcoes de filtro', previewError);
        if (alive) setPreviewRows([]);
      } finally {
        if (alive) setPreviewLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [draftSelectedPairs]);

  const contasDisponiveis = React.useMemo(() => (
    Array.from(new Set(previewRows.map((row) => row.nome)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [previewRows]);

  const previewRowsPorConta = React.useMemo(() => (
    dashboardFilterRows(previewRows, {
      accounts: draftFilters.accounts,
      payers: [],
      divided: []
    })
  ), [previewRows, draftFilters.accounts]);

  const pagadoresDisponiveis = React.useMemo(() => (
    Array.from(new Set(previewRowsPorConta.map((row) => row.quem)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [previewRowsPorConta]);

  const draftFilterOptions = React.useMemo(() => ({
    years: yearOptions,
    months: draftMonthOptions,
    accounts: contasDisponiveis,
    payers: pagadoresDisponiveis,
    divided: dividedOptions
  }), [yearOptions, draftMonthOptions, contasDisponiveis, pagadoresDisponiveis, dividedOptions]);

  React.useEffect(() => {
    setDraftFilters((prev) => {
      const next = {
        ...prev,
        ...dashboardNormalizeFilters(prev, draftFilterOptions)
      };

      if (dashboardFiltersMatch(prev, next, draftFilterOptions)) {
        return prev;
      }

      return next;
    });
  }, [draftFilterOptions]);

  const normalizedDraftFilters = React.useMemo(
    () => dashboardNormalizeFilters(draftFilters, draftFilterOptions),
    [draftFilters, draftFilterOptions]
  );

  const appliedSelectedYears = React.useMemo(
    () => dashboardResolveSelection(appliedFilters.years, yearOptions),
    [appliedFilters.years, yearOptions]
  );
  const appliedMonthOptions = React.useMemo(
    () => dashboardMonthOptionsForYears(monthsByYear, appliedSelectedYears),
    [monthsByYear, appliedSelectedYears]
  );
  const appliedSelectedMonths = React.useMemo(
    () => dashboardResolveSelection(appliedFilters.months, appliedMonthOptions),
    [appliedFilters.months, appliedMonthOptions]
  );
  const appliedSelectedPairs = React.useMemo(
    () => dashboardSortPairs(dashboardBuildPairs(appliedSelectedYears, appliedSelectedMonths, monthsByYear)),
    [appliedSelectedYears, appliedSelectedMonths, monthsByYear]
  );
  const comparePairs = React.useMemo(
    () => appliedSelectedPairs.map((pair) => ({ year: pair.year - 1, month: pair.month })),
    [appliedSelectedPairs]
  );
  const lastAppliedPair = appliedSelectedPairs[appliedSelectedPairs.length - 1] || { year: baseYear, month: baseMonth };
  const previousMonthPair = React.useMemo(
    () => dashboardPrevYearMonth(lastAppliedPair.year, lastAppliedPair.month),
    [lastAppliedPair]
  );
  const showYearInLabels = React.useMemo(() => (
    new Set(appliedSelectedPairs.map((pair) => pair.year)).size > 1
  ), [appliedSelectedPairs]);
  React.useEffect(() => {
    setAppliedFilters((prev) => {
      const next = {
        ...prev,
        ...dashboardNormalizeFilters(prev, {
          years: yearOptions,
          months: appliedMonthOptions,
          accounts: [],
          payers: [],
          divided: []
        })
      };

      if (dashboardFiltersMatch(prev, next, { years: yearOptions, months: appliedMonthOptions, accounts: [], payers: [], divided: [] })) {
        return prev;
      }

      return next;
    });
  }, [yearOptions, appliedMonthOptions]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const [periodRowsLoaded, compareRowsLoaded, previousMonthRowsLoaded] = await Promise.all([
          dashboardFetchRowsForPairs(appliedSelectedPairs),
          dashboardFetchRowsForPairs(comparePairs),
          dashboardFetchRowsForPairs([previousMonthPair])
        ]);

        if (!alive) return;
        setRows(periodRowsLoaded);
        setCompareRows(compareRowsLoaded);
        setPreviousMonthRows(previousMonthRowsLoaded);
      } catch (loadError) {
        console.error('[dashboard] erro ao carregar recorte', loadError);
        if (!alive) return;
        setRows([]);
        setCompareRows([]);
        setPreviousMonthRows([]);
        setError('Nao foi possivel carregar o dashboard agora.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [appliedSelectedPairs, comparePairs, previousMonthPair]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rollingPairsLoaded = dashboardRollingPairs(lastAppliedPair.year, lastAppliedPair.month, 13);
        const rollingRowsLoaded = await dashboardFetchRowsForPairs(rollingPairsLoaded);
        if (!alive) return;
        setRollingRows(rollingRowsLoaded);
      } catch (timelineError) {
        console.warn('[dashboard] erro ao carregar ciclo anual', timelineError);
        if (alive) {
          setRollingRows([]);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [lastAppliedPair]);

  const appliedContasDisponiveis = React.useMemo(() => (
    Array.from(new Set(rows.map((row) => row.nome)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [rows]);

  const appliedRowsPorConta = React.useMemo(() => (
    dashboardFilterRows(rows, {
      accounts: appliedFilters.accounts,
      payers: [],
      divided: []
    })
  ), [rows, appliedFilters.accounts]);

  const appliedPagadoresDisponiveis = React.useMemo(() => (
    Array.from(new Set(appliedRowsPorConta.map((row) => row.quem)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [appliedRowsPorConta]);

  const appliedFilterOptions = React.useMemo(() => ({
    years: yearOptions,
    months: appliedMonthOptions,
    accounts: appliedContasDisponiveis,
    payers: appliedPagadoresDisponiveis,
    divided: dividedOptions
  }), [yearOptions, appliedMonthOptions, appliedContasDisponiveis, appliedPagadoresDisponiveis, dividedOptions]);

  React.useEffect(() => {
    setAppliedFilters((prev) => {
      const next = {
        ...prev,
        ...dashboardNormalizeFilters(prev, {
          years: appliedFilterOptions.years,
          months: appliedFilterOptions.months,
          accounts: [],
          payers: [],
          divided: appliedFilterOptions.divided
        })
      };

      if (dashboardFiltersMatch(prev, next, { years: appliedFilterOptions.years, months: appliedFilterOptions.months, accounts: [], payers: [], divided: appliedFilterOptions.divided })) {
        return prev;
      }

      return next;
    });
  }, [appliedFilterOptions]);

  const normalizedAppliedFilters = React.useMemo(
    () => dashboardNormalizeFilters(appliedFilters, appliedFilterOptions),
    [appliedFilters, appliedFilterOptions]
  );

  const hasPendingChanges = React.useMemo(
    () => JSON.stringify(normalizedDraftFilters) !== JSON.stringify(normalizedAppliedFilters),
    [normalizedDraftFilters, normalizedAppliedFilters]
  );

  const filteredRows = React.useMemo(() => dashboardFilterRows(rows, normalizedAppliedFilters), [rows, normalizedAppliedFilters]);
  const filteredCompareRows = React.useMemo(() => dashboardFilterRows(compareRows, normalizedAppliedFilters), [compareRows, normalizedAppliedFilters]);
  const filteredPreviousMonthRows = React.useMemo(() => dashboardFilterRows(previousMonthRows, normalizedAppliedFilters), [previousMonthRows, normalizedAppliedFilters]);
  const rollingPairs = React.useMemo(
    () => dashboardRollingPairs(lastAppliedPair.year, lastAppliedPair.month, 13),
    [lastAppliedPair]
  );
  const annualCycleStartPair = rollingPairs[0] || lastAppliedPair;
  const annualCycleSubtitle = `De ${dashboardPairLabelLong(annualCycleStartPair)} a ${dashboardPairLabelLong(lastAppliedPair)}`;
  const filteredRollingRows = React.useMemo(
    () => dashboardFilterRows(rollingRows, normalizedAppliedFilters),
    [rollingRows, normalizedAppliedFilters]
  );
  const resolvedAppliedAccounts = React.useMemo(() => dashboardResolveSelection(normalizedAppliedFilters.accounts, appliedFilterOptions.accounts), [normalizedAppliedFilters.accounts, appliedFilterOptions.accounts]);
  const yearsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.years, yearOptions, 'Todos'), [normalizedAppliedFilters.years, yearOptions]);
  const monthsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.months, appliedMonthOptions, 'Todos'), [normalizedAppliedFilters.months, appliedMonthOptions]);
  const accountsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.accounts, appliedContasDisponiveis, 'Todas'), [normalizedAppliedFilters.accounts, appliedContasDisponiveis]);
  const payersSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.payers, appliedPagadoresDisponiveis, 'Todos'), [normalizedAppliedFilters.payers, appliedPagadoresDisponiveis]);
  const dividedSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.divided, dividedOptions, 'Sim e Nao'), [normalizedAppliedFilters.divided, dividedOptions]);
  const emptyFilterLabels = React.useMemo(
    () => dashboardBuildEmptyFilterLabels([
      { label: 'ano', summary: yearsSummary },
      { label: 'mes', summary: monthsSummary },
      { label: 'conta', summary: accountsSummary },
      { label: 'pagador', summary: payersSummary },
      { label: 'divisao', summary: dividedSummary }
    ]),
    [yearsSummary, monthsSummary, accountsSummary, payersSummary, dividedSummary]
  );
  const hasEmptyAppliedFilters = emptyFilterLabels.length > 0;
  const totalPeriodo = React.useMemo(() => dashboardSum(filteredRows), [filteredRows]);
  const totalDividido = React.useMemo(() => dashboardSum(filteredRows.filter((row) => row.dividida)), [filteredRows]);
  const totalNaoDividido = Math.max(totalPeriodo - totalDividido, 0);
  const rankingCategorias = React.useMemo(() => dashboardGroupAndSort(filteredRows, 'nome'), [filteredRows]);
  const rankingPagadores = React.useMemo(() => dashboardGroupAndSort(filteredRows, 'quem'), [filteredRows]);
  const topCategoria = rankingCategorias[0] || null;
  const donutData = React.useMemo(() => dashboardBuildTopFiveSegments(rankingCategorias), [rankingCategorias]);
  const donutSegments = donutData.segments;
  const donutTopValue = donutData.topFiveTotal;
  const settlement = React.useMemo(() => dashboardComputeSettlement(filteredRows), [filteredRows]);
  const splitPct = totalPeriodo > 0 ? Math.round((totalDividido / totalPeriodo) * 100) : 0;

  React.useEffect(() => {
    if (selectedCategory && !rankingCategorias.some((item) => item.name === selectedCategory)) {
      setSelectedCategory('');
    }
  }, [rankingCategorias, selectedCategory]);

  const focusedCategory = selectedCategory || '';
  const monthsCount = Math.max(appliedSelectedPairs.length, 1);
  const rankingItems = React.useMemo(() => (
    rankingCategorias
      .map((item) => ({
        name: item.name,
        total: rankingMode === 'average' ? (item.total / monthsCount) : item.total,
        rawTotal: item.total
      }))
      .sort((left, right) => right.total - left.total)
  ), [rankingCategorias, rankingMode, monthsCount]);
  const paretoItems = React.useMemo(
    () => dashboardBuildParetoItems(rankingCategorias),
    [rankingCategorias]
  );

  const trendAccounts = React.useMemo(() => {
    if (rankingCategorias.length) return rankingCategorias.map((item) => item.name);
    return resolvedAppliedAccounts.length
      ? resolvedAppliedAccounts
      : appliedContasDisponiveis.map((option) => option.value);
  }, [rankingCategorias, resolvedAppliedAccounts, appliedContasDisponiveis]);
  const donutSelectableNames = React.useMemo(
    () => new Set(donutSegments.filter((segment) => segment.name !== 'Outros').map((segment) => segment.name)),
    [donutSegments]
  );
  const rankingCategoryNames = React.useMemo(
    () => rankingCategorias.map((item) => item.name),
    [rankingCategorias]
  );
  const cycleCategoryNames = React.useMemo(() => {
    if (!rankingCategorias.length || !filteredRollingRows.length) return [];

    const rollingNameSet = new Set(filteredRollingRows.map((row) => row.nome));
    return rankingCategorias
      .map((item) => item.name)
      .filter((name) => rollingNameSet.has(name));
  }, [rankingCategorias, filteredRollingRows]);

  React.useEffect(() => {
    if (!trendAccounts.length) {
      setTrendAccountIndex(0);
      return;
    }
    if (trendAccountIndex > trendAccounts.length - 1) {
      setTrendAccountIndex(0);
    }
  }, [trendAccounts, trendAccountIndex]);

  const focusedTrendAccount = trendAccounts[trendAccountIndex] || '';
  const trendSeries = React.useMemo(() => (
    dashboardMakeSeries(filteredRollingRows, rollingPairs, focusedTrendAccount)
      .map((point, index) => ({
        ...point,
        label: dashboardPairLabel(rollingPairs[index], true)
      }))
  ), [filteredRollingRows, rollingPairs, focusedTrendAccount]);
  const trendAverageValue = React.useMemo(() => {
    if (!trendSeries.length) return 0;
    return trendSeries.reduce((sum, point) => sum + Number(point.value || 0), 0) / trendSeries.length;
  }, [trendSeries]);
  const categoriasTimeline = React.useMemo(() => (
    dashboardCategorySeries(filteredRollingRows, rollingPairs, 999, {
      orderedNames: cycleCategoryNames
    }).map((group) => ({
      ...group,
      points: group.points.map((point, index) => ({
        ...point,
        label: dashboardPairLabel(rollingPairs[index], true)
      }))
    }))
  ), [filteredRollingRows, rollingPairs, cycleCategoryNames]);
  const singleMonthComparison = React.useMemo(() => (
    dashboardBuildAccountComparison(filteredRows, filteredPreviousMonthRows, filteredCompareRows)
  ), [filteredRows, filteredPreviousMonthRows, filteredCompareRows]);
  const singleMonthPageCount = Math.max(1, Math.ceil(singleMonthComparison.length / 3));
  const visibleSingleMonthComparison = React.useMemo(
    () => singleMonthComparison.slice(singleMonthPage * 3, (singleMonthPage * 3) + 3),
    [singleMonthComparison, singleMonthPage]
  );
  const timelinePageCount = Math.max(1, Math.ceil(categoriasTimeline.length / 3));
  const visibleTimelineSeries = React.useMemo(
    () => categoriasTimeline.slice(timelinePage * 3, (timelinePage * 3) + 3),
    [categoriasTimeline, timelinePage]
  );
  const rankingPageCount = Math.max(1, Math.ceil(rankingItems.length / 5));
  const visibleRankingItems = React.useMemo(
    () => rankingItems.slice(rankingPage * 5, (rankingPage * 5) + 5),
    [rankingItems, rankingPage]
  );

  function clearLinkedFocus() {
    setSelectedCategory('');
  }

  function focusDashboardAccount(name, options = {}) {
    const nextSelectedCategory = dashboardResolveFocusedAccount({
      name,
      currentName: selectedCategory,
      validNames: rankingCategoryNames,
      toggleIfSame: options.toggleIfSame !== false
    });

    if (nextSelectedCategory !== selectedCategory) {
      setSelectedCategory(nextSelectedCategory);
    }
  }

  React.useEffect(() => {
    const nextPage = dashboardClampPage(singleMonthPage, singleMonthPageCount);
    if (nextPage !== singleMonthPage) setSingleMonthPage(nextPage);
  }, [singleMonthPage, singleMonthPageCount]);

  React.useEffect(() => {
    const nextPage = dashboardClampPage(timelinePage, timelinePageCount);
    if (nextPage !== timelinePage) setTimelinePage(nextPage);
  }, [timelinePage, timelinePageCount]);

  React.useEffect(() => {
    const nextPage = dashboardClampPage(rankingPage, rankingPageCount);
    if (nextPage !== rankingPage) setRankingPage(nextPage);
  }, [rankingPage, rankingPageCount]);

  React.useEffect(() => {
    const nextLinkedState = dashboardBuildLinkedFocusState({
      selectedName: selectedCategory,
      trendAccounts,
      singleMonthItems: singleMonthComparison,
      rankingItems,
      timelineItems: categoriasTimeline,
      trendAccountIndex,
      singleMonthPage,
      rankingPage,
      timelinePage
    });

    if (nextLinkedState.trendAccountIndex !== trendAccountIndex) setTrendAccountIndex(nextLinkedState.trendAccountIndex);
    if (nextLinkedState.singleMonthPage !== singleMonthPage) setSingleMonthPage(nextLinkedState.singleMonthPage);
    if (nextLinkedState.rankingPage !== rankingPage) setRankingPage(nextLinkedState.rankingPage);
    if (nextLinkedState.timelinePage !== timelinePage) setTimelinePage(nextLinkedState.timelinePage);
  }, [selectedCategory, trendAccounts, trendAccountIndex, singleMonthComparison, singleMonthPage, rankingItems, rankingPage, categoriasTimeline, timelinePage]);

  const primeiraPessoa = rankingPagadores[0] || null;
  const segundaPessoa = rankingPagadores[1] || null;
  const cardsPrincipais = [
    {
      key: 'total',
      label: appliedSelectedPairs.length > 1 ? 'Total do periodo' : 'Total do mes',
      value: dashboardBrl(totalPeriodo),
      detail: `${filteredRows.length} contas pagas neste periodo filtrado.`,
      tooltip: 'Soma de todos os valores do período filtrado no dashboard.'
    },
    {
      key: 'split',
      label: 'Valor total dividido',
      value: dashboardBrl(totalDividido),
      detail: `${splitPct}% do total do periodo.`,
      tooltip: 'Soma das contas marcadas como divididas dentro do período filtrado.'
    },
    {
      key: 'payer-1',
      label: primeiraPessoa ? `Pago por ${primeiraPessoa.name}` : 'Pago por',
      value: dashboardBrl(primeiraPessoa ? primeiraPessoa.total : 0),
      detail: primeiraPessoa ? 'Maior pagador do periodo.' : 'Aguardando dados.',
      tooltip: 'Maior pagador no período filtrado.'
    },
    {
      key: 'payer-2',
      label: segundaPessoa ? `Pago por ${segundaPessoa.name}` : 'Qtd. de contas pagas',
      value: segundaPessoa ? dashboardBrl(segundaPessoa.total) : String(filteredRows.length),
      detail: segundaPessoa ? 'Segundo maior pagador do periodo.' : 'Contas pagas no periodo filtrado.',
      tooltip: segundaPessoa
        ? 'Segundo maior pagador no período filtrado.'
        : 'Quantidade de contas pagas visíveis após aplicar os filtros.'
    }
  ];

  const singleMonthMode = appliedSelectedPairs.length <= 1;
  const previousMonthLabel = `${dashboardMonthNamePT(previousMonthPair.month)} ${previousMonthPair.year}`;
  const previousYearLabel = `${dashboardMonthNamePT(lastAppliedPair.month)} ${lastAppliedPair.year - 1}`;
  const emptyStateMessage = `Selecione ao menos uma opcao em ${emptyFilterLabels.join(', ')} e clique em Atualizar dashboard.`;

  function applyDraftFilters() {
    setAppliedFilters(normalizedDraftFilters);
    setSelectedCategory('');
    setTrendAccountIndex(0);
    setSingleMonthPage(0);
    setTimelinePage(0);
    setRankingPage(0);
  }
  return (
    <div className="space-y-6" data-dash-root="true">
      <DashboardFilterToolbarMock
        filters={draftFilters}
        onChange={setDraftFilters}
        onReset={resetDraftFilters}
        onApply={applyDraftFilters}
        yearOptions={yearOptions}
        monthOptions={draftMonthOptions}
        accountOptions={contasDisponiveis}
        payerOptions={pagadoresDisponiveis}
        dividedOptions={dividedOptions}
        previewLoading={previewLoading}
        loading={loading}
        hasPendingChanges={hasPendingChanges}
        appliedYearsSummary={yearsSummary}
        appliedMonthsSummary={monthsSummary}
        appliedAccountsSummary={accountsSummary}
        appliedPayersSummary={payersSummary}
        appliedDividedSummary={dividedSummary}
        appliedRowCount={filteredRows.length}
      />

      {error ? <div className="card border-red-500 text-red-200">{error}</div> : null}

      {loading ? (
        <div className="card text-center py-12">Atualizando dashboard...</div>
      ) : hasEmptyAppliedFilters ? (
        <div className="card text-center py-12 space-y-3" data-dash-empty-state="true">
          <div className="text-lg font-semibold">Dashboard vazio</div>
          <div className="text-sm opacity-70">{emptyStateMessage}</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cardsPrincipais.map((card) => (
              <DashboardMetricCard
                key={card.key}
                label={card.label}
                value={card.value}
                detail={card.detail}
                tooltip={card.tooltip}
                testId={card.key}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DashboardMetricCard
              label="Acerto entre pagadores"
              value={settlement.headline}
              detail={settlement.detail}
              tooltip="Estimativa simples de acerto considerando apenas as contas divididas do período filtrado."
              testId="settlement"
            />
            <DashboardMetricCard
              label="Maior categoria"
              value={topCategoria ? topCategoria.name : 'Sem dados'}
              detail={topCategoria && totalPeriodo > 0 ? `${Math.round((topCategoria.total / totalPeriodo) * 100)}% do total do periodo.` : 'Aguardando movimentacao'}
              tooltip="Categoria com maior valor somado depois da aplicação de todos os filtros."
              testId="top-category"
            />
            <DashboardMetricCard
              label="Qtd. de contas pagas"
              value={String(filteredRows.length)}
              detail={filteredRows.length ? 'Contas pagas no periodo filtrado.' : 'Nenhuma conta paga neste periodo.'}
              tooltip="Quantidade de contas pagas visíveis após a aplicação do filtro."
              testId="count"
            />
          </div>

          <DashboardSection
            title="Pareto das contas"
            subtitle={singleMonthMode
              ? 'Categorias do mes filtrado em ordem de impacto.'
              : 'Categorias agregadas do periodo filtrado com curva acumulada.'}
            tooltip="Ordena as categorias do maior para o menor valor e mostra como o acumulado do período se forma. Clique em uma barra para destacar a mesma categoria nos demais gráficos."
            testId="pareto"
          >
            <DashboardParetoChart
              items={paretoItems}
              onSelect={focusDashboardAccount}
              selectedName={focusedCategory}
              ariaLabel="Gráfico de Pareto das contas do período filtrado"
            />
          </DashboardSection>

          {singleMonthMode ? (
            <DashboardSection
              title="Comparativo por conta"
              subtitle="Mes atual contra mes anterior e mesmo mes do ano anterior."
              tooltip="Mostra as contas do mês atual em blocos de três, ordenadas pelo maior valor do mês selecionado."
              testId="trend-single"
            >
              {singleMonthPageCount > 1 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        clearLinkedFocus();
                        setSingleMonthPage((prev) => dashboardCyclePage(prev, singleMonthPageCount, -1));
                      }}
                      data-dash-action="single-prev"
                    >
                      &lt;
                    </button>
                    <div className="badge">
                      Contas {Math.min((singleMonthPage * 3) + 1, singleMonthComparison.length)} a {Math.min((singleMonthPage * 3) + visibleSingleMonthComparison.length, singleMonthComparison.length)} de {singleMonthComparison.length}
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        clearLinkedFocus();
                        setSingleMonthPage((prev) => dashboardCyclePage(prev, singleMonthPageCount, 1));
                      }}
                      data-dash-action="single-next"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              ) : null}
              <DashboardComparisonBars
                items={visibleSingleMonthComparison}
                currentLabel={`${dashboardMonthNamePT(lastAppliedPair.month)} ${lastAppliedPair.year}`}
                previousLabel={previousMonthLabel}
                previousYearLabel={previousYearLabel}
                onSelect={focusDashboardAccount}
                selectedName={focusedCategory}
              />
            </DashboardSection>
          ) : (
            <DashboardSection
              title="Evolucao por conta"
              subtitle={annualCycleSubtitle}
              tooltip="Mostra o ciclo anual da conta selecionada, do mesmo mês do ano anterior até o mês final do período filtrado. A média do ciclo atual aparece como referência no topo do gráfico."
              testId="trend-period"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!trendAccounts.length) return;
                      const nextIndex = dashboardCycleIndex(trendAccountIndex, trendAccounts.length, -1);
                      focusDashboardAccount(trendAccounts[nextIndex], { toggleIfSame: false });
                    }}
                    data-dash-action="trend-prev"
                    disabled={!trendAccounts.length}
                    aria-label="Conta anterior"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!trendAccounts.length) return;
                      const nextIndex = dashboardCycleIndex(trendAccountIndex, trendAccounts.length, 1);
                      focusDashboardAccount(trendAccounts[nextIndex], { toggleIfSame: false });
                    }}
                    data-dash-action="trend-next"
                    disabled={!trendAccounts.length}
                    aria-label="Proxima conta"
                  >
                    &gt;
                  </button>
                </div>
                <div className="text-center text-base font-semibold" style={{ color: 'var(--primary)' }} data-dash-trend-account="true">
                  {focusedTrendAccount || 'Nenhuma conta selecionada'}
                </div>
              </div>
              <DashboardSparkline
                points={trendSeries}
                primaryLabel="Ciclo anual atual"
                averageValue={trendAverageValue}
                averageLabel="Média do ciclo atual"
                ariaLabel={`Gráfico de evolução para ${focusedTrendAccount || 'conta selecionada'}`}
              />
            </DashboardSection>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            <DashboardSection
              title="Top 5 contas"
              tooltip="Top 5 contas do período filtrado. Clique na legenda para destacar e abrir a fatia correspondente na rosca."
              testId="composition"
            >
              <DashboardDonut
                segments={donutSegments}
                total={totalPeriodo}
                topValue={donutTopValue}
                onSelect={focusDashboardAccount}
                selectedName={donutSelectableNames.has(focusedCategory) ? focusedCategory : ''}
                pageSize={5}
              />
            </DashboardSection>

            <DashboardSection
              title="Ranking de gastos"
              tooltip="Mostra todas as contas do período filtrado. Quando houver mais de um mês, você pode alternar entre total acumulado e média por mês."
              testId="ranking"
              actions={[
                appliedSelectedPairs.length > 1 ? (
                  <div key="ranking-mode" className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`btn ${rankingMode === 'total' ? 'primary' : 'ghost'}`}
                      onClick={() => setRankingMode('total')}
                      data-dash-ranking-mode="total"
                    >
                      Total
                    </button>
                    <button
                      type="button"
                      className={`btn ${rankingMode === 'average' ? 'primary' : 'ghost'}`}
                      onClick={() => setRankingMode('average')}
                      data-dash-ranking-mode="average"
                    >
                      Media/mes
                    </button>
                  </div>
                ) : null,
                rankingPageCount > 1 ? (
                  <div key="ranking-page" className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        clearLinkedFocus();
                        setRankingPage((prev) => dashboardCyclePage(prev, rankingPageCount, -1));
                      }}
                      data-dash-action="ranking-prev"
                    >
                      &lt;
                    </button>
                    <div className="badge">
                      Itens {Math.min((rankingPage * 5) + 1, rankingItems.length)} a {Math.min((rankingPage * 5) + visibleRankingItems.length, rankingItems.length)} de {rankingItems.length}
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        clearLinkedFocus();
                        setRankingPage((prev) => dashboardCyclePage(prev, rankingPageCount, 1));
                      }}
                      data-dash-action="ranking-next"
                    >
                      &gt;
                    </button>
                  </div>
                ) : null
              ].filter(Boolean)}
            >
              <DashboardBarList items={visibleRankingItems} onSelect={focusDashboardAccount} selectedName={focusedCategory} />
            </DashboardSection>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DashboardSection
              title="Pagadores"
              tooltip="Mostra o maior pagador, os demais pagadores e o peso das contas divididas no período filtrado."
              testId="payers"
            >
              <DashboardPayersPanel
                items={rankingPagadores}
                dividedTotal={totalDividido}
                nonDividedTotal={totalNaoDividido}
                splitPct={splitPct}
                settlement={settlement}
              />
            </DashboardSection>

            <DashboardSection
              title="Ciclo anual"
              subtitle={annualCycleSubtitle}
              tooltip="Mostra, para cada conta presente no periodo filtrado, o ciclo anual do mesmo mes do ano anterior ate o mes final do recorte. Clique numa barra para ver o valor daquele mes e use as setas para navegar de tres em tres contas."
              testId="category-trends"
            >
              {timelinePageCount > 1 ? (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      clearLinkedFocus();
                      setTimelinePage((prev) => dashboardCyclePage(prev, timelinePageCount, -1));
                    }}
                    data-dash-action="timeline-prev"
                    aria-label="Bloco anterior"
                  >
                    &lt;
                  </button>
                  <div className="badge">
                    Contas {Math.min((timelinePage * 3) + 1, categoriasTimeline.length)} a {Math.min((timelinePage * 3) + visibleTimelineSeries.length, categoriasTimeline.length)} de {categoriasTimeline.length}
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      clearLinkedFocus();
                      setTimelinePage((prev) => dashboardCyclePage(prev, timelinePageCount, 1));
                    }}
                    data-dash-action="timeline-next"
                    aria-label="Proximo bloco"
                  >
                    &gt;
                  </button>
                </div>
              ) : null}
              <DashboardCategoryTrends series={visibleTimelineSeries} onSelect={focusDashboardAccount} selectedName={focusedCategory} />
            </DashboardSection>
          </div>
        </>
      )}
    </div>
  );
}
