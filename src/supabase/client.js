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
const SUPABASE_URL = 'https://aesaaewyfvdgivmayyqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc2FhZXd5ZnZkZ2l2bWF5eXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Nzc4OTcsImV4cCI6MjA2MTQ1Mzg5N30.qzCx7zbg-lIVpzqkZbMPi0Q8tbDT9JHGz7q0kFxr2DU';

// 🔗 Cria o client exportável
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Apenas log inicial (opcional)
console.log('[Supabase] Client inicializado:', SUPABASE_URL);
