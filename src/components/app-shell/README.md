# App Shell Components

Componentes visuais pequenos da shell autenticada.

Arquivos:

- `AppChrome.jsx`
  - topo global exibido apos login
  - dispara chat interno, pendencias e logout
  - fica desacoplado da regra de sessao, que mora em `src/app-shell/runtime.js`

Diretriz:

- manter estes componentes focados em apresentacao e eventos de UI
- evitar acesso direto ao Supabase aqui
