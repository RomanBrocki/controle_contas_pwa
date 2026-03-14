# Dashboard Archive

Esta pasta guarda snapshots tecnicos do dashboard.

Objetivo:

- preservar snapshots anteriores para consulta tecnica
- manter referencias internas fora da tela ativa do BI
- evitar misturar historico de implementacao com a camada atual do dashboard

Arquivo atual:

- `DashboardViewLegacy.jsx`
  - snapshot da implementacao anterior do dashboard
  - preservado em arquivo apenas para consulta tecnica e comparacao controlada
  - nao deve receber evolucoes novas, exceto se for preciso registrar um snapshot tecnico adicional

Diretrizes:

- a tela ativa continua em `src/dashboard/DashboardView.jsx`
- helpers compartilhados continuam vindo de `window.DashboardHelpers`
- o runtime ativo nao precisa carregar esta referencia no bootstrap
- qualquer nova evolucao deve acontecer fora desta pasta
