function DashboardFilterChecklist(props) {
  const [query, setQuery] = React.useState('');
  const resolvedSelection = React.useMemo(
    () => window.DashboardHelpers.resolveSelection(props.selection, props.options || []),
    [props.selection, props.options]
  );
  const selectedSet = React.useMemo(() => new Set(resolvedSelection), [resolvedSelection]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = React.useMemo(() => {
    if (!normalizedQuery) return props.options || [];
    return (props.options || []).filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [props.options, normalizedQuery]);
  const totalCount = (props.options || []).length;
  const allSelected = props.selection == null || resolvedSelection.length === totalCount;
  const columnClass = props.columns === 2
    ? 'grid gap-2 md:grid-cols-2'
    : props.columns === 3
      ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3'
      : 'space-y-2';

  function toggleValue(value) {
    props.onChange(
      window.DashboardHelpers.toggleSelection(
        props.selection,
        value,
        props.options || [],
        props.emptyBehavior || 'deselect-from-all'
      )
    );
  }

  const searchThreshold = typeof props.searchThreshold === 'number' ? props.searchThreshold : 10;
  const shouldShowSearch = props.searchable !== false && totalCount > searchThreshold;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] opacity-60">{props.label}</div>
          {props.helperText ? <div className="text-sm opacity-70 mt-1">{props.helperText}</div> : null}
        </div>
        {props.tooltip ? <DashboardInfoTooltip content={props.tooltip} testId={`filter-${props.testId}`} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="badge" data-dash-filter-status={props.testId}>
          {window.DashboardHelpers.selectionSummary(props.selection, props.options || [], props.allLabel)}
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => props.onChange(allSelected ? [] : null)}
          data-dash-filter-all={props.testId}
        >
          {allSelected ? 'Limpar seleção' : 'Selecionar todos'}
        </button>
        <div className="text-xs opacity-60" data-dash-filter-active={props.testId}>
          {resolvedSelection.length} de {totalCount || 0} ativos
        </div>
      </div>

      {shouldShowSearch ? (
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={props.searchPlaceholder || `Buscar ${props.label.toLowerCase()}`}
          className="select w-full"
          data-dash-filter-search={props.testId}
        />
      ) : null}

      <div className={columnClass} style={props.maxHeight ? { maxHeight: props.maxHeight, overflow: 'auto', paddingRight: 4 } : undefined}>
        {visibleOptions.map((option) => {
          const checked = selectedSet.has(option.value);
          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer transition-colors ${checked ? 'shadow-sm' : ''}`}
              style={{
                borderColor: checked ? 'color-mix(in srgb, var(--primary) 55%, var(--border))' : 'var(--border)',
                background: checked
                  ? 'color-mix(in srgb, var(--primary) 16%, var(--surface))'
                  : 'color-mix(in srgb, var(--surface) 88%, black 12%)'
              }}
              data-dash-filter-option={`${props.testId}:${option.value}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
              />
              <span className="text-sm leading-5 flex-1">{option.label}</span>
            </label>
          );
        })}

        {!visibleOptions.length ? (
          <div className="text-sm opacity-70" data-dash-filter-empty={props.testId}>
            Nenhuma opcao encontrada.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardToolbarMockField(props) {
  return (
    <div className="relative">
      <button
        type="button"
        className="w-full rounded-2xl border px-4 py-3 text-left transition-all"
        style={{
          borderColor: props.open
            ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
            : 'var(--border)',
          background: props.open
            ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
            : 'color-mix(in srgb, var(--surface) 88%, black 12%)'
        }}
        onClick={props.onToggle}
        data-dash-mock-filter={props.testId}
        aria-expanded={props.open}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] opacity-60">{props.label}</div>
            <div className="mt-1 font-medium truncate">{props.value}</div>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{
              borderColor: props.open
                ? 'color-mix(in srgb, var(--primary) 45%, var(--border))'
                : 'var(--border)',
              background: props.open
                ? 'color-mix(in srgb, var(--primary) 12%, var(--surface))'
                : 'color-mix(in srgb, var(--surface) 92%, black 8%)',
              color: props.open ? 'var(--primary)' : 'var(--muted)'
            }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-4 w-4 transition-transform duration-200 ${props.open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5.5 7.5L10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {props.open ? (
        <div
          className="absolute left-0 top-full z-50 mt-2 rounded-2xl border p-4"
          style={{
            borderColor: 'var(--border)',
            background: 'color-mix(in srgb, var(--surface) 97%, black 3%)',
            boxShadow: '0 16px 48px rgba(0,0,0,.38)',
            width: props.width || 'min(calc(100vw - 2rem), 360px)'
          }}
          data-dash-mock-panel={props.testId}
        >
          {props.children}
        </div>
      ) : null}
    </div>
  );
}

function DashboardFilterToolbarMock(props) {
  const rootRef = React.useRef(null);
  const [openId, setOpenId] = React.useState('');

  React.useEffect(() => {
    if (!openId) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current || rootRef.current.contains(event.target)) return;
      setOpenId('');
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openId]);

  const yearsSummary = window.DashboardHelpers.selectionSummary(props.filters.years, props.yearOptions, 'Todos');
  const monthsSummary = window.DashboardHelpers.selectionSummary(props.filters.months, props.monthOptions, 'Todos');
  const accountsSummary = window.DashboardHelpers.selectionSummary(props.filters.accounts, props.accountOptions, 'Todas');
  const payersSummary = window.DashboardHelpers.selectionSummary(props.filters.payers, props.payerOptions, 'Todos');
  const dividedSummary = window.DashboardHelpers.selectionSummary(props.filters.divided, props.dividedOptions, 'Sim e Não');

  return (
    <section
      ref={rootRef}
      className="card space-y-4"
      style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 95%, white 5%), var(--surface))' }}
      data-dash-section="toolbar-mock"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="space-y-1">
            <div className="brand" style={{ fontSize: '1.65rem', lineHeight: 1.05 }}>
              Dashboard
            </div>
          </div>
          <DashboardInfoTooltip
            content="Filtros compactos do dashboard. As opções se ajustam localmente no rascunho, mas cards e gráficos só são recalculados quando você clicar em Atualizar dashboard."
            testId="toolbar-mock"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn ghost"
            onClick={props.onReset}
            data-dash-action="reset-filters"
          >
            Restaurar padrão
          </button>
          {openId ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setOpenId('')}
              data-dash-action="close-filters"
            >
              Fechar painéis
            </button>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setOpenId('');
              if (props.onApply) props.onApply();
            }}
            disabled={!props.hasPendingChanges || props.previewLoading}
            data-dash-action="apply-filters"
          >
            Atualizar dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))]">
        <DashboardToolbarMockField
          label="Período"
          value={`${monthsSummary} | ${yearsSummary}`}
          open={openId === 'period'}
          onToggle={() => setOpenId((prev) => prev === 'period' ? '' : 'period')}
          testId="period"
          width="min(calc(100vw - 2rem), 720px)"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardFilterChecklist
              label="Anos"
              helperText="Selecione um ou mais anos."
              selection={props.filters.years}
              onChange={(years) => props.onChange((prev) => ({ ...prev, years }))}
              options={props.yearOptions}
              allLabel="Todos"
              searchable={false}
              columns={2}
              testId="mock-years"
            />
            <DashboardFilterChecklist
              label="Meses"
              helperText="Selecione um ou mais meses."
              selection={props.filters.months}
              onChange={(months) => props.onChange((prev) => ({ ...prev, months }))}
              options={props.monthOptions}
              allLabel="Todos"
              searchable={false}
              columns={3}
              testId="mock-months"
            />
          </div>
        </DashboardToolbarMockField>

        <DashboardToolbarMockField
          label="Contas"
          value={accountsSummary}
          open={openId === 'accounts'}
          onToggle={() => setOpenId((prev) => prev === 'accounts' ? '' : 'accounts')}
          testId="accounts"
        >
          <DashboardFilterChecklist
            label="Contas"
            helperText="Contas disponíveis para o período filtrado."
            selection={props.filters.accounts}
            onChange={(accounts) => props.onChange((prev) => ({ ...prev, accounts }))}
            options={props.accountOptions}
            allLabel="Todas"
            maxHeight={280}
            testId="mock-accounts"
          />
        </DashboardToolbarMockField>

        <DashboardToolbarMockField
          label="Pagadores"
          value={payersSummary}
          open={openId === 'payers'}
          onToggle={() => setOpenId((prev) => prev === 'payers' ? '' : 'payers')}
          testId="payers"
        >
          <DashboardFilterChecklist
            label="Pagadores"
            helperText="Pagadores disponíveis no período filtrado."
            selection={props.filters.payers}
            onChange={(payers) => props.onChange((prev) => ({ ...prev, payers }))}
            options={props.payerOptions}
            allLabel="Todos"
            maxHeight={280}
            searchable={props.payerOptions.length > 10}
            testId="mock-payers"
          />
        </DashboardToolbarMockField>

        <DashboardToolbarMockField
          label="Divisão"
          value={dividedSummary}
          open={openId === 'divided'}
          onToggle={() => setOpenId((prev) => prev === 'divided' ? '' : 'divided')}
          testId="divided"
          width="min(calc(100vw - 2rem), 340px)"
        >
          <DashboardFilterChecklist
            label="Divididas"
            helperText="Sim, Não ou ambas."
            selection={props.filters.divided}
            onChange={(divided) => props.onChange((prev) => ({ ...prev, divided }))}
            options={props.dividedOptions}
            allLabel="Sim e Não"
            searchable={false}
            columns={2}
            testId="mock-divided"
          />
        </DashboardToolbarMockField>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="badge">Filtro do período aplicado</div>
        <div className="badge" data-dash-filter-summary="years">Anos: {props.appliedYearsSummary}</div>
        <div className="badge" data-dash-filter-summary="months">Meses: {props.appliedMonthsSummary}</div>
        <div className="badge" data-dash-filter-summary="accounts">Contas: {props.appliedAccountsSummary}</div>
        <div className="badge" data-dash-filter-summary="payers">Pagadores: {props.appliedPayersSummary}</div>
        <div className="badge" data-dash-filter-summary="divided">Divididas: {props.appliedDividedSummary}</div>
        <div className="badge" data-dash-count="rows">Contas pagas: {props.appliedRowCount}</div>
        {props.previewLoading ? <div className="badge">Atualizando opções...</div> : null}
        {props.loading ? <div className="badge">Atualizando dashboard...</div> : null}
        {props.hasPendingChanges ? <div className="badge">Alterações pendentes</div> : null}
      </div>

      {props.hasPendingChanges ? (
        <div className="text-sm opacity-70" data-dash-pending-message="true">
          O rascunho acima já foi ajustado. O dashboard abaixo continua no filtro de período aplicado até você clicar em Atualizar dashboard.
        </div>
      ) : null}
    </section>
  );
}
