# Dashboard Components

Esta pasta concentra componentes visuais especificos do BI.

Objetivo:

- tirar blocos de interface de `DashboardView.jsx`
- deixar a tela principal mais focada em orquestracao de dados e estados
- documentar a camada visual do dashboard separadamente dos helpers de dominio

Arquivos atuais:

- `DashboardInfoTooltip.jsx`
  - tooltip contextual do dashboard
- `DashboardShell.jsx`
  - cards metricos e secoes base do layout BI
- `DashboardFilters.jsx`
  - filtros compactos, checklists e toolbar principal do dashboard
- `DashboardTrendCharts.jsx`
  - graficos e visuais de tendencia do dashboard
  - inclui linha de referencia para a media do ciclo atual
- `DashboardRankingPanels.jsx`
  - comparativos, ranking e painel de pagadores
- `DashboardCompositionCharts.jsx`
  - rosca de composicao e grafico de Pareto do dashboard

Estado atual da extracao:

- `DashboardView.jsx` ja consome destes arquivos os blocos de tendencia, comparativo, ranking, pagadores, composicao e Pareto
- a referencia anterior do dashboard foi movida para `src/dashboard/legacy/`, deixando a tela ativa mais focada
- o foco restante do `DashboardView.jsx` passa a ser orquestracao de estado, navegacao analitica e composicao da tela

Diretrizes:

- componentes daqui podem depender do tema visual do dashboard
- regras de agregacao devem ficar em `src/dashboard/helpers.js`
- extracoes novas devem priorizar blocos com props claras e sem dependencia implicita do restante da tela
