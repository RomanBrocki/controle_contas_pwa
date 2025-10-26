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

import { supabase } from './client.js';

// Nome da tabela
const TABLE = 'controle_contas';

// -----------------------------
// 🔍 Listar contas de um mês
// -----------------------------
export async function listMes(ano, mes) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
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
    .select('quem_pagou');

  if (error) return [];
  return Array.from(new Set(data.map(d => d.quem_pagou).filter(Boolean)));
}

// -----------------------------
// 💳 Contas distintas (nomes únicos)
// -----------------------------
export async function contasDistinct() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('nome_da_conta');

  if (error) return [];
  return Array.from(new Set(data.map(d => d.nome_da_conta).filter(Boolean)));
}

// -----------------------------
// ➕ Inserir nova conta
// -----------------------------
export async function insertConta(conta) {
  const { error } = await supabase.from(TABLE).insert([conta]);
  if (error) {
    console.error('[insertConta] Erro:', error);
    return false;
  }
  return true;
}

// -----------------------------
// ✏️ Atualizar conta existente
// -----------------------------
export async function updateConta(id, conta) {
  const { error } = await supabase.from(TABLE).update(conta).eq('id', id);
  if (error) {
    console.error('[updateConta] Erro:', error);
    return false;
  }
  return true;
}

// -----------------------------
// 🗑️ Excluir conta
// -----------------------------
export async function deleteConta(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('[deleteConta] Erro:', error);
    return false;
  }
  return true;
}

// 🔹 Anos e meses reais do Supabase
window.SupabaseQueries = { listYears, listMonthsByYear, listMes, payersDistinct, contasDistinct };
// Exponha as mutations também
window.SupabaseMutations = { insertConta, updateConta, deleteConta };

