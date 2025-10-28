function ContaCard({ nome, instancia, valor, data, quem, dividida, links, onEdit, active }) {
  return (
    <article className={`card space-y-2 ${active ? 'pulse' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{nome}</h3>
          <div className="text-sm opacity-70">{instancia}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold" style={{textShadow:'var(--glow)'}}>{valor}</div>
          <div className="text-xs opacity-70">{data}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Linha 1: badges sempre à esquerda */}
        <span className="badge">{dividida ? 'Dividida' : 'Não dividida'}</span>

        {/* Linha 2: quem pagou + ações à direita, com wrap controlado */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <span className="chip">Quem pagou: <strong>{quem}</strong></span>

          <div className="ml-auto flex items-center gap-2">
            {links?.boleto && (
              <a className="btn ghost" href={links.boleto} target="_blank" rel="noreferrer">Boleto</a>
            )}
            {links?.comp && (
              <a className="btn ghost" href={links.comp} target="_blank" rel="noreferrer">Comprovante</a>
            )}
          </div>
          <button className="btn ghost ml-auto" onClick={onEdit}>Editar</button>
        </div>
      </div>
    </article>
  );
}

