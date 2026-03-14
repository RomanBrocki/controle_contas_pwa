# Dashboard Legacy

Esta pasta guarda referencias congeladas do dashboard.

Objetivo:

- preservar implementacoes anteriores para consulta tecnica
- permitir comparacao funcional durante a profissionalizacao
- evitar misturar referencia historica com a tela ativa do BI

Arquivo atual:

- `DashboardViewLegacy.jsx`
  - snapshot da implementacao anterior do dashboard
  - preservado em arquivo apenas para consulta tecnica e comparacao controlada
  - nao deve receber evolucoes novas, exceto se for preciso registrar um estado legado adicional

Diretrizes:

- a tela ativa continua em `src/dashboard/DashboardView.jsx`
- helpers compartilhados continuam vindo de `window.DashboardHelpers`
- o runtime ativo nao precisa carregar esta referencia no bootstrap
- qualquer nova evolucao deve acontecer fora desta pasta
