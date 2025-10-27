# 💸 Controle de Contas — PWA com Supabase (Port do Streamlit)

Aplicação web moderna para **controle doméstico de contas**, desenvolvida como **PWA 100% client‑side** (HTML + React UMD + Tailwind).  
Este projeto é um **porte do app em Streamlit**: https://controlecontasapp-atdnfadfgd3ibqjsgj6v3p.streamlit.app/

---

## 🧩 Arquitetura do Projeto

```
controle_contas_pwa/
├── index.html                # App principal (React + Tailwind + Babel no browser)
├── src/
│   ├── router.js             # Roteamento SPA por hash (#/mes, #/relatorios)
│   ├── data-adapter.js       # Adaptação dos dados vindos do Supabase para a UI
│   ├── supabase/
│   │   ├── client.js         # Inicialização do cliente Supabase (anon key + RLS)
│   │   └── queries.js        # Consultas (anos, meses, mês atual) e CRUD
│   └── features/
│       ├── charts.js         # Gráficos (Chart.js + datalabels + outlabels)
│       └── pdf.js            # Helpers de exportação (2 gráficos por página)
```

- **Roteamento:** hash‑based SPA (`#/mes`, `#/relatorios`), sem recarregar a página.
- **Dados:** Supabase direto no front (Anon Key) com **RLS ativo**.
- **UI:** React (UMD) + Tailwind; Babel Standalone (apenas para prototipagem).

---

## 🚀 Tecnologias

- **React 18 (UMD)** — renderização client‑side
- **Tailwind CSS** — utilitários e temas
- **Chart.js** + **chartjs-plugin-datalabels** + **piechart-outlabels**
- **jsPDF** — exportação de múltiplos gráficos em PDF
- **Supabase** — banco, API e RLS
- **Babel** — transpila JSX no navegador (dev/prototipagem)

---

## 🎨 Temas

Três temas prontos no CSS do `index.html`:
- 🧊 **Gunmetal Neon** (escuro padrão)
- 🪩 **Synthwave Teal**
- 🌤️ **Claro Metálico** (claro; com ajustes de contraste para gráficos no app)

Para PDF, há uma paleta **PDF‑friendly** separada em `:root` (`--chart-*-pdf`), aplicada automaticamente na exportação para fundo branco.

---

## 📊 Gráficos e Relatórios (Comparativos)

**Comparativos** (modal “Relatórios → Comparativos”):
- **🍕 Pizza**: mês único ou período
  - Rótulo interno ≥ ~8%; fatias pequenas usam rótulo externo com linha e anti‑colisão.
- **📈 Linhas**: por conta, apenas quando há **reincidência ≥ 2 meses** no período.
- **📊 Barras**: mês único, comparando **mês atual x mês anterior** e **mês atual x mesmo mês do ano anterior**.
  - No app, limite prático de leitura: **até 7 contas**.

**Exportação:**
- **PNG**: baixa o **primeiro** gráfico renderizado no modal.
- **PDF (todos)**: exporta **todos os gráficos renderizados**, **2 por página**, com ajuste automático de tema PDF.

---

## 🖼️ Exportação PDF

Implementada em `src/features/pdf.js`:
- `exportTwoPerPage(canvases, filename, { margin, gap })`
- Aplica `--chart-*-pdf` (texto e linhas mais escuros) antes de capturar as imagens dos canvases.
- Restaura o tema do app após a exportação.

---

## 🗂️ Base de Dados (Supabase)

Tabela atual (exemplo) — `public.controle_contas`:
- `id` (PK), `ano`, `mes`, `nome_da_conta`, `valor`, `data_de_pagamento`,
- `instancia`, `quem_pagou`, `dividida` (bool), `link_boleto`, `link_comprovante`.

**Consultas disponíveis (src/supabase/queries.js):**
- `listMes(ano, mes)` — itens do mês
- `listYears()` — anos distintos (ordenados DESC)
- `listMonthsByYear(ano)` — meses distintos do ano (ordenados DESC)
- `payersDistinct()` e `contasDistinct()` — listas únicas
- `insertConta`, `updateConta`, `deleteConta` — CRUD

**Planejado (autenticação e multi‑usuário):**
- Criar coluna **`user_id`** (UUID/ref `auth.users`), com índices.
- Ajustar **RLS** para filtrar registros por usuário autenticado.
- Atualizar inserções/edições para preencher `user_id`.
- Preparar migração/seed para dados históricos sem `user_id` (atribuição retroativa).

---

## ✅ O que já está funcionando

- Tela **Mês** (listar, criar, editar, excluir) com total do mês e links de boleto/comprovante.
- **Gráficos Comparativos** completos e dinâmicos:
  - Seleção de alcance (mês/período) e **contas** derivadas **do próprio intervalo**.
  - Geração de **pizza**, **linhas** (quando aplicável) e **barras**.
  - **Baixar PNG** e **Baixar PDF (todos)** com 2 gráficos por página.
- Paleta e contraste **automaticamente ajustados** no app e **otimizados para PDF**.

---

## 🛣️ Roadmap (próximas etapas)

1) **Relatórios PDF completos**
   - **Mensal**: pizza do mês + resumo por pessoa + listagem consolidada com links.
   - **Período**: pizza agregada + comparativos + listagem resumida do intervalo.
   - Reutilizar canvases já renderizados no modal.

2) **Autenticação (página de login)**
   - Tela de **login** (Supabase Auth).
   - **RLS** por usuário e fallback de sessão anônima (somente leitura, se desejado).
   - Rotas protegidas e estado global de sessão.

3) **Adequação da base para multi‑acesso**
   - Inclusão de coluna **`user_id`** e migração de dados antigos.
   - Policies de RLS por `user_id`.
   - Ajustes no CRUD para sempre enviar/validar `user_id`.

4) **Temas padronizados e tokens CSS**
   - Consolidar `--chart-1..8`, `--chart-label-*` por tema (manutenção simples).
   - Charts passam a consumir **apenas** tokens (nada hardcoded).
5) **(Opcional) PWA completo**
   - Refatoração do HTML para melhor manutenção.
6) **(Opcional) PWA completo**
   - Manifest, ícones e instalação “Add to Home Screen”.
   - Build sem Babel Standalone (Tailwind + bundler), minificação e cache estático.

---

## 🧪 Execução local (dev)

1. Sirva a pasta com um server estático (VS Code Live Server ou `python -m http.server`).  
2. Abra `index.html`.  
3. Configure `src/supabase/client.js` com **URL** e **Anon Key** do seu projeto (RLS ativo).

> **Atenção**: em produção, evite `Babel Standalone` e `cdn.tailwindcss.com`. Prefira build com bundler e Tailwind JIT.

---

## 📄 Licença

Uso pessoal e educacional.  
© 2025 — Desenvolvido por **Roman Wladyslaw Brocki Neto** com auxílio do ChatGPT‑5.
