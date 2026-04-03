# Reports Domain

Esta pasta concentra o dominio tecnico da area de relatorios.

Objetivo:

- evitar repeticao de regras de periodo, parsing e agregacao dentro de `ReportsModal.jsx`
- manter preview, comparativos e geracao formal de PDF em camadas pequenas e documentadas
- preservar o fluxo legado do modal enquanto a logica de render e montagem formal evolui por baixo

Arquivos atuais:

- `helpers.js`
  - labels de mes
  - montagem de listas de meses por periodo
  - parsing monetario
  - normalizacao de nomes de conta
  - somatorios e agrupamentos auxiliares
- `dom.js`
  - host offscreen para PDF
  - canvases auxiliares
  - limpeza e montagem do preview de comparativos
  - fundo branco e flush de render
- `renderers.js`
  - render local da pizza mensal/periodo usada em fluxos legados
  - render local das barras do mensal
  - render manual dos comparativos por conta do PDF de periodo
  - comparativos por conta com colunas em zero, linha de tendencia e linha de media
  - ajustes finos de labels, densidade e ocupacao vertical para series longas
- `pdf-builders.js`
  - montagem do PDF mensal formal
  - montagem do PDF por periodo formal
  - capas executivas da pagina 1
  - capa de periodo com grafico mensal, Top 5, detalhamento de outras contas e card de balanco
  - uso de meses de contexto quando o recorte do periodo e menor que 13 meses
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
- a pagina 1 dos PDFs pode evoluir, mas o corpo legado da pagina 2 em diante deve ser preservado sem necessidade real de refatoracao ampla
- o caminho ativo de relatorios nao deve depender de `window.PDFHelpers` dentro dos componentes

Estado atual dos PDFs:

- o relatorio mensal abre com capa executiva baseada no mes escolhido
- o relatorio por periodo abre com capa executiva focada no recorte e no acumulado por conta
- os comparativos por conta do PDF de periodo usam renderer manual em canvas para ocupar melhor a area util e manter consistencia visual em series curtas e longas
- o bloco `Outras contas` da capa do periodo pode detalhar mais itens sem depender de pagina extra
