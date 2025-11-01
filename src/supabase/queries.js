// ============================================
// 📦 Supabase Queries - Controle de Contas PWA
// ============================================
//
// Contém funções de leitura e escrita
// compatíveis com o schema atual da tabela:
//
// public.controle_contas
//  id | ano | mes | nome_da_conta | valor | data_de_pagamento | ...
//
// Agora COM guard de UID.
//

import { supabase, CURRENT_UID } from './client.js';

function uid() {
  // 1) se o LoginGate já preencheu, usa ele
  if (window.MOCK_AUTH && window.MOCK_AUTH.user_id) {
    return window.MOCK_AUTH.user_id;
  }
  // 2) se o client já descobriu uma sessão e pendurou no window, usa
  if (window.SupabaseClient && window.SupabaseClient.__lastAuthUid) {
    return window.SupabaseClient.__lastAuthUid;
  }
  // 3) senão, sem UID → devolve null
  return null;
}

// Nome da tabela
const TABLE = 'controle_contas';

// -----------------------------
// 🔍 Listar contas de um mês
// -----------------------------
export async function listMes(ano, mes) {
  const u = uid();
  if (!u) {
    console.warn('[listMes] sem UID, retornando lista vazia');
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', u)
    .eq('ano', ano)
    .eq('mes', mes)
    .order('data_de_pagamento', { ascending: true });

  if (error) {
    console.error('[listMes] Erro:', error);
    return [];
  }
  return data || [];
}

// -----------------------------
// 📅 Listar anos distintos
// -----------------------------
export async function listYears() {
  const u = uid();
  if (!u) {
    console.warn('[listYears] sem UID, retornando []');
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('ano')
    .eq('user_id', u)
    .order('ano', { ascending: false });

  if (error) return [];
  // remove duplicados
  return Array.from(new Set(data.map(d => d.ano)));
}

// -----------------------------
// 📆 Listar meses por ano
// -----------------------------
export async function listMonthsByYear(ano) {
  const u = uid();
  if (!u) {
    console.warn('[listMonthsByYear] sem UID, retornando []');
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('mes')
    .eq('user_id', u)
    .eq('ano', ano)
    .order('mes', { ascending: false });

  if (error) return [];
  return Array.from(new Set(data.map(d => d.mes)));
}

// -----------------------------
// 🙋 Quem pagou (distinct)
// -----------------------------
export async function payersDistinct() {
  const u = uid();
  if (!u) {
    console.warn('[payersDistinct] sem UID, retornando []');
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('quem_pagou')
    .eq('user_id', u);

  if (error) return [];
  return Array.from(new Set(data.map(d => d.quem_pagou).filter(Boolean)));
}

// -----------------------------
// 💳 Contas distintas (nomes únicos)
// -----------------------------
export async function contasDistinct() {
  const u = uid();
  if (!u) {
    console.warn('[contasDistinct] sem UID, retornando []');
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta')
    .eq('user_id', u);

  if (error) return [];
  return Array.from(new Set(data.map(d => d.nome_da_conta).filter(Boolean)));
}

// 💳 Contas distintas dos últimos 12 meses
export async function contasDistinctUltimos12() {
  const u = uid();
  if (!u) {
    console.warn('[contasDistinctUltimos12] sem UID, retornando []');
    return [];
  }

  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setFullYear(hoje.getFullYear() - 1);

  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta, data_de_pagamento')
    .eq('user_id', u)
    .gte('data_de_pagamento', limite.toISOString().split('T')[0])
    .order('data_de_pagamento', { ascending: false });

  if (error) {
    console.error('[contasDistinctUltimos12] Erro:', error);
    return [];
  }

  const nomes = Array.from(new Set((data || [])
    .map(d => d.nome_da_conta)
    .filter(Boolean)));

  return nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// ➕ Inserir nova conta (PWA): garante campos mínimos
export async function insertConta(conta) {
  const u = uid();
  if (!u) {
    console.error('[insertConta] sem UID, abortando insert');
    return false;
  }

  // ✅ extrai ano/mês da string, sem Date (pra não cair pro dia anterior)
  let anoFromIso = null;
  let mesFromIso = null;
  if (conta.data_de_pagamento) {
    const [yyyy, mm] = conta.data_de_pagamento.split('-');
    anoFromIso = Number(yyyy);
    mesFromIso = Number(mm);
  }

  const safe = {
    user_id: u,
    nome_da_conta: conta.nome_da_conta,
    valor: conta.valor,
    data_de_pagamento: conta.data_de_pagamento,
    instancia: conta.instancia ?? null,
    quem_pagou: conta.quem_pagou,
    dividida: !!conta.dividida,
    link_boleto: conta.link_boleto ?? null,
    link_comprovante: conta.link_comprovante ?? null,
    ano: conta.ano ?? anoFromIso,
    mes: conta.mes ?? mesFromIso,
  };

  const { error } = await supabase.from(TABLE).insert([safe]);
  if (error) {
    console.error('[insertConta] Erro:', error);
    return false;
  }
  return true;
}


// ✏️ Atualizar conta existente (com guard de usuário)
export async function updateConta(id, conta) {
  const u = uid();
  if (!u) {
    console.error('[updateConta] sem UID, abortando update');
    return false;
  }

  let anoFromIso = null;
  let mesFromIso = null;
  if (conta.data_de_pagamento) {
    const [yyyy, mm] = conta.data_de_pagamento.split('-');
    anoFromIso = Number(yyyy);
    mesFromIso = Number(mm);
  }
  const safe = {
    nome_da_conta: conta.nome_da_conta,
    valor: conta.valor,
    data_de_pagamento: conta.data_de_pagamento,
    instancia: conta.instancia ?? null,
    quem_pagou: conta.quem_pagou,
    dividida: conta.dividida !== undefined ? !!conta.dividida : undefined,
    link_boleto: conta.link_boleto ?? null,
    link_comprovante: conta.link_comprovante ?? null,
    ...(conta.data_de_pagamento && conta.ano === undefined ? { ano: anoFromIso } : {}),
    ...(conta.data_de_pagamento && conta.mes === undefined ? { mes: mesFromIso } : {}),
  };

  Object.keys(safe).forEach(k => safe[k] === undefined && delete safe[k]);

  const { error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq('id', id)
    .eq('user_id', u); // guard

  if (error) {
    console.error('[updateConta] Erro:', error);
    return false;
  }
  return true;
}

// 🗑️ Excluir conta (com guard de usuário)
export async function deleteConta(id) {
  const u = uid();
  if (!u) {
    console.error('[deleteConta] sem UID, abortando delete');
    return false;
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', u); // guard

  if (error) {
    console.error('[deleteConta] Erro:', error);
    return false;
  }
  return true;
}

// ===== profile =====
export async function getProfile() {
  const u = uid();
  if (!u) {
    console.warn('[getProfile] sem UID, retornando null');
    return null;
  }

  const { data, error } = await supabase
    .from('profile')
    .select('user_id, email, theme, chart_accounts')
    .eq('user_id', u)
    .maybeSingle();
  if (error) {
    console.warn('[getProfile] erro:', error);
    return null;
  }
  if (!data) return null;

  const chart_accounts = Array.isArray(data.chart_accounts) ? data.chart_accounts : [];
  return { ...data, chart_accounts };
}

export async function upsertProfile(p) {
  const u = uid();
  if (!u) {
    console.error('[upsertProfile] sem UID, abortando');
    return false;
  }

  const payload = { user_id: u };
  if ('email' in p) payload.email = p.email ?? null;
  if ('theme' in p) payload.theme = p.theme ?? 'gunmetal';
  if ('chart_accounts' in p) payload.chart_accounts = (p.chart_accounts || []).slice(0, 7);

  const { error } = await supabase.from('profile').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    console.error('[upsertProfile] erro:', error);
    return false;
  }
  return true;
}

window.SupabaseQueries = {
  listYears,
  listMonthsByYear,
  listMes,
  payersDistinct,
  contasDistinct,
  contasDistinctUltimos12,
  getProfile,
  upsertProfile,
  insertConta,
  updateConta,
  deleteConta,
};
window.SupabaseMutations = {
  insertConta,
  updateConta,
  deleteConta,
};


