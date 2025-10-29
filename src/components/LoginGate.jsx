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
      // 🔌 Placeholder de login (mock)
      // Trocar por supabase.auth.signInWithPassword({ email, password: pwd }) futuramente
      window.MOCK_AUTH = {
        user_id: window.CURRENT_UID || '8193908b-c37e-4639-b0f1-d646bc4ebf0b',
        email: email || 'user@example.com',
      };
      onLogged?.(window.MOCK_AUTH);
    } catch (e) {
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
          <div className="text-xs opacity-70 mt-2">
            (Hoje é mock. Futuramente conecta no Supabase Auth.)
          </div>
        </form>
      </div>
    </div>
  );
}
