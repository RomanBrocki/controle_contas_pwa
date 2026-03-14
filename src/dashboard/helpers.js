// Dashboard runtime helpers shared across BI screens and widgets.
// Keep business rules and value formatting here so the main view can focus on
// data flow and composition instead of carrying every utility inline.

(function attachDashboardHelpers(globalObject) {
  function monthNamePT(month, shortLabel = false) {
    return globalObject.AppDateUtils.monthNamePT(month, {
      shortLabel,
      referenceYear: 2026
    });
  }

  function brl(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function isoToBR(iso) {
    if (!iso) return '';
    const parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function normalizeRow(row) {
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

  function sum(rows) {
    return (rows || []).reduce((total, row) => total + Number(row.valor || 0), 0);
  }

  function groupAndSort(rows, fieldName) {
    const groups = {};
    (rows || []).forEach((row) => {
      const key = row[fieldName] || 'Nao informado';
      groups[key] = (groups[key] || 0) + Number(row.valor || 0);
    });

    return Object.keys(groups)
      .map((key) => ({ name: key, total: groups[key] }))
      .sort((left, right) => right.total - left.total);
  }

  function groupTotalsMap(rows, fieldName) {
    const map = new Map();
    (rows || []).forEach((row) => {
      const key = row[fieldName] || 'Nao informado';
      map.set(key, (map.get(key) || 0) + Number(row.valor || 0));
    });
    return map;
  }

  function filterRows(rows, filters) {
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

  function prevYearMonth(year, month) {
    if (month > 1) return { year, month: month - 1 };
    return { year: year - 1, month: 12 };
  }

  function pairKey(pair) {
    return `${pair.year}-${String(pair.month).padStart(2, '0')}`;
  }

  function pairLabel(pair, showYear = false) {
    const label = monthNamePT(pair.month, true);
    return showYear ? `${label}/${String(pair.year).slice(-2)}` : label;
  }

  function pairLabelLong(pair) {
    return `${monthNamePT(pair.month, true)}/${pair.year}`;
  }

  function sortPairs(pairs) {
    return [...pairs].sort((left, right) => {
      if (left.year !== right.year) return left.year - right.year;
      return left.month - right.month;
    });
  }

  function buildPairs(years, months, monthsByYear) {
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

  function resolveSelection(selection, options) {
    if (!options.length) return [];
    if (selection == null) return options.map((option) => option.value);
    return options
      .filter((option) => (selection || []).includes(option.value))
      .map((option) => option.value);
  }

  function selectionSummary(selection, options, allLabel) {
    if (!options.length) return allLabel;
    const resolved = resolveSelection(selection, options);
    if (selection == null || resolved.length === options.length) return allLabel;
    if (!resolved.length) return 'Nenhum';

    const labelByValue = new Map(options.map((option) => [option.value, option.label]));
    const labels = resolved.map((value) => labelByValue.get(value) || String(value));

    if (labels.length <= 2) return labels.join(', ');
    return `${labels.length} selecionados`;
  }

  function normalizeSelection(selection, options) {
    if (!options.length) return [];
    if (selection == null) return null;

    const optionSet = new Set(options.map((option) => option.value));
    const ordered = (selection || []).filter((value) => optionSet.has(value));

    if (ordered.length === options.length) return null;
    if (!ordered.length) return [];
    return options.filter((option) => ordered.includes(option.value)).map((option) => option.value);
  }

  function filtersKey(filters, optionsByField) {
    return JSON.stringify({
      years: normalizeSelection(filters?.years == null ? null : filters.years, optionsByField?.years || []),
      months: normalizeSelection(filters?.months == null ? null : filters.months, optionsByField?.months || []),
      accounts: normalizeSelection(filters?.accounts == null ? null : filters.accounts, optionsByField?.accounts || []),
      payers: normalizeSelection(filters?.payers == null ? null : filters.payers, optionsByField?.payers || []),
      divided: normalizeSelection(filters?.divided == null ? null : filters.divided, optionsByField?.divided || [])
    });
  }

  function toggleSelection(selection, value, options, emptyBehavior = 'deselect-from-all') {
    if (!options.length) return [];

    const resolved = resolveSelection(selection, options);
    const next = new Set(resolved);

    if (next.has(value)) next.delete(value);
    else next.add(value);

    const ordered = options.filter((option) => next.has(option.value)).map((option) => option.value);
    if (ordered.length === options.length) return null;
    if (!ordered.length) return [];
    return ordered;
  }

  function rollingPairs(endYear, endMonth, count) {
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

  async function fetchRowsForPairs(pairs) {
    const uniquePairs = sortPairs(
      Array.from(new Map((pairs || []).map((pair) => [pairKey(pair), pair])).values())
    );

    if (!uniquePairs.length) return [];

    const lists = await Promise.all(uniquePairs.map(async (pair) => {
      const raw = await globalObject.SupabaseQueries.listMes(pair.year, pair.month);
      return (raw || []).map(normalizeRow);
    }));

    return lists.flat();
  }

  function monthOptionsForYears(monthsByYear, selectedYears) {
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
      .map((month) => ({ value: month, label: monthNamePT(month) }));
  }

  function makeSeries(rows, pairs, groupName) {
    return (pairs || []).map((pair) => {
      const monthRows = (rows || []).filter((row) => {
        if (row.ano !== pair.year || row.mes !== pair.month) return false;
        if (groupName && row.nome !== groupName) return false;
        return true;
      });

      return {
        key: pairKey(pair),
        label: monthNamePT(pair.month, true),
        value: sum(monthRows)
      };
    });
  }

  function categorySeries(rows, pairs, limit, options = {}) {
    const orderedNames = Array.isArray(options.orderedNames) && options.orderedNames.length
      ? options.orderedNames
      : groupAndSort(rows, 'nome').map((item) => item.name);
    const categories = Array.from(new Set(orderedNames))
      .filter(Boolean)
      .slice(0, limit || 3);

    return categories.map((name) => ({
      name,
      points: makeSeries(rows, pairs, name)
    }));
  }

  function buildTopFiveSegments(items) {
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

  function buildParetoItems(items) {
    const normalized = (items || [])
      .map((item) => ({
        name: item.name || 'Sem categoria',
        total: Number(item.total || 0)
      }))
      .filter((item) => item.total > 0);

    const total = normalized.reduce((sum, item) => sum + item.total, 0);
    let runningTotal = 0;

    return normalized.map((item) => {
      runningTotal += item.total;
      const sharePct = total > 0 ? (item.total / total) * 100 : 0;
      const cumulativePct = total > 0 ? (runningTotal / total) * 100 : 0;

      return {
        ...item,
        sharePct,
        cumulativePct
      };
    });
  }

  function splitLabel(label, maxCharsPerLine = 12, maxLines = 2) {
    const cleaned = String(label || '').trim();
    if (!cleaned) return [''];

    const safeLimit = Math.max(4, Number(maxCharsPerLine || 12));
    const words = cleaned.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      const normalizedWord = word.length > safeLimit
        ? `${word.slice(0, safeLimit - 1)}…`
        : word;

      if (!current) {
        current = normalizedWord;
        return;
      }

      const candidate = `${current} ${normalizedWord}`;
      if (candidate.length <= safeLimit) {
        current = candidate;
        return;
      }

      lines.push(current);
      current = normalizedWord;
    });

    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;

    const visible = lines.slice(0, maxLines);
    const lastIndex = visible.length - 1;
    const lastLine = visible[lastIndex];
    visible[lastIndex] = lastLine.endsWith('…')
      ? lastLine
      : `${lastLine.slice(0, Math.max(safeLimit - 1, 1))}…`;
    return visible;
  }

  function buildAccountComparison(currentRows, previousRows, previousYearRows, limit) {
    const currentMap = groupTotalsMap(currentRows, 'nome');
    const previousMap = groupTotalsMap(previousRows, 'nome');
    const previousYearMap = groupTotalsMap(previousYearRows, 'nome');
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

  function computeSettlement(rows) {
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

    const totalDivided = sum(dividedRows);
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
        headline: `${debtor.payer} deve ${brl(amount)}`,
        detail: `para ${creditor.payer} nas contas divididas.`
      };
    }

    return {
      headline: `${debtor.payer} deve ${brl(amount)}`,
      detail: `maior repasse estimado para ${creditor.payer}.`
    };
  }

  function buildCategoryFocus(rows, categoryName, totalPeriodo) {
    if (!categoryName) return null;

    const categoryRows = (rows || []).filter((row) => row.nome === categoryName);
    if (!categoryRows.length) return null;

    const total = sum(categoryRows);
    const topPayer = groupAndSort(categoryRows, 'quem')[0] || null;
    const topInstance = groupAndSort(
      categoryRows.map((row) => ({ ...row, instancia: row.instancia || row.nome })),
      'instancia'
    )[0] || null;
    const dividedTotal = sum(categoryRows.filter((row) => row.dividida));

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

  globalObject.DashboardHelpers = {
    monthNamePT,
    brl,
    isoToBR,
    normalizeRow,
    sum,
    groupAndSort,
    groupTotalsMap,
    filterRows,
    prevYearMonth,
    pairKey,
    pairLabel,
    pairLabelLong,
    sortPairs,
    buildPairs,
    resolveSelection,
    selectionSummary,
    normalizeSelection,
    filtersKey,
    toggleSelection,
    rollingPairs,
    fetchRowsForPairs,
    monthOptionsForYears,
    makeSeries,
    categorySeries,
    buildTopFiveSegments,
    buildParetoItems,
    splitLabel,
    buildAccountComparison,
    computeSettlement,
    buildCategoryFocus,
  };
})(window);
