# 💸 Controle de Contas — PWA

**Controle de Contas** é uma aplicação **Progressive Web App (PWA)** desenvolvida em **React UMD + Tailwind + Supabase**, que permite gerenciar e visualizar contas mensais, gerar relatórios completos (em PDF e gráficos interativos) e manter dados sincronizados por usuário autenticado.

A arquitetura é modular, legível e projetada para funcionar **100% client-side**, sem build tools — ideal para hospedar em **GitHub Pages** ou ambientes estáticos.

---

## 🚀 Principais Recursos

- **Autenticação real com Supabase** (login e cadastro por e-mail/senha)  
- **Perfil por usuário**, com tema, e seleção de contas favoritas para gráficos  
- **Dashboard mensal interativo**: cards de contas, pendências e totais  
- **Edição completa de contas** com links de boleto e comprovante clicáveis  
- **Relatórios formais em PDF** (mensal e por período, com gráficos)  
- **Gráficos comparativos** (pizza, barras e linhas) com seleção dinâmica  
- **Temas visuais**: Gunmetal Neon, Synthwave Teal e Claro Metálico  
- **Funcionamento offline via Service Worker**  
- **Modo PWA instalável** (ícones, splash, standalone)  

---

## 🧱 Estrutura de Pastas

```text
├─ index.html                         # Ponto de entrada — carrega React UMD, Tailwind e todos os JSX
├─ manifest.json                      # Manifest PWA (ícones, tema, start_url)
├─ sw.js                              # Service Worker (cache first, offline básico)
├─ src/
│  ├─ data-adapter.js                 # Adaptador de dados: formata respostas Supabase para a UI
│  ├─ router.js                       # Router SPA baseado em hash (#/mes, #/relatorios)
│  ├─ supabase/
│  │  ├─ client.js                    # Inicializa o Supabase e expõe no window
│  │  └─ queries.js                   # Consultas e mutações: contas, perfil, listas e filtros
│  ├─ features/
│  │  ├─ charts.js                    # Configurações globais e renderizadores Chart.js (pizza, barras, linhas)
│  │  └─ pdf.js                       # Exportador PDF (2 gráficos por página, tema PDF, links clicáveis)
│  ├─ icons/
│  │  ├─ icon-192.png                 # Ícone menor do PWA
│  │  └─ icon-512.png                 # Ícone maior (Android/instalação)
│  └─ components/
│     ├─ StyleTag.jsx                 # CSS global + tokens de tema e ajustes responsivos
│     ├─ LoginGate.jsx                # Tela de login/cadastro Supabase
│     ├─ PostLoginMock.jsx            # Shell pós-login (dashboard, cards, modais)
│     ├─ ContaCard.jsx                # Card individual de conta (valor, pagador, links)
│     ├─ EditPopup.jsx                # Modal de criação/edição de conta
│     ├─ SettingsModal.jsx            # Configurações do perfil (e-mail, tema e contas de gráfico)
│     ├─ ReportsModal.jsx             # Central de relatórios (mensal, período e comparativos)
│     └─ App.jsx                      # Componente raiz (controle de sessão, logout e roteamento)
```

---

## ⚙️ Fluxo de Autenticação

1. **LoginGate.jsx** usa `supabase.auth.signInWithPassword()` para autenticação real.  
   - Modo “Criar conta” faz `signUp()` e alterna para login automático ou aviso de confirmação.  
2. O App mantém o estado `authed` e reflete em `window.MOCK_AUTH` (compatibilidade com código legado).  
3. O UID autenticado é lido globalmente via `window.SupabaseClient.__lastAuthUid`.

---

## 🧩 Integração com Supabase

- O **cliente** (`client.js`) é inicializado globalmente:
  ```js
  export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  ```
- Todas as operações de CRUD e leitura passam por `queries.js`, com **guard de UID**:
  - `listMes()` – lista contas de um mês  
  - `insertConta()`, `updateConta()`, `deleteConta()` – operações com `user_id` obrigatório  
  - `getProfile()` e `upsertProfile()` – controle de tema, e-mail e seleção de contas para gráficos  

Os resultados são adaptados por `data-adapter.js` para exibição formatada (datas pt-BR, valores em R$).

---

## 🎨 Interface e Temas

**StyleTag.jsx** injeta todas as variáveis de tema no DOM (`--bg`, `--text`, `--primary`, etc.)  
Três temas estão disponíveis:
- **Gunmetal Neon** — padrão, fundo escuro com ciano  
- **Synthwave Teal** — variação mais viva e futurista  
- **Claro Metálico** — superfícies prateadas e contraste alto  

Todos os componentes reagem automaticamente à classe de tema (`theme-gunmetal`, `theme-synth`, `theme-light`).

---

## 📊 Gráficos e Relatórios

A renderização é feita com **Chart.js 3.9.1** e **chartjs-plugin-datalabels**.

### 1️⃣ Gráficos Interativos
- **Pizza:** com linhas externas, anticolisão e legenda circular  
- **Barras:** comparativos mês vs mês anterior / mesmo mês do ano anterior  
- **Linhas:** evolução de contas ao longo de um período

### 2️⃣ Relatórios PDF
Gerados por `jsPDF`:
- **Mensal:** Pizza + Resumo + Barras + Listagem detalhada (com links clicáveis)  
- **Período:** Pizza consolidada + Linhas 2-up + Tabelas mensais segmentadas  
- Função `exportTwoPerPage()` (em `pdf.js`) monta dois gráficos por página com margens e espaçamento automáticos.

### 3️⃣ Comparativos
A aba **“Gráficos comparativos”** do `ReportsModal` permite gerar e baixar PNG ou PDF dos gráficos diretamente na tela.

### 🤬 Fale com Tosco

O **Fale com Tosco** é uma função cômica que simula um **“Fale Conosco” sem suporte real**.  
Ela foi criada para dar um toque de humor ao app e entreter o usuário em momentos de frustração — afinal, o Tosco responde, mas **não ajuda em nada**.

Ao clicar no botão **“🤬 Fale com Tosco”**, no topo da tela principal, abre-se um pequeno chat local onde o “atendente” envia respostas automáticas, aleatórias e sarcásticas — como um *easter egg* escondido no aplicativo.

**Características:**
- 💬 Nenhum backend ou IA — todas as respostas são locais e aleatórias.  
- 🧠 O Tosco tem dezenas de frases pré-programadas com ironias, desculpas e conselhos inúteis.  
- 🔒 Nenhuma mensagem é salva nem enviada — tudo acontece apenas no navegador.  
- 🎭 É uma brincadeira, não um canal real de suporte.

**Localização no código:**
- Gatilho: botão “🤬 Fale com Tosco” → [`App.jsx`](./src/components/App.jsx)  
- Lógica e respostas: [`PostLoginMock.jsx`](./src/components/PostLoginMock.jsx)

**Exemplo de conversa:**

🧑 Você: Tá travando de novo!
🤬 Tosco: Já tentou colocar no arroz?

🧑 Você: Acho que bugou.
🤬 Tosco: Hmm, interessante….

---

## 💾 Cache e Offline (Service Worker)

Arquivo: **`sw.js`**

- Implementa cache local básico (`cache-first`) para páginas, scripts JSX e assets locais.  
- Scripts externos (React, Tailwind, Supabase, Chart.js, Babel, jsPDF) são sempre carregados via CDN.  
- Na atualização, o `activate` remove caches antigos (`contas-pwa-v3`).

---

## 📱 Instalação PWA

Arquivo: **`manifest.json`**

- `display: "standalone"` — o app abre como aplicativo nativo  
- Ícones:
  - `icons/icon-192.png`
  - `icons/icon-512.png`
- `start_url` e `scope` ajustados para `/controle_contas_pwa/` (compatível com GitHub Pages)
- Cor principal: `#0f172a`

O `index.html` registra o Service Worker automaticamente:
```js
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(() => {
    console.log("✅ Service Worker registrado.");
  });
}
```

---

## 🧭 Navegação SPA

Arquivo: **`router.js`**

- Implementa roteamento baseado em `window.location.hash`
- Roteia para:
  - `#/mes` → tela mensal
  - `#/relatorios` → central de relatórios
- Mantém estado e evita recarregar a página

---

## 🧠 Componentes Principais

| Componente | Função |
|-------------|--------|
| **App.jsx** | Gerencia autenticação, sessão e tema global |
| **LoginGate.jsx** | Tela de login e cadastro Supabase |
| **PostLoginMock.jsx** | Dashboard pós-login: cards, pendências, modais |
| **ContaCard.jsx** | Renderiza cada conta mensal (valor, data, links) |
| **EditPopup.jsx** | Modal para criar/editar conta com validações |
| **SettingsModal.jsx** | Configura e salva preferências de usuário (tema, email, contas) |
| **ReportsModal.jsx** | Interface de relatórios (mensal, período e comparativos) |
| **StyleTag.jsx** | CSS injetado dinamicamente com variáveis e temas |

---

## 🧰 Stack Técnica

| Área | Tecnologia |
|------|-------------|
| Frontend | React 18 (UMD) + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth) |
| Charts | Chart.js 3.9.1 + chartjs-plugin-datalabels |
| PDF | jsPDF 2.5.1 |
| PWA | Manifest + Service Worker (cache-first) |
| Build | Nenhum — Babel transforma JSX no navegador |
| Hosting | GitHub Pages (estático, com offline) |

---

## 🔒 Segurança e Escopo

Cada usuário só acessa seus próprios registros:
- Todas as queries Supabase filtram por `user_id`
- RLS (Row-Level Security) deve estar **ativado** no Supabase com políticas por usuário

---

## 🧾 Banco de Dados — Estrutura

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

---

## 🧑‍💻 Execução Local

1. Clone o repositório https://github.com/RomanBrocki/controle_contas_pwa .  
2. Abra `index.html` no navegador (não requer servidor).  
3. Configure o `SUPABASE_URL` e `SUPABASE_KEY` em `src/supabase/client.js` se for usar seu próprio backend.  
4. O app funcionará offline após o primeiro carregamento.

---

## 🧩 Deploy (GitHub Pages)

1. Crie o repositório `controle_contas_pwa`.  
2. Configure o GitHub Pages com **branch `main` / pasta raiz**.  
3. Certifique-se de que `start_url` e `scope` em `manifest.json` estejam corretos:
   ```json
   "start_url": "/controle_contas_pwa/",
   "scope": "/controle_contas_pwa/"
   ```
4. Após o deploy, acesse:
   ```
   https://<usuario>.github.io/controle_contas_pwa/
   ```

---

## 🧭 Créditos e Licença

Desenvolvido por **Roman W. Brocki Neto** — projeto pessoal para controle financeiro familiar, evoluído em PWA completo.

Licença: **MIT**  
Frameworks: React, Tailwind, Supabase, Chart.js, jsPDF.
