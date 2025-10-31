// src/data-adapter.js
import { listMes } from './supabase/queries.js';

// Função que o React (no script Babel) vai chamar sem usar import()
async function fetchMes(y, m) {
  const rows = await listMes(Number(y), Number(m));
  return (rows || []).map(r => ({
    id: r.id,
    nome: r.nome_da_conta,
    instancia: r.instancia || '',
    valor: (r.valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    data: (() => {
      const s = r.data_de_pagamento; // "2025-10-31"
      if (!s) return '';
      const [yyyy, mm, dd] = s.split('-');
      return `${dd}/${mm}/${yyyy}`;
    })(),
    quem: r.quem_pagou,
    dividida: !!r.dividida,
    links: {
      boleto: r.link_boleto || '',
      comp: r.link_comprovante || ''
    }
  }));
}

// expõe no escopo global para o script Babel
window.DataAdapter = { fetchMes };
