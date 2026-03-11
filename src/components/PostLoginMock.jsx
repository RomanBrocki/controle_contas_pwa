function ChevronSelectField(props) {
      const {
        id,
        label,
        value,
        onChange,
        children,
        wrapperClassName = '',
        selectClassName = '',
        labelClassName = 'text-sm opacity-70'
      } = props;

      return (
        <label className={`flex min-w-0 flex-col gap-1 ${wrapperClassName}`.trim()}>
          {label ? <span className={labelClassName}>{label}</span> : null}
          <div className="select-shell">
            <select
              id={id}
              className={`select select-shell__input ${selectClassName}`.trim()}
              value={value}
              onChange={onChange}
            >
              {children}
            </select>
            <div className="select-shell__icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5.5 7.5L10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </label>
      );
    }

function parseEditableYear(raw) {
      const digits = String(raw || '').replace(/[^\d]/g, '').slice(0, 4);
      if (digits.length !== 4) return null;
      const year = Number(digits);
      if (!Number.isFinite(year) || year < 1900 || year > 9999) return null;
      return year;
    }

function renderYearOptions(years, selectedYear) {
      return Array.from(
        new Set(
          [...(Array.isArray(years) ? years : []), new Date().getFullYear(), Number(selectedYear)]
            .map((year) => Number(year))
            .filter((year) => Number.isFinite(year) && year > 0)
        )
      )
        .sort((a, b) => a - b)
        .map((year) => (
          <option key={year} value={year}>{year}</option>
        ));
    }

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

function LegacyMonthPickerBlock({
      title,
      year, setYear,
      month, setMonth,
      years,
      monthOptions,
      idPrefix
    }) {
      return (
        <div className="subpick">
          <h3>{title}</h3>
          <div className="row">
            <div className="cell" style={{flexDirection:'column', alignItems:'stretch'}}>
              <SelectPopoverField
                id={`${idPrefix}-ano`}
                label="Ano"
                value={year}
                onChange={e=>setYear(Number(e.target.value))}
                allowCustomValue
                customInputPlaceholder="Digite um ano"
                customInputButtonLabel={(candidate) => `Usar ${candidate}`}
                customInputMaxLength={4}
                customValueParser={parseEditableYear}
                panelWidth="min(280px, calc(100vw - 2rem))"
              >
                {renderYearOptions(years, year)}
              </SelectPopoverField>
            </div>
            <div className="cell" style={{flexDirection:'column', alignItems:'stretch'}}>
              <label htmlFor={`${idPrefix}-mes`}>Mês</label>
              <SelectPopoverField
                id={`${idPrefix}-mes`}
                label={'M\u00eas'}
                value={month}
                onChange={e=>setMonth(Number(e.target.value))}
              >
                {monthOptions(year)}
              </SelectPopoverField>
            </div>
          </div>
        </div>
      );
    }

function MonthPickerBlock({
      title,
      year, setYear,
      month, setMonth,
      years,
      monthOptions,
      idPrefix
    }) {
      return (
        <div className="subpick">
          <h3>{title}</h3>
          <div className="row">
            <div className="cell" style={{flexDirection:'column', alignItems:'stretch'}}>
              <SelectPopoverField
                id={`${idPrefix}-ano`}
                label="Ano"
                value={year}
                onChange={e=>setYear(Number(e.target.value))}
                allowCustomValue
                customInputPlaceholder="Digite um ano"
                customInputButtonLabel={(candidate) => `Usar ${candidate}`}
                customInputMaxLength={4}
                customValueParser={parseEditableYear}
                panelWidth="min(280px, calc(100vw - 2rem))"
              >
                {renderYearOptions(years, year)}
              </SelectPopoverField>
            </div>
            <div className="cell" style={{flexDirection:'column', alignItems:'stretch'}}>
              <SelectPopoverField
                id={`${idPrefix}-mes`}
                label={'M\u00eas'}
                value={month}
                onChange={e=>setMonth(Number(e.target.value))}
              >
                {monthOptions(year)}
              </SelectPopoverField>
            </div>
          </div>
        </div>
      );
    }


function FaleSozinhoInput({ onSend }) {
  const [txt, setTxt] = React.useState('');
  const ref = React.useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const v = txt.trim();
    if (!v) return;
    onSend?.(v);
    setTxt('');
    // volta foco
    ref.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-3 py-2 flex gap-2">
      <input
        ref={ref}
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
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

function PostLoginMock() {
      const [theme, setTheme] = React.useState('gunmetal');
      const [currentView, setCurrentView] = React.useState(() => (
        window.location.hash && window.location.hash.startsWith('#/dashboard')
          ? 'dashboard'
          : 'controle'
      ));
      const [showOverlay, setShowOverlay] = React.useState(true);
      const [editing, setEditing] = React.useState(null); // {mode:'edit'|'new', item:{...}}
      const [typeOpts, setTypeOpts] = React.useState([]);
      const [activeId, setActiveId] = React.useState(null); // anima o card clicado
      const [showReports, setShowReports] = React.useState(false);
      const [reportsTab, setReportsTab] = React.useState('home'); // 'mensal' | 'periodo' | 'comparativos'
      // ---- Settings / Perfil ----
      const [showSettings, setShowSettings] = React.useState(false);
      const [profile, setProfile] = React.useState(null); // {email, theme, payers_default, chart_accounts}
      const [contasDisp, setContasDisp] = React.useState([]);
      const [showSelfChat, setShowSelfChat] = React.useState(false);
      const SELF_REPLIES = React.useRef([
        'E?',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Aham…',
        'Tá me dando sono.',
        'Já tentou colocar no arroz?',
        'Reinicia o app.',
        'Reinicia o celular.',
        'Dorme e tenta amanhã.',
        'Ih, complicado…',
        'Nossa, nunca vi isso.',
        'Não entendi.',
        'Pode ser problema temporário.',
        'Tenta atualizar a página.',
        'Ué, funcionou aqui.',
        'Isso é normal (acho).',
        'Estranho… mas ok.',
        'Tem certeza que ligou?',
        'okay...',
        'okay...',
        'okay...',
        'okay...',
        'Ah, isso aí é assim mesmo.',
        'Você apertou o botão certo?',
        'Talvez se você ignorar, resolva.',
        'Hahaha, boa sorte.',
        'Tenta soprar o cabo USB.',
        'Isso não é comigo, é com o setor 7.',
        'Putz, que chato, hein?',
        'Deve ser o cache quântico.',
        'Então tá certo, né?',
        'Já tentou limpar o cache?',
        'Já tentou usar outro dispositivo?',
        'Funciona se você acreditar.',
        'Ah, mas isso é do sistema.',
        'Hmm, isso parece magia negra.',
        'Já pensou em desistir?',
        'Uau, que desastre elegante!',
        'São os Aliens, cara.',
        'Não entendi nada, mas parece sério.',
        'Pode repetir?',
        'Explica em outras palavras.',
        'Hmm, interessante….',
        'O problema tá entre a cadeira e o teclado.',
        'Ah, isso é normal. Ninguém entende também.',
        'Pode deixar que iremos demitir o estagiário',
        'Ah, isso aí é culpa do Mercúrio retrógrado.',
        'Já tentou não fazer isso?',
        'Pode repetir?',
        'Espera um pouco que talvez resolva sozinho.',
        'Tá com cara de “problema seu”.',
        'Parece coisa de Windows.',
        'Sei lá, tenta outro navegador.',
      ]);



      const [selfMsgs, setSelfMsgs] = React.useState([]);


      // 🔹 Anos e meses reais do Supabase
      const [years, setYears] = React.useState([]);
      const [monthsByYear, setMonthsByYear] = React.useState({});
      React.useEffect(() => {
        function handleOpenSelfChat() {
          setShowSelfChat(true);
          setSelfMsgs([]);
        }
        window.addEventListener('open-self-chat', handleOpenSelfChat);
        return () => window.removeEventListener('open-self-chat', handleOpenSelfChat);
      }, []);


      React.useEffect(() => {
        if (!showSettings) return;
        let alive = true;
        (async () => {
          try {
            const list = await window.SupabaseQueries.contasDistinctUltimos12();
            if (alive) setContasDisp(list);
          } catch (e) {
            console.warn('[settings] contas 12m', e);
            if (alive) setContasDisp([]);
          }
        })();
        return () => { alive = false; };
      }, [showSettings]);

      // Carrega anos e meses disponíveis do banco
      React.useEffect(() => {
        (async () => {
          try {
            const yrs = await window.SupabaseQueries.listYears();
            setYears(yrs);

            const monthsMap = {};
            for (const y of yrs) {
              const months = await window.SupabaseQueries.listMonthsByYear(y);
              monthsMap[y] = months;
            }
            setMonthsByYear(monthsMap);
          } catch (err) {
            console.error('[ui] Erro ao carregar anos/meses', err);
          }
        })();
      }, []);
      
      // Se o ano padrão (2025) não existir no banco, pega o mais recente disponível
      React.useEffect(() => {
        if (years.length && (yearSel == null || Number.isNaN(Number(yearSel)))) {
          setYearSel(years[0]); // assumindo que listYears() já retorna DESC
        }
      }, [years]);
      // Carrega perfil na montagem e aplica tema/pagadores
      React.useEffect(() => {
        (async () => {
          try {
            const p = await window.SupabaseQueries.getProfile();
            if (p) {
              setProfile(p);
              if (p.theme) setTheme(p.theme); // aplica tema inicial do perfil
              
            } else {
              setProfile({ email: '', theme, payers_default: [], chart_accounts: [] });
            }
          } catch (e) {
            console.warn('[perfil] erro ao carregar:', e);
            setProfile({ email: '', theme, payers_default: [], chart_accounts: [] });
          }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // roda uma vez

      // Carrega tipos de conta disponíveis (distinct nomes)
      React.useEffect(() => {
        (async () => {
          if (!editing) return; // abre só quando modal 'Nova/Editar' estiver ativo
          try {
            const list = await window.SupabaseQueries.contasDistinctUltimos12?.();
            setTypeOpts(Array.isArray(list) ? list : []);
          } catch (e) {
            console.warn('[tipo de conta] usando fallback COMMON_TYPES', e);
            setTypeOpts([]);
          }
        })();
      }, [editing]); // quando abrir/fechar o modal
      // Evento global para abrir o overlay de pendências
      React.useEffect(() => {
        function openManual() {
          setShowOverlay(true);
        }
        window.addEventListener('open-reminder-manual', openManual);
        return () => window.removeEventListener('open-reminder-manual', openManual);
      }, []);

      const now = new Date();
      const [yearSel, setYearSel] = React.useState(now.getFullYear());
      const [monthSel, setMonthSel] = React.useState(now.getMonth() + 1);

      // ---- Pendências (dinâmico): estados + helpers ----
      const [pendentes, setPendentes] = React.useState(null); // null = calculando
      const [pendLoading, setPendLoading] = React.useState(false);
      // normaliza: remove acentos, trim e baixa caixa
      function normalize(str='') {
        return String(str)
          .normalize('NFD')                // decompõe acentos
          .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
          .toLowerCase()
          .trim();
      }


      function prevYearMonth(y, m) {
        return m > 1 ? { y, m: m - 1 } : { y: y - 1, m: 12 };
      }
      function keyFor(i) {
        return `${normalize(i.nome)}__${normalize(i.instancia)}`;
      }



      // Exponho handlers para o Router (sem depender de React fora do componente)
      React.useEffect(() => {
        window.AppRoutes = {
          mes: ({ ano, mes } = {}) => {
            setCurrentView('controle');
            setShowReports(false);
            if (ano) setYearSel(Number(ano));
            if (mes) setMonthSel(Number(mes));
          },
          relatorios: () => {
            setCurrentView('controle');
            setReportsTab('home');
            setShowReports(true);
          },
          dashboard: () => {
            setCurrentView('dashboard');
            setShowReports(false);
          }
        };
        return () => { if (window.AppRoutes) delete window.AppRoutes; };
      }, []);




      // ---- Calcula pendências comparando mês atual x anterior ----
      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            setPendLoading(true);
            const { y, m } = prevYearMonth(yearSel, monthSel);
            const [cur, prev] = await Promise.all([
              window.DataAdapter.fetchMes(yearSel, monthSel),
              window.DataAdapter.fetchMes(y, m)
            ]);

            const curKeys = new Set((cur || []).map(keyFor));
            const listaPend = (prev || []).filter(p => !curKeys.has(keyFor(p)));

            if (!alive) return;
            setPendentes(listaPend);

            // 🔹 só abre automaticamente se for o mês vigente
            const hoje = new Date();
            const anoAtual = hoje.getFullYear();
            const mesAtual = hoje.getMonth() + 1;
            const isMesAtual = yearSel === anoAtual && monthSel === mesAtual;

            setShowOverlay(isMesAtual && listaPend.length > 0);
          } catch (e) {
            console.error('[pendentes] erro ao calcular', e);
            if (!alive) return;
            setPendentes([]);
            setShowOverlay(false);
          } finally {
            if (alive) setPendLoading(false);
          }
        })();
        return () => { alive = false; };
      }, [yearSel, monthSel]);


      // Itens reais do mês (Supabase) + loading
      const [itens, setItens] = React.useState(null); // null = carregando

      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            const mapped = await window.DataAdapter.fetchMes(yearSel, monthSel);
            if (alive) setItens(mapped);
          } catch (err) {
            console.error('[ui] Falha ao carregar mês', err);
            if (alive) setItens([]);
          }
        })();
        return () => { alive = false; };
      }, [yearSel, monthSel]);

      // Toast simples
      const [toast, setToast] = React.useState(null); // { msg, type: 'ok'|'err' }
      function showToast(msg, type='ok'){
        setToast({ msg, type });
        setTimeout(() => setToast(null), 1800);
      }

      // Recarrega só a lista do mês atual
      async function reloadMonth(){
        const mapped = await window.DataAdapter.fetchMes(yearSel, monthSel);
        setItens(mapped);
      }

      // Pequena validação/sanitização de URL (http/https)
      function cleanUrl(u){
        if(!u) return '';
        const s = String(u).trim();
        if(/^https?:\/\//i.test(s)) return s;
        return 'https://' + s;
      }

      async function handleSave(mode, initialId, form){
        try {
          const quem = form.quemMode === 'outro'
            ? (form.quemOutro || '').trim()
            : (form.quem || '').trim();

          // 1) data que o usuário colocou (pode ser outubro)
          const isoFromForm = form.data || todayISO();

          // 2) mês/ano que o usuário ESTÁ TRABALHANDO na tela
          const ano = yearSel;                 // 👈 força ano da tela
          const mes = monthSel;                // 👈 força mês da tela

          const draft = {
            nome_da_conta: (form.nome || '').trim(),
            valor: parseBRL(form.valor),
            data_de_pagamento: isoFromForm,    // 👈 aqui fica outubro, por ex.
            instancia: (form.instancia || '').trim(),
            quem_pagou: quem,
            dividida: !!form.dividida,
            link_boleto: cleanUrl(form.boleto),
            link_comprovante: cleanUrl(form.comp),
            ano,                               // 👈 aqui vai novembro
            mes,                               // 👈 aqui vai 11
          };

          const muts = window.SupabaseMutations || window.SupabaseQueries;
          if (!muts) throw new Error('SupabaseMutations/Queries não carregados');

          let ok = false;
          if (mode === 'new') {
            ok = await muts.insertConta(draft);
          } else {
            ok = await muts.updateConta(initialId, draft);
          }

          if (!ok) throw new Error('Falha no Supabase');

          await reloadMonth();
          showToast('Conta salva ✅', 'ok');
          setEditing(null);
        } catch (e) {
          console.error('[save] erro', e);
          showToast('Erro ao salvar ❌', 'err');
        }
      }



      async function handleDelete(id){
        try{
          const ok = await window.SupabaseMutations.deleteConta(id);
          if(!ok) throw new Error('Falha no Supabase');
          await reloadMonth();
          showToast('Conta excluída 🗑️','ok');
          setEditing(null);
        } catch(e){
          console.error('[delete] erro', e);
          showToast('Erro ao excluir ❌','err');
        }
      }


      const [payersDB, setPayersDB] = React.useState([]);

      React.useEffect(() => {
        (async () => {
          try {
            const list = await window.SupabaseQueries.payersDistinct();
            setPayersDB(list || []);
          } catch (e) {
            console.error('[ui] payersDistinct', e);
            setPayersDB([]);
          }
        })();
      }, []);


      const totalMes = React.useMemo(
        () => (itens ? itens.reduce((acc,i)=> acc + parseBRL(i.valor), 0) : 0),
        [itens]
      );
      const contasDistinct = React.useMemo(
        () => Array.from(new Set((itens || []).map(i=> i.nome))),
        [itens]
      );


      function popCard(id){
        setActiveId(id);
        setTimeout(()=> setActiveId(null), 650);
      }

      function openNew(prefill){
        popCard('new');

        // agora a data padrão é hoje, e NÃO o dia 01 do mês selecionado
        const isoToday = todayISO();

        setEditing({
          mode: 'new',
          item: {
            id: null,
            nome: prefill?.nome || '',
            valor: '',
            data: isoToday,                 // 👈 default visível no popup
            instancia: prefill?.instancia || '',
            quem: prefill?.quem || '',
            dividida: !!prefill?.dividida,
            links: { boleto: '', comp: '' }
          }
        });
      }



      function openEdit(item){
        popCard(item.id);
        const isoDate = parseBRtoISO(item.data) || todayISO();
        setEditing({ mode:'edit', item: { ...JSON.parse(JSON.stringify(item)), data: isoDate } });
      }

      const navigationHelp = (
        <div className="space-y-2">
          <div>Use estes botões para trocar de área dentro da aplicação.</div>
          <ul className="list-disc space-y-1 pl-4">
            <li><strong>Controle</strong> mostra o mês em trabalho.</li>
            <li><strong>Dashboard</strong> abre a leitura analítica do período filtrado.</li>
          </ul>
        </div>
      );
      const actionsHelp = (
        <div className="space-y-2">
          <div>Estas ações resolvem tarefas do dia a dia sem trocar de área.</div>
          <ul className="list-disc space-y-1 pl-4">
            <li><strong>Nova conta</strong> abre o cadastro de um novo lançamento no período exibido no Controle.</li>
            <li><strong>Relatórios</strong> abre a geração dos relatórios formais em PDF do app.</li>
            <li><strong>Configurações</strong> ajusta tema, perfil e preferências.</li>
          </ul>
          <div>No dashboard, a ação de <strong>Nova conta</strong> sai de cena para manter o foco na leitura analítica.</div>
        </div>
      );

      return (
        <div className={`theme-${theme} min-h-screen relative p-4 md:p-6`}>
          <div className="mx-auto w-full max-w-5xl">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-3">
            <h1 className="brand text-center md:text-left w-full flex items-center gap-3 relative">
              <img
                src="./icons/icon-512.png"
                alt="Ícone Controle de Contas"
                width="62"
                height="62"
                className="absolute left-0 translate-x-[-10%] md:static md:translate-x-0 rounded-full shadow-md"
              />
              <span className="w-full text-center md:w-auto md:text-left block">Controle de Contas</span>
            </h1>

            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex w-full flex-col gap-1 lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.16em] opacity-60">{'Navega\u00e7\u00e3o'}</span>
                  <HomeInfoTooltip content={navigationHelp} testId="navigation" align="left" />
                </div>
                <div className="grid w-full grid-cols-2 gap-2 lg:w-auto">
                  <button
                    className={`btn w-full lg:w-auto ${currentView === 'controle' ? 'primary' : 'ghost'}`}
                    onClick={() => Router.go(`#/mes?ano=${yearSel}&mes=${monthSel}`)}
                    aria-current={currentView === 'controle' ? 'page' : undefined}
                  >
                    Controle
                  </button>
                  <button
                    className={`btn w-full lg:w-auto ${currentView === 'dashboard' ? 'primary' : 'ghost'}`}
                    onClick={() => Router.go('#/dashboard')}
                    aria-current={currentView === 'dashboard' ? 'page' : undefined}
                  >
                    Dashboard
                  </button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1 lg:w-auto lg:min-w-[520px]">
                <div className="flex items-center gap-2 lg:justify-end">
                  <span className="text-xs uppercase tracking-[0.16em] opacity-60">{'A\u00e7\u00f5es'}</span>
                  <HomeInfoTooltip content={actionsHelp} testId="actions" align="right" />
                </div>
                <div className={`grid w-full gap-2 ${currentView === 'controle' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {currentView === 'controle' ? (
                    <div className="w-full">
                      <button
                        className={`btn primary w-full inline-flex items-center justify-center gap-2 ${activeId==='new' ? 'pop' : ''}`}
                        onClick={()=>openNew()}
                      >
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base font-bold"
                          style={{ background: 'rgba(10,10,10,.14)' }}
                          aria-hidden="true"
                        >
                          +
                        </span>
                        <span>Nova conta</span>
                      </button>
                    </div>
                  ) : (
                    <div className="hidden lg:block" aria-hidden="true" />
                  )}
                  <button className="btn ghost w-full" onClick={()=>{ setReportsTab('home'); setShowReports(true); }}>
                    {'Relat\u00f3rios'}
                  </button>
                  <button className="btn ghost w-full" onClick={()=> setShowSettings(true)}>
                    {'Configura\u00e7\u00f5es'}
                  </button>
                </div>
              </div>
            </div>

          </header>
        

          {currentView === 'dashboard' ? (
            <DashboardView
              years={years}
              monthsByYear={monthsByYear}
              currentYear={yearSel}
              currentMonth={monthSel}
              onGoControlToMonth={(ano, mes) => Router.go(`#/mes?ano=${ano}&mes=${mes}`)}
            />
          ) : (
            <>
          {/* Overlay de contas pendentes (agora pode ser para qualquer mês; auto só no mês atual) */}
          {showOverlay && (
            <div className="overlay hard" onClick={() => setShowOverlay(false)}>
              <div className="modal solid w-full md:max-w-2xl" onClick={(e) => e.stopPropagation()}>
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

                {/* você mantém aqui exatamente o mesmo corpo que já existe */}
                {pendentes === null || pendLoading ? (
                  <div className="card text-center py-6">Calculando…</div>
                ) : pendentes.length === 0 ? (
                  <div className="card text-center py-6 text-sm opacity-70">
                    Nenhuma conta do mês anterior está pendente.
                  </div>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {pendentes.map((p, idx) => (
                      <li key={`${keyFor(p)}-${idx}`} className="card flex justify-between items-center">
                        <div>
                          <strong>{p.nome}</strong><br />
                          <span className="text-sm opacity-70">
                            {p.instancia ? `${p.instancia} • ` : ''}{p.valor} • {p.data}
                          </span>
                        </div>
                        <button
                          className="btn primary"
                          onClick={() => {
                            setShowOverlay(false);
                            openNew({ nome: p.nome, instancia: p.instancia, quem: p.quem, dividida: p.dividida });
                          }}
                        >
                          Lançar agora
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button className="btn ghost w-full" onClick={() => setShowOverlay(false)}>Sair</button>
              </div>
            </div>
          )}




          {/* Resumo do mês + seletor ano/mês (meses DESC e nomes apenas) */}
          <section className="card mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-sm opacity-70">Total do mês</div>
              <div className="text-2xl font-semibold" style={{textShadow:'var(--glow)'}}>
                {totalMes.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </div>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 md:ml-auto md:w-auto">
              <SelectPopoverField
                id="home-ano"
                label="Ano"
                value={yearSel}
                onChange={e=>{
                  const y = Number(e.target.value);
                  setYearSel(y);
                  Router.go(`#/mes?ano=${y}&mes=${monthSel}`);
                }}
                allowCustomValue
                customInputPlaceholder="Digite um ano"
                customInputButtonLabel={(candidate) => `Usar ${candidate}`}
                customInputMaxLength={4}
                customValueParser={parseEditableYear}
                panelWidth="min(280px, calc(100vw - 2rem))"
                wrapperClassName="w-full md:w-[120px]"
              >
                {renderYearOptions(years, yearSel)}
              </SelectPopoverField>

              {(() => {
                const dbMonths = monthsByYear[yearSel] || [];
                const all12 = [1,2,3,4,5,6,7,8,9,10,11,12];

                // se o ano tem meses no banco, usa esses; senÃ£o usa 1..12
                const monthsToShow = dbMonths.length ? [...dbMonths] : [...all12];

                // garante que o mÃªs selecionado atual apareÃ§a na lista
                if (!monthsToShow.includes(monthSel)) {
                  monthsToShow.push(monthSel);
                }

                // ordena
                monthsToShow.sort((a, b) => a - b);

                return (
                  <SelectPopoverField
                    id="home-mes"
                    label={'M\u00eas'}
                    value={monthSel}
                    onChange={e=>{
                      const m = Number(e.target.value);
                      setMonthSel(m);
                      Router.go(`#/mes?ano=${yearSel}&mes=${m}`);
                    }}
                    wrapperClassName="w-full md:w-[180px]"
                  >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                        <option key={m} value={m}>{monthNamePT(m)}</option>
                      ))}
                  </SelectPopoverField>
                );
              })()}

            </div>
          </section>

          {/* ================================================ */}
          {/* 📭 Lista de contas do mês (loading / vazio / itens) */}
          {itens === null ? (
            <div className="card text-center py-10">Carregando…</div>
          ) : itens.length === 0 ? (
            <div className="card text-center py-10">
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta neste mês</h3>
              <p className="text-sm opacity-70 mb-4">Você ainda não adicionou nenhuma conta para este período.</p>
              <button className="btn primary" onClick={() => openNew()}>+ Adicionar primeira conta</button>
            </div>
          ) : (
            <main className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {itens.map((i) => (
                <ContaCard key={i.id} active={activeId === i.id} {...i} onEdit={() => openEdit(i)} />
              ))}
            </main>
          )}
            </>
          )}



          {editing && currentView === 'controle' && (
            <EditPopup
              data={editing}
              payers={payersDB}
              typeOpts={typeOpts}
              onClose={()=>setEditing(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}


          {showReports && (
            <ReportsModal
              tab={reportsTab}
              onChangeTab={setReportsTab}
              onClose={()=>setShowReports(false)}
              onOpenDashboard={() => {
                setShowReports(false);
                Router.go('#/dashboard');
              }}
              years={years}
              monthsByYear={monthsByYear}
              currentYear={yearSel}
              currentMonth={monthSel}
              contasDistinct={Array.from(new Set((itens || []).map(i=> i.nome)))}
              defaultSel={Array.isArray(profile?.chart_accounts) ? profile.chart_accounts : []}
            />
          )}

          {showSettings && (
            <SettingsModal
              initial={profile}
              // contasDisponiveis: sem await no JSX; pega das contas já carregadas na tela atual
              contasDisponiveis={contasDisp}
              onClose={()=> setShowSettings(false)}
              onSaved={(p)=>{
                setProfile(p);
                if (p.theme) setTheme(p.theme); // aplica tema escolhido
                
              }}
            />
          )}

          {showSelfChat && (
            <div
              className="fixed inset-0 z-[999] flex items-end justify-end p-4 pointer-events-none"
              onClick={() => setShowSelfChat(false)}
            >
              <div
                className="pointer-events-auto w-full max-w-sm bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] flex flex-col max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤬 Fale com tosco</span>
                    <span className="text-xs opacity-60">nível de suporte: baixo</span>
                  </div>
                  <button
                    className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                    onClick={() => setShowSelfChat(false)}
                  >
                    Fechar
                  </button>

                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {selfMsgs.length === 0 && (
                    <div className="text-sm opacity-60">
                      Manda aí… vou responder qualquer coisa
                    </div>
                  )}
                  {selfMsgs.map((m, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-xs opacity-60">Você</div>
                      <div className="bg-white/5 rounded px-3 py-2 text-sm">{m.user}</div>
                      <div className="text-xs opacity-60 mt-1">Fale com tosco</div>
                      <div className="bg-white/0 rounded px-3 py-2 text-sm">
                        {m.bot}
                      </div>
                    </div>
                  ))}
                </div>

                <FaleSozinhoInput
                  onSend={(text) => {
                    const list = SELF_REPLIES.current;
                    const reply = list[Math.floor(Math.random() * list.length)];
                    setSelfMsgs((prev) => [...prev, { user: text, bot: '...' }]);
                    setTimeout(() => {
                      setSelfMsgs((prev) => {
                        const copy = [...prev];
                        copy[copy.length - 1] = { user: text, bot: reply };
                        return copy;
                      });
                    }, 400 + Math.random() * 700);
                  }}
                />

              </div>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border"
                style={{ background:'var(--surface)', borderColor:'var(--border)', boxShadow:'var(--glow)' }}>
              <span className="text-sm">{toast.msg}</span>
            </div>
          )}

          </div>{/* /max-w wrapper */}
        </div>
      );
    }
