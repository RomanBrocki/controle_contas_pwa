// ===========================================
// 🔌 Supabase Client - Controle de Contas PWA
// ===========================================
//
// Inicializa a conexão com o banco Supabase
// usando a biblioteca @supabase/supabase-js v2
//
// ⚙️ Para o modo PWA, usaremos a ANON KEY
// e RLS já configurado para public access.
//

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ⚠️ Valores reais vindos do seu projeto
const SUPABASE_URL = 'https://qfuzyueriamekyhqpgta.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdXp5dWVyaWFtZWt5aHFwZ3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTYzMjYsImV4cCI6MjA3NzIzMjMyNn0.aZVRhArrTAIS6aqKAv5e4lpHA7E3aEtAaA9g5CicC6U';

// 🔗 Cria o client exportável
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// UID temporário do Roman até termos login na UI
export const CURRENT_UID = '8193908b-c37e-4639-b0f1-d646bc4ebf0b';

// UID centralizado (mock agora; auth real depois)
function uid() {
  return (window.MOCK_AUTH && window.MOCK_AUTH.user_id) || CURRENT_UID;
}


// Apenas log inicial (opcional)
console.log('[Supabase] Client inicializado:', SUPABASE_URL);
