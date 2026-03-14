function PostLoginToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--glow)',
      }}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm">{toast.msg}</span>
    </div>
  );
}
