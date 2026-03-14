function MonthlyAccountsPanel(props) {
  if (props.items === null) {
    return <div className="card text-center py-10">Carregando...</div>;
  }

  if (!props.items.length) {
    return (
      <div className="card text-center py-10">
        <h3 className="text-lg font-semibold mb-2">Nenhuma conta neste mes</h3>
        <p className="text-sm opacity-70 mb-4">Voce ainda nao adicionou nenhuma conta para este periodo.</p>
        <button className="btn primary" onClick={props.onCreateFirstAccount}>+ Adicionar primeira conta</button>
      </div>
    );
  }

  return (
    <main className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {props.items.map((item) => (
        <ContaCard
          key={item.id}
          active={props.activeId === item.id}
          {...item}
          onEdit={() => props.onEditItem(item)}
        />
      ))}
    </main>
  );
}
