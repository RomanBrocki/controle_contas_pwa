# Reports Components

Esta pasta concentra os blocos visuais do modal de relatorios.

O objetivo e deixar `ReportsModal.jsx` mais proximo de um orquestrador, enquanto os paineis de interface ficam isolados e mais faceis de manter.

Arquivos atuais:

- `ReportsPanels.jsx`
  - header do modal
  - tela inicial
  - painel mensal
  - painel de periodo
  - painel de comparativos

Integracao atual:

- `ReportsModal.jsx` fica como orquestrador do modal
- `src/reports/*.js` concentra DOM auxiliar, renderers locais, builders formais de PDF e workflows de comparativo

Diretrizes:

- componentes daqui devem ser focados em interface e composicao
- regras de agregacao, parsing e periodos devem ficar em helpers dedicados da area
- a geracao formal de PDF deve ficar fora do JSX, preferencialmente em `src/reports/pdf-builders.js`
- quando um comportamento do modal deixar de ser puramente visual, a preferencia e mover para `src/reports/`
