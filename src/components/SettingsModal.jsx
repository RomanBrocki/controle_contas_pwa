function SettingsModal({ onClose, initial, contasDisponiveis, onSave }) {
  const themeCatalog = window.ThemeCatalog;
  const defaultTheme = themeCatalog?.DEFAULT_THEME || 'gunmetal';
  const normalizeTheme = themeCatalog?.normalizeTheme || ((value) => value || defaultTheme);
  const themeOptions = themeCatalog?.THEMES || [
    { id: 'gunmetal', label: 'Gunmetal Neon' },
    { id: 'synth', label: 'Synthwave Teal' },
    { id: 'titanium', label: 'Titanio Azul' },
    { id: 'bronze', label: 'Cobre Industrial' },
    { id: 'alloy', label: 'Aco Neblina' },
    { id: 'light', label: 'Claro Metalico' }
  ];
  const [email, setEmail] = React.useState(initial?.email || '');
  const [theme, setTheme] = React.useState(normalizeTheme(initial?.theme));
  const [chartSel, setChartSel] = React.useState(new Set(initial?.chart_accounts || []));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setEmail(initial?.email || '');
    setTheme(normalizeTheme(initial?.theme));
    setChartSel(new Set(initial?.chart_accounts || []));
  }, [initial]);

  const toggleConta = (nome) => {
    setChartSel((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else if (next.size < 7) next.add(nome);
      return next;
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal glass max-w-2xl w-full pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-semibold">Configuracoes</h3>
          <button className="btn ghost ml-auto" onClick={onClose}>Fechar</button>
        </div>

        <div className="content space-y-4">
          <div>
            <label className="text-sm opacity-80">E-mail</label>
            <input
              className="w-full input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-80">Tema</label>
              <select className="w-full select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {themeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Contas para graficos de barras e linhas nos PDFs (max. 7)</h4>
              <div className="text-xs opacity-70">{chartSel.size}/7</div>
            </div>
            <div className="text-sm opacity-70 mb-2">Usado apenas nos relatorios em PDF. Nao afeta o dashboard.</div>
            {contasDisponiveis.length === 0 ? (
              <div className="text-sm opacity-70">Nenhuma conta encontrada nos ultimos 365 dias.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {contasDisponiveis.map((nome) => (
                  <label key={nome} className="card flex items-center gap-2 account-chip">
                    <input
                      type="checkbox"
                      checked={chartSel.has(nome)}
                      onChange={() => toggleConta(nome)}
                      style={{ marginTop: 3 }}
                    />
                    <span className="account-chip__text">{nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footer flex gap-2 justify-end">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                const savedProfile = await onSave?.({
                  email,
                  theme: normalizeTheme(theme),
                  chart_accounts: Array.from(chartSel)
                });
                if (!savedProfile) throw new Error('Erro ao salvar perfil');
                onClose();
              } catch (error) {
                console.error('[settings] erro ao salvar perfil', error);
                alert('Erro ao salvar perfil');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
