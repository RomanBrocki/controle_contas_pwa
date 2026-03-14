function DashboardMetricCard(props) {
  return (
    <div
      className="card flex flex-col gap-2 min-h-[132px]"
      style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, white 6%), var(--surface))' }}
      data-dash-card={props.testId}
      title={props.tooltip || props.detail || `${props.label}: ${props.value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm uppercase tracking-[0.16em] opacity-60">{props.label}</div>
        {props.tooltip ? <DashboardInfoTooltip content={props.tooltip} testId={`card-${props.testId}`} /> : null}
      </div>
      <div className="text-2xl md:text-3xl font-semibold" style={{ textShadow: 'var(--glow)' }}>{props.value}</div>
      {props.detail ? <div className="text-sm opacity-70">{props.detail}</div> : null}
    </div>
  );
}

function DashboardSection(props) {
  return (
    <section
      className="card space-y-4"
      style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 95%, white 5%), var(--surface))' }}
      data-dash-section={props.testId}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="text-lg font-semibold">{props.title}</h3>
            {props.subtitle ? <div className="text-sm opacity-70">{props.subtitle}</div> : null}
          </div>
          {props.tooltip ? <DashboardInfoTooltip content={props.tooltip} testId={`section-${props.testId}`} /> : null}
        </div>
        {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}
