function PostLoginHeader(props) {
  const navigationHelp = (
    <div className="space-y-2">
      <div>{'Use estes botões para trocar de área dentro da aplicação.'}</div>
      <ul className="list-disc space-y-1 pl-4">
        <li><strong>Controle</strong>{' mostra o mês em trabalho.'}</li>
        <li><strong>Dashboard</strong>{' abre a leitura analítica do período filtrado.'}</li>
      </ul>
    </div>
  );

  const actionsHelp = (
    <div className="space-y-2">
      <div>{'Estas ações resolvem tarefas do dia a dia sem trocar de área.'}</div>
      <ul className="list-disc space-y-1 pl-4">
        <li><strong>Nova conta</strong>{' abre o cadastro de um novo lançamento no período exibido no Controle.'}</li>
        <li><strong>Relatórios</strong>{' abre a geração dos relatórios formais em PDF do app.'}</li>
        <li><strong>Configurações</strong>{' ajusta tema, perfil e preferências.'}</li>
      </ul>
      <div>{'No dashboard, a ação de '}<strong>Nova conta</strong>{' sai de cena para manter o foco na leitura analítica.'}</div>
    </div>
  );

  return (
    <header className="mb-6 flex flex-col gap-3">
      <h1 className="brand text-center md:text-left w-full flex items-center gap-3 relative">
        <img
          src="./icons/icon-512.png"
          alt={'Ícone Controle de Contas'}
          width="62"
          height="62"
          className="absolute left-0 translate-x-[-10%] md:static md:translate-x-0 rounded-full shadow-md"
        />
        <span className="w-full text-center md:w-auto md:text-left block">Controle de Contas</span>
      </h1>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-col gap-1 lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.16em] opacity-60">{'Navegação'}</span>
            <HomeInfoTooltip content={navigationHelp} testId="navigation" align="left" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2 lg:w-auto">
            <button
              className={`btn w-full lg:w-auto ${props.currentView === 'controle' ? 'primary' : 'ghost'}`}
              onClick={props.onGoControl}
              aria-current={props.currentView === 'controle' ? 'page' : undefined}
            >
              Controle
            </button>
            <button
              className={`btn w-full lg:w-auto ${props.currentView === 'dashboard' ? 'primary' : 'ghost'}`}
              onClick={props.onGoDashboard}
              aria-current={props.currentView === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 lg:w-auto lg:min-w-[520px]">
          <div className="flex items-center gap-2 lg:justify-end">
            <span className="text-xs uppercase tracking-[0.16em] opacity-60">{'Ações'}</span>
            <HomeInfoTooltip content={actionsHelp} testId="actions" align="right" />
          </div>
          <div className={`grid w-full gap-2 ${props.currentView === 'controle' ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {props.currentView === 'controle' ? (
              <div className="w-full">
                <button
                  className={`btn primary w-full inline-flex items-center justify-center gap-2 ${props.newButtonActive ? 'pop' : ''}`}
                  onClick={props.onOpenNew}
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
            <button className="btn ghost w-full" onClick={props.onOpenReports}>
              {'Relatórios'}
            </button>
            <button className="btn ghost w-full" onClick={props.onOpenSettings}>
              {'Configurações'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
