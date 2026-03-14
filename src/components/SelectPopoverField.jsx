function selectPopoverNormalizeLabel(content) {
  if (content == null) return '';
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  if (Array.isArray(content)) return content.map(selectPopoverNormalizeLabel).join('');
  return '';
}

function selectPopoverNormalizeOptions(options, children) {
  if (Array.isArray(options) && options.length) {
    return options.map((option) => ({
      value: option.value,
      label: selectPopoverNormalizeLabel(option.label ?? option.value),
    }));
  }

  return React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => ({
      value: child.props.value,
      label: selectPopoverNormalizeLabel(child.props.children),
    }));
}

function SelectPopoverField(props) {
  const {
    id,
    label,
    value,
    onChange,
    onChangeValue,
    children,
    options,
    wrapperClassName = '',
    buttonClassName = '',
    panelWidth = '100%',
    maxPanelHeight = 280,
    placeholder = 'Selecione',
    emptyLabel = 'Nenhuma opcao disponivel.',
    disabled = false,
    allowCustomValue = false,
    customInputPlaceholder = 'Digite um valor',
    customInputButtonLabel = 'Usar valor',
    customInputMaxLength,
    customValueParser,
  } = props;

  const rootRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [customDraft, setCustomDraft] = React.useState('');
  const [panelLayout, setPanelLayout] = React.useState(null);

  const normalizedOptions = React.useMemo(
    () => selectPopoverNormalizeOptions(options, children),
    [options, children]
  );

  const selectedOption = React.useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)) || null,
    [normalizedOptions, value]
  );

  const parsedCustomValue = React.useMemo(() => {
    if (!allowCustomValue) return null;
    const parser = typeof customValueParser === 'function'
      ? customValueParser
      : (raw) => {
          const trimmed = String(raw || '').trim();
          return trimmed ? trimmed : null;
        };
    return parser(customDraft);
  }, [allowCustomValue, customDraft, customValueParser]);

  const canCommitCustomValue = React.useMemo(() => {
    if (parsedCustomValue == null || parsedCustomValue === '') return false;
    return String(parsedCustomValue) !== String(value);
  }, [parsedCustomValue, value]);

  React.useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) return;
    setCustomDraft('');
    setPanelLayout(null);
  }, [open]);

  React.useLayoutEffect(() => {
    if (!open) return undefined;

    function updatePanelLayout() {
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;

      const buttonRect = button.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportMargin = 16;
      const panelGap = 8;
      const requestedMaxHeight = Number.isFinite(Number(maxPanelHeight))
        ? Number(maxPanelHeight)
        : 280;
      const minUsableHeight = 180;
      const resolvedWidth = panelWidth === '100%'
        ? Math.round(buttonRect.width)
        : panelWidth;
      const measuredWidth = panelWidth === '100%'
        ? Math.round(buttonRect.width)
        : (panelRect.width || buttonRect.width);

      let left = buttonRect.left;
      if (left + measuredWidth > viewportWidth - viewportMargin) {
        left = viewportWidth - viewportMargin - measuredWidth;
      }
      left = Math.max(viewportMargin, left);

      const spaceBelow = viewportHeight - buttonRect.bottom - viewportMargin - panelGap;
      const spaceAbove = buttonRect.top - viewportMargin - panelGap;
      const shouldOpenUpward = (
        spaceBelow < Math.min(requestedMaxHeight, minUsableHeight)
        && spaceAbove > spaceBelow
      );
      const usableHeight = Math.max(
        minUsableHeight,
        Math.min(requestedMaxHeight, shouldOpenUpward ? spaceAbove : spaceBelow)
      );

      let top = buttonRect.bottom + panelGap;
      if (shouldOpenUpward) {
        top = Math.max(viewportMargin, buttonRect.top - panelRect.height - panelGap);
      } else if (top + panelRect.height > viewportHeight - viewportMargin) {
        top = Math.max(viewportMargin, viewportHeight - viewportMargin - panelRect.height);
      }

      setPanelLayout({
        left,
        top,
        width: resolvedWidth,
        maxHeight: usableHeight,
      });
    }

    function handleViewportResize() {
      updatePanelLayout();
    }

    function handleViewportScroll(event) {
      if (panelRef.current?.contains(event.target)) return;
      updatePanelLayout();
    }

    updatePanelLayout();
    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('scroll', handleViewportScroll, true);

    return () => {
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('scroll', handleViewportScroll, true);
    };
  }, [open, panelWidth, maxPanelHeight, normalizedOptions.length, allowCustomValue, canCommitCustomValue]);

  function commit(nextValue) {
    onChange?.({ target: { value: nextValue }, currentTarget: { value: nextValue } });
    onChangeValue?.(nextValue);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  const selectedLabel = selectedOption?.label || (value != null && value !== '' ? String(value) : placeholder);

  const panelNode = open ? (
    <div
      ref={panelRef}
      id={id ? `${id}-panel` : undefined}
      className="rounded-2xl border p-2"
      style={{
        position: 'fixed',
        zIndex: 2147483647,
        left: panelLayout?.left ?? 16,
        top: panelLayout?.top ?? 16,
        width: panelLayout?.width ?? panelWidth,
        maxWidth: 'calc(100vw - 2rem)',
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--surface) 97%, black 3%)',
        boxShadow: '0 16px 48px rgba(0,0,0,.38)',
        visibility: panelLayout ? 'visible' : 'hidden',
      }}
      role="listbox"
      aria-labelledby={id}
    >
      {allowCustomValue ? (
        <div className="mb-2 space-y-2 border-b border-[var(--border)] pb-2">
          <input
            type="text"
            value={customDraft}
            onChange={(event) => setCustomDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canCommitCustomValue) {
                event.preventDefault();
                commit(parsedCustomValue);
              }
            }}
            placeholder={customInputPlaceholder}
            className="input w-full"
            inputMode="numeric"
            maxLength={customInputMaxLength}
          />
          {canCommitCustomValue ? (
            <button
              type="button"
              className="btn primary w-full"
              onClick={() => commit(parsedCustomValue)}
            >
              {typeof customInputButtonLabel === 'function'
                ? customInputButtonLabel(parsedCustomValue)
                : customInputButtonLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div style={{ maxHeight: panelLayout?.maxHeight ?? maxPanelHeight, overflow: 'auto', paddingRight: 4 }}>
        {normalizedOptions.length ? normalizedOptions.map((option) => {
          const selected = String(option.value) === String(value);
          return (
            <button
              key={`${id || 'popover'}-${String(option.value)}`}
              type="button"
              className="mb-2 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors last:mb-0"
              style={{
                borderColor: selected
                  ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
                  : 'var(--border)',
                background: selected
                  ? 'color-mix(in srgb, var(--primary) 16%, var(--surface))'
                  : 'color-mix(in srgb, var(--surface) 88%, black 12%)',
              }}
              onClick={() => commit(option.value)}
              role="option"
              aria-selected={selected}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-[4px] border text-[11px]"
                style={{
                  borderColor: selected
                    ? 'color-mix(in srgb, var(--primary) 60%, var(--border))'
                    : 'var(--border)',
                  background: selected
                    ? 'color-mix(in srgb, var(--primary) 18%, var(--surface))'
                    : 'color-mix(in srgb, var(--surface) 88%, black 12%)',
                  color: selected ? 'var(--primary)' : 'transparent',
                }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3.5 8.5l2.5 2.5 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm leading-5 flex-1">{option.label}</span>
            </button>
          );
        }) : (
          <div className="px-3 py-2 text-sm opacity-70">{emptyLabel}</div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${wrapperClassName}`.trim()}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${buttonClassName}`.trim()}
        style={{
          borderColor: open
            ? 'color-mix(in srgb, var(--primary) 55%, var(--border))'
            : 'var(--border)',
          background: open
            ? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
            : 'color-mix(in srgb, var(--surface) 88%, black 12%)',
          opacity: disabled ? 0.65 : 1,
        }}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-panel` : undefined}
        disabled={disabled}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {label ? (
              <div className="text-[11px] uppercase tracking-[0.16em] opacity-60">{label}</div>
            ) : null}
            <div className="mt-1 font-medium truncate">{selectedLabel}</div>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{
              borderColor: open
                ? 'color-mix(in srgb, var(--primary) 45%, var(--border))'
                : 'var(--border)',
              background: open
                ? 'color-mix(in srgb, var(--primary) 12%, var(--surface))'
                : 'color-mix(in srgb, var(--surface) 92%, black 8%)',
              color: open ? 'var(--primary)' : 'var(--muted)',
            }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5.5 7.5L10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {panelNode ? ReactDOM.createPortal(panelNode, document.body) : null}
    </div>
  );
}

window.SelectPopoverField = SelectPopoverField;
