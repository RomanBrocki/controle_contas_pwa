# Post Login

Esta pasta concentra blocos especificos da shell principal depois do login.

Objetivo:

- organizar a camada visual da area autenticada
- concentrar header, resumo mensal, pendencias, chat e notificacoes em componentes claros
- manter o fluxo principal do controle previsivel e facil de evoluir

Arquivos atuais:

- `ControlMonthSummary.jsx`
  - resumo do mes e seletores de ano/mes da home
- `PendingAccountsOverlay.jsx`
  - overlay de pendencias comparando o mes atual com o anterior
- `SelfChatModal.jsx`
  - easter egg "Fale com Tosco"
- `PostLoginHeader.jsx`
  - header principal, navegacao e acoes contextuais do app
- `MonthlyAccountsPanel.jsx`
  - estados visuais da lista mensal: loading, vazio e grid de cards
- `PostLoginToast.jsx`
  - notificacao temporaria da shell autenticada

Diretrizes:

- componentes daqui podem depender do contexto visual do fluxo de controle
- regras de negocio maiores continuam no shell principal ou em helpers dedicados
- helpers de dominio do shell ficam em `src/post-login/`
- estados, efeitos e orquestracao principal ficam em `src/post-login/controller.js`
- leituras e persistencia da shell ficam em `src/post-login/data.js`
- notificacoes pequenas e recorrentes da shell devem preferir componentes dedicados desta pasta
- se um bloco ficar reutilizavel por outras areas, ele deve migrar para `src/components/shared/`
