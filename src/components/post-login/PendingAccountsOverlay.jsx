function PendingAccountsOverlay(props) {
  const {
    open,
    loading,
    pendingItems,
    getItemKey,
    onClose,
    onLaunchItem
  } = props;

  React.useEffect(() => {
    if (!open) return undefined;

    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay hard">
      <div className="modal solid w-full md:max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <img
            src="./icons/icon-512.png"
            alt="Ícone Controle de Contas"
            width="32"
            height="32"
            className="rounded-full shadow-sm"
          />
          <span>Contas Pendentes</span>
        </h2>

        {pendingItems === null || loading ? (
          <div className="card text-center py-6">Calculando…</div>
        ) : pendingItems.length === 0 ? (
          <div className="card text-center py-6 text-sm opacity-70">
            Nenhuma conta do mês anterior está pendente.
          </div>
        ) : (
          <ul className="space-y-2 mb-4">
            {pendingItems.map((item, index) => (
              <li key={`${getItemKey(item)}-${index}`} className="card flex justify-between items-center">
                <div>
                  <strong>{item.nome}</strong><br />
                  <span className="text-sm opacity-70">
                    {item.instancia ? `${item.instancia} • ` : ''}{item.valor} • {item.data}
                  </span>
                </div>
                <button
                  className="btn primary"
                  onClick={() => onLaunchItem(item)}
                >
                  Lançar agora
                </button>
              </li>
            ))}
          </ul>
        )}

        <button className="btn ghost w-full" onClick={onClose}>Sair</button>
      </div>
    </div>
  );
}
