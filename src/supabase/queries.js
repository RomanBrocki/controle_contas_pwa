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
// Nenhum filtro de usuário (auth) ainda.
//

import { supabase, CURRENT_UID } from './client.js';

// helper de UID (mock agora, auth real no futuro)
function uid() {
  return (window.MOCK_AUTH && window.MOCK_AUTH.user_id) || CURRENT_UID;
}

// Nome da tabela
const TABLE = 'controle_contas';

// -----------------------------
// 🔍 Listar contas de um mês
// -----------------------------
export async function listMes(ano, mes) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', uid())
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
  const { data, error } = await supabase
    .from(TABLE)
    .select('ano')
    .eq('user_id', uid())
    .order('ano', { ascending: false });

  if (error) return [];
  // remove duplicados
  return Array.from(new Set(data.map(d => d.ano)));
}

// -----------------------------
// 📆 Listar meses por ano
// -----------------------------
export async function listMonthsByYear(ano) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('mes')
    .eq('user_id', uid())
    .eq('ano', ano)
    .order('mes', { ascending: false });

  if (error) return [];
  return Array.from(new Set(data.map(d => d.mes)));
}

// -----------------------------
// 🙋 Quem pagou (distinct)
// -----------------------------
export async function payersDistinct() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('quem_pagou')
    .eq('user_id', uid());

  if (error) return [];
  return Array.from(new Set(data.map(d => d.quem_pagou).filter(Boolean)));
}

// -----------------------------
// 💳 Contas distintas (nomes únicos)
// -----------------------------
export async function contasDistinct() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta')
    .eq('user_id', uid());

  if (error) return [];
  return Array.from(new Set(data.map(d => d.nome_da_conta).filter(Boolean)));
}

// 💳 Contas distintas dos últimos 12 meses
export async function contasDistinctUltimos12() {
  const TABLE = 'controle_contas';
  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setFullYear(hoje.getFullYear() - 1);

  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta, data_de_pagamento')
    .eq('user_id', uid())
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
  const d = new Date(conta.data_de_pagamento); // espera 'YYYY-MM-DD'
  const safe = {
    user_id: uid(),                 // obrigatório na PWA
    nome_da_conta: conta.nome_da_conta,
    valor: conta.valor,
    data_de_pagamento: conta.data_de_pagamento,
    instancia: conta.instancia ?? null,
    quem_pagou: conta.quem_pagou,
    dividida: !!conta.dividida,           // força boolean
    link_boleto: conta.link_boleto ?? null,
    link_comprovante: conta.link_comprovante ?? null,
    ano: conta.ano ?? d.getFullYear(),
    mes: conta.mes ?? (d.getMonth() + 1),
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
  const d = conta.data_de_pagamento ? new Date(conta.data_de_pagamento) : null;
  const safe = {
    nome_da_conta: conta.nome_da_conta,
    valor: conta.valor,
    data_de_pagamento: conta.data_de_pagamento,
    instancia: conta.instancia ?? null,
    quem_pagou: conta.quem_pagou,
    dividida: conta.dividida !== undefined ? !!conta.dividida : undefined,
    link_boleto: conta.link_boleto ?? null,
    link_comprovante: conta.link_comprovante ?? null,
    // se a data mudou e ano/mes não vieram, recalcula
    ...(d && (conta.ano === undefined) ? { ano: d.getFullYear() } : {}),
    ...(d && (conta.mes === undefined) ? { mes: (d.getMonth() + 1) } : {}),
  };

  // remove chaves undefined (supabase não curte)
  Object.keys(safe).forEach(k => safe[k] === undefined && delete safe[k]);

  const { error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq('id', id)
    .eq('user_id', uid()); // guard

  if (error) {
    console.error('[updateConta] Erro:', error);
    return false;
  }
  return true;
}


// 🗑️ Excluir conta (com guard de usuário)
export async function deleteConta(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', uid()); // guard

  if (error) {
    console.error('[deleteConta] Erro:', error);
    return false;
  }
  return true;
}

// ===== profile =====
// Tabela "profile": user_id (uuid) PK/FK, email text, payers_default text[], theme text,
// chart_accounts text[]
export async function getProfile() {
  const { data, error } = await supabase
    .from('profile')
    .select('user_id, email, theme, chart_accounts')
    .eq('user_id', uid())
    .maybeSingle();
  if (error) {
    console.warn('[getProfile] erro:', error);
    return null;
  }
  if (!data) return null;

    // garante array válido
  const chart_accounts = Array.isArray(data.chart_accounts) ? data.chart_accounts : [];
  return { ...data, chart_accounts };
}

export async function upsertProfile(p) {
  // guarda sempre sob o mesmo user_id do login
  const payload = { user_id: uid() };
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


