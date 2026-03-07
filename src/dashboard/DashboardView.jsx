function dashboardMonthNamePT(month, shortLabel = false) {
  const label = new Date(2026, Number(month) - 1, 1).toLocaleString('pt-BR', {
    month: shortLabel ? 'short' : 'long'
  }).replace('.', '');
  return label.replace(/^./, (char) => char.toUpperCase());
}

function dashboardBrl(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function dashboardIsoToBR(iso) {
  if (!iso) return '';
  const parts = String(iso).split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function dashboardNormalizeRow(row) {
  return {
    id: row.id,
    ano: Number(row.ano || 0),
    mes: Number(row.mes || 0),
    nome: row.nome_da_conta || 'Sem categoria',
    instancia: row.instancia || '',
    valor: Number(row.valor || 0),
    data: row.data_de_pagamento || '',
    quem: row.quem_pagou || 'Sem pagador',
    dividida: !!row.dividida,
    boleto: row.link_boleto || '',
    comprovante: row.link_comprovante || ''
  };
}

function dashboardSum(rows) {
  return (rows || []).reduce((total, row) => total + Number(row.valor || 0), 0);
}

function dashboardGroupAndSort(rows, fieldName) {
  const groups = {};
  (rows || []).forEach((row) => {
    const key = row[fieldName] || 'Nao informado';
    groups[key] = (groups[key] || 0) + Number(row.valor || 0);
  });

  return Object.keys(groups)
    .map((key) => ({ name: key, total: groups[key] }))
    .sort((left, right) => right.total - left.total);
}

function dashboardGroupTotalsMap(rows, fieldName) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const key = row[fieldName] || 'Nao informado';
    map.set(key, (map.get(key) || 0) + Number(row.valor || 0));
  });
  return map;
}

function dashboardFilterRows(rows, filters) {
  return (rows || []).filter((row) => {
    if (filters.accounts?.length && !filters.accounts.includes(row.nome)) return false;
    if (filters.payers?.length && !filters.payers.includes(row.quem)) return false;
    if (filters.divided?.length) {
      const dividedValue = row.dividida ? 'yes' : 'no';
      if (!filters.divided.includes(dividedValue)) return false;
    }
    return true;
  });
}

function dashboardPrevYearMonth(year, month) {
  if (month > 1) return { year, month: month - 1 };
  return { year: year - 1, month: 12 };
}

function dashboardPairKey(pair) {
  return `${pair.year}-${String(pair.month).padStart(2, '0')}`;
}

function dashboardPairLabel(pair, showYear = false) {
  const monthLabel = dashboardMonthNamePT(pair.month, true);
  return showYear ? `${monthLabel}/${String(pair.year).slice(-2)}` : monthLabel;
}

function dashboardSortPairs(pairs) {
  return [...pairs].sort((left, right) => {
    if (left.year !== right.year) return left.year - right.year;
    return left.month - right.month;
  });
}

function dashboardBuildPairs(years, months, monthsByYear) {
  const pairs = [];
  if (!Array.isArray(years) || !years.length) return pairs;
  if (!Array.isArray(months) || !months.length) return pairs;

  (years || []).forEach((year) => {
    const availableMonths = Array.isArray(monthsByYear?.[year]) && monthsByYear[year].length
      ? new Set(monthsByYear[year].map(Number))
      : null;

    (months || []).forEach((month) => {
      const numericMonth = Number(month);
      if (availableMonths && !availableMonths.has(numericMonth)) return;
      pairs.push({ year: Number(year), month: numericMonth });
    });
  });

  return pairs;
}

function dashboardResolveSelection(selection, options) {
  if (!options.length) return [];
  if (selection == null) return options.map((option) => option.value);
  return options
    .filter((option) => (selection || []).includes(option.value))
    .map((option) => option.value);
}

function dashboardSelectionSummary(selection, options, allLabel) {
  if (!options.length) return allLabel;
  const resolved = dashboardResolveSelection(selection, options);
  if (selection == null || resolved.length === options.length) return allLabel;
  if (!resolved.length) return 'Nenhum';

  const labelByValue = new Map(options.map((option) => [option.value, option.label]));
  const labels = resolved.map((value) => labelByValue.get(value) || String(value));

  if (labels.length <= 2) return labels.join(', ');
  return `${labels.length} selecionados`;
}

function dashboardNormalizeSelection(selection, options) {
  if (!options.length) return [];
  if (selection == null) return null;

  const optionSet = new Set(options.map((option) => option.value));
  const ordered = (selection || []).filter((value) => optionSet.has(value));

  if (ordered.length === options.length) return null;
  if (!ordered.length) return [];
  return options.filter((option) => ordered.includes(option.value)).map((option) => option.value);
}

function dashboardFiltersKey(filters, optionsByField) {
  return JSON.stringify({
    years: dashboardNormalizeSelection(filters?.years == null ? null : filters.years, optionsByField?.years || []),
    months: dashboardNormalizeSelection(filters?.months == null ? null : filters.months, optionsByField?.months || []),
    accounts: dashboardNormalizeSelection(filters?.accounts == null ? null : filters.accounts, optionsByField?.accounts || []),
    payers: dashboardNormalizeSelection(filters?.payers == null ? null : filters.payers, optionsByField?.payers || []),
    divided: dashboardNormalizeSelection(filters?.divided == null ? null : filters.divided, optionsByField?.divided || [])
  });
}

function dashboardToggleSelection(selection, value, options, emptyBehavior = 'deselect-from-all') {
  if (!options.length) return [];

  const resolved = dashboardResolveSelection(selection, options);
  const next = new Set(resolved);

  if (next.has(value)) next.delete(value);
  else next.add(value);

  const ordered = options.filter((option) => next.has(option.value)).map((option) => option.value);
  if (ordered.length === options.length) return null;
  if (!ordered.length) return [];
  return ordered;
}

function dashboardRollingPairs(endYear, endMonth, count) {
  const pairs = [];
  let cursorYear = Number(endYear);
  let cursorMonth = Number(endMonth);

  for (let index = 0; index < (count || 12); index += 1) {
    pairs.unshift({ year: cursorYear, month: cursorMonth });
    if (cursorMonth === 1) {
      cursorMonth = 12;
      cursorYear -= 1;
    } else {
      cursorMonth -= 1;
    }
  }

  return pairs;
}

async function dashboardFetchRowsForPairs(pairs) {
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

function dashboardMonthOptionsForYears(monthsByYear, selectedYears) {
  const monthValues = new Set();
  const yearsToRead = selectedYears && selectedYears.length
    ? selectedYears
    : Object.keys(monthsByYear || {}).map(Number);

  yearsToRead.forEach((year) => {
    const months = monthsByYear?.[year];
    if (Array.isArray(months) && months.length) {
      months.forEach((month) => monthValues.add(Number(month)));
    }
  });

  if (!monthValues.size) {
    for (let month = 1; month <= 12; month += 1) {
      monthValues.add(month);
    }
  }

  return Array.from(monthValues)
    .sort((left, right) => left - right)
    .map((month) => ({ value: month, label: dashboardMonthNamePT(month) }));
}

function dashboardMakeSeries(rows, pairs, groupName) {
  return (pairs || []).map((pair) => {
    const monthRows = (rows || []).filter((row) => {
      if (row.ano !== pair.year || row.mes !== pair.month) return false;
      if (groupName && row.nome !== groupName) return false;
      return true;
    });

    return {
      key: dashboardPairKey(pair),
      label: dashboardMonthNamePT(pair.month, true),
      value: dashboardSum(monthRows)
    };
  });
}

function dashboardCategorySeries(rows, pairs, limit) {
  const categories = dashboardGroupAndSort(rows, 'nome')
    .slice(0, limit || 3)
    .map((item) => item.name);

  return categories.map((name) => ({
    name,
    points: dashboardMakeSeries(rows, pairs, name)
  }));
}

function dashboardBuildTopFiveSegments(items) {
  const sorted = items || [];
  const topFive = sorted.slice(0, 5);
  const othersTotal = sorted.slice(5).reduce((total, item) => total + Number(item.total || 0), 0);
  const segments = othersTotal > 0
    ? [...topFive, { name: 'Outros', total: othersTotal }]
    : topFive;

  return {
    segments,
    topFiveTotal: topFive.reduce((total, item) => total + Number(item.total || 0), 0)
  };
}

function dashboardBuildAccountComparison(currentRows, previousRows, previousYearRows, limit) {
  const currentMap = dashboardGroupTotalsMap(currentRows, 'nome');
  const previousMap = dashboardGroupTotalsMap(previousRows, 'nome');
  const previousYearMap = dashboardGroupTotalsMap(previousYearRows, 'nome');
  const names = Array.from(new Set([
    ...Array.from(currentMap.keys()),
    ...Array.from(previousMap.keys()),
    ...Array.from(previousYearMap.keys())
  ]));

  return names
    .map((name) => ({
      name,
      current: currentMap.get(name) || 0,
      previous: previousMap.get(name) || 0,
      previousYear: previousYearMap.get(name) || 0,
      total: (currentMap.get(name) || 0) + (previousMap.get(name) || 0) + (previousYearMap.get(name) || 0)
    }))
    .sort((left, right) => {
      if (right.current !== left.current) return right.current - left.current;
      return right.total - left.total;
    })
    .slice(0, typeof limit === 'number' ? limit : names.length);
}

function dashboardComputeSettlement(rows) {
  const dividedRows = (rows || []).filter((row) => row.dividida);
  const payers = Array.from(new Set((rows || []).map((row) => row.quem).filter(Boolean)));

  if (dividedRows.length === 0 || payers.length < 2) {
    return {
      headline: 'Sem acerto pendente',
      detail: 'Nao ha base suficiente nas contas divididas deste recorte.'
    };
  }

  const paidByPayer = {};
  payers.forEach((payer) => { paidByPayer[payer] = 0; });
  dividedRows.forEach((row) => {
    paidByPayer[row.quem] = (paidByPayer[row.quem] || 0) + Number(row.valor || 0);
  });

  const totalDivided = dashboardSum(dividedRows);
  const fairShare = totalDivided / payers.length;
  const balances = payers
    .map((payer) => ({ payer, delta: Number((paidByPayer[payer] - fairShare).toFixed(2)) }))
    .sort((left, right) => left.delta - right.delta);

  const debtor = balances[0];
  const creditor = balances[balances.length - 1];
  const amount = Math.min(Math.abs(debtor.delta), Math.abs(creditor.delta));

  if (amount <= 0.01) {
    return {
      headline: 'Acerto equilibrado',
      detail: 'Os pagadores estao praticamente compensados neste recorte.'
    };
  }

  if (balances.length === 2) {
    return {
      headline: `${debtor.payer} deve ${dashboardBrl(amount)}`,
      detail: `para ${creditor.payer} nas contas divididas.`
    };
  }

  return {
    headline: `${debtor.payer} deve ${dashboardBrl(amount)}`,
    detail: `maior repasse estimado para ${creditor.payer}.`
  };
}

function dashboardBuildCategoryFocus(rows, categoryName, totalPeriodo) {
  if (!categoryName) return null;

  const categoryRows = (rows || []).filter((row) => row.nome === categoryName);
  if (!categoryRows.length) return null;

  const total = dashboardSum(categoryRows);
  const topPayer = dashboardGroupAndSort(categoryRows, 'quem')[0] || null;
  const topInstance = dashboardGroupAndSort(
    categoryRows.map((row) => ({ ...row, instancia: row.instancia || row.nome })),
    'instancia'
  )[0] || null;
  const dividedTotal = dashboardSum(categoryRows.filter((row) => row.dividida));

  return {
    name: categoryName,
    total,
    share: totalPeriodo > 0 ? Math.round((total / totalPeriodo) * 100) : 0,
    count: categoryRows.length,
    topPayer,
    topInstance,
    dividedShare: total > 0 ? Math.round((dividedTotal / total) * 100) : 0
  };
}

function DashboardInfoTooltip({ content, testId }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="h-7 w-7 rounded-full border text-xs font-semibold"
        style={{ borderColor: 'var(--border)', background: 'var(--chip)', color: 'var(--text)' }}
        onClick={() => setOpen((prev) => !prev)}
        data-dash-tooltip-button={testId}
        aria-label="Mais informacoes"
        aria-expanded={open}
      >
        i
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border p-3 text-sm"
          style={{
            borderColor: 'var(--border)',
            background: 'color-mix(in srgb, var(--surface) 96%, black 4%)',
            boxShadow: '0 10px 30px rgba(0,0,0,.32)'
          }}
          data-dash-tooltip={testId}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}

function DashboardFilterChecklist(props) {
  const [query, setQuery] = React.useState('');
  const resolvedSelection = React.useMemo(
    () => dashboardResolveSelection(props.selection, props.options || []),
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
      dashboardToggleSelection(
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
          {dashboardSelectionSummary(props.selection, props.options || [], props.allLabel)}
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

function DashboardMetricCard(props) {
  return (
    <div
      className="card flex flex-col gap-2 min-h-[132px]"
      style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, white 6%), var(--surface))' }}
      data-dash-card={props.testId}
      title={props.tooltip || props.detail || `${props.label}: ${props.value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm uppercase tracking-[0.16em] opacity-60">{props.label}</div>
        {props.tooltip ? <DashboardInfoTooltip content={props.tooltip} testId={`card-${props.testId}`} /> : null}
      </div>
      <div className="text-2xl md:text-3xl font-semibold" style={{ textShadow: 'var(--glow)' }}>{props.value}</div>
      {props.detail ? <div className="text-sm opacity-70">{props.detail}</div> : null}
    </div>
  );
}

function DashboardSection(props) {
  return (
    <section
      className="card space-y-4"
      style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 95%, white 5%), var(--surface))' }}
      data-dash-section={props.testId}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="text-lg font-semibold">{props.title}</h3>
            {props.subtitle ? <div className="text-sm opacity-70">{props.subtitle}</div> : null}
          </div>
          {props.tooltip ? <DashboardInfoTooltip content={props.tooltip} testId={`section-${props.testId}`} /> : null}
        </div>
        {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
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
          <div className="text-base opacity-60" aria-hidden="true">{props.open ? '^' : 'v'}</div>
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

  const yearsSummary = dashboardSelectionSummary(props.filters.years, props.yearOptions, 'Todos');
  const monthsSummary = dashboardSelectionSummary(props.filters.months, props.monthOptions, 'Todos');
  const accountsSummary = dashboardSelectionSummary(props.filters.accounts, props.accountOptions, 'Todas');
  const payersSummary = dashboardSelectionSummary(props.filters.payers, props.payerOptions, 'Todos');
  const dividedSummary = dashboardSelectionSummary(props.filters.divided, props.dividedOptions, 'Sim e Nao');

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
            content="Filtros compactos do dashboard. As opcoes se ajustam localmente no rascunho, mas cards e graficos so sao recalculados quando voce clicar em Atualizar dashboard."
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
            Restaurar padrao
          </button>
          {openId ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setOpenId('')}
              data-dash-action="close-filters"
            >
              Fechar paineis
            </button>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setOpenId('');
              if (props.onApply) props.onApply();
            }}
            data-dash-action="apply-filters"
            disabled={!props.hasPendingChanges || props.previewLoading}
          >
            Atualizar dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))]">
        <DashboardToolbarMockField
          label="Periodo"
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
              helperText="Contas disponiveis para o periodo selecionado."
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
              helperText="Pagadores disponiveis para o recorte atual."
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
          label="Divisao"
          value={dividedSummary}
          open={openId === 'divided'}
          onToggle={() => setOpenId((prev) => prev === 'divided' ? '' : 'divided')}
          testId="divided"
          width="min(calc(100vw - 2rem), 340px)"
        >
          <DashboardFilterChecklist
            label="Divididas"
            helperText="Sim, Nao ou ambas."
            selection={props.filters.divided}
            onChange={(divided) => props.onChange((prev) => ({ ...prev, divided }))}
            options={props.dividedOptions}
            allLabel="Sim e Nao"
            searchable={false}
            columns={2}
            testId="mock-divided"
          />
        </DashboardToolbarMockField>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="badge">Recorte aplicado no dashboard</div>
        <div className="badge" data-dash-filter-summary="years">Anos: {props.appliedYearsSummary}</div>
        <div className="badge" data-dash-filter-summary="months">Meses: {props.appliedMonthsSummary}</div>
        <div className="badge" data-dash-filter-summary="accounts">Contas: {props.appliedAccountsSummary}</div>
        <div className="badge" data-dash-filter-summary="payers">Pagadores: {props.appliedPayersSummary}</div>
        <div className="badge" data-dash-filter-summary="divided">Divididas: {props.appliedDividedSummary}</div>
        <div className="badge" data-dash-count="rows">Lancamentos: {props.appliedRowCount}</div>
        {props.previewLoading ? <div className="badge">Atualizando opcoes...</div> : null}
        {props.loading ? <div className="badge">Atualizando dashboard...</div> : null}
        {props.hasPendingChanges ? <div className="badge">Alteracoes pendentes</div> : null}
      </div>

      {props.hasPendingChanges ? (
        <div className="text-sm opacity-70" data-dash-pending-message="true">
          O rascunho acima ja foi ajustado. O dashboard abaixo continua no recorte aplicado ate voce clicar em Atualizar dashboard.
        </div>
      ) : null}
    </section>
  );
}

function DashboardSparkline(props) {
  const points = props.points || [];
  const comparePoints = props.comparePoints || [];
  const width = 760;
  const height = 240;
  const padX = 26;
  const padTop = 18;
  const padBottom = 38;
  const maxValue = Math.max(1, ...points.map((point) => point.value), ...comparePoints.map((point) => point.value));
  const innerWidth = width - (padX * 2);
  const innerHeight = height - padTop - padBottom;
  const [selectedPointKey, setSelectedPointKey] = React.useState(points[points.length - 1]?.key || '');

  function pointPath(series) {
    return series.map((point, index) => {
      const x = padX + ((innerWidth / Math.max(series.length - 1, 1)) * index);
      const y = padTop + innerHeight - ((Number(point.value || 0) / maxValue) * innerHeight);
      return `${x},${y}`;
    }).join(' ');
  }

  function areaPath(series) {
    if (!series.length) return '';
    const line = pointPath(series);
    const firstX = padX;
    const lastX = padX + ((innerWidth / Math.max(series.length - 1, 1)) * (series.length - 1));
    const baseY = padTop + innerHeight;
    return `M${firstX},${baseY} L${line.replace(/ /g, ' L')} L${lastX},${baseY} Z`;
  }

  React.useEffect(() => {
    if (!points.length) {
      setSelectedPointKey('');
      return;
    }
    if (!points.some((point) => point.key === selectedPointKey)) {
      setSelectedPointKey(points[points.length - 1].key);
    }
  }, [points, selectedPointKey]);

  const selectedPoint = points.find((point) => point.key === selectedPointKey) || points[points.length - 1] || null;

  if (!points.length) {
    return <div className="text-sm opacity-70">Sem dados suficientes para o grafico.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="badge flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--primary)' }} />
          {props.primaryLabel || 'Ultimos 12 meses'}
        </div>
        {comparePoints.length ? (
          <div className="badge flex items-center gap-2">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--muted)' }} />
            {props.compareLabel || 'Mesmo periodo no ano anterior'}
          </div>
        ) : null}
        {selectedPoint ? (
          <div className="badge" data-dash-point-selected="true">
            Destaque: {selectedPoint.label} · {dashboardBrl(selectedPoint.value)}
          </div>
        ) : null}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl" role="img" aria-label={props.ariaLabel || 'Grafico de evolucao'}>
        <title>{props.ariaLabel || 'Grafico de evolucao'}</title>
        <defs>
          <linearGradient id="dashboard-gradient-main" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = padTop + innerHeight - (innerHeight * step);
          return (
            <line
              key={step}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              opacity="0.7"
            />
          );
        })}

        <path d={areaPath(points)} fill="url(#dashboard-gradient-main)">
          <title>Serie principal do recorte filtrado.</title>
        </path>
        {comparePoints.length ? (
          <polyline
            fill="none"
            stroke="var(--muted)"
            strokeDasharray="8 7"
            strokeWidth="3"
            points={pointPath(comparePoints)}
            opacity="0.8"
          >
            <title>Mesmo recorte no ano anterior.</title>
          </polyline>
        ) : null}
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pointPath(points)}
        >
          <title>Serie principal do recorte filtrado.</title>
        </polyline>

        {points.map((point, index) => {
          const x = padX + ((innerWidth / Math.max(points.length - 1, 1)) * index);
          const y = padTop + innerHeight - ((Number(point.value || 0) / maxValue) * innerHeight);
          const selected = point.key === selectedPoint?.key;
          return (
            <g key={point.key || index}>
              {selected ? (
                <circle cx={x} cy={y} r="9" fill="rgba(34, 211, 238, 0.18)" />
              ) : null}
              <circle
                cx={x}
                cy={y}
                r={selected ? '6.5' : '4.5'}
                fill="var(--primary)"
                stroke={selected ? 'white' : 'none'}
                strokeWidth={selected ? '2' : '0'}
                style={{ cursor: 'pointer' }}
                data-dash-point={point.label}
                onClick={() => setSelectedPointKey(point.key)}
              >
                <title>{`${point.label}: ${dashboardBrl(point.value)}`}</title>
              </circle>
            </g>
          );
        })}

        {points.map((point, index) => {
          const x = padX + ((innerWidth / Math.max(points.length - 1, 1)) * index);
          return (
            <text
              key={`${point.key || index}-label`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="13"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {points.map((point) => (
          <button
            key={point.key}
            type="button"
            className="badge justify-between flex text-left"
            style={{
              minHeight: 36,
              borderColor: point.key === selectedPoint?.key
                ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
                : 'var(--border)',
              background: point.key === selectedPoint?.key
                ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
                : undefined
            }}
            title={`${point.label}: ${dashboardBrl(point.value)}`}
            data-dash-point-summary={point.label}
            onClick={() => setSelectedPointKey(point.key)}
          >
            {point.label}: {dashboardBrl(point.value)}
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardComparisonBars(props) {
  const items = props.items || [];
  const series = [
    { key: 'current', label: props.currentLabel, color: 'var(--primary)' },
    { key: 'previous', label: props.previousLabel, color: 'var(--accent)' },
    { key: 'previousYear', label: props.previousYearLabel, color: 'var(--muted)' }
  ];

  if (!items.length) {
    return <div className="text-sm opacity-70">Nao ha contas suficientes para comparar o mes atual com as referencias.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {series.map((item) => (
          <div key={item.key} className="badge flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            className="w-full text-left card"
            onClick={() => props.onSelect && props.onSelect(item.name)}
            data-dash-account-comparison={item.name}
            style={{
              padding: 14,
              borderColor: props.selectedName === item.name
                ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
                : 'var(--border)',
              background: props.selectedName === item.name
                ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
                : undefined
            }}
            title={`${item.name}: ${dashboardBrl(item.current)} no periodo atual.`}
          >
            {(() => {
              const itemMaxValue = Math.max(
                1,
                Number(item.current || 0),
                Number(item.previous || 0),
                Number(item.previousYear || 0)
              );

              return (
                <>
            <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <span className="font-semibold block">{item.name}</span>
                    <span className="text-[11px] opacity-60">Escala da conta | pico {dashboardBrl(itemMaxValue)}</span>
                  </div>
                  <span className="text-xs opacity-70">{props.selectedName === item.name ? 'conta destacada' : 'toque para destacar'}</span>
            </div>

            <div className="space-y-2">
              {series.map((seriesItem) => {
                const value = Number(item[seriesItem.key] || 0);
                const width = value > 0 ? Math.max((value / itemMaxValue) * 100, 3) : 0;
                return (
                  <div key={seriesItem.key} className="flex items-center gap-3">
                    <div className="w-28 text-xs opacity-70 shrink-0">{seriesItem.label}</div>
                    <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--chip)' }}>
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${width}%`,
                          background: seriesItem.color
                        }}
                      />
                    </div>
                    <div className="text-xs w-24 text-right shrink-0">{dashboardBrl(value)}</div>
                  </div>
                );
              })}
            </div>
                </>
              );
            })()}
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardDonut(props) {
  const segments = props.segments || [];
  const total = Math.max(props.total || 0, 0);
  const chartTotal = Math.max(segments.reduce((sum, segment) => sum + Number(segment.total || 0), 0), total, 0);
  const topValue = Math.max(props.topValue || 0, 0);
  const palette = ['#22d3ee', '#ff38a1', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#94a3b8'];

  function polarToCartesian(cx, cy, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + (radius * Math.cos(angleInRadians)),
      y: cy + (radius * Math.sin(angleInRadians))
    };
  }

  function buildArcPath(startAngle, endAngle, outerRadius, innerRadius) {
    const startOuter = polarToCartesian(120, 120, outerRadius, endAngle);
    const endOuter = polarToCartesian(120, 120, outerRadius, startAngle);
    const startInner = polarToCartesian(120, 120, innerRadius, endAngle);
    const endInner = polarToCartesian(120, 120, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
      'Z'
    ].join(' ');
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
      <div className="mx-auto flex flex-col items-center gap-3">
        <div className="text-center text-sm opacity-70" data-dash-donut-total="true">
          Total geral: {dashboardBrl(total)}
        </div>
        <div className="relative h-[244px] w-[244px]">
          <svg
            viewBox="0 0 240 240"
            className="w-full h-full"
            role="img"
            aria-label={`Composicao do recorte. Total ${dashboardBrl(total)}.`}
          >
            {segments.length ? (() => {
              let runningAngle = 0;
              return segments.map((segment, index) => {
                const sweep = chartTotal > 0 ? ((segment.total / chartTotal) * 360) : 0;
                const startAngle = runningAngle;
                const endAngle = runningAngle + sweep;
                runningAngle = endAngle;
                const midAngle = startAngle + (sweep / 2);
                const selected = props.selectedName === segment.name;
                const offset = selected ? 10 : 0;
                const transform = selected
                  ? `translate(${Math.cos(((midAngle - 90) * Math.PI) / 180) * offset} ${Math.sin(((midAngle - 90) * Math.PI) / 180) * offset})`
                  : undefined;

                return (
                  <path
                    key={segment.name}
                    d={buildArcPath(startAngle, endAngle, 100, 56)}
                    fill={palette[index % palette.length]}
                    transform={transform}
                    style={{ cursor: 'pointer', filter: selected ? 'drop-shadow(0 0 12px rgba(255,255,255,.2))' : 'none' }}
                    onClick={() => props.onSelect && props.onSelect(segment.name)}
                    data-dash-segment={segment.name}
                  >
                    <title>{`${segment.name}: ${dashboardBrl(segment.total)}`}</title>
                  </path>
                );
              });
            })() : (
              <circle cx="120" cy="120" r="100" fill="#334155" />
            )}

            <circle cx="120" cy="120" r="54" fill="var(--bg)" stroke="var(--border)" />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 pointer-events-none">
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-60">Top 5 contas</div>
            <div className="text-base font-semibold leading-tight">{dashboardBrl(topValue || chartTotal)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {segments.length ? (
          <div className="grid gap-2 grid-cols-1">
            {segments.map((segment, index) => {
              const pct = chartTotal > 0 ? Math.round((segment.total / chartTotal) * 100) : 0;
              return (
                <button
                  key={segment.name}
                  type="button"
                  className="w-full text-left rounded-2xl border px-3 py-2 flex items-center gap-3"
                  onClick={() => props.onSelect && props.onSelect(segment.name)}
                  style={{
                    borderColor: props.selectedName === segment.name
                      ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
                      : 'var(--border)',
                    background: props.selectedName === segment.name
                      ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
                      : 'color-mix(in srgb, var(--surface) 88%, black 12%)'
                  }}
                  title={`${segment.name}: ${dashboardBrl(segment.total)} (${pct}% do recorte)`}
                  data-dash-segment={segment.name}
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: palette[index % palette.length] }} />
                  <span className={`flex-1 text-sm ${props.selectedName === segment.name ? 'font-semibold' : 'font-medium'}`}>{segment.name}</span>
                  <span className="text-xs opacity-70 shrink-0">{pct}%</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm opacity-70">Sem categorias para compor o periodo.</div>
        )}
      </div>
    </div>
  );
}

function DashboardBarList(props) {
  const items = props.items || [];
  const maxValue = Math.max(1, ...items.map((item) => item.total));

  if (!items.length) {
    return <div className="text-sm opacity-70">Nenhum item para ranquear neste recorte.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.max((item.total / maxValue) * 100, 8);
        return (
          <button
            key={item.name}
            type="button"
            className="w-full text-left rounded-2xl px-2 py-2 transition-colors"
            onClick={() => props.onSelect && props.onSelect(item.name)}
            title={item.rawTotal != null && item.rawTotal !== item.total
              ? `${item.name}: ${dashboardBrl(item.total)} de media por mes (${dashboardBrl(item.rawTotal)} no total).`
              : `${item.name}: ${dashboardBrl(item.total)}`}
            data-dash-bar={item.name}
            style={{
              background: props.selectedName === item.name
                ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                : 'transparent'
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-medium truncate">{item.name}</span>
              <span className="text-sm opacity-70">{dashboardBrl(item.total)}</span>
            </div>
            <div className="h-3 rounded-full" style={{ background: 'var(--chip)' }}>
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${width}%`,
                  background: props.selectedName === item.name
                    ? 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 65%, white 35%))'
                    : 'linear-gradient(90deg, var(--primary), var(--accent))'
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DashboardPayersPanel(props) {
  const items = props.items || [];
  const maxValue = Math.max(1, ...items.map((item) => item.total));

  if (!items.length) {
    return <div className="text-sm opacity-70">Sem pagadores suficientes neste recorte.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item) => {
          const width = Math.max((item.total / maxValue) * 100, 8);
          return (
            <div key={item.name} className="space-y-2" data-dash-payer-row={item.name}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm opacity-70">{dashboardBrl(item.total)}</span>
              </div>
              <div className="h-3 rounded-full" style={{ background: 'var(--chip)' }}>
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${width}%`,
                    background: 'linear-gradient(90deg, var(--primary), var(--accent))'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, black 12%)' }}>
          <div className="text-xs uppercase tracking-[0.16em] opacity-60">Divididas</div>
          <div className="text-lg font-semibold">{dashboardBrl(props.dividedTotal)}</div>
          <div className="text-sm opacity-70">{props.splitPct}% do total</div>
        </div>
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, black 12%)' }}>
          <div className="text-xs uppercase tracking-[0.16em] opacity-60">Nao divididas</div>
          <div className="text-lg font-semibold">{dashboardBrl(props.nonDividedTotal)}</div>
          <div className="text-sm opacity-70">{Math.max(100 - props.splitPct, 0)}% do total</div>
        </div>
        <div className="rounded-2xl border px-4 py-3 sm:col-span-2" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, black 12%)' }} data-dash-payers-settlement="true">
          <div className="text-xs uppercase tracking-[0.16em] opacity-60">Acerto entre pagadores</div>
          <div className="text-lg font-semibold">{props.settlement.headline}</div>
          <div className="text-sm opacity-70">{props.settlement.detail}</div>
        </div>
      </div>
    </div>
  );
}

function DashboardCategoryTrends(props) {
  const series = props.series || [];
  const targetPeakHeight = 60;
  const [selectedPoints, setSelectedPoints] = React.useState({});

  React.useEffect(() => {
    setSelectedPoints((prev) => {
      const next = { ...prev };
      series.forEach((group) => {
        const selectedKey = next[group.name];
        if (!group.points.some((point) => point.key === selectedKey)) {
          next[group.name] = group.points[group.points.length - 1]?.key || '';
        }
      });
      return next;
    });
  }, [series]);

  if (!series.length) {
    return <div className="text-sm opacity-70">Sem categorias suficientes para comparar ao longo do tempo.</div>;
  }

  return (
    <div className="space-y-3">
      {series.map((group) => {
        const groupMaxValue = Math.max(1, ...group.points.map((point) => Number(point.value || 0)));
        const selectedPoint = group.points.find((point) => point.key === selectedPoints[group.name]) || group.points[group.points.length - 1] || null;
        const points = group.points.map((point, index) => {
          const x = 12 + ((index / Math.max(group.points.length - 1, 1)) * 216);
          const y = 80 - ((point.value / groupMaxValue) * targetPeakHeight);
          return `${x},${y}`;
        }).join(' ');

        return (
          <div
            key={group.name}
            className="w-full text-left card"
            title={`${group.name}: ${dashboardBrl(group.points.reduce((sum, point) => sum + point.value, 0))} no periodo selecionado.`}
            data-dash-category-trend={group.name}
            style={{
              padding: 12,
              borderColor: props.selectedName === group.name
                ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
                : 'var(--border)',
              background: props.selectedName === group.name
                ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
                : undefined
            }}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => props.onSelect && props.onSelect(group.name)}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <span className="font-medium truncate block">{group.name}</span>
                  <span className="text-[11px] opacity-60">Escala da conta · pico {dashboardBrl(groupMaxValue)}</span>
                </div>
                <span className="text-xs opacity-70">{dashboardBrl(group.points.reduce((sum, point) => sum + point.value, 0))}</span>
              </div>
            </button>
            <svg viewBox="0 0 240 92" className="w-full h-[92px]">
              <polyline fill="none" stroke="var(--border)" strokeWidth="1" points="12,80 228,80" />
              {group.points.map((point, index) => {
                const barWidth = 12;
                const gap = 18;
                const x = 12 + (index * gap);
                const barHeight = point.value > 0 ? Math.max((point.value / groupMaxValue) * targetPeakHeight, 6) : 0;
                const selected = point.key === selectedPoint?.key;
                return (
                  <g key={point.key || `${group.name}-${index}`}>
                    <rect
                      x={x}
                      y={80 - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={selected ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 45%, var(--surface))'}
                      style={{ cursor: 'pointer' }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (props.onSelect) props.onSelect(group.name);
                        setSelectedPoints((prev) => ({ ...prev, [group.name]: point.key }));
                      }}
                      data-dash-category-point={`${group.name}:${point.label}`}
                    >
                      <title>{`${point.label}: ${dashboardBrl(point.value)}`}</title>
                    </rect>
                    {selected ? (
                      <circle cx={x + (barWidth / 2)} cy={80 - barHeight} r="3.5" fill="white" />
                    ) : null}
                  </g>
                );
              })}
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={group.points.map((point, index) => {
                  const x = 18 + (index * 18);
                  const y = 80 - ((point.value / groupMaxValue) * targetPeakHeight);
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            {selectedPoint ? (
              <div className="mt-3 badge" data-dash-category-selected={group.name}>
                {selectedPoint.label}: {dashboardBrl(selectedPoint.value)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

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

// Override: dashboard v2 with draft/applied filters and visible category focus
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
  const defaultFilters = React.useMemo(() => ({
    years: [baseYear],
    months: [baseMonth],
    accounts: null,
    payers: null,
    divided: null
  }), [baseYear, baseMonth]);

  const [draftFilters, setDraftFilters] = React.useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = React.useState(defaultFilters);
  const [previewRows, setPreviewRows] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [compareRows, setCompareRows] = React.useState([]);
  const [previousMonthRows, setPreviousMonthRows] = React.useState([]);
  const [rollingRows, setRollingRows] = React.useState([]);
  const [rollingCompareRows, setRollingCompareRows] = React.useState([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [trendAccountIndex, setTrendAccountIndex] = React.useState(0);
  const [singleMonthPage, setSingleMonthPage] = React.useState(0);
  const [timelinePage, setTimelinePage] = React.useState(0);
  const [rankingPage, setRankingPage] = React.useState(0);
  const [rankingMode, setRankingMode] = React.useState('total');
  const [activeFilterTab, setActiveFilterTab] = React.useState('period');
  const [showFilters, setShowFilters] = React.useState(true);

  function resetDraftFilters() {
    setDraftFilters({
      years: [...defaultFilters.years],
      months: [...defaultFilters.months],
      accounts: null,
      payers: null,
      divided: null
    });
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
        years: dashboardNormalizeSelection(prev.years, yearOptions),
        months: dashboardNormalizeSelection(prev.months, draftMonthOptions)
      };

      if (
        dashboardFiltersKey(prev, { years: yearOptions, months: draftMonthOptions, accounts: [], payers: [], divided: [] })
        === dashboardFiltersKey(next, { years: yearOptions, months: draftMonthOptions, accounts: [], payers: [], divided: [] })
      ) {
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
        years: dashboardNormalizeSelection(prev.years, draftFilterOptions.years),
        months: dashboardNormalizeSelection(prev.months, draftFilterOptions.months),
        accounts: dashboardNormalizeSelection(prev.accounts, draftFilterOptions.accounts),
        payers: dashboardNormalizeSelection(prev.payers, draftFilterOptions.payers),
        divided: dashboardNormalizeSelection(prev.divided, draftFilterOptions.divided)
      };

      if (dashboardFiltersKey(prev, draftFilterOptions) === dashboardFiltersKey(next, draftFilterOptions)) {
        return prev;
      }

      return next;
    });
  }, [draftFilterOptions]);

  const normalizedDraftFilters = React.useMemo(() => ({
    years: dashboardNormalizeSelection(draftFilters.years, draftFilterOptions.years),
    months: dashboardNormalizeSelection(draftFilters.months, draftFilterOptions.months),
    accounts: dashboardNormalizeSelection(draftFilters.accounts, draftFilterOptions.accounts),
    payers: dashboardNormalizeSelection(draftFilters.payers, draftFilterOptions.payers),
    divided: dashboardNormalizeSelection(draftFilters.divided, draftFilterOptions.divided)
  }), [draftFilters, draftFilterOptions]);

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
        years: dashboardNormalizeSelection(prev.years, yearOptions),
        months: dashboardNormalizeSelection(prev.months, appliedMonthOptions)
      };

      if (
        dashboardFiltersKey(prev, { years: yearOptions, months: appliedMonthOptions, accounts: [], payers: [], divided: [] })
        === dashboardFiltersKey(next, { years: yearOptions, months: appliedMonthOptions, accounts: [], payers: [], divided: [] })
      ) {
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
        const rollingPairsLoaded = dashboardRollingPairs(lastAppliedPair.year, lastAppliedPair.month, 12);
        const rollingComparePairsLoaded = dashboardRollingPairs(lastAppliedPair.year - 1, lastAppliedPair.month, 12);
        const [rollingRowsLoaded, rollingCompareRowsLoaded] = await Promise.all([
          dashboardFetchRowsForPairs(rollingPairsLoaded),
          dashboardFetchRowsForPairs(rollingComparePairsLoaded)
        ]);
        if (!alive) return;
        setRollingRows(rollingRowsLoaded);
        setRollingCompareRows(rollingCompareRowsLoaded);
      } catch (timelineError) {
        console.warn('[dashboard] erro ao carregar linha de 12 meses', timelineError);
        if (alive) {
          setRollingRows([]);
          setRollingCompareRows([]);
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
        years: dashboardNormalizeSelection(prev.years, appliedFilterOptions.years),
        months: dashboardNormalizeSelection(prev.months, appliedFilterOptions.months),
        divided: dashboardNormalizeSelection(prev.divided, appliedFilterOptions.divided)
      };

      if (
        dashboardFiltersKey(prev, { years: appliedFilterOptions.years, months: appliedFilterOptions.months, accounts: [], payers: [], divided: appliedFilterOptions.divided })
        === dashboardFiltersKey(next, { years: appliedFilterOptions.years, months: appliedFilterOptions.months, accounts: [], payers: [], divided: appliedFilterOptions.divided })
      ) {
        return prev;
      }

      return next;
    });
  }, [appliedFilterOptions]);

  const normalizedAppliedFilters = React.useMemo(() => ({
    years: dashboardNormalizeSelection(appliedFilters.years, appliedFilterOptions.years),
    months: dashboardNormalizeSelection(appliedFilters.months, appliedFilterOptions.months),
    accounts: dashboardNormalizeSelection(appliedFilters.accounts, appliedFilterOptions.accounts),
    payers: dashboardNormalizeSelection(appliedFilters.payers, appliedFilterOptions.payers),
    divided: dashboardNormalizeSelection(appliedFilters.divided, appliedFilterOptions.divided)
  }), [appliedFilters, appliedFilterOptions]);

  const hasPendingChanges = React.useMemo(
    () => JSON.stringify(normalizedDraftFilters) !== JSON.stringify(normalizedAppliedFilters),
    [normalizedDraftFilters, normalizedAppliedFilters]
  );

  const filteredRows = React.useMemo(() => dashboardFilterRows(rows, normalizedAppliedFilters), [rows, normalizedAppliedFilters]);
  const filteredCompareRows = React.useMemo(() => dashboardFilterRows(compareRows, normalizedAppliedFilters), [compareRows, normalizedAppliedFilters]);
  const filteredPreviousMonthRows = React.useMemo(() => dashboardFilterRows(previousMonthRows, normalizedAppliedFilters), [previousMonthRows, normalizedAppliedFilters]);
  const rollingPairs = React.useMemo(
    () => dashboardRollingPairs(lastAppliedPair.year, lastAppliedPair.month, 12),
    [lastAppliedPair]
  );
  const filteredRollingRows = React.useMemo(
    () => dashboardFilterRows(rollingRows, normalizedAppliedFilters),
    [rollingRows, normalizedAppliedFilters]
  );
  const filteredRollingCompareRows = React.useMemo(
    () => dashboardFilterRows(rollingCompareRows, normalizedAppliedFilters),
    [rollingCompareRows, normalizedAppliedFilters]
  );
  const resolvedAppliedAccounts = React.useMemo(() => dashboardResolveSelection(normalizedAppliedFilters.accounts, appliedFilterOptions.accounts), [normalizedAppliedFilters.accounts, appliedFilterOptions.accounts]);
  const yearsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.years, yearOptions, 'Todos'), [normalizedAppliedFilters.years, yearOptions]);
  const monthsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.months, appliedMonthOptions, 'Todos'), [normalizedAppliedFilters.months, appliedMonthOptions]);
  const accountsSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.accounts, appliedContasDisponiveis, 'Todas'), [normalizedAppliedFilters.accounts, appliedContasDisponiveis]);
  const payersSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.payers, appliedPagadoresDisponiveis, 'Todos'), [normalizedAppliedFilters.payers, appliedPagadoresDisponiveis]);
  const dividedSummary = React.useMemo(() => dashboardSelectionSummary(normalizedAppliedFilters.divided, dividedOptions, 'Sim e Nao'), [normalizedAppliedFilters.divided, dividedOptions]);
  const emptyFilterLabels = React.useMemo(() => (
    [
      { label: 'ano', summary: yearsSummary },
      { label: 'mes', summary: monthsSummary },
      { label: 'conta', summary: accountsSummary },
      { label: 'pagador', summary: payersSummary },
      { label: 'divisao', summary: dividedSummary }
    ]
      .filter((item) => item.summary === 'Nenhum')
      .map((item) => item.label)
  ), [yearsSummary, monthsSummary, accountsSummary, payersSummary, dividedSummary]);
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
  const trendCompareSeries = React.useMemo(() => (
    dashboardMakeSeries(filteredRollingCompareRows, rollingPairs, focusedTrendAccount)
      .map((point, index) => ({
        ...point,
        label: dashboardPairLabel(rollingPairs[index], true)
      }))
  ), [filteredRollingCompareRows, rollingPairs, focusedTrendAccount]);
  const categoriasTimeline = React.useMemo(() => (
    dashboardCategorySeries(filteredRollingRows, rollingPairs, 999).map((group) => ({
      ...group,
      points: group.points.map((point, index) => ({
        ...point,
        label: dashboardPairLabel(rollingPairs[index], true)
      }))
    }))
  ), [filteredRollingRows, rollingPairs]);
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

  function focusDashboardAccount(name) {
    if (!name || name === 'Outros') return;
    if (!rankingCategorias.some((item) => item.name === name)) return;
    setSelectedCategory(name);
  }

  React.useEffect(() => {
    if (singleMonthPage > singleMonthPageCount - 1) setSingleMonthPage(0);
  }, [singleMonthPage, singleMonthPageCount]);

  React.useEffect(() => {
    if (timelinePage > timelinePageCount - 1) setTimelinePage(0);
  }, [timelinePage, timelinePageCount]);

  React.useEffect(() => {
    if (rankingPage > rankingPageCount - 1) setRankingPage(0);
  }, [rankingPage, rankingPageCount]);

  React.useEffect(() => {
    if (!selectedCategory) return;
    const trendIndex = trendAccounts.indexOf(selectedCategory);
    if (trendIndex >= 0 && trendIndex !== trendAccountIndex) {
      setTrendAccountIndex(trendIndex);
    }

    const rankingIndex = rankingItems.findIndex((item) => item.name === selectedCategory);
    if (rankingIndex >= 0) {
      const nextRankingPage = Math.floor(rankingIndex / 5);
      if (nextRankingPage !== rankingPage) setRankingPage(nextRankingPage);
    }

    const timelineIndex = categoriasTimeline.findIndex((group) => group.name === selectedCategory);
    if (timelineIndex >= 0) {
      const nextTimelinePage = Math.floor(timelineIndex / 3);
      if (nextTimelinePage !== timelinePage) setTimelinePage(nextTimelinePage);
    }
  }, [selectedCategory, trendAccounts, trendAccountIndex, rankingItems, rankingPage, categoriasTimeline, timelinePage]);

  const primeiraPessoa = rankingPagadores[0] || null;
  const segundaPessoa = rankingPagadores[1] || null;
  const cardsPrincipais = [
    {
      key: 'total',
      label: appliedSelectedPairs.length > 1 ? 'Total do periodo' : 'Total do mes',
      value: dashboardBrl(totalPeriodo),
      detail: `${filteredRows.length} lancamentos neste recorte.`,
      tooltip: 'Soma de todos os lancamentos retornados pelos filtros aplicados ao dashboard.'
    },
    {
      key: 'split',
      label: 'Valor total dividido',
      value: dashboardBrl(totalDividido),
      detail: `${splitPct}% do total do periodo.`,
      tooltip: 'Somatorio das contas marcadas como divididas dentro do recorte aplicado.'
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
  const renderLegacyFilterPanel = false;
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

      {renderLegacyFilterPanel ? (
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
                onClick={resetDraftFilters}
                data-dash-action="reset-filters"
              >
                Restaurar padrao
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={applyDraftFilters}
                data-dash-action="apply-filters"
                disabled={!hasPendingChanges || previewLoading}
              >
                Atualizar dashboard
              </button>
            </div>
          </div>

          <div className={showFilters ? 'block' : 'hidden lg:block'}>
            {activeFilterTab === 'period' ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <DashboardFilterChecklist
                  label="Anos"
                  helperText="Padrao: ano atual."
                  selection={draftFilters.years}
                  onChange={(years) => setDraftFilters((prev) => ({ ...prev, years }))}
                  options={yearOptions}
                  allLabel="Todos"
                  searchable={false}
                  columns={2}
                  testId="years"
                  tooltip="Escolha um ou mais anos disponiveis no banco para montar o recorte."
                />
                <DashboardFilterChecklist
                  label="Meses"
                  helperText="Padrao: mes atual."
                  selection={draftFilters.months}
                  onChange={(months) => setDraftFilters((prev) => ({ ...prev, months }))}
                  options={draftMonthOptions}
                  allLabel="Todos"
                  searchable={false}
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
                selection={draftFilters.accounts}
                onChange={(accounts) => setDraftFilters((prev) => ({ ...prev, accounts }))}
                options={contasDisponiveis}
                allLabel="Todas"
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
                  selection={draftFilters.payers}
                  onChange={(payers) => setDraftFilters((prev) => ({ ...prev, payers }))}
                  options={pagadoresDisponiveis}
                  allLabel="Todos"
                  maxHeight={300}
                  testId="payers"
                  tooltip="A lista de pagadores acompanha o periodo e as contas selecionadas."
                />
                <DashboardFilterChecklist
                  label="Divididas"
                  helperText="Marque Sim, Nao ou ambas."
                  selection={draftFilters.divided}
                  onChange={(divided) => setDraftFilters((prev) => ({ ...prev, divided }))}
                  options={dividedOptions}
                  allLabel="Sim e Nao"
                  columns={2}
                  testId="divided"
                  tooltip="Filtra apenas contas divididas, apenas nao divididas ou ambas."
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="badge">Dashboard aplicado</div>
            <div className="badge" data-dash-filter-summary="years">Anos: {yearsSummary}</div>
            <div className="badge" data-dash-filter-summary="months">Meses: {monthsSummary}</div>
            <div className="badge" data-dash-filter-summary="accounts">Contas: {accountsSummary}</div>
            <div className="badge" data-dash-filter-summary="payers">Pagadores: {payersSummary}</div>
            <div className="badge" data-dash-filter-summary="divided">Divididas: {dividedSummary}</div>
            <div className="badge" data-dash-count="rows">Lancamentos: {filteredRows.length}</div>
            {previewLoading ? <div className="badge">Atualizando opcoes...</div> : null}
            {loading ? <div className="badge">Atualizando dashboard...</div> : null}
            {hasPendingChanges ? <div className="badge">Alteracoes pendentes</div> : null}
          </div>

          {hasPendingChanges ? (
            <div className="text-sm opacity-70" data-dash-pending-message="true">
              Aplique os filtros e clique em Atualizar dashboard para refletir as mudancas abaixo.
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

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
              tooltip="Mostra as contas do mes atual em blocos de tres, ordenadas pelo maior valor do mes selecionado."
              testId="trend-single"
            >
              {singleMonthPageCount > 1 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setSingleMonthPage((prev) => (prev <= 0 ? singleMonthPageCount - 1 : prev - 1))}
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
                      onClick={() => setSingleMonthPage((prev) => (prev >= singleMonthPageCount - 1 ? 0 : prev + 1))}
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
              tooltip="Janela movel dos ultimos 12 meses ate o fim do recorte. A linha cheia mostra a conta selecionada e o tracejado mostra a mesma janela do ano anterior."
              testId="trend-period"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!trendAccounts.length) return;
                      const nextIndex = trendAccountIndex <= 0 ? Math.max(trendAccounts.length - 1, 0) : trendAccountIndex - 1;
                      focusDashboardAccount(trendAccounts[nextIndex]);
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
                      const nextIndex = trendAccountIndex >= trendAccounts.length - 1 ? 0 : trendAccountIndex + 1;
                      focusDashboardAccount(trendAccounts[nextIndex]);
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
                comparePoints={trendCompareSeries}
                primaryLabel="Ultimos 12 meses"
                compareLabel="Meses equivalentes do ano anterior"
                ariaLabel={`Grafico de evolucao para ${focusedTrendAccount || 'conta selecionada'}`}
              />
            </DashboardSection>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            <DashboardSection
              title="Top 5 contas"
              tooltip="Top 5 contas dentre as selecionadas. Clique na legenda para destacar e abrir a fatia correspondente na rosca."
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
              tooltip="Mostra todas as contas do recorte aplicado. Quando houver mais de um mes, voce pode alternar entre total acumulado e media por mes."
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
                        setRankingPage((prev) => (prev <= 0 ? rankingPageCount - 1 : prev - 1));
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
                        setRankingPage((prev) => (prev >= rankingPageCount - 1 ? 0 : prev + 1));
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
              tooltip="Resume quanto cada pagador desembolsou, quanto do recorte esta em contas divididas e qual acerto estimado ainda resta."
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
              title="Contas nos ultimos 12 meses"
              subtitle="Barras por mes com linha de tendencia, sempre ancoradas no mes final do recorte."
              tooltip="Mostra os ultimos 12 meses ate o fechamento do filtro aplicado. Clique numa barra para ver o valor daquele mes e use as setas para navegar de tres em tres contas."
              testId="category-trends"
            >
              {timelinePageCount > 1 ? (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      clearLinkedFocus();
                      setTimelinePage((prev) => (prev <= 0 ? timelinePageCount - 1 : prev - 1));
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
                      setTimelinePage((prev) => (prev >= timelinePageCount - 1 ? 0 : prev + 1));
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
