# Mapa de Arquitetura

Este documento descreve como o app esta organizado hoje e quais fronteiras devemos preservar para manter a arquitetura clara e sustentavel.

O principio central e simples: manter a estrutura interna clara, a UX estavel e a compatibilidade com GitHub Pages + Supabase free.

---

## 1. Bootstrap da aplicacao

Arquivos:

- `index.html`
- `manifest.json`
- `sw.js`

Responsabilidades:

- carregar React UMD, ReactDOM, Babel, Tailwind e os scripts da aplicacao
- manter a ordem de carga correta entre JSX Babel, scripts normais e modulos ES
- registrar o service worker
- garantir instalacao e atualizacao do PWA

Riscos de mudanca:

- qualquer arquivo novo usado em runtime precisa entrar no `index.html`
- qualquer arquivo novo carregado pela app precisa entrar em `sw.js`
- alteracoes no versionamento do PWA exigem revisar query strings e `CACHE_NAME`

---

## 2. Contratos globais do runtime

Contratos atuais em `window`:

- `window.SupabaseClient`
- `window.SupabaseQueries`
- `window.SupabaseMutations`
- `window.DataAdapter`
- `window.AppRoutes`
- `window.MOCK_AUTH`
- `window.AppShellRuntime`
- `window.AppDateUtils`
- `window.PostLoginHelpers`
- `window.PostLoginRuntime`
- `window.PostLoginData`
- `window.PostLoginWorkflows`
- `window.PostLoginController`
- `window.ReportsHelpers`
- `window.ReportsDom`
- `window.ReportsRenderers`
- `window.ReportsPdfBuilders`
- `window.ReportsWorkflows`
- `window.DashboardHelpers`
- `window.DashboardOrchestration`

Por que isso existe:

- o projeto mistura scripts Babel com modulos ES
- parte da aplicacao consome dependencias por globais, nao por import/export
- a ordem de carga no HTML funciona como cola de integracao
- no estado atual, esses globais permanecem como contratos de runtime e espelhos de compatibilidade, nao como dependencia direta dos componentes principais

Diretriz profissional:

- nao remover esses contratos sem necessidade real
- quando for preciso criar reutilizacao nova, preferir helper global pequeno e bem documentado a duplicar regra de negocio em arquivos grandes

---

## 3. Camada de dados

Arquivos:

- `src/supabase/client.js`
- `src/supabase/queries.js`
- `src/data-adapter.js`
- `src/post-login/data.js`
- `src/reports/helpers.js`
- `src/reports/dom.js`
- `src/reports/renderers.js`
- `src/reports/pdf-builders.js`
- `src/reports/workflows.js`

Responsabilidades:

- inicializar o client do Supabase
- descobrir usuario autenticado
- encapsular leituras e mutacoes por usuario
- adaptar o retorno do banco para o formato consumido pela UI legada

Diretriz profissional:

- manter `queries.js` como fronteira de acesso ao banco
- mover regras repetidas de mapeamento/formatacao para helpers pequenos e puros
- evitar espalhar chamadas diretas ao Supabase pelos componentes

---

## 4. Shell da aplicacao

Arquivos:

- `src/app-shell/runtime.js`
- `src/components/App.jsx`
- `src/components/LoginGate.jsx`
- `src/components/app-shell/*.jsx`
- `src/post-login/helpers.js`
- `src/post-login/runtime.js`
- `src/post-login/data.js`
- `src/post-login/workflows.js`
- `src/post-login/controller.js`
- `src/components/PostLoginMock.jsx`
- `src/components/post-login/*.jsx`
- `src/components/StyleTag.jsx`

Responsabilidades:

- sessao sincronizada entre Supabase e runtime da aplicacao
- sessao e autenticacao
- chrome global da area autenticada
- header, logout e acoes globais
- fluxo principal do controle mensal
- pendencias
- abertura de modais
- aplicacao de tema

Ponto de atencao:

- `src/app-shell/runtime.js` agora concentra as transicoes pequenas de sessao, hash inicial e profile global
- `src/components/app-shell/AppChrome.jsx` concentra o topo autenticado sem carregar regra de Supabase
- `src/post-login/runtime.js` concentra rotas, navegacao curta, eventos globais e toasts da shell do controle
- `src/post-login/workflows.js` concentra composicoes assincronas da shell do controle
- `src/post-login/controller.js` concentra o hook controlador da shell pos-login
- `PostLoginMock.jsx` fica progressivamente mais proximo de composicao visual
- `src/components/post-login/PostLoginToast.jsx` isola a apresentacao das notificacoes temporarias da shell autenticada
- a shell principal ja compartilha pequenos helpers em `src/post-login/helpers.js`
- leituras e mutacoes do fluxo principal passam a ser concentradas em `src/post-login/data.js`
- o caminho ativo de `App.jsx`, `SettingsModal.jsx` e `ReportsModal.jsx` passou a consumir runtime/dados novos, em vez de globais legadas diretas
- a manutencao desta area deve continuar priorizando modulos pequenos e contratos explicitos

---

## 5. Fluxos especializados

Arquivos:

- `src/components/shared/*.jsx`
- `src/components/reports/*.jsx`
- `src/components/ReportsModal.jsx`
- `src/reports/helpers.js`
- `src/reports/dom.js`
- `src/reports/renderers.js`
- `src/reports/pdf-builders.js`
- `src/reports/workflows.js`
- `src/dashboard/helpers.js`
- `src/dashboard/orchestration.js`
- `src/dashboard/legacy/*.jsx`
- `src/dashboard/components/*.jsx`
- `src/dashboard/DashboardView.jsx`
- `src/features/charts.js`
- `src/features/pdf.js`

Responsabilidades:

- relatórios formais
- exportacao de PDF
- leitura analitica do dashboard
- renderizacao de graficos e temas visuais dos charts

Ponto de atencao:

- `ReportsModal.jsx` e `DashboardView.jsx` ainda sao os maiores orquestradores da interface
- a area de relatorios agora ja delega renderers locais, DOM auxiliar, builders formais de PDF e workflows de comparativo para `src/reports/*.js`
- no dashboard, a maior parte dos blocos visuais ja foi extraida para `src/dashboard/components/*.jsx`
- o estado compartilhado do dashboard passa a ser consolidado em `src/dashboard/orchestration.js`
- o snapshot tecnico do dashboard fica arquivado em `src/dashboard/legacy/`, sem entrar no bootstrap atual
- a melhoria desejada agora e continuar reduzindo estados auxiliares e responsabilidades residuais sem quebrar a compatibilidade do runtime

---

## 6. Estrategia segura de evolucao

Sequencia recomendada:

1. documentar o que existe
2. extrair helpers pequenos e repetidos
3. isolar estado e logica de leitura em modulos menores
4. quebrar componentes gigantes em subcomponentes testaveis
5. revisar nomes, comentarios e responsabilidades
6. so depois otimizar pontos de performance claros

O que nao fazer:

- reescrever tudo de uma vez
- trocar contratos globais por uma arquitetura nova sem plano incremental
- alterar UX junto com reorganizacao interna
- esquecer de atualizar `index.html` e `sw.js`

---

## 7. Definicao de sucesso

Uma mudanca conta como evolucao saudavel quando:

- a interface continua igual para o usuario
- os fluxos principais continuam funcionando
- o codigo fica mais facil de localizar, entender e alterar
- a documentacao acompanha a nova organizacao
- o risco de regressao cai, nao sobe
