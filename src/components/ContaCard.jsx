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
      {/* Linha do meio: badges + quem pagou (sem rótulo) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">{dividida ? 'Dividida' : 'Não dividida'}</span>
        {quem ? <span className="badge">Paga por {quem}</span> : null}
      </div>

      {/* Linha de baixo: links à esquerda, Editar à direita */}
      <div className="flex items-center gap-2">
        {links?.boleto && (
          <a className="btn ghost" href={links.boleto} target="_blank" rel="noreferrer">Boleto</a>
        )}
        {links?.comp && (
          <a className="btn ghost" href={links.comp} target="_blank" rel="noreferrer">Comprovante</a>
        )}
        <button className="btn ghost ml-auto" onClick={onEdit}>Editar</button>
      </div>

    </article>
  );
}

