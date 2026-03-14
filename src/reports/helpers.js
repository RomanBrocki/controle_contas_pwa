// Report-domain helpers shared by the modal, previews, and PDF builders.
// Exposed in window because the app still mixes Babel-in-browser scripts
// with ES modules and global contracts.

(function attachReportsHelpers(globalObject) {
  function monthNamePT(month) {
    return globalObject.AppDateUtils.monthNamePT(month);
  }

  function monthLabel(year, month) {
    return `${monthNamePT(month)} / ${year}`;
  }

  function makeMonthsList(y1, m1, y2, m2) {
    const out = [];
    let year = y1;
    let month = m1;

    while (year < y2 || (year === y2 && month <= m2)) {
      out.push({ y: year, m: month });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return out;
  }

  function parseBRLnum(brl) {
    return parseFloat(
      String(brl || '')
        .replace(/[^\d,]/g, '')
        .replace(/\.(?=\d)/g, '')
        .replace(',', '.')
    ) || 0;
  }

  function normalizeContaName(raw = '') {
    return String(raw || '')
      .trim()
      .replace(/\s*\([^()]*\)\s*$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function sumByConta(items, contasSel) {
    return (contasSel || []).map((conta) => {
      const alvo = normalizeContaName(conta);
      return (items || [])
        .filter((item) => normalizeContaName(item.nome) === alvo)
        .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0);
    });
  }

  globalObject.ReportsHelpers = {
    monthNamePT,
    monthLabel,
    makeMonthsList,
    parseBRLnum,
    normalizeContaName,
    sumByConta,
  };
})(window);
