function EditPopup({ data, payers, typeOpts = [], onClose, onSave, onDelete }) {
      const { mode, item: initial } = data;
      // Fecha o modal ao pressionar Esc (desktop apenas)
      React.useEffect(() => {
        const handleKey = (e) => {
          if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
      }, []);
      const [form, setForm] = React.useState(()=>({
        nome: initial.nome || '',
        valor: initial.valor || '',
        data: initial.data || todayISO(),
        instancia: initial.instancia || '',
        quem: initial.quem || '',
        quemOutro: '',
        quemMode: initial.quem && payers.includes(initial.quem) ? 'select' : (initial.quem ? 'outro' : 'select'),
        dividida: !!initial.dividida,
        boleto: initial.links?.boleto || '',
        comp: initial.links?.comp || ''
      }));

      const pristine = React.useMemo(()=>{
        const canonicalQuem = form.quemMode==='outro' ? form.quemOutro : form.quem;
        const a = JSON.stringify({
          nome: initial.nome||'', valor: initial.valor||'', data: initial.data || todayISO(),
          instancia: initial.instancia||'', quem: initial.quem||'', dividida: !!initial.dividida,
          boleto: initial.links?.boleto||'', comp: initial.links?.comp||''
        });
        const b = JSON.stringify({
          nome: form.nome||'', valor: form.valor||'', data: form.data||'',
          instancia: form.instancia||'', quem: canonicalQuem||'', dividida: !!form.dividida,
          boleto: form.boleto||'', comp: form.comp||''
        });
        return a===b;
      }, [form, initial]);
      

      const isQuemValid = form.quemMode==='select' ? !!form.quem : !!form.quemOutro.trim();
      const isNomeValid = !!form.nome.trim();
      const isValorValid = !!form.valor.trim();
      const isFormValid = isQuemValid && isNomeValid && isValorValid;

      function upd(k,v){ setForm(f=>({...f,[k]:v})); }
      const setQuemMode = (mode)=> upd('quemMode', mode);

      function onSubmit(){
        if(!isFormValid) return;
        onSave(mode, initial.id, form); // parent resolve insert/update, fecha e toast
      }
      function onDeleteClick(){
        if(mode!=='edit') return;
        onDelete(initial.id); // parent resolve exclusão
      }


      return (
        <div className="overlay" onClick={onClose}>
          <div className="modal max-w-lg w-full pop" role="dialog" aria-modal="true" aria-labelledby="edit-title" onClick={e=>e.stopPropagation()}>
            <h3 id="edit-title" className="text-lg font-semibold mb-3">{mode==='new' ? 'Nova Conta' : 'Editar Conta'}</h3>
            <form className="space-y-3" onSubmit={e=>e.preventDefault()} onKeyDown={(e)=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey) && isFormValid){ onSubmit(); } }}>
              {/* Tipo de conta: Top10 + “Outro…” */}
              <div>
                <label className="text-sm opacity-80">Tipo de conta</label>

                {/* SELECT sempre aparece primeiro; input só aparece se escolher “Outro…” */}
                <select
                  className="w-full select"
                  value={form.nome || ''}
                  onChange={e=>{
                    const v = e.target.value;
                    if (v === '__outro') {
                      // não escrever “de cara”: zera o nome e mostra o input
                      upd('nome','');
                      // marca um flag leve só para renderizar o input abaixo
                      // (sem criar campo novo no form, para manter o resto intacto)
                      e.target.dataset._outro = '1';
                      const host = e.target.closest('div');
                      const input = host?.querySelector('[data-nome-outro]');
                      if (input) input.style.display = '';
                    } else {
                      // escolheu uma opção do Top10 (ou a opção “(atual)”)
                      upd('nome', v);
                      // esconde o input “Outro”
                      const host = e.target.closest('div');
                      const input = host?.querySelector('[data-nome-outro]');
                      if (input) input.style.display = 'none';
                    }
                  }}
                >
                  <option value="">Selecione…</option>

                  {/* Se estiver editando e o nome atual NÃO estiver no Top10, mostra opção “(atual)” */}
                  {(initial.nome && !COMMON_TYPES.includes(initial.nome)) ? (
                    <option value={initial.nome}>{initial.nome} (atual)</option>
                  ) : null}

                  {(typeOpts.length ? typeOpts : COMMON_TYPES).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}

                  <option value="__outro">Outro…</option>
                </select>

                {/* Mostra aviso se tipo de conta estiver vazio */}
                {!form.nome.trim() && (
                  <div className="text-xs text-red-400 mt-1">Campo obrigatório</div>
                )}


                {/* Input “Outro…” (inicialmente oculto) */}
                <div data-nome-outro style={{display: 'none', marginTop: '8px'}}>
                  <input
                    className="w-full input"
                    placeholder="Digite o tipo de conta"
                    value={form.nome}
                    onChange={e=>upd('nome', e.target.value)}
                  />
                  <div className="text-xs opacity-70 mt-1">Campo obrigatório</div>
                  <button
                    type="button"
                    className="btn ghost mt-2"
                    onClick={(e)=>{
                      // volta ao seletor e esconde o input
                      upd('nome','');
                      const host = e.currentTarget.closest('div[data-nome-outro]');
                      if (host) host.style.display = 'none';
                    }}
                  >
                    Voltar ao seletor
                  </button>
                </div>
              </div>

              {/* ========================== */}
              {/* 💡 Campo: Valor (obrigatório com hint visual) */}
              {/* ========================== */}
              <div>
                <label className="text-sm opacity-80">Valor</label>
                <input
                  className={`w-full input ${!form.valor.trim() ? 'border-red-500' : ''}`}
                  placeholder="R$ 0,00"
                  value={form.valor}
                  onChange={e=>upd('valor', e.target.value)}
                />
                {/* Mostra o aviso “Campo obrigatório” apenas se estiver vazio */}
                {!form.valor.trim() && (
                  <div className="text-xs text-red-400 mt-1">Campo obrigatório</div>
                )}
              </div>

              <div>
                <label className="text-sm opacity-80">Data de pagamento</label>
                <input type="date" className="w-full input" value={form.data} onChange={e=>upd('data', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm opacity-80">Instância</label>
                  <input
                    className="w-full input"
                    placeholder="Digite a instância (opcional)"
                    value={form.instancia}
                    onChange={e => upd('instancia', e.target.value)}
                  />

                </div>
                <div>
                  <label className="text-sm opacity-80">Quem pagou</label>
                  {form.quemMode==='select' ? (
                    <>
                      <select
                        className="w-full select"
                        value={form.quem}
                        onChange={e=>{
                          const v = e.target.value;
                          if (v === '__outro') {
                            upd('quem','');               // limpa o select
                            upd('quemOutro','');          // prepara campo livre
                            setQuemMode('outro');         // ativa modo 'outro'
                          } else {
                            upd('quem', v);
                            upd('quemOutro','');
                            setQuemMode('select');
                          }
                        }}
                      >
                        <option value="">Selecione…</option>
                        {payers.map(p=> <option key={p} value={p}>{p}</option>)}
                        <option value="__outro">Outro…</option>
                      </select>

                    </>
                  ) : (
                    <>
                      <input className="w-full input" placeholder="Digite o pagador" value={form.quemOutro} onChange={e=>upd('quemOutro', e.target.value)} />
                      <div className="text-xs opacity-70 mt-1">Campo obrigatório</div>
                      <button className="btn ghost mt-2" type="button" onClick={()=>{ upd('quem',''); upd('quemOutro',''); setQuemMode('select'); }}>Voltar ao seletor</button>
                    </>
                  )}
                  {/* Mostra aviso se “Quem pagou” estiver vazio */}
                  {!isQuemValid && (
                    <div className="text-xs text-red-400 mt-1">Campo obrigatório</div>
                  )}
                </div>
                                
              </div>

              <div className="flex items-center gap-2">
                <input id="dividida" type="checkbox" checked={form.dividida} onChange={e=>upd('dividida', e.target.checked)} />
                <label htmlFor="dividida">Dividida</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm opacity-80">Link boleto</label>
                  <input className="w-full input" placeholder="https://..." value={form.boleto} onChange={e=>upd('boleto', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm opacity-80">Link comprovante</label>
                  <input className="w-full input" placeholder="https://..." value={form.comp} onChange={e=>upd('comp', e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {!pristine && isFormValid && (
                  <button className="btn primary" type="button" onClick={onSubmit}>Salvar</button>
                )}
                <button className="btn ghost" type="button" onClick={onClose}>Cancelar</button>
                {mode==='edit' && <button className="btn danger" type="button" onClick={onDeleteClick}>Excluir</button>}
              </div>

            </form>
          </div>
        </div>
      );
    }