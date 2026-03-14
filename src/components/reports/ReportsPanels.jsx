function ReportsModalHeader({ onClose }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 id="reports-title" className="text-lg font-semibold">Relatórios</h3>
      <div className="ml-auto flex gap-2">
        <button className="btn ghost" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function ReportsHomePanel({ onChangeTab }) {
  return (
    <div className="grid gap-3">
      <button className="btn primary" onClick={() => onChangeTab('mensal')}>{'Relat\u00f3rio mensal'}</button>
      <button className="btn primary" onClick={() => onChangeTab('periodo')}>{'Relat\u00f3rio por per\u00edodo'}</button>
    </div>
  );
}

function ReportsMensalPanel(props) {
  const {
    years,
    monthOptions,
    mensalYear,
    setMensalYear,
    mensalMonth,
    setMensalMonth,
    onBack,
    onGeneratePdf
  } = props;

  return (
    <>
      <div className="content">
        <MonthPickerBlock
          title="Selecione o mês"
          year={mensalYear}
          setYear={setMensalYear}
          month={mensalMonth}
          setMonth={setMensalMonth}
          years={years}
          monthOptions={monthOptions}
          idPrefix="mensal"
        />
        <div className="text-sm opacity-70" style={{ marginTop: 12 }}>
          Gera: Pizza do mês + Resumo por pessoa + Balanço divididas + Listagem com links.
        </div>
      </div>
      <div className="footer flex gap-2 justify-end">
        <button className="btn ghost" onClick={onBack}>Voltar</button>
        <button className="btn primary" onClick={onGeneratePdf}>Gerar PDF</button>
      </div>
    </>
  );
}

function ReportsPeriodoPanel(props) {
  const {
    years,
    monthOptions,
    pStartYear,
    setPStartYear,
    pStartMonth,
    setPStartMonth,
    pEndYear,
    setPEndYear,
    pEndMonth,
    setPEndMonth,
    onBack,
    onGeneratePdf
  } = props;

  return (
    <>
      <div className="content">
        <MonthPickerBlock
          title="Selecione início"
          year={pStartYear}
          setYear={setPStartYear}
          month={pStartMonth}
          setMonth={setPStartMonth}
          years={years}
          monthOptions={monthOptions}
          idPrefix="periodo-inicio"
        />
        <MonthPickerBlock
          title="Selecione final"
          year={pEndYear}
          setYear={setPEndYear}
          month={pEndMonth}
          setMonth={setPEndMonth}
          years={years}
          monthOptions={monthOptions}
          idPrefix="periodo-fim"
        />
        <div className="text-sm opacity-70" style={{ marginTop: 12 }}>
          Consolidado do período.
        </div>
      </div>
      <div className="footer flex gap-2 justify-end">
        <button className="btn ghost" onClick={onBack}>Voltar</button>
        <button className="btn primary" onClick={onGeneratePdf}>Gerar PDF</button>
      </div>
    </>
  );
}

function ReportsComparativosPanel(props) {
  const {
    years,
    monthOptions,
    cmpRange,
    setCmpRange,
    cmpType,
    setCmpType,
    cmpYear,
    setCmpYear,
    cmpMonth,
    setCmpMonth,
    cmpStartYear,
    setCmpStartYear,
    cmpStartMonth,
    setCmpStartMonth,
    cmpEndYear,
    setCmpEndYear,
    cmpEndMonth,
    setCmpEndMonth,
    cmpContas,
    cmpSel,
    setCmpSel,
    toggleConta,
    onBack,
    onPreview,
    onDownloadPng,
    onDownloadPdf,
    onGenerateMensalPdf,
    onGeneratePeriodoPdf
  } = props;

  return (
    <>
      <div className="content">
        <div className="subpick">
          <h3>Alcance</h3>
          <div className="row">
            <div className="cell" style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch' }}>
              <SelectPopoverField id="cmp-range" label="Tipo" value={cmpRange} onChange={(event) => setCmpRange(event.target.value)}>
                <option value="mes">Mês único</option>
                <option value="periodo">Período</option>
              </SelectPopoverField>
            </div>
          </div>
        </div>

        {cmpRange === 'mes' ? (
          <MonthPickerBlock
            title="Selecione o mês"
            year={cmpYear}
            setYear={setCmpYear}
            month={cmpMonth}
            setMonth={setCmpMonth}
            years={years}
            monthOptions={monthOptions}
            idPrefix="cmp-mes"
          />
        ) : (
          <>
            <MonthPickerBlock
              title="Selecione início"
              year={cmpStartYear}
              setYear={setCmpStartYear}
              month={cmpStartMonth}
              setMonth={setCmpStartMonth}
              years={years}
              monthOptions={monthOptions}
              idPrefix="cmp-inicio"
            />
            <MonthPickerBlock
              title="Selecione final"
              year={cmpEndYear}
              setYear={setCmpEndYear}
              month={cmpEndMonth}
              setMonth={setCmpEndMonth}
              years={years}
              monthOptions={monthOptions}
              idPrefix="cmp-fim"
            />
          </>
        )}

        <div className="subpick">
          <h3>Tipo de gráfico</h3>
          <div className="row">
            <div className="cell" style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch' }}>
              <SelectPopoverField label="Visual" value={cmpType} onChange={(event) => setCmpType(event.target.value)}>
                {cmpRange === 'mes' ? (
                  <>
                    <option value="pizza">Pizza</option>
                    <option value="barras">Barras</option>
                  </>
                ) : null}
                {cmpRange === 'periodo' ? (
                  <>
                    <option value="pizza">Pizza</option>
                    <option value="linhas">Linhas</option>
                  </>
                ) : null}
              </SelectPopoverField>
            </div>
          </div>
        </div>

        <div className="subpick">
          <h3>Contas (seleção múltipla)</h3>

          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setCmpSel(new Set(cmpContas))}
              disabled={cmpContas.length === 0}
              title="Selecionar todas"
            >
              Selecionar todas
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setCmpSel(new Set())}
              disabled={cmpSel.size === 0}
              title="Limpar seleção"
            >
              Limpar seleção
            </button>
          </div>

          {cmpContas.length === 0 ? (
            <div className="text-sm opacity-70">Nenhuma conta encontrada no alcance selecionado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {cmpContas.map((name) => (
                <label
                  key={name}
                  className="card flex items-start gap-3 account-chip"
                  title={name}
                >
                  <input
                    type="checkbox"
                    checked={cmpSel.has(name)}
                    onChange={() => toggleConta(name)}
                    style={{ marginTop: 3 }}
                  />
                  <span className="account-chip__text">{name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm opacity-70" style={{ marginTop: 12 }}>
          (Opcional) visualizar gráfico antes do download.
        </div>
      </div>

      <div className="footer flex flex-wrap gap-2 justify-end">
        <button type="button" className="btn ghost" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={cmpSel.size === 0 || (cmpRange === 'periodo' && cmpType === 'barras')}
          onClick={onPreview}
        >
          Gerar gráfico
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={cmpSel.size === 0}
          onClick={onDownloadPng}
        >
          Baixar PNG
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={cmpSel.size === 0}
          onClick={onDownloadPdf}
        >
          Baixar PDF (todos)
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn"
            onClick={onGenerateMensalPdf}
            title="Gera PDF com Pizza do mês e Barras comparativas (mês anterior e mesmo mês do ano anterior, quando houver dados)."
          >
            Relatório Mensal (PDF)
          </button>

          <button
            type="button"
            className="btn"
            onClick={onGeneratePeriodoPdf}
            title="Gera PDF com gráficos de linha por conta ao longo do período selecionado (2 por página)."
          >
            Relatório Período (PDF)
          </button>
        </div>
      </div>

      {cmpSel.size === 0 ? (
        <div className="text-xs opacity-70 mt-2 text-right">
          Selecione ao menos 1 conta.
        </div>
      ) : null}
    </>
  );
}
