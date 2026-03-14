# App Shell Runtime

Esta pasta concentra contratos pequenos da shell autenticada do app.

Objetivo:

- isolar regras de sessao hoje espalhadas entre `App.jsx` e `LoginGate.jsx`
- manter compatibilidade com o runtime baseado em `window`
- evitar duplicacao de regra de login, logout, hash atual e perfil global

Arquivos:

- `runtime.js`
  - resolve a secao atual a partir do hash
  - mantem cache proprio da sessao autenticada
  - espelha a sessao do Supabase em `window.MOCK_AUTH` apenas por compatibilidade
  - preserva `window.SupabaseClient.__lastAuthUid`
  - carrega e sincroniza o profile em cache proprio e em `window.AppState.profile`
  - centraliza logout e eventos globais da shell

Contrato global:

- `window.AppShellRuntime`

Diretriz:

- manter esta camada pequena e previsivel
- deixar componentes visuais consumirem essa API, em vez de manipular globais direto
- o caminho ativo da UI nao deve depender de `window.MOCK_AUTH` diretamente
