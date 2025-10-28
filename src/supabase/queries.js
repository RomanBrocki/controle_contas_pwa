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


// Nome da tabela
const TABLE = 'controle_contas';

// -----------------------------
// 🔍 Listar contas de um mês
// -----------------------------
export async function listMes(ano, mes) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', CURRENT_UID)
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
    .eq('user_id', CURRENT_UID)
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
    .eq('user_id', CURRENT_UID)
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
    .eq('user_id', CURRENT_UID);

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
    .eq('user_id', CURRENT_UID);

  if (error) return [];
  return Array.from(new Set(data.map(d => d.nome_da_conta).filter(Boolean)));
}

// 💳 Contas distintas dos últimos 12 meses
export async function contasDistinctUltimos12() {
  const hoje = new Date();
  const limite = new Date();
  limite.setFullYear(hoje.getFullYear() - 1);

  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta, data_de_pagamento')
    .eq('user_id', CURRENT_UID)
    .gte('data_de_pagamento', limite.toISOString().split('T')[0])
    .order('data_de_pagamento', { ascending: false });

  if (error) {
    console.error('[contasDistinctUltimos12] Erro:', error);
    return [];
  }

  const nomes = Array.from(new Set(data.map(d => d.nome_da_conta).filter(Boolean)));
  return nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}


// ➕ Inserir nova conta (PWA): garante campos mínimos
export async function insertConta(conta) {
  const d = new Date(conta.data_de_pagamento); // espera 'YYYY-MM-DD'
  const safe = {
    user_id: CURRENT_UID,                 // obrigatório na PWA
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
    .eq('user_id', CURRENT_UID); // guard

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
    .eq('user_id', CURRENT_UID); // guard

  if (error) {
    console.error('[deleteConta] Erro:', error);
    return false;
  }
  return true;
}


// 🔹 Anos e meses reais do Supabase
window.SupabaseQueries = { listYears, listMonthsByYear, listMes, payersDistinct, contasDistinct, contasDistinctUltimos12, };
// Exponha as mutations também
window.SupabaseMutations = { insertConta, updateConta, deleteConta };

