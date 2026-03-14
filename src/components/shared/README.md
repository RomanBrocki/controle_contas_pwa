# Shared UI Components

Esta pasta concentra componentes pequenos e reutilizaveis carregados no runtime global do app.

O projeto mistura scripts Babel e modulos ES. Por isso, alguns componentes visuais compartilhados ainda vivem como funcoes globais carregadas pelo `index.html`.

Arquivos atuais:

- `InfoTooltip.jsx`
  - tooltip pequeno usado para ajuda contextual
- `MonthPickerBlocks.jsx`
  - blocos de selecao de ano/mes reutilizados por telas legadas e pelo modal de relatorios

Diretrizes:

- manter esses componentes pequenos, puros e sem dependencia de estado do app
- preferir receber tudo por props
- quando um componente for reutilizado por mais de uma area, ele deve sair de arquivos gigantes e entrar aqui
