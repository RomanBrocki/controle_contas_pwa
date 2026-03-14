# Dashboard BI

Esta pasta concentra a camada de BI do projeto.

O objetivo aqui nao e substituir o legado do controle mensal nem empurrar a analise para dentro do modal de relatorios. A proposta e manter uma area separada, testavel e iterativa para leitura executiva e exploracao dos dados.

---

## Objetivo funcional

O dashboard existe para responder perguntas como:

- quanto foi gasto no recorte selecionado
- quem pagou mais
- quanto do periodo foi dividido
- qual conta domina o recorte
- como cada conta evoluiu ao longo do tempo
- como os pagadores se equilibram

Tudo isso usando os mesmos dados do app principal, sem backend novo e sem custo adicional.

---

## Arquivos principais

- `helpers.js`
- `orchestration.js`
- `DashboardView.jsx`
- `legacy/DashboardViewLegacy.jsx`
- `components/DashboardInfoTooltip.jsx`
- `components/DashboardShell.jsx`
- `components/DashboardFilters.jsx`
- `components/DashboardTrendCharts.jsx`
- `components/DashboardRankingPanels.jsx`
- `components/DashboardCompositionCharts.jsx`

Responsabilidades por camada:

- `helpers.js`
  - formatacao
  - selecao de filtros
  - construcao de series e agregacoes
  - regras analiticas reutilizaveis
- `orchestration.js`
  - transicoes de estado do BI
  - sincronias de foco compartilhado
  - normalizacao de filtros e paginacao
- `components/*`
  - tooltip contextual
  - shell visual compartilhada do BI
  - toolbar e checklists de filtro
  - graficos de tendencia e comparativos reutilizaveis
  - paineis de ranking e pagadores
  - composicao do recorte e Pareto
- `DashboardView.jsx`
  - orquestracao de estado
  - carregamento dos recortes
  - composicao da tela final
  - manutencao da integracao entre os blocos do BI
- `legacy/DashboardViewLegacy.jsx`
  - referencia congelada da iteracao anterior do dashboard
  - preservada fora da tela ativa para consulta e comparacao segura
  - mantida em arquivo, sem necessidade de carga no bootstrap ativo

---

## Modelo de interacao

### Filtros reais

Os filtros do topo sao o recorte oficial do dashboard:

- periodo
- contas
- pagadores
- divididas / nao divididas

O usuario monta o rascunho dos filtros e so recalcula os blocos quando clica em **Atualizar dashboard**.

### Foco sincronizado

Alguns graficos conversam entre si sem alterar o filtro real. Esse foco temporario sincroniza:

- `Top 5`
- `Ranking`
- `Evolucao por conta`
- `Contas nos ultimos 12 meses`

Isso permite navegacao de estilo BI sem baguncar o recorte principal.

No bloco `Ciclo anual`, a ordem das contas deve respeitar o peso delas no periodo filtrado. O historico do ciclo entra para contextualizar essas mesmas contas, sem antecipar categorias que nao aparecem no recorte principal.

---

## Blocos atuais

- cards de resumo
- acerto entre pagadores
- maior conta/categoria
- pagadores
- top 5 contas + outros
- ranking paginado
- evolucao por conta
- contas nos ultimos 12 meses
- categorias ao longo do tempo

---

## Regras arquiteturais

- preferir componentes e helpers novos dentro de `src/dashboard/`
- manter referencias historicas do BI em `src/dashboard/legacy/`
- evitar empurrar logica analitica para `ReportsModal.jsx`
- preservar a navegacao atual do app
- tratar filtros do topo como fonte de verdade
- tratar sincronias entre graficos como foco temporario
- remover blocos mortos da tela ativa quando ja estiverem preservados em `legacy/`
- nao alterar contratos globais do app sem necessidade real
- manter `window.DashboardHelpers` e `window.DashboardOrchestration` como contratos de runtime pequenos e documentados para a camada BI

---

## Validacao manual minima

1. abrir `#/dashboard`
2. validar filtros e resumo aplicado
3. clicar em `Atualizar dashboard`
4. validar cards, ranking, top 5 e visoes temporais
5. validar sincronia entre ranking, top 5, evolucao e ultimos 12 meses
6. voltar para `#/mes` e confirmar que o controle segue intacto

---

## Observacoes de evolucao

Melhorias futuras provaveis:

- tooltips mais ricos
- cross-filter mais forte entre visuais
- drillthrough controlado para detalhe
- refinamento fino de responsividade

O principio continua o mesmo: evolucao incremental, com baixo risco para o legado.
