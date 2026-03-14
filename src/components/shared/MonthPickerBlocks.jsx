function renderYearOptions(years, selectedYear) {
  return window.AppDateUtils
    .buildYearList(years, selectedYear)
    .map((year) => (
      <option key={year} value={year}>{year}</option>
    ));
}

function MonthPickerBlockBase(props) {
  const {
    title,
    year,
    setYear,
    month,
    setMonth,
    years,
    monthOptions,
    idPrefix,
    legacyMonthLabel = false
  } = props;

  return (
    <div className="subpick">
      <h3>{title}</h3>
      <div className="row">
        <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <SelectPopoverField
            id={`${idPrefix}-ano`}
            label="Ano"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            allowCustomValue
            customInputPlaceholder="Digite um ano"
            customInputButtonLabel={(candidate) => `Usar ${candidate}`}
            customInputMaxLength={4}
            customValueParser={window.AppDateUtils.parseEditableYear}
            panelWidth="min(280px, calc(100vw - 2rem))"
          >
            {renderYearOptions(years, year)}
          </SelectPopoverField>
        </div>
        <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {legacyMonthLabel ? <label htmlFor={`${idPrefix}-mes`}>{'M\u00eas'}</label> : null}
          <SelectPopoverField
            id={`${idPrefix}-mes`}
            label={legacyMonthLabel ? undefined : 'M\u00eas'}
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            panelWidth="min(280px, calc(100vw - 2rem))"
          >
            {monthOptions(year)}
          </SelectPopoverField>
        </div>
      </div>
    </div>
  );
}

// Keep both public names because the reports flow and legacy screens already
// reference them directly from the global runtime.
function LegacyMonthPickerBlock(props) {
  return <MonthPickerBlockBase {...props} legacyMonthLabel />;
}

function MonthPickerBlock(props) {
  return <MonthPickerBlockBase {...props} />;
}
