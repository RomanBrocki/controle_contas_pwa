const {
  brl: dashboardBrl
} = window.DashboardHelpers;

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
        {items.map((item) => {
          const itemMaxValue = Math.max(
            1,
            Number(item.current || 0),
            Number(item.previous || 0),
            Number(item.previousYear || 0)
          );

          return (
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
            </button>
          );
        })}
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
