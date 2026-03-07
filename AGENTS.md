# AGENTS.md

## Objetivo deste repositório

Este projeto e um PWA de controle de contas com:

- frontend client-side em React UMD + Babel no navegador
- Tailwind via CDN
- Supabase como auth e banco
- Chart.js e jsPDF para relatorios
- deploy estatico, sem build, via GitHub Pages

O objetivo do agente neste repositório e evoluir o produto sem quebrar o fluxo atual de:

- login
- listagem mensal
- cadastro, edicao e exclusao de contas
- pendencias
- configuracoes
- relatorios atuais
- exportacao de PDF
- funcionamento PWA/offline

## Modo de trabalho esperado

O agente tem autonomia para implementar mudancas, desde que siga estas regras:

1. Trabalhar em passos pequenos, testaveis e observaveis pelo usuario.
2. Priorizar mudancas aditivas e isoladas.
3. Nao refatorar o legado por iniciativa propria se isso aumentar risco de regressao.
4. Nao remover fluxos existentes sem pedido explicito.
5. Antes de editar, explicar rapidamente o que sera alterado.
6. Depois de cada etapa, informar:
   - o que mudou
   - como validar manualmente
   - risco residual
   - proximo passo sugerido

## Regra principal: preservar o legado

O comportamento atual do app e considerado legado funcional e deve ser preservado.

Ao implementar novas funcionalidades:

- evitar reescrever `PostLoginMock.jsx`, `ReportsModal.jsx` e fluxo atual de auth sem necessidade real
- preferir extensoes por novos componentes, novos helpers e novas rotas
- manter compatibilidade com os objetos globais ja usados pelo projeto
- nao alterar contratos existentes de `window.SupabaseQueries`, `window.SupabaseMutations`, `window.DataAdapter` e `window.AppRoutes` sem necessidade

Se uma mudanca no legado for inevitavel, ela deve ser:

- minima
- local
- explicada antes
- validada logo depois

## Estrutura desejada para o Dashboard

Toda nova funcionalidade de BI/dashboard deve ser isolada em uma pasta propria:

- `src/dashboard/`

Preferencias de organizacao:

- componentes visuais do dashboard em `src/dashboard/`
- logica de agregacao do dashboard em arquivos proprios dentro de `src/dashboard/` ou `src/features/`, sem misturar com relatorios atuais
- novos utilitarios devem ser criados de forma aditiva
- o dashboard deve entrar por rota propria, preferencialmente `#/dashboard`

O dashboard nao deve substituir nem embaralhar o fluxo atual de relatorios. A ideia e coexistencia, nao migracao.

## Escopo e restricoes de plataforma

- Sem custo adicional.
- Manter compatibilidade com Supabase free.
- Manter compatibilidade com GitHub Pages.
- Preferir processamento no cliente.
- Evitar qualquer dependencia que exija backend proprio.
- Evitar bibliotecas pesadas sem ganho claro.

## Arquitetura real do projeto

### Entrada e bootstrap

- `index.html` carrega React UMD, ReactDOM, Babel, Tailwind e os componentes JSX em ordem
- o mount da aplicacao ocorre em `root.render(<App />)`
- alguns arquivos sao ES modules e outros dependem de globais no `window`

### Arquivos principais

- `src/components/App.jsx`: sessao, logout e gate de autenticacao
- `src/components/LoginGate.jsx`: login e signup no Supabase
- `src/components/PostLoginMock.jsx`: tela principal, estado geral, cards, pendencias e modais
- `src/components/ReportsModal.jsx`: relatorios atuais, graficos e PDF
- `src/components/EditPopup.jsx`: cadastro e edicao
- `src/components/SettingsModal.jsx`: preferencias do usuario
- `src/supabase/client.js`: client do Supabase
- `src/supabase/queries.js`: consultas e mutacoes
- `src/data-adapter.js`: adaptacao dos dados do banco para a UI
- `src/router.js`: router hash-based
- `src/features/charts.js`: configuracao e renderizacao de graficos
- `src/features/pdf.js`: exportacao de PDF
- `sw.js`: cache offline

## Convencoes tecnicas importantes

1. Nao ha build step.
   JSX e transformado no navegador.

2. O projeto mistura:
   - componentes JSX carregados por `<script type="text/babel">`
   - modulos ES carregados por `<script type="module">`

3. Existe dependencia de globais em `window`, especialmente:
   - `window.SupabaseClient`
   - `window.SupabaseQueries`
   - `window.SupabaseMutations`
   - `window.DataAdapter`
   - `window.AppRoutes`
   - `window.MOCK_AUTH`

4. Mudancas em arquivos novos carregados no bootstrap exigem cuidado em:
   - `index.html`
   - `sw.js`

5. Se adicionar ou renomear arquivos carregados pela app:
   - atualizar `sw.js`
   - revisar `CACHE_NAME`

## Regras para novas implementacoes

Ao criar novas features:

- preferir novos arquivos em vez de expandir arquivos grandes existentes
- encapsular logica nova
- evitar duplicacao de regra de negocio quando puder criar helper claro
- manter nomenclatura consistente com o projeto
- nao introduzir TypeScript, bundler ou frameworks novos sem pedido explicito

## Regras especificas para BI/Dashboard

Ao implementar o dashboard:

1. Comecar por uma tela placeholder ou shell navegavel.
2. Depois adicionar filtros.
3. Depois KPIs.
4. Depois graficos.
5. Por fim, detalhamento interativo.

Cada fase deve ser validavel isoladamente pelo usuario.

Exemplo de sequencia esperada:

1. botao e rota do dashboard
2. estrutura visual base
3. filtros e carregamento de dados
4. cards de resumo
5. graficos principais
6. drill-down por categoria
7. refinamentos visuais

## Validacao obrigatoria por etapa

Sempre que concluir uma etapa, o agente deve informar como validar manualmente.

Checklist base:

- a tela principal continua abrindo
- login continua funcionando
- listagem mensal continua carregando
- editar/salvar/excluir continua funcionando
- relatorios atuais continuam abrindo
- PDF continua exportando, se a etapa tiver tocado nessa area
- dashboard novo abre sem afetar a navegacao existente

## O que evitar

- refatoracao ampla do codigo legado sem necessidade
- mover arquivos antigos de lugar sem ganho real
- alterar schema do banco sem alinhamento previo
- introduzir dependencia paga
- quebrar o funcionamento offline por esquecer de atualizar o `sw.js`
- misturar dashboard novo dentro do modal gigante de relatorios se puder usar tela separada

## Como responder ao usuario neste projeto

Quando estiver implementando, o agente deve:

- ser direto
- mostrar progresso curto e objetivo
- explicitar suposicoes
- sinalizar risco de regressao quando existir
- fechar cada etapa com instrucoes de validacao

Quando a solicitacao for grande, o agente deve quebrar em etapas executaveis sem esperar que o usuario detalhe tudo.

## Pasta reservada para dashboard

A area oficial para a nova funcionalidade de BI fica em:

- `src/dashboard/`

Se houver componentes, helpers ou estilos especificos do dashboard, a preferencia e mantelos ali sempre que isso nao entrar em conflito com convencoes ja estabelecidas.
