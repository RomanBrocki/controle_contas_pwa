// Referencia legada preservada para comparacao funcional e consulta tecnica.
(() => {
const {
  monthNamePT: dashboardMonthNamePT,
  brl: dashboardBrl,
  isoToBR: dashboardIsoToBR,
  normalizeRow: dashboardNormalizeRow,
  sum: dashboardSum,
  groupAndSort: dashboardGroupAndSort,
  groupTotalsMap: dashboardGroupTotalsMap,
  filterRows: dashboardFilterRows,
  prevYearMonth: dashboardPrevYearMonth,
  pairKey: dashboardPairKey,
  pairLabel: dashboardPairLabel,
  pairLabelLong: dashboardPairLabelLong,
  sortPairs: dashboardSortPairs,
  buildPairs: dashboardBuildPairs,
  resolveSelection: dashboardResolveSelection,
  selectionSummary: dashboardSelectionSummary,
  normalizeSelection: dashboardNormalizeSelection,
  filtersKey: dashboardFiltersKey,
  toggleSelection: dashboardToggleSelection,
  rollingPairs: dashboardRollingPairs,
  fetchRowsForPairs: dashboardFetchRowsForPairs,
  monthOptionsForYears: dashboardMonthOptionsForYears,
  makeSeries: dashboardMakeSeries,
  categorySeries: dashboardCategorySeries,
  buildTopFiveSegments: dashboardBuildTopFiveSegments,
  buildParetoItems: dashboardBuildParetoItems,
  splitLabel: dashboardSplitLabel,
  buildAccountComparison: dashboardBuildAccountComparison,
  computeSettlement: dashboardComputeSettlement,
  buildCategoryFocus: dashboardBuildCategoryFocus
} = window.DashboardHelpers;


function DashboardViewLegacy(props) {
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
  const defaultFilters = React.useMemo(() => ({
    years: [baseYear],
    months: [baseMonth],
    accounts: null,
    payers: null,
    divided: null
  }), [baseYear, baseMonth]);

  const [filters, setFilters] = React.useState(defaultFilters);
  const [rows, setRows] = React.useState([]);
  const [compareRows, setCompareRows] = React.useState([]);
  const [previousMonthRows, setPreviousMonthRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [trendAccountIndex, setTrendAccountIndex] = React.useState(0);
  const [activeFilterTab, setActiveFilterTab] = React.useState('period');
  const [showFilters, setShowFilters] = React.useState(true);

  function resetFilters() {
    setFilters({
      years: [...defaultFilters.years],
      months: [...defaultFilters.months],
      accounts: [],
      payers: [],
      divided: []
    });
  }

  const selectedYears = React.useMemo(() => dashboardResolveSelection(filters.years, yearOptions), [filters.years, yearOptions]);
  const monthOptions = React.useMemo(() => (
    dashboardMonthOptionsForYears(monthsByYear, selectedYears)
  ), [monthsByYear, selectedYears]);
  const selectedMonths = React.useMemo(() => dashboardResolveSelection(filters.months, monthOptions), [filters.months, monthOptions]);
  const selectedPairs = React.useMemo(() => (
    dashboardSortPairs(dashboardBuildPairs(selectedYears, selectedMonths, monthsByYear))
  ), [selectedYears, selectedMonths, monthsByYear]);
  const comparePairs = React.useMemo(() => (
    selectedPairs.map((pair) => ({ year: pair.year - 1, month: pair.month }))
  ), [selectedPairs]);
  const lastAppliedPair = selectedPairs[selectedPairs.length - 1] || { year: baseYear, month: baseMonth };
  const previousMonthPair = React.useMemo(
    () => dashboardPrevYearMonth(lastAppliedPair.year, lastAppliedPair.month),
    [lastAppliedPair]
  );
  const showYearInLabels = React.useMemo(() => (
    new Set(selectedPairs.map((pair) => pair.year)).size > 1
  ), [selectedPairs]);

  React.useEffect(() => {
    setFilters((prev) => {
      const nextYears = prev.years.filter((year) => yearOptions.some((option) => option.value === year));
      const nextMonths = prev.months.filter((month) => monthOptions.some((option) => option.value === month));

      if (nextYears.length === prev.years.length && nextMonths.length === prev.months.length) {
        return prev;
      }

      return {
        ...prev,
        years: nextYears,
        months: nextMonths
      };
    });
  }, [yearOptions, monthOptions]);

  React.useEffect(() => {
    let alive = true;

    async function fetchRowsForPairs(pairs) {
      const uniquePairs = dashboardSortPairs(
        Array.from(new Map((pairs || []).map((pair) => [dashboardPairKey(pair), pair])).values())
      );

      if (!uniquePairs.length) return [];

      const lists = await Promise.all(uniquePairs.map(async (pair) => {
        const raw = await window.SupabaseQueries.listMes(pair.year, pair.month);
        return (raw || []).map(dashboardNormalizeRow);
      }));

      return lists.flat();
    }

    (async () => {
      try {
        setLoading(true);
        setError('');
        const [periodRowsLoaded, compareRowsLoaded, previousMonthRowsLoaded] = await Promise.all([
          fetchRowsForPairs(selectedPairs),
          fetchRowsForPairs(comparePairs),
          fetchRowsForPairs([previousMonthPair])
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
  }, [selectedPairs, comparePairs, previousMonthPair]);

  const contasDisponiveis = React.useMemo(() => (
    Array.from(new Set(rows.map((row) => row.nome)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [rows]);

  const rowsPorConta = React.useMemo(() => (
    dashboardFilterRows(rows, {
      accounts: filters.accounts,
      payers: [],
      divided: []
    })
  ), [rows, filters.accounts]);

  const pagadoresDisponiveis = React.useMemo(() => (
    Array.from(new Set(rowsPorConta.map((row) => row.quem)))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
      .map((name) => ({ value: name, label: name }))
  ), [rowsPorConta]);

  React.useEffect(() => {
    setFilters((prev) => {
      const nextAccounts = prev.accounts.filter((account) => contasDisponiveis.some((option) => option.value === account));
      const nextPayers = prev.payers.filter((payer) => pagadoresDisponiveis.some((option) => option.value === payer));
      const nextDivided = prev.divided.filter((value) => dividedOptions.some((option) => option.value === value));

      if (
        nextAccounts.length === prev.accounts.length &&
        nextPayers.length === prev.payers.length &&
        nextDivided.length === prev.divided.length
      ) {
        return prev;
      }

      return {
        ...prev,
        accounts: nextAccounts,
        payers: nextPayers,
        divided: nextDivided
      };
    });
  }, [contasDisponiveis, pagadoresDisponiveis, dividedOptions]);

  const filteredRows = React.useMemo(() => dashboardFilterRows(rows, filters), [rows, filters]);
  const filteredCompareRows = React.useMemo(() => dashboardFilterRows(compareRows, filters), [compareRows, filters]);
  const filteredPreviousMonthRows = React.useMemo(() => dashboardFilterRows(previousMonthRows, filters), [previousMonthRows, filters]);
  const totalPeriodo = React.useMemo(() => dashboardSum(filteredRows), [filteredRows]);
  const totalDividido = React.useMemo(() => dashboardSum(filteredRows.filter((row) => row.dividida)), [filteredRows]);
  const rankingCategorias = React.useMemo(() => dashboardGroupAndSort(filteredRows, 'nome'), [filteredRows]);
  const rankingPagadores = React.useMemo(() => dashboardGroupAndSort(filteredRows, 'quem'), [filteredRows]);
  const topCategoria = rankingCategorias[0] || null;
  const categoriaDetalhe = selectedCategory || (topCategoria ? topCategoria.name : '');
  const donutSegments = React.useMemo(() => {
    if (!rankingCategorias.length) return [];
    const top = rankingCategorias.slice(0, 4);
    const otherTotal = rankingCategorias.slice(4).reduce((sum, item) => sum + item.total, 0);
    if (otherTotal > 0) top.push({ name: 'Outros', total: otherTotal });
    return top;
  }, [rankingCategorias]);
  const settlement = React.useMemo(() => dashboardComputeSettlement(filteredRows), [filteredRows]);
  const splitPct = totalPeriodo > 0 ? Math.round((totalDividido / totalPeriodo) * 100) : 0;
  const detalhesCategoria = React.useMemo(() => (
    filteredRows
      .filter((row) => !categoriaDetalhe || row.nome === categoriaDetalhe)
      .sort((left, right) => Number(right.valor || 0) - Number(left.valor || 0))
      .slice(0, 12)
  ), [filteredRows, categoriaDetalhe]);

  React.useEffect(() => {
    if (!rankingCategorias.length) {
      setSelectedCategory('');
      return;
    }

    if (!selectedCategory || !rankingCategorias.some((item) => item.name === selectedCategory)) {
      setSelectedCategory(rankingCategorias[0].name);
    }
  }, [rankingCategorias, selectedCategory]);

  const trendAccounts = React.useMemo(() => {
    if (rankingCategorias.length) return rankingCategorias.map((item) => item.name);
    return filters.accounts.length
      ? filters.accounts
      : contasDisponiveis.map((option) => option.value);
  }, [rankingCategorias, filters.accounts, contasDisponiveis]);

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
    dashboardMakeSeries(filteredRows, selectedPairs, focusedTrendAccount)
      .map((point, index) => ({
        ...point,
        label: dashboardPairLabel(selectedPairs[index], showYearInLabels)
      }))
  ), [filteredRows, selectedPairs, focusedTrendAccount, showYearInLabels]);
  const trendCompareSeries = React.useMemo(() => (
    dashboardMakeSeries(filteredCompareRows, comparePairs, focusedTrendAccount)
      .map((point, index) => ({
        ...point,
        label: dashboardPairLabel(selectedPairs[index], showYearInLabels)
      }))
  ), [filteredCompareRows, comparePairs, focusedTrendAccount, selectedPairs, showYearInLabels]);
  const categoriasTimeline = React.useMemo(() => (
    dashboardCategorySeries(filteredRows, selectedPairs, 3).map((group) => ({
      ...group,
      points: group.points.map((point, index) => ({
        ...point,
        label: dashboardPairLabel(selectedPairs[index], showYearInLabels)
      }))
    }))
  ), [filteredRows, selectedPairs, showYearInLabels]);
  const singleMonthComparison = React.useMemo(() => (
    dashboardBuildAccountComparison(filteredRows, filteredPreviousMonthRows, filteredCompareRows, 6)
  ), [filteredRows, filteredPreviousMonthRows, filteredCompareRows]);

  const primeiraPessoa = rankingPagadores[0] || null;
  const segundaPessoa = rankingPagadores[1] || null;
  const cardsPrincipais = [
    {
      key: 'total',
      label: selectedPairs.length > 1 ? 'Total do periodo' : 'Total do mes',
      value: dashboardBrl(totalPeriodo),
      detail: `${filteredRows.length} lancamentos neste recorte.`,
      tooltip: 'Soma de todos os lancamentos retornados pelos filtros atuais.'
    },
    {
      key: 'split',
      label: 'Valor total dividido',
      value: dashboardBrl(totalDividido),
      detail: `${splitPct}% do total do periodo.`,
      tooltip: 'Somatorio das contas marcadas como divididas dentro do recorte atual.'
    },
    {
      key: 'payer-1',
      label: primeiraPessoa ? `Pago por ${primeiraPessoa.name}` : 'Pago por',
      value: dashboardBrl(primeiraPessoa ? primeiraPessoa.total : 0),
      detail: primeiraPessoa ? 'Maior gasto do periodo.' : 'Aguardando dados.',
      tooltip: 'Pessoa com maior desembolso no recorte filtrado.'
    },
    {
      key: 'payer-2',
      label: segundaPessoa ? `Pago por ${segundaPessoa.name}` : 'Qtde de lancamentos',
      value: segundaPessoa ? dashboardBrl(segundaPessoa.total) : String(filteredRows.length),
      detail: segundaPessoa ? 'Segundo maior gasto do periodo.' : 'Movimentos no recorte atual.',
      tooltip: segundaPessoa
        ? 'Pessoa com o segundo maior desembolso no recorte filtrado.'
        : 'Quantidade de linhas retornadas apos aplicar os filtros.'
    }
  ];

  const filterTabs = [
    { id: 'period', label: 'Periodo' },
    { id: 'accounts', label: 'Contas' },
    { id: 'meta', label: 'Pagador e divisao' }
  ];
  const singleMonthMode = selectedPairs.length <= 1;
  const previousMonthLabel = `${dashboardMonthNamePT(previousMonthPair.month)} ${previousMonthPair.year}`;
  const previousYearLabel = `${dashboardMonthNamePT(lastAppliedPair.month)} ${lastAppliedPair.year - 1}`;

  return (
    <div className="space-y-6" data-dash-root="true">
      <div className="card overflow-hidden">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.24em] opacity-60">Guia</div>
            <div className="brand" style={{ fontSize: '1.65rem', lineHeight: 1.05 }}>
              Dashboard
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn ${activeFilterTab === tab.id ? 'primary' : 'ghost'}`}
                  onClick={() => setActiveFilterTab(tab.id)}
                  data-dash-filter-tab={tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn ghost lg:hidden"
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                data-dash-action="toggle-filters"
              >
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={resetFilters}
                data-dash-action="reset-filters"
              >
                Restaurar padrao
              </button>
            </div>
          </div>

          <div className={showFilters ? 'block' : 'hidden lg:block'}>
            {activeFilterTab === 'period' ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <DashboardFilterChecklist
                  label="Anos"
                  helperText="Padrao: ano atual."
                  selection={filters.years}
                  onChange={(years) => setFilters((prev) => ({ ...prev, years }))}
                  options={yearOptions}
                  allLabel="Todos"
                  columns={2}
                  testId="years"
                  tooltip="Escolha um ou mais anos disponiveis no banco para montar o recorte."
                />
                <DashboardFilterChecklist
                  label="Meses"
                  helperText="Padrao: mes atual."
                  selection={filters.months}
                  onChange={(months) => setFilters((prev) => ({ ...prev, months }))}
                  options={monthOptions}
                  allLabel="Todos"
                  searchable={true}
                  columns={3}
                  testId="months"
                  tooltip="Os meses exibidos acompanham os anos selecionados na aba de periodo."
                />
              </div>
            ) : null}

            {activeFilterTab === 'accounts' ? (
              <DashboardFilterChecklist
                label="Tipos de conta"
                helperText="Categorias unicas encontradas no periodo selecionado."
                selection={filters.accounts}
                onChange={(accounts) => setFilters((prev) => ({ ...prev, accounts }))}
                options={contasDisponiveis}
                allLabel="Todas"
                searchable={true}
                maxHeight={300}
                testId="accounts"
                tooltip="A lista de contas depende apenas do periodo selecionado na primeira aba."
              />
            ) : null}

            {activeFilterTab === 'meta' ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <DashboardFilterChecklist
                  label="Pagadores"
                  helperText="Pagadores encontrados no recorte atual de periodo e contas."
                  selection={filters.payers}
                  onChange={(payers) => setFilters((prev) => ({ ...prev, payers }))}
                  options={pagadoresDisponiveis}
                  allLabel="Todos"
                  searchable={true}
                  maxHeight={300}
                  testId="payers"
                  tooltip="A lista de pagadores acompanha o periodo e as contas selecionadas."
                />
                <DashboardFilterChecklist
                  label="Divididas"
                  helperText="Marque Sim, Nao ou ambas."
                  selection={filters.divided}
                  onChange={(divided) => setFilters((prev) => ({ ...prev, divided }))}
                  options={dividedOptions}
                  allLabel="Sim e Nao"
                  columns={2}
                  showResolvedSelection={true}
                  emptyBehavior="deselect-from-all"
                  testId="divided"
                  tooltip="Filtra apenas contas divididas, apenas nao divididas ou ambas."
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="badge" data-dash-filter-summary="years">Anos: {dashboardSelectionSummary(filters.years, yearOptions, 'Todos')}</div>
            <div className="badge" data-dash-filter-summary="months">Meses: {dashboardSelectionSummary(filters.months, monthOptions, 'Todos')}</div>
            <div className="badge" data-dash-filter-summary="accounts">Contas: {dashboardSelectionSummary(filters.accounts, contasDisponiveis, 'Todas')}</div>
            <div className="badge" data-dash-filter-summary="payers">Pagadores: {dashboardSelectionSummary(filters.payers, pagadoresDisponiveis, 'Todos')}</div>
            <div className="badge" data-dash-filter-summary="divided">Divididas: {dashboardSelectionSummary(filters.divided, dividedOptions, 'Sim e Nao')}</div>
            <div className="badge" data-dash-count="rows">Lancamentos: {filteredRows.length}</div>
            {loading ? <div className="badge">Atualizando...</div> : null}
          </div>
        </div>
      </div>

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
              tooltip="Estimativa simples de acerto considerando apenas as contas divididas do recorte."
              testId="settlement"
            />
            <DashboardMetricCard
              label="Maior categoria"
              value={topCategoria ? topCategoria.name : 'Sem dados'}
              detail={topCategoria && totalPeriodo > 0 ? `${Math.round((topCategoria.total / totalPeriodo) * 100)}% do total do periodo.` : 'Aguardando movimentacao'}
              tooltip="Categoria com maior valor somado depois da aplicacao de todos os filtros."
              testId="top-category"
            />
            <DashboardMetricCard
              label="Qtde de lancamentos"
              value={String(filteredRows.length)}
              detail={filteredRows.length ? 'Itens filtrados no recorte atual.' : 'Nenhum lancamento neste recorte.'}
              tooltip="Quantidade de linhas efetivamente visiveis apos a aplicacao do filtro."
              testId="count"
            />
          </div>

          {singleMonthMode ? (
            <DashboardSection
              title="Comparativo por conta"
              subtitle="Mes atual contra mes anterior e mesmo mes do ano anterior."
              tooltip="Comparativo adaptado para leitura de um unico mes."
              testId="trend-single"
            >
              <DashboardComparisonBars
                items={singleMonthComparison}
                currentLabel={`${dashboardMonthNamePT(lastAppliedPair.month)} ${lastAppliedPair.year}`}
                previousLabel={previousMonthLabel}
                previousYearLabel={previousYearLabel}
                onSelect={setSelectedCategory}
              />
            </DashboardSection>
          ) : (
            <DashboardSection
              title="Evolucao por conta"
              subtitle="Passe pelas contas com as setas. O grafico acompanha o recorte de periodo."
              tooltip="Quando ha mais de um mes selecionado, o dashboard destaca uma conta por vez para facilitar leitura em desktop e smartphone."
              testId="trend-period"
              actions={[
                <button
                  key="trend-prev"
                  className="btn ghost"
                  onClick={() => setTrendAccountIndex((prev) => (prev <= 0 ? Math.max(trendAccounts.length - 1, 0) : prev - 1))}
                  data-dash-action="trend-prev"
                  disabled={!trendAccounts.length}
                >
                  Conta anterior
                </button>,
                <div key="trend-account" className="badge" data-dash-trend-account="true">
                  Conta: {focusedTrendAccount || 'Nenhuma'}
                </div>,
                <button
                  key="trend-next"
                  className="btn ghost"
                  onClick={() => setTrendAccountIndex((prev) => (prev >= trendAccounts.length - 1 ? 0 : prev + 1))}
                  data-dash-action="trend-next"
                  disabled={!trendAccounts.length}
                >
                  Proxima conta
                </button>
              ]}
            >
              <DashboardSparkline
                points={trendSeries}
                comparePoints={trendCompareSeries}
                ariaLabel={`Grafico de evolucao para ${focusedTrendAccount || 'conta selecionada'}`}
              />
            </DashboardSection>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <DashboardSection
              title="Composicao do recorte"
              subtitle="Top categorias e agrupamento do restante."
              tooltip="Clique em uma categoria para fixar o detalhamento no bloco inferior."
              testId="composition"
            >
              <DashboardDonut
                segments={donutSegments}
                total={totalPeriodo}
                onSelect={setSelectedCategory}
              />
            </DashboardSection>

            <DashboardSection
              title="Ranking de gastos"
              subtitle="Ordenado pelo valor total filtrado."
              tooltip="Ranking usa o mesmo subconjunto de dados dos cards, da composicao e do detalhamento."
              testId="ranking"
            >
              <DashboardBarList items={rankingCategorias.slice(0, 8)} onSelect={setSelectedCategory} />
            </DashboardSection>
          </div>

          <div className={`grid gap-4 ${selectedPairs.length > 1 ? 'xl:grid-cols-2' : ''}`}>
            <DashboardSection
              title="Pagadores"
              subtitle="Quem concentrou mais gasto no recorte atual."
              tooltip="Mostra quem concentra mais desembolso e o peso das contas divididas."
              testId="payers"
            >
              <DashboardBarList items={rankingPagadores} />
              <div className="grid gap-2 md:grid-cols-2">
                <div className="badge justify-center flex">Divididas: {splitPct}% do total</div>
                <div className="badge justify-center flex">Nao divididas: {Math.max(100 - splitPct, 0)}%</div>
              </div>
            </DashboardSection>

            {selectedPairs.length > 1 ? (
              <DashboardSection
                title="Categorias ao longo do tempo"
                subtitle="Leitura rapida das categorias mais relevantes do periodo."
                tooltip="Selecionar uma linha daqui atualiza o detalhamento logo abaixo."
                testId="category-trends"
              >
                <DashboardCategoryTrends series={categoriasTimeline} onSelect={setSelectedCategory} />
              </DashboardSection>
            ) : null}
          </div>

          <DashboardSection
            title="Detalhamento"
            subtitle="A categoria selecionada sempre respeita os filtros do topo."
            tooltip="Drill-down dos mesmos dados que alimentam cards e graficos."
            testId="details"
            actions={[
              <div key="selected-category" className="badge" data-dash-selected-category="true">
                Categoria selecionada: {categoriaDetalhe || 'Nenhuma'}
              </div>
            ]}
          >
            {detalhesCategoria.length ? (
              <div className="space-y-3">
                {detalhesCategoria.map((item) => (
                  <div key={item.id} className="card flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" style={{ padding: 14 }} data-dash-detail-row="true">
                    <div>
                      <div className="font-semibold">{item.instancia || item.nome}</div>
                      <div className="text-sm opacity-70">{item.nome}{item.instancia ? ` - ${item.instancia}` : ''}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge">{dashboardBrl(item.valor)}</span>
                      <span className="badge">{item.quem}</span>
                      <span className="badge">{item.dividida ? 'Dividida' : 'Nao dividida'}</span>
                      <span className="badge">{dashboardIsoToBR(item.data)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.boleto ? <a className="btn ghost" href={item.boleto} target="_blank" rel="noreferrer">Ver boleto</a> : null}
                      {item.comprovante ? <a className="btn ghost" href={item.comprovante} target="_blank" rel="noreferrer">Ver comprovante</a> : null}
                      <button
                        className="btn ghost"
                        onClick={() => {
                          if (props.onGoControlToMonth) props.onGoControlToMonth(item.ano, item.mes);
                        }}
                      >
                        Abrir no controle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm opacity-70">
                Selecione uma categoria com dados para abrir os lancamentos deste dashboard.
              </div>
            )}
          </DashboardSection>
        </>
      )}
    </div>
  );
}

window.DashboardViewLegacy = DashboardViewLegacy;
})();
