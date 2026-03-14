const {
  brl: dashboardBrl,
  splitLabel: dashboardSplitLabel
} = window.DashboardHelpers;

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

function DashboardParetoChart(props) {
  const items = props.items || [];
  const useRotatedLabels = items.length > 10;
  const width = Math.max(860, (items.length * 44) + 120);
  const height = useRotatedLabels ? 420 : 388;
  const padLeft = 52;
  const padRight = 56;
  const padTop = 30;
  const padBottom = useRotatedLabels ? 154 : 96;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const slotWidth = innerWidth / Math.max(items.length, 1);
  const barWidth = Math.max(10, Math.min(30, slotWidth - 10));
  const maxValue = Math.max(1, ...items.map((item) => Number(item.total || 0)));
  const selectedItem = items.find((item) => item.name === props.selectedName) || null;
  const detailItem = selectedItem || items[0] || null;
  const eightyIndex = items.findIndex((item) => item.cumulativePct >= 80);
  const labelFontSize = useRotatedLabels
    ? (slotWidth < 34 ? 9 : 10)
    : (slotWidth < 52 ? 10 : 11);
  const labelCharLimit = slotWidth < 34 ? 12 : slotWidth < 48 ? 16 : 20;
  const labelCharsPerLine = slotWidth < 70 ? 10 : slotWidth < 96 ? 12 : 14;
  const labelAnchorY = padTop + innerHeight + (useRotatedLabels ? 78 : 26);

  if (!items.length) {
    return <div className="text-sm opacity-70">Sem categorias suficientes para compor o Pareto.</div>;
  }

  const cumulativeLinePoints = items.map((item, index) => {
    const x = padLeft + (slotWidth * index) + (slotWidth / 2);
    const y = padTop + innerHeight - ((item.cumulativePct / 100) * innerHeight);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="badge flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: 'linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 65%, white 35%))' }} />
          Valor por categoria
        </div>
        <div className="badge flex items-center gap-2">
          <span className="w-5 border-t-2" style={{ borderColor: 'var(--accent)' }} />
          Curva acumulada
        </div>
        {eightyIndex >= 0 ? (
          <div className="badge" data-dash-pareto-eighty="true">
            80% do gasto em {eightyIndex + 1} {eightyIndex === 0 ? 'categoria' : 'categorias'}
          </div>
        ) : null}
        {detailItem ? (
          <div className="badge" data-dash-pareto-selected="true">
            Em foco: {detailItem.name} · {dashboardBrl(detailItem.total)} · {Math.round(detailItem.sharePct)}% do período
          </div>
        ) : null}
      </div>

      <div className="w-full overflow-hidden pb-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full rounded-2xl"
          style={{ height: `${height}px` }}
          role="img"
          aria-label={props.ariaLabel || 'Gráfico de Pareto do período filtrado'}
        >
          <title>{props.ariaLabel || 'Gráfico de Pareto do período filtrado'}</title>

          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = padTop + innerHeight - (innerHeight * step);
            return (
              <line
                key={`grid-${step}`}
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity={step === 0 ? '1' : '0.7'}
              />
            );
          })}

          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={cumulativeLinePoints}
          >
            <title>Curva acumulada do período filtrado.</title>
          </polyline>

          {items.map((item, index) => {
            const value = Number(item.total || 0);
            const barHeight = Math.max((value / maxValue) * innerHeight, 6);
            const x = padLeft + (slotWidth * index) + ((slotWidth - barWidth) / 2);
            const y = padTop + innerHeight - barHeight;
            const pointX = padLeft + (slotWidth * index) + (slotWidth / 2);
            const pointY = padTop + innerHeight - ((item.cumulativePct / 100) * innerHeight);
            const selected = props.selectedName === item.name;
            const labelText = item.name.length > labelCharLimit
              ? `${item.name.slice(0, labelCharLimit - 1)}…`
              : item.name;
            const labelLines = dashboardSplitLabel(item.name, labelCharsPerLine, 2);

            return (
              <g key={item.name}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={selected ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 55%, var(--surface))'}
                  stroke={selected ? 'white' : 'none'}
                  strokeWidth={selected ? '1.5' : '0'}
                  style={{ cursor: 'pointer', filter: selected ? 'drop-shadow(0 0 10px rgba(34,211,238,.25))' : 'none' }}
                  onClick={() => props.onSelect && props.onSelect(item.name)}
                  data-dash-pareto-bar={item.name}
                >
                  <title>{`${item.name}: ${dashboardBrl(item.total)} (${Math.round(item.sharePct)}% do período)`}</title>
                </rect>
                <circle
                  cx={pointX}
                  cy={pointY}
                  r={selected ? '5.5' : '4'}
                  fill="var(--accent)"
                  stroke={selected ? 'white' : 'none'}
                  strokeWidth={selected ? '1.5' : '0'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => props.onSelect && props.onSelect(item.name)}
                  data-dash-pareto-point={item.name}
                >
                  <title>{`${item.name}: acumulado de ${Math.round(item.cumulativePct)}%`}</title>
                </circle>
                {useRotatedLabels ? (
                  <text
                    x={pointX}
                    y={labelAnchorY}
                    textAnchor="end"
                    fill={selected ? 'var(--text)' : 'var(--muted)'}
                    fontSize={labelFontSize}
                    transform={`rotate(-45 ${pointX} ${labelAnchorY})`}
                  >
                    {labelText}
                  </text>
                ) : (
                  <text
                    x={pointX}
                    y={labelAnchorY}
                    textAnchor="middle"
                    fill={selected ? 'var(--text)' : 'var(--muted)'}
                    fontSize={labelFontSize}
                  >
                    {labelLines.map((line, lineIndex) => (
                      <tspan key={`${item.name}-line-${lineIndex}`} x={pointX} dy={lineIndex === 0 ? '0' : '12'}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}

          <text x={padLeft - 8} y={padTop + 10} textAnchor="end" fill="var(--muted)" fontSize="11">
            {dashboardBrl(maxValue)}
          </text>
          <text x={padLeft - 8} y={padTop + innerHeight + 4} textAnchor="end" fill="var(--muted)" fontSize="11">
            R$ 0
          </text>
          <text x={width - padRight + 10} y={padTop + 10} textAnchor="start" fill="var(--muted)" fontSize="11">
            100%
          </text>
          <text x={width - padRight + 10} y={padTop + innerHeight + 4} textAnchor="start" fill="var(--muted)" fontSize="11">
            0%
          </text>
        </svg>
      </div>
    </div>
  );
}
