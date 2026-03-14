# Roadmap de Evolucao

Este roadmap define prioridades de evolucao para manter o projeto organizado, previsivel e facil de sustentar.

O foco aqui e orientar manutencao, modularizacao adicional e validacao continua sem alterar a UX.

---

## Objetivos

- manter todas as funcionalidades atuais
- manter a interface e os fluxos percebidos pelo usuario
- melhorar legibilidade, coesao e previsibilidade do codigo
- reduzir duplicacoes e helpers espalhados
- documentar melhor os contratos do runtime
- preparar terreno para manutencao mais rapida e segura

---

## Principios de execucao

1. Fazer mudancas pequenas e observaveis.
2. Priorizar extracoes aditivas antes de reestruturar arquivos grandes.
3. Validar manualmente ao fim de cada etapa.
4. Nao misturar reorganizacao interna com mudancas de UX.
5. Preservar compatibilidade com Supabase free, GitHub Pages e PWA offline.

---

## Fases recomendadas

### Fase 1. Documentacao e contratos

Meta:

- deixar claro como o projeto funciona hoje
- registrar fronteiras sensiveis
- iniciar consolidacao de helpers pequenos e repetidos

Entregas tipicas:

- README reforcado
- docs de arquitetura
- docs de roadmap
- helpers compartilhados pequenos

### Fase 2. Fundacao compartilhada

Meta:

- consolidar regras comuns em modulos menores e reutilizaveis

Entregas tipicas:

- helpers de datas, filtros e formatacao
- normalizadores de dados
- adaptadores de selecao e periodos

### Fase 3. Shell do controle

Meta:

- reduzir o tamanho e a responsabilidade de `PostLoginMock.jsx`

Entregas tipicas:

- runtime pequeno para sessao e perfil global
- chrome autenticado em componente proprio
- runtime pequeno para rotas, eventos globais e toasts do pos-login
- workflows pequenos para composicao assincrona do pos-login
- hook/controlador da shell principal
- subcomponentes de header e toolbar
- bloco de pendencias isolado
- bloco de resumo mensal isolado
- servicos locais de carregamento e sincronizacao

### Fase 4. Relatorios

Meta:

- separar `ReportsModal.jsx` em partes menores sem alterar os PDFs

Entregas tipicas:

- helpers de periodo
- camada DOM auxiliar para preview/PDF
- renderizadores locais por tipo de relatorio
- builders formais de PDF isolados do JSX
- workflows de preview/download mais isolados
- funcoes de exportacao mais isoladas

### Fase 5. Dashboard

Meta:

- quebrar `DashboardView.jsx` em componentes e agregadores claros

Entregas tipicas:

- pasta de blocos visuais
- helpers de agregacao
- hooks ou funcoes de aplicacao de filtros
- modulo de orquestracao do estado analitico
- docs especificas da camada BI

### Fase 6. Revisao final

Meta:

- conferir paridade funcional antes de consolidar no `main`

Entregas tipicas:

- checklist final de validacao
- limpeza de comentarios mortos
- README final consolidado
- documento de regressao e gate de consolidacao

---

## Checklist minimo por etapa

- login continua funcionando
- listagem mensal continua carregando
- criar/editar/excluir continua funcionando
- pendencias continuam calculando
- configuracoes continuam abrindo e salvando
- relatorios atuais continuam abrindo
- PDF continua exportando quando a etapa tocar nessa area
- dashboard continua abrindo sem afetar `#/mes`
- PWA nao perde arquivos por falta de update no `sw.js`

---

## Quando consolidar no main

So vale publicar ou consolidar quando:

- a versao estiver funcionalmente equivalente ao comportamento esperado do produto
- a documentacao refletir a nova organizacao
- as etapas de validacao manual estiverem fechadas
- os pontos mais sensiveis da arquitetura estiverem claros e controlados
