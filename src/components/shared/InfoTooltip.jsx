function HomeInfoTooltip({ content, testId, align = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className="h-7 w-7 rounded-full border text-xs font-semibold"
        style={{ borderColor: 'var(--border)', background: 'var(--chip)', color: 'var(--text)' }}
        onClick={() => setOpen((prev) => !prev)}
        data-home-tooltip-button={testId}
        aria-label="Mais informações"
        aria-expanded={open}
      >
        i
      </button>
      {open ? (
        <div
          className={`absolute top-full z-40 mt-2 rounded-2xl border p-3 text-sm leading-relaxed ${align === 'left' ? 'left-0' : 'right-0'}`}
          style={{
            width: 'min(20rem, calc(100vw - 2rem))',
            borderColor: 'var(--border)',
            background: 'color-mix(in srgb, var(--surface) 96%, black 4%)',
            boxShadow: '0 10px 30px rgba(0,0,0,.32)'
          }}
          data-home-tooltip={testId}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
