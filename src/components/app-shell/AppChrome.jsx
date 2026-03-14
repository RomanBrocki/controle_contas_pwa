function AppChrome({ currentSection, onLogout }) {
  const isDashboard = currentSection === 'dashboard';

  return (
    <div className="w-full flex items-center justify-between gap-2 px-4 py-2">
      <button
        onClick={() => window.AppShellRuntime.emitUiEvent('open-self-chat')}
        className="text-sm px-3 py-1 rounded bg-slate-500/40 hover:bg-slate-500/70 text-white"
      >
        {'\ud83e\udd2c Fale com tosco'}
      </button>

      {!isDashboard ? (
        <button
          onClick={() => window.AppShellRuntime.emitUiEvent('open-reminder-manual')}
          className="text-sm px-3 py-1 rounded bg-slate-500/40 hover:bg-slate-500/70 text-white"
        >
          {'\ud83d\udd14 Pend\u00eancias'}
        </button>
      ) : null}

      <button
        onClick={onLogout}
        className="text-sm px-3 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
      >
        Sair
      </button>
    </div>
  );
}
