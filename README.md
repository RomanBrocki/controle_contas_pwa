# 💸 Controle de Contas — PWA

**Controle de Contas** é uma aplicação **Progressive Web App (PWA)** feita em **React UMD + Tailwind + Supabase**, voltada para controle financeiro mensal, relatórios formais em PDF e análise visual via dashboard BI.

O projeto roda **100% client-side**, sem build tool e sem backend próprio. A ideia central é manter tudo simples para operar em **Supabase free + GitHub Pages**, preservando o fluxo principal do app e acrescentando novas camadas de valor sem quebrar o legado.

---

## 🚀 Visão Geral

O app foi desenhado para registrar contas por usuário autenticado, separando cada lançamento por:

- **tipo da conta** (`nome_da_conta`)
- **instância**, quando existir (`instancia`)
- **quem pagou** (`quem_pagou`)
- **se a conta é dividida ou não** (`dividida`)
- **valor**
- **data de pagamento**
- **link de boleto**
- **link de comprovante**

Com esse modelo, o sistema consegue:

- mostrar o **controle mensal**
- destacar **pendências**
- gerar **relatórios mensais e por período**
- exportar **PDFs formais**
- montar um **dashboard BI** com filtros e leitura interativa

---

## ✨ Principais Recursos

- **Autenticação real com Supabase** por e-mail e senha
- **Separação por usuário** com `user_id`
- **Listagem mensal** das contas do período
- **Cadastro, edição e exclusão** de lançamentos
- **Pendências automáticas** comparando mês atual com mês anterior
- **Perfil por usuário**, com tema e preferências
- **Links clicáveis** de boleto e comprovante
- **Relatório mensal em PDF**
- **Relatório por período em PDF**
- **Dashboard BI em rota própria** (`#/dashboard`)
- **Funcionamento offline básico** com Service Worker
- **Instalação como PWA**

---

## 🧭 Fluxos Principais do Produto

### 1. Controle mensal

Fluxo principal do app:

- login
- seleção de ano e mês
- visualização dos cards/lançamentos do mês
- criação ou edição das contas
- acompanhamento do total do mês

### 2. Pendências

O sistema compara o mês atual com o mês anterior e aponta contas que ainda não foram relançadas.

Esse fluxo existe para acelerar o preenchimento recorrente do mês e continua sendo parte do legado funcional.

### 3. Relatórios

O modal de relatórios hoje expõe:

- **Relatório mensal**
- **Relatório por período**
- **Dashboard BI**

Os comparativos antigos continuam existindo no código legado, mas o dashboard passou a concentrar a leitura analítica mais rica e interativa.

### 4. Dashboard BI

O dashboard foi criado para coexistir com o legado, não para substituir o controle mensal.

Ele entra por:

- botão dentro de `Relatórios`
- rota própria `#/dashboard`

O dashboard trabalha em cima dos mesmos dados do app e respeita o filtro do topo antes de recalcular os blocos analíticos.

---

## 📊 Dashboard BI

A camada de BI fica isolada em `src/dashboard/` e foi pensada para não misturar regra analítica nova com o fluxo legado do controle e dos relatórios formais.

### Objetivo do dashboard

Entregar leitura executiva e analítica do período selecionado, mantendo o processamento local e sem custo adicional de infraestrutura.

### Filtros do dashboard

O dashboard trabalha com filtros em abas:

- **Período**
  - anos
  - meses
- **Contas**
  - tipos de conta encontrados no recorte de período
- **Pagador e divisão**
  - pagadores
  - divididas / não divididas

O comportamento é:

- o usuário monta o recorte
- o dashboard só recalcula quando clica em **Atualizar dashboard**
- se o filtro aplicado ficar vazio, o dashboard entra em **estado vazio guiado**

### Blocos analíticos atuais

- **KPIs principais**
  - total do período
  - valor total dividido
  - maiores gastos por pagador
- **Acerto entre pagadores**
- **Maior categoria / maior conta do recorte**
- **Quantidade de lançamentos**
- **Evolução por conta**
- **Top 5 contas + Outros**
- **Ranking de gastos**
- **Pagadores**
- **Contas nos últimos 12 meses**
- **Categorias ao longo do tempo**

### Interação entre blocos

Os blocos principais do dashboard conversam entre si por foco temporário:

- `Top 5`
- `Ranking`
- `Evolução por conta`
- `Contas nos últimos 12 meses`

Ao selecionar uma conta em um desses blocos, os demais sincronizam o destaque dessa mesma conta, sem alterar os filtros reais do topo.

### Regras de UX do dashboard

- o dashboard não altera a lógica do controle mensal
- o dashboard não substitui os relatórios formais
- o botão de `Pendências` não aparece na visão BI
- o usuário pode voltar para `#/mes` a qualquer momento

---

## 🧱 Estrutura de Pastas

```text
├─ index.html                         # Entrada da aplicação; carrega React UMD, Babel, Tailwind e os JSX
├─ manifest.json                      # Manifest do PWA
├─ sw.js                              # Service Worker e política de atualização/cache
├─ icons/
│  ├─ icon-192.png                    # Ícone padrão 192x192
│  ├─ icon-512.png                    # Ícone padrão 512x512
│  ├─ icon-192-launcher.png           # Ícone maskable/launcher 192x192
│  └─ icon-512-launcher.png           # Ícone maskable/launcher 512x512
├─ src/
│  ├─ data-adapter.js                 # Adapta dados do banco para o formato usado pela UI
│  ├─ router.js                       # Router hash-based
│  ├─ dashboard/
│  │  ├─ DashboardView.jsx            # Tela principal do dashboard BI
│  │  └─ README.md                    # Guia técnico da camada de BI
│  ├─ features/
│  │  ├─ charts.js                    # Renderização e helpers de gráficos
│  │  └─ pdf.js                       # Helpers de exportação de PDF
│  ├─ supabase/
│  │  ├─ client.js                    # Inicialização do Supabase
│  │  └─ queries.js                   # CRUD, perfil e consultas por mês/período
│  └─ components/
│     ├─ App.jsx                      # Componente raiz; sessão, header e logout
│     ├─ LoginGate.jsx                # Login/cadastro
│     ├─ PostLoginMock.jsx            # Shell pós-login e fluxo principal do controle
│     ├─ ContaCard.jsx                # Card individual de lançamento
│     ├─ EditPopup.jsx                # Modal de criação/edição
│     ├─ SettingsModal.jsx            # Perfil e preferências
│     ├─ ReportsModal.jsx             # Relatórios formais e entrada para o dashboard
│     └─ StyleTag.jsx                 # CSS global e temas
```

---

## 🧠 Arquitetura Real do Projeto

Este repositório não usa bundler. O app mistura:

- **scripts JSX carregados com `type="text/babel"`**
- **módulos ES com `type="module"`**
- **objetos globais em `window`**

Alguns contratos importantes:

- `window.SupabaseClient`
- `window.SupabaseQueries`
- `window.SupabaseMutations`
- `window.DataAdapter`
- `window.AppRoutes`
- `window.MOCK_AUTH`

Isso significa que:

- a ordem de carga dos scripts em `index.html` importa
- mudanças em arquivos novos precisam ser refletidas no `sw.js`
- refatorações grandes no legado são naturalmente mais arriscadas

---

## ⚙️ Fluxo de Autenticação

1. `LoginGate.jsx` usa `supabase.auth.signInWithPassword()` para autenticação.
2. Em cadastro, usa `signUp()`.
3. O app espelha o usuário autenticado em `window.MOCK_AUTH` por compatibilidade com o legado.
4. O profile do usuário é carregado depois do login.
5. Após autenticar, o fluxo padrão de entrada vai para `#/mes`.

---

## 🧩 Integração com Supabase

O cliente é inicializado em `src/supabase/client.js`.

As leituras e mutações passam por `src/supabase/queries.js`, incluindo:

- listagem mensal
- inserção
- atualização
- exclusão
- leitura de perfil
- gravação de perfil

O `data-adapter.js` organiza esses dados para a UI, lidando com:

- datas
- valores monetários
- nomes
- links
- estrutura consumida pelos cards e pelos relatórios

---

## 🗃️ Banco de Dados

Estrutura esperada:

```sql
create table public.controle_contas (
  id bigint generated by default as identity primary key,
  ano bigint not null,
  mes bigint not null,
  nome_da_conta text not null,
  valor numeric not null,
  data_de_pagamento date not null,
  instancia text null,
  quem_pagou text not null,
  dividida boolean not null,
  link_boleto text null,
  link_comprovante text null,
  user_id uuid not null
);

create table public.profile (
  user_id uuid primary key,
  email text null,
  theme text null,
  chart_accounts text[] null
);
```

### Significado prático do schema

- `nome_da_conta`: tipo da conta, como Escola, Luz, Empregada, Cartão etc.
- `instancia`: detalhamento adicional, como parcela, aluno, unidade, semanal, diária etc.
- `quem_pagou`: pagador responsável naquele lançamento
- `dividida`: informa se entra na lógica de balanço/acerto entre pagadores
- `link_boleto` e `link_comprovante`: preservam rastreabilidade do pagamento

---

## 🎨 Interface e Temas

Os temas são injetados por `StyleTag.jsx` com CSS variables.

Temas disponíveis:

- **Gunmetal Neon**
- **Synthwave Teal**
- **Claro Metálico**

O dashboard respeita o tema ativo da aplicação.

---

## 📑 Relatórios e PDFs

O app possui dois relatórios formais principais:

### Relatório mensal

Gera um PDF com:

- pizza do mês
- resumo por pagador
- barras comparativas
- listagem detalhada com links

### Relatório por período

Gera um PDF com:

- pizza consolidada do período
- gráficos de linha por conta
- tabelas segmentadas por mês

### Comparativos legados

Os comparativos continuam no código, mas deixaram de ser o caminho principal na UI.

O motivo é simples: o dashboard BI cobre melhor a leitura exploratória sem duplicar tanta navegação.

---

## 📈 Gráficos

O app usa **Chart.js 3.9.1** e **chartjs-plugin-datalabels**.

Tipos utilizados no sistema:

- pizza
- barras
- linhas
- composições analíticas do dashboard

No dashboard, parte da visualização é feita de forma mais leve e customizada, sem depender de uma nova biblioteca pesada de BI.

---

## 🤬 Fale com Tosco

Existe um microfluxo cômico chamado **Fale com Tosco**.

Ele:

- não usa IA real
- não envia nada para backend
- responde localmente com frases fixas/aleatórias
- serve como easter egg do projeto

Gatilho:

- topo do app, na área pós-login

Lógica:

- `App.jsx`
- `PostLoginMock.jsx`

---

## 📱 Navegação SPA

O roteamento é hash-based:

- `#/mes` → controle mensal
- `#/relatorios` → abre o modal de relatórios
- `#/dashboard` → dashboard BI

O router fica em `src/router.js` e chama handlers expostos pela própria app via `window.AppRoutes`.

---

## 💾 PWA, Cache e Atualização

Arquivos principais:

- `manifest.json`
- `sw.js`
- registro no `index.html`

### O que o PWA faz hoje

- instala o app
- mantém cache local dos arquivos do domínio
- funciona offline de forma básica
- tenta assumir a atualização assim que uma nova versão é publicada

### Estratégia atual de atualização

O `sw.js` atual:

- usa `CACHE_NAME` versionado
- chama `skipWaiting()` no install
- chama `clients.claim()` no activate
- usa atualização automática via registro do `index.html`
- revalida arquivos same-origin em rede quando possível

### Manifest

O `manifest.json` hoje inclui:

- `id`
- `start_url`
- `scope`
- `display: "standalone"`
- ícones padrão
- ícones `maskable`

### Observação prática

Depois de publicar uma nova versão:

1. abra o app online
2. aguarde o service worker novo assumir
3. faça um hard refresh na primeira validação, se necessário

Se a PWA instalada estiver presa numa versão antiga, limpar os dados do site/app resolve.

---

## 🧠 Componentes Principais

| Arquivo | Papel |
|--------|-------|
| `App.jsx` | sessão, header, logout e orquestração do topo |
| `LoginGate.jsx` | login e cadastro |
| `PostLoginMock.jsx` | fluxo principal do controle, pendências, modais e navegação interna |
| `ReportsModal.jsx` | relatórios formais e entrada para o dashboard |
| `DashboardView.jsx` | dashboard BI |
| `SettingsModal.jsx` | tema e preferências |
| `EditPopup.jsx` | criação/edição/exclusão |
| `ContaCard.jsx` | exibição do lançamento |
| `StyleTag.jsx` | CSS global, temas e ajustes visuais |

---

## 🧰 Stack Técnica

| Área | Tecnologia |
|------|------------|
| Frontend | React 18 UMD |
| UI | Tailwind via CDN |
| Banco/Auth | Supabase |
| Charts | Chart.js |
| PDF | jsPDF |
| Roteamento | hash router próprio |
| PWA | Manifest + Service Worker |
| Build | nenhum; Babel transpila JSX no navegador |
| Deploy | GitHub Pages |

---

## 🔒 Segurança e Escopo

Cada usuário só deve acessar seus próprios registros.

Premissas:

- `user_id` obrigatório nas operações
- RLS habilitado no Supabase
- políticas por usuário no banco

---

## 🧪 Execução Local

Para validar UI básica, dá para abrir localmente.

Para validar corretamente:

- service worker
- manifest
- cache
- fluxo PWA

o ideal é servir por HTTP estático.

Exemplo:

```powershell
python -m http.server 4173
```

Depois abra:

```text
http://localhost:4173/
```

---

## 🚀 Deploy em GitHub Pages

1. publique o repositório
2. aponte o GitHub Pages para a branch/pasta correta
3. confirme `start_url` e `scope` no `manifest.json`
4. publique
5. abra o app online para permitir atualização do service worker

URL esperada:

```text
https://<usuario>.github.io/controle_contas_pwa/
```

---

## 🛠️ Observações de Manutenção

- o projeto mistura JSX Babel e módulos ES
- globais em `window` fazem parte da arquitetura atual
- mudanças novas devem ser preferencialmente aditivas
- `PostLoginMock.jsx` e `ReportsModal.jsx` concentram muito comportamento legado
- o dashboard deve continuar isolado em `src/dashboard/`
- se adicionar arquivos carregados pela app, atualize `index.html` e `sw.js`

---

## 🧭 Créditos e Licença

Desenvolvido por **Roman W. Brocki Neto**.

Projeto pessoal de controle financeiro familiar evoluído para PWA com relatórios e dashboard BI.

Licença: **MIT**
