function FaleSozinhoInput({ onSend }) {
  const [txt, setTxt] = React.useState('');
  const ref = React.useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    const value = txt.trim();
    if (!value) return;

    onSend?.(value);
    setTxt('');
    ref.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-3 py-2 flex gap-2">
      <input
        ref={ref}
        value={txt}
        onChange={(event) => setTxt(event.target.value)}
        className="flex-1 input"
        placeholder="Fale…"
        autoFocus
      />
      <button className="btn primary" type="submit">
        ➤
      </button>
    </form>
  );
}

function SelfChatModal(props) {
  const {
    open,
    messages,
    onClose,
    onSend
  } = props;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-end p-4 pointer-events-none"
      onClick={onClose}
    >
      <div
        className="pointer-events-auto w-full max-w-sm bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] flex flex-col max-h-[70vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤬 Fale com tosco</span>
            <span className="text-xs opacity-60">nível de suporte: baixo</span>
          </div>
          <button
            className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 ? (
            <div className="text-sm opacity-60">
              Manda aí… vou responder qualquer coisa
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div key={index} className="space-y-1">
              <div className="text-xs opacity-60">Você</div>
              <div className="bg-white/5 rounded px-3 py-2 text-sm">{message.user}</div>
              <div className="text-xs opacity-60 mt-1">Fale com tosco</div>
              <div className="bg-white/0 rounded px-3 py-2 text-sm">
                {message.bot}
              </div>
            </div>
          ))}
        </div>

        <FaleSozinhoInput onSend={onSend} />
      </div>
    </div>
  );
}
