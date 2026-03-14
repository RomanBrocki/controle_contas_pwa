// Shared date helpers exposed to the legacy in-browser runtime.
// Keep these helpers framework-agnostic so control, reports, and dashboard
// can reuse the same parsing and labeling rules without copy/paste drift.

(function attachAppDateUtils(globalObject) {
  function toInteger(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function monthNamePT(month, options) {
    const settings = options || {};
    const numericMonth = toInteger(month);
    const shortLabel = settings.shortLabel === true;
    const referenceYear = toInteger(settings.referenceYear) || 2026;

    if (numericMonth == null || numericMonth < 1 || numericMonth > 12) {
      return '';
    }

    const label = new Date(referenceYear, numericMonth - 1, 1)
      .toLocaleString('pt-BR', { month: shortLabel ? 'short' : 'long' })
      .replace('.', '');

    return label.replace(/^./, function capitalizeFirstLetter(char) {
      return char.toUpperCase();
    });
  }

  function parseEditableYear(rawValue) {
    const digits = String(rawValue || '').replace(/[^\d]/g, '').slice(0, 4);
    if (digits.length !== 4) return null;

    const parsedYear = Number(digits);
    if (!Number.isFinite(parsedYear) || parsedYear < 1900 || parsedYear > 9999) {
      return null;
    }

    return parsedYear;
  }

  function buildYearList(years, selectedYear) {
    return Array.from(
      new Set(
        []
          .concat(Array.isArray(years) ? years : [])
          .concat([new Date().getFullYear(), Number(selectedYear)])
          .map(function normalizeYear(year) {
            return Number(year);
          })
          .filter(function isValidYear(year) {
            return Number.isFinite(year) && year > 0;
          })
      )
    ).sort(function sortAscending(left, right) {
      return left - right;
    });
  }

  globalObject.AppDateUtils = {
    monthNamePT,
    parseEditableYear,
    buildYearList,
  };
})(window);
