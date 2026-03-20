function ReportsModal({
  tab,
  onChangeTab,
  onClose,
  years,
  monthsByYear,
  currentYear,
  currentMonth,
  defaultSel = [],
  configuredChartAccounts = [],
}) {
  React.useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const [loading, setLoading] = React.useState(false);
  const [mensalYear, setMensalYear] = React.useState(currentYear);
  const [mensalMonth, setMensalMonth] = React.useState(currentMonth);
  const [pStartYear, setPStartYear] = React.useState(currentYear);
  const [pStartMonth, setPStartMonth] = React.useState(currentMonth);
  const [pEndYear, setPEndYear] = React.useState(currentYear);
  const [pEndMonth, setPEndMonth] = React.useState(currentMonth);
  const [cmpRange, setCmpRange] = React.useState('mes');
  const [cmpYear, setCmpYear] = React.useState(currentYear);
  const [cmpMonth, setCmpMonth] = React.useState(currentMonth);
  const [cmpStartYear, setCmpStartYear] = React.useState(currentYear);
  const [cmpStartMonth, setCmpStartMonth] = React.useState(currentMonth);
  const [cmpEndYear, setCmpEndYear] = React.useState(currentYear);
  const [cmpEndMonth, setCmpEndMonth] = React.useState(currentMonth);
  const [cmpType, setCmpType] = React.useState('linhas');
  const [cmpSel, setCmpSel] = React.useState(() => new Set(defaultSel));
  const [cmpContas, setCmpContas] = React.useState([]);

  const monthNamePT = window.ReportsHelpers.monthNamePT;
  const {
    listDistinctAccountsForRange,
    normalizeComparativoType,
    filterSelectionToAvailableAccounts,
    renderComparativoPreview,
    downloadComparativoPng,
    downloadComparativoPdf,
  } = window.ReportsWorkflows;
  const {
    generateMonthlyReportPdf,
    generatePeriodReportPdf,
  } = window.ReportsPdfBuilders;

  React.useEffect(() => {
    if (tab === 'comparativos') {
      setCmpSel(new Set(defaultSel));
    }
  }, [tab, defaultSel]);

  React.useEffect(() => {
    const nextType = normalizeComparativoType(cmpRange, cmpType);
    if (nextType !== cmpType) setCmpType(nextType);
  }, [cmpRange, cmpType, normalizeComparativoType]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await listDistinctAccountsForRange({
        range: cmpRange,
        year: cmpYear,
        month: cmpMonth,
        startYear: cmpStartYear,
        startMonth: cmpStartMonth,
        endYear: cmpEndYear,
        endMonth: cmpEndMonth,
      });

      if (cancelled) return;
      setCmpContas(list);
      setCmpSel((previous) => filterSelectionToAvailableAccounts(previous, list));
    })();

    return () => {
      cancelled = true;
    };
  }, [
    cmpRange,
    cmpYear,
    cmpMonth,
    cmpStartYear,
    cmpStartMonth,
    cmpEndYear,
    cmpEndMonth,
    listDistinctAccountsForRange,
    filterSelectionToAvailableAccounts,
  ]);

  React.useEffect(() => {
    setMensalYear(currentYear);
    setMensalMonth(currentMonth);
    setPStartYear(currentYear);
    setPStartMonth(currentMonth);
    setPEndYear(currentYear);
    setPEndMonth(currentMonth);
    setCmpYear(currentYear);
    setCmpMonth(currentMonth);
    setCmpStartYear(currentYear);
    setCmpStartMonth(currentMonth);
    setCmpEndYear(currentYear);
    setCmpEndMonth(currentMonth);
  }, [currentYear, currentMonth]);

  function monthOptions(year) {
    const availableMonths = monthsByYear?.[year];
    const source = Array.isArray(availableMonths) && availableMonths.length
      ? Array.from(new Set(availableMonths))
          .map((month) => Number(month))
          .filter((month) => month >= 1 && month <= 12)
          .sort((left, right) => left - right)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return source.map((month) => (
      <option key={month} value={month}>{monthNamePT(month)}</option>
    ));
  }

  function toggleConta(name) {
    setCmpSel((previous) => {
      const next = new Set(previous);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleMonthlyPdf() {
    setLoading(true);
    try {
      await generateMonthlyReportPdf({
        year: mensalYear,
        month: mensalMonth,
        configuredChartAccounts,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePeriodPdf() {
    setLoading(true);
    try {
      await generatePeriodReportPdf({
        startYear: pStartYear,
        startMonth: pStartMonth,
        endYear: pEndYear,
        endMonth: pEndMonth,
        configuredChartAccounts,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePreviewComparativo(event) {
    const content = event.currentTarget.closest('.modal')?.querySelector('.content');
    await renderComparativoPreview({
      content,
      range: cmpRange,
      type: cmpType,
      year: cmpYear,
      month: cmpMonth,
      startYear: cmpStartYear,
      startMonth: cmpStartMonth,
      endYear: cmpEndYear,
      endMonth: cmpEndMonth,
      selectedAccounts: Array.from(cmpSel),
    });
  }

  function handleDownloadComparativoPng() {
    downloadComparativoPng();
  }

  function handleDownloadComparativoPdf() {
    downloadComparativoPdf();
  }

  return (
    <div className="overlay">
      <div
        className={`modal glass ${tab === 'home' ? 'max-w-md' : 'max-w-3xl'} w-full pop`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reports-title"
        onClick={(event) => event.stopPropagation()}
      >
        <ReportsModalHeader onClose={onClose} />

        {tab === 'home' ? (
          <ReportsHomePanel onChangeTab={onChangeTab} />
        ) : null}

        {tab === 'mensal' ? (
          <ReportsMensalPanel
            years={years}
            monthOptions={monthOptions}
            mensalYear={mensalYear}
            setMensalYear={setMensalYear}
            mensalMonth={mensalMonth}
            setMensalMonth={setMensalMonth}
            onBack={() => onChangeTab('home')}
            onGeneratePdf={handleMonthlyPdf}
          />
        ) : null}

        {tab === 'periodo' ? (
          <ReportsPeriodoPanel
            years={years}
            monthOptions={monthOptions}
            pStartYear={pStartYear}
            setPStartYear={setPStartYear}
            pStartMonth={pStartMonth}
            setPStartMonth={setPStartMonth}
            pEndYear={pEndYear}
            setPEndYear={setPEndYear}
            pEndMonth={pEndMonth}
            setPEndMonth={setPEndMonth}
            onBack={() => onChangeTab('home')}
            onGeneratePdf={handlePeriodPdf}
          />
        ) : null}

        {tab === 'comparativos' ? (
          <ReportsComparativosPanel
            years={years}
            monthOptions={monthOptions}
            cmpRange={cmpRange}
            setCmpRange={setCmpRange}
            cmpType={cmpType}
            setCmpType={setCmpType}
            cmpYear={cmpYear}
            setCmpYear={setCmpYear}
            cmpMonth={cmpMonth}
            setCmpMonth={setCmpMonth}
            cmpStartYear={cmpStartYear}
            setCmpStartYear={setCmpStartYear}
            cmpStartMonth={cmpStartMonth}
            setCmpStartMonth={setCmpStartMonth}
            cmpEndYear={cmpEndYear}
            setCmpEndYear={setCmpEndYear}
            cmpEndMonth={cmpEndMonth}
            setCmpEndMonth={setCmpEndMonth}
            cmpContas={cmpContas}
            cmpSel={cmpSel}
            setCmpSel={setCmpSel}
            toggleConta={toggleConta}
            onBack={() => onChangeTab('home')}
            onPreview={handlePreviewComparativo}
            onDownloadPng={handleDownloadComparativoPng}
            onDownloadPdf={handleDownloadComparativoPdf}
            onGenerateMensalPdf={handleMonthlyPdf}
            onGeneratePeriodoPdf={handlePeriodPdf}
          />
        ) : null}

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-50">
            <div className="bg-[var(--surface)] text-[var(--text)] px-6 py-4 rounded-lg font-semibold shadow-lg animate-pulse">
              Gerando relatório... Aguarde
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
