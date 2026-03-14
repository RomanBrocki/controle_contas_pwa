function buildControlMonthOptions(monthsByYear, selectedYear, selectedMonth) {
  const fallbackMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const monthValues = [...fallbackMonths];

  if (!monthValues.includes(selectedMonth)) {
    monthValues.push(selectedMonth);
  }

  return monthValues.sort((left, right) => left - right);
}

function ControlMonthSummary(props) {
  const {
    totalMes,
    yearSel,
    monthSel,
    years,
    monthsByYear,
    onYearChange,
    onMonthChange
  } = props;

  const yearOptions = window.AppDateUtils.buildYearList(years, yearSel);
  const monthOptions = buildControlMonthOptions(monthsByYear, yearSel, monthSel);

  return (
    <section className="card mb-6 flex flex-col gap-4 md:flex-row md:items-center">
      <div>
        <div className="text-sm opacity-70">Total do mês</div>
        <div className="text-2xl font-semibold" style={{ textShadow: 'var(--glow)' }}>
          {totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2 md:ml-auto md:w-auto">
        <SelectPopoverField
          id="home-ano"
          label="Ano"
          value={yearSel}
          onChange={(event) => onYearChange(Number(event.target.value))}
          allowCustomValue
          customInputPlaceholder="Digite um ano"
          customInputButtonLabel={(candidate) => `Usar ${candidate}`}
          customInputMaxLength={4}
          customValueParser={window.AppDateUtils.parseEditableYear}
          panelWidth="min(280px, calc(100vw - 2rem))"
          wrapperClassName="w-full md:w-[120px]"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </SelectPopoverField>

        <SelectPopoverField
          id="home-mes"
          label="Mês"
          value={monthSel}
          onChange={(event) => onMonthChange(Number(event.target.value))}
          wrapperClassName="w-full md:w-[180px]"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>{window.AppDateUtils.monthNamePT(month)}</option>
          ))}
        </SelectPopoverField>
      </div>
    </section>
  );
}
