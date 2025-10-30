// ===========================================
// 🔌 Supabase Client - Controle de Contas PWA
// ===========================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://qfuzyueriamekyhqpgta.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdXp5dWVyaWFtZWt5aHFwZ3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTYzMjYsImV4cCI6MjA3NzIzMjMyNn0.aZVRhArrTAIS6aqKAv5e4lpHA7E3aEtAaA9g5CicC6U';

// cria o client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// fallback legado
export const CURRENT_UID = '8193908b-c37e-4639-b0f1-d646bc4ebf0b';

// tenta sessão real → mock → fallback
export async function getActiveUid() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data?.session?.user?.id) {
      return data.session.user.id;
    }
  } catch (e) {
    console.warn('[Supabase] getActiveUid(): sessão real indisponível', e);
  }

  if (window.MOCK_AUTH && window.MOCK_AUTH.user_id) {
    return window.MOCK_AUTH.user_id;
  }

  return CURRENT_UID;
}

// versão síncrona usada pelo código legado
export function uid() {
  return (window.MOCK_AUTH && window.MOCK_AUTH.user_id) || CURRENT_UID;
}

console.log('[Supabase] Client inicializado:', SUPABASE_URL);

// torna visível pro ambiente JSX (Babel in-browser)
window.SupabaseClient = {
  supabase,
  getActiveUid,
  CURRENT_UID,
};
