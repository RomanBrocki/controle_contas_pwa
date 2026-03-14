const {
  brl: dashboardBrl
} = window.DashboardHelpers;

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
