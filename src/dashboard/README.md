# Dashboard BI

Esta pasta concentra a camada de BI do projeto.

O objetivo aqui e manter a leitura analitica em uma area dedicada, separada do controle mensal e dos relatorios formais.

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
  - snapshot tecnico preservado para consulta interna
  - mantido fora da tela ativa para referencia de implementacao
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
- `Pareto`

Isso permite navegacao de estilo BI sem baguncar o recorte principal.

O grafico principal de gasto mensal do recorte usa tooltip por clique, contextualiza o mesmo mes do ano anterior e lista as 5 contas mais pesadas daquele mes, sem alterar o foco real dos demais blocos.

---

## Blocos atuais

- grafico principal de gasto mensal do recorte
- cards de resumo
- acerto entre pagadores
- balanco dos pagadores
- top 5 contas + outros
- ranking paginado
- Pareto
- evolucao por conta
- categorias ao longo do tempo

Detalhes do estado atual:

- o KPI de `acerto entre pagadores` pode listar diretamente os repasses sugeridos no topo do dashboard
- o bloco `balanco dos pagadores` mostra, para cada pagador, o total pago e quanto desse total saiu em contas divididas
- a logica de acerto considera divisao igual entre todos os pagadores visiveis no recorte para as contas marcadas como divididas

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
5. validar sincronia entre ranking, top 5, evolucao e grafico principal do recorte
6. voltar para `#/mes` e confirmar que o controle segue intacto

---

## Observacoes de evolucao

Melhorias futuras provaveis:

- tooltips mais ricos
- cross-filter mais forte entre visuais
- drillthrough controlado para detalhe
- refinamento fino de responsividade

O principio continua o mesmo: evolucao incremental, com baixo risco operacional.
O principio continua o mesmo: evolucao incremental, com baixo risco para a experiencia do usuario e para a manutencao do produto.
