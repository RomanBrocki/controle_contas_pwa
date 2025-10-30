# 💸 Controle de Contas — PWA (porta do Streamlit)
App de contas domésticas em **HTML + React UMD + Tailwind + Supabase**, rodando 100% no browser, com **relatórios em PDF** gerados no cliente e **múltiplos temas**.

> Este projeto é o passo intermediário entre o app original em Streamlit e uma PWA React organizada. Aqui a gente já tem:
> - mock de login,
> - leitura/gravação no Supabase,
> - tela mensal funcional,
> - modais de edição, configurações e relatórios,
> - geração de PDF (mensal e período),
> - e gráficos do Chart.js forçados para tema de PDF.

---

## 🗂 Estrutura de Pastas e Arquivos

```text
├─ index.html                         # ponto de entrada; carrega React UMD, Tailwind CDN e todos os JSX
├─ src/
│  ├─ data-adapter.js                 # camada “bonita” de dados: pega do Supabase e devolve no formato que a UI espera
│  ├─ router.js                       # SPA simples baseada em hash (#/mes, #/relatorios)
│  ├─ supabase/
│  │  ├─ client.js                    # inicializa o Supabase + CURRENT_UID (mock)
│  │  └─ queries.js                   # consultas e mutações (contas, profile, listas distintas, últimos 12 meses, etc.)
│  ├─ features/
│  │  ├─ charts.js                    # helpers de gráficos + “ChartFeatures” usados no ReportsModal e nos PDFs
│  │  └─ pdf.js                       # helpers de PDF (exporta 2 canvases por página, aplica tema PDF, etc.)
│  └─ components/
│     ├─ StyleTag.jsx                 # temas (gunmetal, synth, light) + tokens para PDF + base dos modais
│     ├─ LoginGate.jsx                # login mock (futuro: Supabase Auth)
│     ├─ PostLoginMock.jsx            # shell pós-login (header, cards do mês, pendências, modais)
│     ├─ ContaCard.jsx                # card de cada conta do mês
│     ├─ EditPopup.jsx                # modal de criar/editar conta (com “Outro…” para pagador e links)
│     ├─ SettingsModal.jsx            # configurações de perfil (email, tema, contas para gráficos)
│     ├─ ReportsModal.jsx             # central de relatórios: mensal, período e comparativos
│     └─ App.jsx                      # escolhe entre LoginGate e PostLoginMock e injeta StyleTag
```

---

## ⚙️ Fluxo Geral do App

1. **index.html** sobe React, Tailwind e Babel direto no navegador.  
2. **App.jsx** verifica se há uma sessão mock no `window.MOCK_AUTH`.  
   - se **não** tiver → mostra **LoginGate.jsx**;  
   - se **tiver** → mostra **PostLoginMock.jsx** (a tela toda).  
3. **LoginGate.jsx** hoje só cria um objeto de auth fake e devolve para o App. Isso já deixa o caminho pronto para trocar por `supabase.auth.signInWithPassword(...)` depois.  
4. **PostLoginMock.jsx** é onde tudo acontece:
   - carrega **anos** e **meses por ano** reais do Supabase;
   - monta o **resumo do mês** (total, seletor de ano/mês);
   - busca **pendências** comparando mês atual x mês anterior;
   - busca **itens do mês** via `DataAdapter.fetchMes(...)`;
   - renderiza lista de contas com **ContaCard.jsx**;
   - abre **EditPopup.jsx**, **SettingsModal.jsx**, e **ReportsModal.jsx**.

---

## 🧠 Camada de Dados

### 1. `src/supabase/client.js`
- inicializa o client do Supabase com **URL** e **anon key**;
- deixa disponível um **CURRENT_UID (mock)** no `window`.

### 2. `src/supabase/queries.js`
- contém todas as **funções de acesso ao banco** (listar, inserir, atualizar, apagar, perfis e listas).

### 3. `src/data-adapter.js`
- adapta os dados crus do banco para o formato visual do app (nomes, links, agrupamentos).

---

## 🎨 Estilos e Temas (`StyleTag.jsx`)
Define três temas (`gunmetal`, `synth`, `light`) com variáveis CSS e tokens de cor usados também nos PDFs.
Controla também aparência dos modais e do overlay escuro.

---

## 🧍🏽‍♂️ Fluxo Pós-Login (`PostLoginMock.jsx`)
Gerencia toda a interface após login:
- header com botões (Nova Conta, Relatórios, Configurações);
- overlay de pendências;
- seletor de ano/mês;
- cards de contas;
- modais: editar, configurações e relatórios.

---

## 📑 Central de Relatórios (`ReportsModal.jsx`)
Reúne todas as funções de geração de relatórios e PDFs:
1. **Mensal** — pizza, comparativos e listagem por pagador.
2. **Período** — pizza consolidada, linhas e tabelas por mês.
3. **Comparativos** — gráficos em tempo real com exportação PNG e PDF.

---

## 📊 Gráficos (`src/features/charts.js`)
Define e aplica o estilo global do Chart.js.  
Fornece funções para gerar pizza, barras e linhas e ajustar o tema para PDF.

---

## 🧾 PDF Helpers (`src/features/pdf.js`)
Oferece `exportTwoPerPage()` para montar PDF 2-a-2 por página com margens e espaçamento.

---

## 👤 Perfil e Configurações
`SettingsModal.jsx` salva email, tema e contas para gráficos no Supabase.  
Aplica tema e sincroniza pagadores com os encontrados no banco.

---

## 🛡️ Login (mock) e Futuro Auth
Atualmente é simulado via `LoginGate.jsx`.  
Futuro: integração direta com `supabase.auth.signInWithPassword` e RLS por usuário.

---

## 🧪 Como Rodar
1. Suba servidor local (ex.: `python -m http.server`).
2. Abra `index.html` no navegador.
3. Configure URL e anon key do Supabase.
4. Faça login mock e teste.

---

## 📌 Funcionalidades Atuais
- Listagem mensal (Supabase)
- CRUD de contas
- Links clicáveis (boleto e comprovante)
- Pendências do mês anterior
- Seletor de ano/mês
- Temas dinâmicos
- Perfil (email, tema, contas p/ gráficos)
- PDF mensal e PDF por período
- Gráficos comparativos e exportação
- Router hash (#/mes, #/relatorios)

---

## 🛣️ Próximos Passos
1. Substituir login mock por Supabase Auth.
2. Ligar `user_id` nas mutações e ativar RLS.
3. Fazer build real (sem Babel in-browser).
4. Adicionar manifest e service worker para PWA.
5. Modularizar ReportsModal.

---

## 📄 Créditos
- Código e lógica: **Roman Wladyslaw Brocki Neto**  
- Assistência técnica: **ChatGPT-5**  
- Ano: **2025**
