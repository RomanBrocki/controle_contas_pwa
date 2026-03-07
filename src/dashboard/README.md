# Dashboard BI

Esta pasta concentra a camada de BI do projeto.

O objetivo aqui nao e substituir o legado do controle mensal nem empurrar a analise para dentro do modal de relatorios. A proposta e manter uma area separada, testavel e iterativa para leitura executiva e exploracao dos dados.

---

## Objetivo funcional

O dashboard existe para responder perguntas como:

- quanto foi gasto no recorte selecionado
- quem pagou mais
- quanto do periodo foi dividido
- qual conta domina o recorte
- como cada conta evoluiu ao longo do tempo
- como os pagadores se equilibram

Tudo isso usando os mesmos dados do app principal, sem backend novo e sem custo adicional.

---

## Arquivo principal

- `DashboardView.jsx`

Esse arquivo hoje concentra:

- shell da tela
- filtros em abas
- KPIs
- blocos graficos
- sincronias entre visuais
- estados de foco e pagina

---

## Modelo de interacao

### Filtros reais

Os filtros do topo sao o recorte oficial do dashboard:

- periodo
- contas
- pagadores
- divididas / nao divididas

O usuario monta o rascunho dos filtros e so recalcula os blocos quando clica em **Atualizar dashboard**.

### Foco sincronizado

Alguns graficos conversam entre si sem alterar o filtro real. Esse foco temporario sincroniza:

- `Top 5`
- `Ranking`
- `Evolucao por conta`
- `Contas nos ultimos 12 meses`

Isso permite navegacao de estilo BI sem baguncar o recorte principal.

---

## Blocos atuais

- cards de resumo
- acerto entre pagadores
- maior conta/categoria
- pagadores
- top 5 contas + outros
- ranking paginado
- evolucao por conta
- contas nos ultimos 12 meses
- categorias ao longo do tempo

---

## Regras arquiteturais

- preferir componentes e helpers novos dentro de `src/dashboard/`
- evitar empurrar logica analitica para `ReportsModal.jsx`
- preservar a navegacao atual do app
- tratar filtros do topo como fonte de verdade
- tratar sincronias entre graficos como foco temporario
- nao alterar contratos globais do app sem necessidade real

---

## Validacao manual minima

1. abrir `#/dashboard`
2. validar filtros e resumo aplicado
3. clicar em `Atualizar dashboard`
4. validar cards, ranking, top 5 e visoes temporais
5. validar sincronia entre ranking, top 5, evolucao e ultimos 12 meses
6. voltar para `#/mes` e confirmar que o controle segue intacto

---

## Observacoes de evolucao

Melhorias futuras provaveis:

- tooltips mais ricos
- cross-filter mais forte entre visuais
- drillthrough controlado para detalhe
- refinamento fino de responsividade

O principio continua o mesmo: evolucao incremental, com baixo risco para o legado.
