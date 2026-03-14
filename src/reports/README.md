# Reports Domain

Esta pasta concentra helpers de dominio usados pela area de relatorios.

Objetivo:

- evitar repeticao de regras de periodo e parsing dentro de `ReportsModal.jsx`
- manter funcoes pequenas e reutilizaveis para preview, comparativos e PDFs

Arquivos atuais:

- `helpers.js`
  - labels de mes
  - montagem de listas de meses por periodo
  - parsing monetario
  - normalizacao de nomes de conta
  - somatorios por conta
- `dom.js`
  - host offscreen para PDF
  - canvases auxiliares
  - limpeza e montagem do preview de comparativos
  - fundo branco e flush de render
- `renderers.js`
  - render local da pizza mensal/periodo
  - render local das barras do mensal
  - render local das linhas por conta
- `pdf-builders.js`
  - montagem do PDF mensal formal
  - montagem do PDF por periodo formal
  - coordenacao entre renderers, DOM offscreen e jsPDF
- `workflows.js`
  - lista dinamica de contas por alcance
  - preview comparativo
  - downloads PNG/PDF do comparativo
  - exportacao local dos canvases comparativos

Contratos globais:

- `window.ReportsHelpers`
- `window.ReportsDom`
- `window.ReportsRenderers`
- `window.ReportsPdfBuilders`
- `window.ReportsWorkflows`

Diretrizes:

- helpers daqui devem ser puros ou quase puros
- nao misturar JSX nesta pasta
- quando alguma regra for exclusiva de UI, ela deve ficar em `src/components/reports/`
- quando o fluxo precisar falar com DOM, Chart.js ou PDF, preferir centralizar isso aqui em funcoes pequenas e documentadas
- `ReportsModal.jsx` deve atuar como orquestrador da UI, delegando a geracao formal de PDF para `pdf-builders.js`
- o caminho ativo de relatorios nao deve depender de `window.PDFHelpers` dentro dos componentes
