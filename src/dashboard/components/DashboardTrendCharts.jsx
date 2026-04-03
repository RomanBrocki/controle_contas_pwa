const {
  brl: dashboardBrl
} = window.DashboardHelpers;

function dashboardFormatDeltaLabel(deltaPct, compareValue) {
  if (compareValue <= 0 || deltaPct == null) return 'Sem base no ano anterior';
  const rounded = Math.round(deltaPct);
  if (rounded === 0) return 'Estável vs ano anterior';
  return `${rounded > 0 ? '+' : ''}${rounded}% vs ano anterior`;
}

function dashboardDeltaTone(deltaPct, compareValue) {
  if (compareValue <= 0 || deltaPct == null) {
    return {
      borderColor: 'var(--border)',
      background: 'color-mix(in srgb, var(--surface) 88%, black 12%)'
    };
  }

  if (deltaPct > 0) {
    return {
      borderColor: 'rgba(248, 113, 113, 0.34)',
      background: 'rgba(127, 29, 29, 0.16)'
    };
  }

  if (deltaPct < 0) {
    return {
      borderColor: 'rgba(52, 211, 153, 0.34)',
      background: 'rgba(6, 95, 70, 0.16)'
    };
  }

  return {
    borderColor: 'rgba(251, 191, 36, 0.32)',
    background: 'rgba(120, 53, 15, 0.16)'
  };
}

function dashboardCompactBrl(value) {
  const amount = Number(value || 0);
  const abs = Math.abs(amount);
  const signal = amount < 0 ? '-' : '';

  if (abs >= 1000000) {
    return `${signal}R$ ${(abs / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: abs >= 10000000 ? 0 : 1 })} mi`;
  }

  if (abs >= 1000) {
    return `${signal}R$ ${(abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: abs >= 10000 ? 0 : 1 })} mil`;
  }

  return `${signal}${dashboardBrl(abs).replace(',00', '')}`;
}

function dashboardMedianValue(values) {
  const ordered = (values || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (!ordered.length) return 0;
  const middleIndex = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return ordered[middleIndex];
  return (ordered[middleIndex - 1] + ordered[middleIndex]) / 2;
}

function dashboardOrdinal(value) {
  const number = Math.max(1, Number(value || 1));
  return `${number}º`;
}

function dashboardOrdinalLabel(value) {
  const number = Math.max(1, Number(value || 1));
  return `${number}\u00BA`;
}

function DashboardMonthlyCycleBars(props) {
  const sourcePoints = props.points || [];
  const [activePointKey, setActivePointKey] = React.useState('');
  const [viewportWidth, setViewportWidth] = React.useState(() => (
    typeof window === 'undefined' ? 1280 : (window.innerWidth || 1280)
  ));
  const isMobileViewport = viewportWidth < 640;
  const isMobileLimited = isMobileViewport && sourcePoints.length > 13;
  const points = React.useMemo(
    () => (isMobileLimited ? sourcePoints.slice(-13) : sourcePoints),
    [sourcePoints, isMobileLimited]
  );
  const averageValue = React.useMemo(() => {
    if (!points.length) return 0;
    if (!isMobileLimited) return Number(props.averageValue || 0);
    return points.reduce((sum, point) => sum + Number(point.value || 0), 0) / points.length;
  }, [points, isMobileLimited, props.averageValue]);
  const medianValue = React.useMemo(() => {
    if (!points.length) return 0;
    if (!isMobileLimited) return Number(props.medianValue || 0);
    return dashboardMedianValue(points.map((point) => Number(point.value || 0)));
  }, [points, isMobileLimited, props.medianValue]);
  const maxValue = Math.max(1, averageValue, medianValue, ...points.map((point) => Number(point.value || 0)));

  React.useEffect(() => {
    if (!points.length) {
      setActivePointKey('');
      return;
    }

    if (activePointKey && !points.some((point) => point.key === activePointKey)) {
      setActivePointKey('');
    }
  }, [points, activePointKey]);

  React.useEffect(() => {
    if (!activePointKey) return undefined;

    function closeTooltip() {
      setActivePointKey('');
    }

    window.addEventListener('scroll', closeTooltip, { passive: true });
    window.addEventListener('hashchange', closeTooltip);

    return () => {
      window.removeEventListener('scroll', closeTooltip);
      window.removeEventListener('hashchange', closeTooltip);
    };
  }, [activePointKey]);

  React.useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth || 1280);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const activePoint = points.find((point) => point.key === activePointKey) || null;
  const activeIndex = Math.max(points.findIndex((point) => point.key === activePoint?.key), 0);
  const tooltipAnchor = points.length ? `${((activeIndex + 0.5) / points.length) * 100}%` : '50%';
  const averageBottom = `${(averageValue / maxValue) * 100}%`;
  const activeTone = dashboardDeltaTone(activePoint?.deltaPct, activePoint?.compareValue || 0);
  const pointsSortedByValue = React.useMemo(
    () => [...points].sort((left, right) => Number(right.value || 0) - Number(left.value || 0)),
    [points]
  );
  const activeCycleRank = activePoint
    ? (pointsSortedByValue.findIndex((point) => point.key === activePoint.key) + 1)
    : 0;
  const positionCardDetailScope = props.positionCardDetailScope || `do ${props.periodLabel || 'ciclo'}`;
  const denseSeries = points.length > 16;
  const veryDenseSeries = points.length > 24;
  const chartColumnsStyle = { gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` };
  const barMaxWidth = veryDenseSeries ? 18 : denseSeries ? 24 : points.length > 13 ? 28 : 34;
  const valueLabelMaxWidth = veryDenseSeries ? '36px' : denseSeries ? '44px' : points.length > 13 ? '54px' : '68px';
  const xLabelAngle = React.useMemo(() => {
    if (isMobileViewport) return 90;
    if (points.length <= 12) return 0;
    const progress = Math.min((points.length - 12) / 12, 1);
    return Math.round(progress * 90);
  }, [isMobileViewport, points.length]);
  const xLabelSlotHeight = 18 + Math.round((xLabelAngle / 90) * 58);
  const averageLinePaint = 'repeating-linear-gradient(to right, color-mix(in srgb, var(--accent) 52%, white 48%) 0 7px, transparent 7px 27px)';

  function tooltipPositionStyle() {
    if (activeIndex <= 1) {
      return { left: '0%', transform: 'translateX(0)' };
    }
    if (activeIndex >= points.length - 2) {
      return { left: '100%', transform: 'translateX(-100%)' };
    }
    return { left: tooltipAnchor, transform: 'translateX(-50%)' };
  }

  function handleBarToggle(pointKey) {
    setActivePointKey((currentKey) => (currentKey === pointKey ? '' : pointKey));
  }

  if (!points.length) {
    return <div className="text-sm opacity-70">Sem dados suficientes para montar este gráfico.</div>;
  }

  return (
    <div className="space-y-4" onMouseLeave={() => setActivePointKey('')}>
      <div className="flex flex-wrap gap-2">
        <div className="badge flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--primary)' }} />
          {props.primaryLabel || 'Ciclo anual'}
        </div>
        {averageValue > 0 ? (
          <div className="badge flex items-center gap-2" data-dash-cycle-average="true">
            <span className="inline-block w-6" style={{ height: '1px', background: 'color-mix(in srgb, var(--accent) 50%, white 50%)', opacity: 0.78 }} />
            {(props.averageLabel || 'Média do ciclo')}: {dashboardBrl(averageValue)}
          </div>
        ) : null}
        {medianValue > 0 ? (
          <div className="badge" data-dash-cycle-median="true">
            {(props.medianLabel || 'Mediana do ciclo')}: {dashboardBrl(medianValue)}
          </div>
        ) : null}
        {activePoint ? (
          <div className="badge" data-dash-cycle-selected="true">
            Destaque: {activePoint.labelLong} - {dashboardBrl(activePoint.value)}
          </div>
        ) : null}
      </div>
      <div
        className="relative overflow-visible rounded-2xl border px-3 pb-4 pt-3"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 90%, black 10%)'
        }}
      >
        <div className="relative min-h-[132px] px-1 pb-4">
          {activePoint ? (
            <div
              className="absolute top-0 z-20 w-[min(240px,calc(100%-8px))] rounded-lg border p-1.5 shadow-sm"
              style={{
                ...tooltipPositionStyle(),
                borderColor: activeTone.borderColor,
                background: 'color-mix(in srgb, var(--bg) 82%, var(--surface) 18%)'
              }}
              data-dash-cycle-tooltip={activePoint.label}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-1 text-center">
                  <div className="text-[9px] uppercase tracking-[0.14em] opacity-60">{activePoint.labelLong}</div>
                  <div
                    className="rounded-full border px-1 py-0.5 text-[8px] font-medium opacity-75"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {`${dashboardOrdinalLabel(activeCycleRank)} mês com maior gasto ${positionCardDetailScope}`}
                  </div>
                </div>
                <div className="text-center text-[15px] font-semibold">{dashboardBrl(activePoint.value)}</div>
              </div>

              <div className="mt-1.5 rounded-md border px-2 py-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[9px] uppercase tracking-[0.14em] opacity-60">Mesmo mês no ano anterior</div>
                <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px]">
                  <div className="font-medium">{activePoint.compareLabel}</div>
                  <div className="shrink-0 opacity-75">{dashboardBrl(activePoint.compareValue)}</div>
                </div>
                {activePoint.compareTopAccount ? (
                  <div className="mt-1 text-[10px] leading-4 opacity-75">
                    Maior conta daquele mês:{' '}
                    <span className="font-medium">{activePoint.compareTopAccount.name}</span>
                    {' · '}
                    {dashboardBrl(activePoint.compareTopAccount.total)}
                  </div>
                ) : null}
              </div>

              <div className="mt-1.5 rounded-md border px-2 py-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[9px] uppercase tracking-[0.14em] opacity-60">Top 5 contas do mês</div>
                {activePoint.topAccounts.length ? (
                  <div className="mt-1 space-y-0.5">
                    {activePoint.topAccounts.map((item, index) => (
                      <div key={`${activePoint.key}-${item.name}`} className="flex items-center justify-between gap-1.5 text-[11px]">
                        <span className="truncate">{`${index + 1}. ${item.name}`}</span>
                        <span className="shrink-0 opacity-75">{dashboardBrl(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] opacity-70">Sem contas pagas neste mês.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-2 pb-3 pt-2">
          <div className="relative h-[216px]">
            {[0, 0.25, 0.5, 0.75, 1].map((step) => (
              <div
                key={step}
                className="pointer-events-none absolute left-0 right-0 border-t"
                style={{
                  bottom: `${step * 100}%`,
                  borderColor: 'color-mix(in srgb, var(--border) 92%, transparent)'
                }}
              />
            ))}

            {averageValue > 0 ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10"
                style={{
                  bottom: averageBottom,
                  height: '1px',
                  backgroundImage: averageLinePaint,
                  opacity: 0.62
                }}
              />
            ) : null}

            <div
              className={`relative grid h-full items-end ${denseSeries ? 'gap-1' : 'gap-2'}`}
              style={chartColumnsStyle}
            >
              {points.map((point) => {
                const barHeight = point.value > 0
                  ? Math.max((Number(point.value || 0) / maxValue) * 100, 5)
                  : 0;
                const selected = point.key === activePoint?.key;
                const titleParts = [
                  `${point.labelLong}: ${dashboardBrl(point.value)}`,
                  `Mesmo mês do ano anterior (${point.compareLabel}): ${dashboardBrl(point.compareValue)}`,
                  dashboardFormatDeltaLabel(point.deltaPct, point.compareValue),
                  ...point.topAccounts.map((item, index) => `${index + 1}. ${item.name}: ${dashboardBrl(item.total)}`)
                ];
                const valueLabel = dashboardCompactBrl(point.value);

                return (
                  <button
                    key={point.key}
                    type="button"
                    className="group flex h-full min-w-0 items-end justify-center"
                    aria-label={titleParts.join('. ')}
                    onClick={() => handleBarToggle(point.key)}
                    data-dash-cycle-bar={point.label}
                  >
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div
                        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-center leading-tight ${denseSeries ? 'text-[9px]' : 'text-[10px]'} ${selected ? 'font-semibold' : 'opacity-70'}`}
                        style={{
                          bottom: `${Math.min(barHeight + 4, 98)}%`,
                          width: 'max-content',
                          maxWidth: valueLabelMaxWidth
                        }}
                      >
                        {valueLabel}
                      </div>
                      <div
                        className="w-full transition-all"
                        style={{
                          maxWidth: `${barMaxWidth}px`,
                          height: `${barHeight}%`,
                          background: selected
                            ? 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 78%, white 22%), var(--primary))'
                            : point.isCurrentPeriod
                              ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 72%, white 28%), var(--accent))'
                              : 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 45%, white 18%), color-mix(in srgb, var(--primary) 82%, var(--surface)))',
                          boxShadow: selected ? '0 0 18px rgba(34, 211, 238, 0.22)' : 'none',
                          opacity: selected || point.isCurrentPeriod ? 1 : 0.82,
                          borderRadius: 0
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mt-3 grid overflow-visible ${denseSeries ? 'gap-1' : 'gap-2'}`} style={chartColumnsStyle}>
            {points.map((point) => {
              const selected = point.key === activePoint?.key;
              const rotated = xLabelAngle > 0;
              return (
                <div
                  key={`${point.key}-label`}
                  className={`flex justify-center overflow-visible ${rotated ? 'items-center' : 'items-start'}`}
                  style={{ minHeight: `${xLabelSlotHeight}px` }}
                >
                  <span
                    className={`inline-block text-center ${denseSeries ? 'text-[10px]' : 'text-[11px]'} whitespace-nowrap ${selected ? 'font-semibold' : 'opacity-70'}`}
                    style={{
                      transform: rotated ? `rotate(-${xLabelAngle}deg)` : 'none',
                      transformOrigin: rotated ? 'center center' : 'top center',
                      lineHeight: 1.05
                    }}
                  >
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
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
  const averageValue = Number(props.averageValue || 0);
  const maxValue = Math.max(1, averageValue, ...points.map((point) => point.value), ...comparePoints.map((point) => point.value));
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
  const averageY = padTop + innerHeight - ((averageValue / maxValue) * innerHeight);

  if (!points.length) {
    return <div className="text-sm opacity-70">{'Sem dados suficientes para o gr\u00e1fico.'}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="badge flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--primary)' }} />
          {props.primaryLabel || '\u00daltimos 12 meses'}
        </div>
        {comparePoints.length ? (
          <div className="badge flex items-center gap-2">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--muted)' }} />
            {props.compareLabel || 'Mesmo per\u00edodo no ano anterior'}
          </div>
        ) : null}
        {averageValue > 0 ? (
          <div className="badge flex items-center gap-2" data-dash-average-badge="true">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--accent)' }} />
            {(props.averageLabel || 'M\u00e9dia')}: {dashboardBrl(averageValue)}
          </div>
        ) : null}
        {selectedPoint ? (
          <div className="badge" data-dash-point-selected="true">
            Destaque: {selectedPoint.label} - {dashboardBrl(selectedPoint.value)}
          </div>
        ) : null}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl" role="img" aria-label={props.ariaLabel || 'Gr\u00e1fico de evolu\u00e7\u00e3o'}>
        <title>{props.ariaLabel || 'Gr\u00e1fico de evolu\u00e7\u00e3o'}</title>
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
        {averageValue > 0 ? (
          <line
            x1={padX}
            x2={width - padX}
            y1={averageY}
            y2={averageY}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            opacity="0.95"
          >
            <title>{`${props.averageLabel || 'M\u00e9dia'}: ${dashboardBrl(averageValue)}`}</title>
          </line>
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
        const groupTotal = group.points.reduce((sum, point) => sum + Number(point.value || 0), 0);

        return (
          <div
            key={group.name}
            className="w-full text-left card"
            title={`${group.name}: total do ciclo ${dashboardBrl(groupTotal)}.`}
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
                  <span className="text-[11px] opacity-60">{`Escala da conta \u00b7 pico ${dashboardBrl(groupMaxValue)}`}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[10px] uppercase tracking-[0.14em] opacity-50">Total do ciclo</span>
                  <span className="block text-xs opacity-70">{dashboardBrl(groupTotal)}</span>
                </div>
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
