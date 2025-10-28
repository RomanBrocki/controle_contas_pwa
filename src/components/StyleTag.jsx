function StyleTag() {
      return (
        <style>{`
:root {
  --radius: 16px;

}

/* ==== THEMES ==== */
.theme-gunmetal {
  --bg: #0e1218; --surface: #141923; --text: #e5e7eb; --muted: #93a1b1;
  --primary: #22d3ee; --primary-600: #06b6d4; --accent: #ff38a1; --danger: #ef4444;
  --border: #232a36; --chip: #1a2130; --glow: 0 0 24px rgba(34,211,238,.25), 0 0 4px rgba(34,211,238,.4);
}
.theme-synth {
  --bg: #0a1114; --surface: #101a1f; --text: #e6fffb; --muted: #8abcb6;
  --primary: #2dd4bf; --primary-600: #14b8a6; --accent: #f472b6; --danger: #ef4444;
  --border: #1b2a2f; --chip: #0f1a1e; --glow: 0 0 18px rgba(45,212,191,.22);
}
/* Light metálico — foco em contraste e superfícies prateadas */
.theme-light {
  --bg: #edf1f5; /* steel 50 */
  --surface: #ffffff; /* metal plate */
  --text: #0b1220;
  --muted: #475569;
  --primary: #3b82f6;
  --primary-600: #2563eb;
  --accent: #22c55e;
  --danger: #dc2626;
  --border: #d7e0ea; /* hairline cool gray */
  --chip: #f5f7fa; /* light chip */
  --glow: 0 0 16px rgba(59,130,246,.20);
}
:root {
  /* Paleta neutra para PDFs */
  --chart-bg-pdf: #ffffff;
  --chart-text-pdf: #1f2937;    /* cinza-escuro */
  --chart-line-pdf: #4b5563;    /* cinza médio */
  --chart-colors-pdf: #3b82f6, #10b981, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #84cc16, #ec4899;
}

/* ==== BASE ==== */
* { box-sizing: border-box; }
body, #root { background: var(--bg); color: var(--text); }
.card { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius); padding:16px; transition: transform .15s ease, box-shadow .2s ease; }
.btn { border-radius: 9999px; padding: 8px 14px; font-weight:600; }
.btn.primary { background: var(--primary); color:#0a0a0a; box-shadow: var(--glow); }
.btn.ghost { background:transparent; border:1px solid var(--border); color:var(--text); }
.btn.danger { background:var(--danger); color:#0a0a0a; }
.badge { background:var(--chip); color:var(--muted); border-radius:9999px; padding:4px 8px; font-size:12px; }
.overlay {
  position: fixed;
  inset: 0;
  background: #000 !important;     /* opaco de verdade */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483647 !important;   /* garante que fica acima de tudo */
}

/* Base opaca (sem vidro) */
.modal {
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  padding: 24px;
  animation: pop-in .18s ease;
}
/* Vidro (use .modal.glass onde quiser translucidez) */
.modal.glass {
  background: rgba(20,25,35,.9);
  backdrop-filter: blur(8px);
}
.theme-light .modal.glass {
  background: rgba(255,255,255,.95);
}

/* Opaco explícito (use .modal.solid para forçar) */
.modal.solid {
  background: var(--surface) !important;
  color: var(--text) !important;
  backdrop-filter: none !important;
  opacity: 1 !important;
}

input.input, select.select { background: #0c0f14; color: var(--text); border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
/* Ajustes de campo no tema claro para contraste adequado */
.theme-light input.input, .theme-light select.select { background: #ffffff; color: #0b1220; border-color: #d7e0ea; }
.theme-light .modal { background: #fff !important; color:#0b1220; }

/* Brand */
.brand { font-size: 2.125rem; font-weight: 800; letter-spacing:.5px; background: linear-gradient(90deg, var(--primary), var(--accent)); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 24px rgba(34,211,238,.25); }

/* Animations */
@keyframes pop-in { from { opacity:0; transform: scale(.98); } to { opacity:1; transform: scale(1); } }
.pop { animation: pop-in .18s ease; }
.pulse { box-shadow: 0 0 0 0 rgba(34,211,238,.35); animation: pulse 600ms ease-out; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34,211,238,.45); transform: scale(1.01);} 100% { box-shadow: 0 0 0 12px rgba(34,211,238,0); transform: scale(1);} }

/* ==== RESPONSIVO & AJUSTES MÓVEIS ==== */

/* garante que o “fundo de fora” siga o tema (corrige o Claro Metálico) */
html { background: var(--bg); }

/* mobile-first: modal full-screen no celular */
@media (max-width: 767.98px) {
  .modal {
    width: 100vw;
    height: 100vh;
    max-width: none;      /* ignora max-w-lg em telas pequenas */
    border-radius: 0;
    padding: 16px;
    overflow: auto;
  }
  .brand { font-size: clamp(1.5rem, 6vw, 2rem); }
}

/* telas médias+ : modal confortável e rolável se precisar */
@media (min-width: 768px) {
  .modal { max-height: 90vh; overflow: auto; }
}

/* toques mais confortáveis em qualquer tela */
.btn { min-height: 40px; }
.input, .select { min-height: 40px; }

/* Centraliza o grid principal e limita largura */
main.grid { max-width: 72rem; margin-inline: auto; }

/* Evita título “espremido” no modal e melhora respiro */
.modal h2 { margin: 0 0 12px; line-height: 1.2; }

/* Garante que o conteúdo do modal role e o rodapé fique visível */
.modal { display: flex; flex-direction: column; }
.modal .content { flex: 1 1 auto; overflow: auto; }
.modal .footer { margin-top: 12px; }

/* Botões de ação sempre “tocáveis” */
.modal .footer .btn { min-height: 40px; }

/* Extra: espaço no fundo para não “sumir” botão em telas pequenas */
@media (max-width: 767.98px) {
  .modal { padding-bottom: 16px; }
}

/* ===== Sub-bloco de seleção de mês/ano (reutilizável) ===== */
.subpick {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  margin-top: 6px;
}
.subpick h3 {
  text-align: center;
  font-weight: 600;
  margin: 0 0 10px 0;
  letter-spacing: .2px;
}
.subpick .row {
  display: grid;
  grid-template-columns: 1fr 1fr; /* ano | mês lado a lado também no mobile */
  gap: 8px;
}
.subpick .cell { display: flex; align-items: center; gap: 6px; }
.subpick label { font-size: .9rem; opacity: .75; white-space: nowrap; }

/* === Modal "Contas Pendentes" totalmente opaco === */
.modal.solid {
  background-color: var(--surface) !important;
  color: var(--text) !important;
  opacity: 1 !important;
  backdrop-filter: none !important;
  box-shadow: 0 0 24px rgba(0,0,0,0.4); /* leve destaque para não "fundir" com o fundo */
}

/* Tema claro: fundo branco real, sem alpha */
body.theme-light .modal.solid {
  background-color: #ffffff !important;
}

/* Tema synth: leve brilho ciano */
body.theme-synth .modal.solid {
  background-color: #101a1f !important;
  box-shadow: 0 0 24px rgba(45,212,191,.25);
}

/* Tema gunmetal: fundo uniforme, mais contraste */
body.theme-gunmetal .modal.solid {
  background-color: #141923 !important;
}

/* Overlay mais escura/sem transparência visível para o lembrete */
.overlay.hard { background: rgba(0,0,0,0.88) !important; }

/* Chips de contas: texto quebra em múltiplas linhas sem colar no checkbox */
.account-chip { padding: 10px 12px; }
.account-chip__text {
  display: inline-block;
  line-height: 1.25;
  word-break: break-word;
  overflow-wrap: anywhere;
}



`}</style>
      );
    }