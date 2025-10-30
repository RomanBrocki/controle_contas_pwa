// ===========================================
// 🔐 LoginGate - autenticação com Supabase
// ===========================================
function LoginGate({ onLogged }) {
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const { supabase } = window.SupabaseClient || {};
      if (!supabase) throw new Error('Supabase client não disponível');

      // 1️⃣ tenta login real no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });

      if (error) {
        console.warn('[Auth] Erro Supabase:', error);
        setErr(error.message || 'Falha ao autenticar.');
        return;
      }

      const user = data.user;

      // 2️⃣ espelha no mock para compatibilidade com o app existente
      window.MOCK_AUTH = {
        user_id: user.id,
        email: user.email,
      };
      window.SupabaseClient = window.SupabaseClient || {};
      window.SupabaseClient.__lastAuthUid = user.id;
      console.log('[Auth] logado como', user.id);

      // 3️⃣ notifica o App.jsx que o login foi feito
      onLogged?.(window.MOCK_AUTH);
    } catch (e) {
      console.error(e);
      setErr('Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen theme-gunmetal flex items-center justify-center p-6">
      <div className="modal solid max-w-sm w-full">
        <h1 className="brand mb-4">💸 Controle de Contas</h1>
        <form className="space-y-3" onSubmit={handleLogin}>
          <div>
            <label className="text-sm opacity-80">E-mail</label>
            <input className="w-full input" type="email" value={email}
                   onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" required/>
          </div>
          <div>
            <label className="text-sm opacity-80">Senha</label>
            <input className="w-full input" type="password" value={pwd}
                   onChange={e=>setPwd(e.target.value)} placeholder="••••••••" required/>
          </div>
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button className="btn primary w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
      
        </form>
      </div>
    </div>
  );
}
