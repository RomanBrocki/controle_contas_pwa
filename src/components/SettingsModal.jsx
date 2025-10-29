function SettingsModal({ onClose, initial, contasDisponiveis, onSaved }) {
  const [email, setEmail] = React.useState(initial?.email || '');
  const [theme, setTheme] = React.useState(initial?.theme || 'gunmetal');
  const [chartSel, setChartSel] = React.useState(new Set(initial?.chart_accounts || []));
    // sincroniza quando o modal abre/reabre ou quando o perfil chegar do DB
    React.useEffect(() => {
        setEmail(initial?.email || '');
        setTheme(initial?.theme || 'gunmetal');
        setChartSel(new Set(initial?.chart_accounts || []));
        }, [initial]);

  const toggleConta = (nome) => {
    setChartSel(prev => {
      const n = new Set(prev);
      if (n.has(nome)) n.delete(nome); else if (n.size < 7) n.add(nome);
      return n;
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal glass max-w-2xl w-full pop" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-semibold">Configurações</h3>
          <button className="btn ghost ml-auto" onClick={onClose}>Fechar</button>
        </div>

        <div className="content space-y-4">
          <div>
            <label className="text-sm opacity-80">E-mail</label>
            <input className="w-full input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-80">Tema</label>
              <select className="w-full select" value={theme} onChange={e=>setTheme(e.target.value)}>
                <option value="gunmetal">Gunmetal Neon</option>
                <option value="synth">Synthwave Teal</option>
                <option value="light">Claro Metálico</option>
              </select>
            </div>

            
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Contas para gráficos (máx. 7)</h4>
              <div className="text-xs opacity-70">{chartSel.size}/7</div>
            </div>
            {contasDisponiveis.length===0 ? (
              <div className="text-sm opacity-70">Nenhuma conta encontrada nos últimos 365 dias.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {contasDisponiveis.map(nome => (
                  <label key={nome} className="card flex items-center gap-2 account-chip">
                    <input
                      type="checkbox"
                      checked={chartSel.has(nome)}
                      onChange={()=>toggleConta(nome)}
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
            onClick={async ()=>{
              const ok = await window.SupabaseQueries.upsertProfile({
                email,
                theme,
                chart_accounts: Array.from(chartSel)
              });
              if (!ok) return alert('Erro ao salvar perfil');
              onSaved({ email, theme, chart_accounts: Array.from(chartSel) });
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
