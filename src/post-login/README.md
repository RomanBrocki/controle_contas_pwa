# Post Login Runtime

Esta pasta concentra helpers de dominio do fluxo principal depois do login.

Objetivo:

- tirar regras pequenas e repetidas de `PostLoginMock.jsx`
- documentar o contrato do shell principal sem misturar com a camada visual
- manter transformacoes de dados e estados de edicao em um ponto previsivel

Arquivo atual:

- `helpers.js`
  - normalizacao de chaves das contas
  - calculo de mes anterior
  - saneamento de URLs externas
  - montagem do draft de salvamento
  - montagem dos estados de criacao/edicao
  - resposta aleatoria do modal "Fale com Tosco"
- `runtime.js`
  - resolucao da view a partir do hash
  - registro controlado de `window.AppRoutes` como espelho de compatibilidade
  - invocacao centralizada de rotas pelo runtime novo
  - navegacao para `#/mes` e `#/dashboard`
  - assinatura de eventos globais da shell
  - controle padrao de toast temporario
- `workflows.js`
  - bootstrap inicial da shell do controle
  - carga composta de mes, pendencias e pagadores
  - persistencia com recarga do mes atual
- `controller.js`
  - hook controlador da shell pos-login
  - centralizacao dos estados principais da tela autenticada
  - orquestracao de efeitos, timers, toasts e acoes da shell
- `data.js`
  - carregamento de periodos disponiveis
  - carregamento de profile, contas e pagadores
  - leitura do mes atual e calculo de pendencias
  - persistencia de criar, editar, excluir contas e salvar configuracoes

Contrato de runtime:

- exposto como `window.PostLoginHelpers`
- exposto como `window.PostLoginRuntime`
- exposto como `window.PostLoginData`
- exposto como `window.PostLoginWorkflows`
- exposto como `window.PostLoginController`
- usado pela shell principal do controle
- deve continuar pequeno, explicito e sem efeitos colaterais
- a renderizacao visual de toasts, header e paineis mensais deve permanecer em `src/components/post-login/`
- `SettingsModal.jsx` e `ReportsModal.jsx` devem receber callbacks e dados desta camada, sem chamar globais legadas diretamente
