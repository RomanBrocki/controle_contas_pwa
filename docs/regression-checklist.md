# Checklist de Regressao

Este documento consolida a validacao manual recomendada antes de consolidar a branch profissional no `main`.

Objetivo:

- confirmar paridade funcional com o legado
- validar que a reorganizacao interna nao alterou UX
- reduzir risco de regressao nas areas mais sensiveis do app

---

## 1. Smoke test inicial

- abrir a app em HTTP estatico, por exemplo `py -m http.server 5500`
- validar que a home de login carrega sem erros visiveis
- confirmar que a PWA abre online e o service worker atual assume

---

## 2. Autenticacao e shell

- entrar com usuario valido
- criar conta nova de usuario, se desejar testar signup
- confirmar que o topo autenticado aparece corretamente
- validar `Controle`
- validar `Dashboard`
- validar `Relatorios`
- validar `Configuracoes`
- validar `Fale com tosco`
- validar `Sair`

---

## 3. Controle mensal

- abrir `#/mes`
- trocar ano e mes
- confirmar total do mes
- validar lista carregada
- abrir estado vazio, se houver mes sem dados
- criar conta
- editar conta
- excluir conta
- validar toast de sucesso e erro

---

## 4. Pendencias

- abrir overlay de pendencias
- confirmar calculo comparando mes atual e mes anterior
- usar `Lancar agora`
- validar que os dados entram pre-preenchidos em `Nova conta`

---

## 5. Configuracoes

- abrir modal
- alterar tema
- salvar
- confirmar aplicacao visual do tema
- marcar contas de grafico
- salvar novamente
- reabrir e confirmar persistencia

---

## 6. Relatorios

- abrir modal de relatorios
- validar painel inicial
- validar seletores de mes e periodo em ordem de janeiro a dezembro
- gerar `Relatorio mensal (PDF)`
- gerar `Relatorio periodo (PDF)`
- confirmar que os PDFs respeitam as contas definidas em `Configuracoes`
- confirmar pizza `Top 10 + Outros` nos PDFs quando houver muitas contas

### Comparativos do modal

- testar `Mes unico`
- testar `Periodo`
- trocar tipo de grafico
- selecionar e limpar contas
- gerar preview
- baixar PDF de comparativos

---

## 7. Dashboard

- abrir `#/dashboard`
- aplicar filtros
- clicar em `Atualizar dashboard`
- validar KPIs
- validar Pareto
- validar Top 5
- validar Ranking
- validar Pagadores
- validar Evolucao por conta
- validar Ciclo anual
- clicar numa conta para focar
- clicar novamente para desfocar
- paginar cards quando houver multiplas paginas

---

## 8. PWA e offline

- abrir a app online e aguardar atualizacao do service worker
- fazer refresh forte
- recarregar com a rede indisponivel
- confirmar que a app continua abrindo em modo offline basico

---

## 9. Gate de consolidacao

A branch fica pronta para consolidacao no `main` quando:

- todos os fluxos acima estiverem validados
- o README principal refletir a arquitetura atual
- `index.html` e `sw.js` estiverem alinhados com os arquivos novos carregados pela app
- os PDFs e o dashboard estiverem com paridade funcional observada
- nao houver regressao visual ou de navegacao percebida
