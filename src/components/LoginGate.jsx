// ===========================================
// 🔐 LoginGate - autenticação com Supabase
// agora com modos: login | signup
// ===========================================
function LoginGate({ onLogged }) {
  const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [pwd2, setPwd2] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [okMsg, setOkMsg] = React.useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');
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
        console.warn('[Auth] Erro Supabase (login):', error);
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

  async function handleSignup(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');
    if (!email || !pwd || !pwd2) {
      setErr('Preencha todos os campos.');
      return;
    }
    if (pwd !== pwd2) {
      setErr('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const { supabase } = window.SupabaseClient || {};
      if (!supabase) throw new Error('Supabase client não disponível');

      // 1️⃣ cria usuário no supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd,
      });

      if (error) {
        console.warn('[Auth] Erro Supabase (signup):', error);
        setErr(error.message || 'Falha ao cadastrar.');
        return;
      }

      // dependendo das settings do projeto, o Supabase pode:
      // - já autenticar o usuário
      // - ou exigir confirmação de e-mail
      const user = data.user;

      if (user) {
        // já veio autenticado 👍
        window.MOCK_AUTH = {
          user_id: user.id,
          email: user.email,
        };
        window.SupabaseClient = window.SupabaseClient || {};
        window.SupabaseClient.__lastAuthUid = user.id;
        console.log('[Auth] cadastrado e logado como', user.id);
        onLogged?.(window.MOCK_AUTH);
      } else {
        // veio sem user -> provavelmente exige confirmação
        setOkMsg('Cadastro criado. Verifique seu e-mail para confirmar.');
        // fica no modo login
        setMode('login');
      }
    } catch (e) {
      console.error(e);
      setErr('Falha ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen theme-gunmetal flex items-center justify-center p-6">
      <div className="modal solid max-w-md w-full md:max-w-lg">
        <h1 className="brand mb-4 flex items-center gap-3 relative">
          <img
            src="./icons/icon-512.png"
            alt="Ícone Controle de Contas"
            width="62"
            height="62"
            className="absolute left-0 translate-x-[-20%] md:translate-x-[-20%] rounded-full shadow-md"
          />
          <span className="w-full text-center block">Controle de Contas</span>
        </h1>



        {/* toggle de modo */}
        <div className="flex mb-4 gap-2">
          <button
            type="button"
            onClick={() => { setMode('login'); setErr(''); setOkMsg(''); }}
            className={`flex-1 py-2 rounded text-sm ${mode === 'login' ? 'bg-white/10' : 'bg-black/10'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErr(''); setOkMsg(''); }}
            className={`flex-1 py-2 rounded text-sm ${mode === 'signup' ? 'bg-white/10' : 'bg-black/10'}`}
          >
            Criar conta
          </button>
        </div>

        {mode === 'login' ? (
          <form className="space-y-3" onSubmit={handleLogin}>
            <div>
              <label className="text-sm opacity-80">E-mail</label>
              <input
                className="w-full input"
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Senha</label>
              <input
                className="w-full input"
                type="password"
                value={pwd}
                onChange={e=>setPwd(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {err && <div className="text-sm text-red-400">{err}</div>}
            {okMsg && <div className="text-sm text-emerald-400">{okMsg}</div>}
            <button className="btn primary w-full" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handleSignup}>
            <div>
              <label className="text-sm opacity-80">E-mail</label>
              <input
                className="w-full input"
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Senha</label>
              <input
                className="w-full input"
                type="password"
                value={pwd}
                onChange={e=>setPwd(e.target.value)}
                placeholder="mín. 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Confirmar senha</label>
              <input
                className="w-full input"
                type="password"
                value={pwd2}
                onChange={e=>setPwd2(e.target.value)}
                placeholder="repita a senha"
                required
              />
            </div>
            {err && <div className="text-sm text-red-400">{err}</div>}
            {okMsg && <div className="text-sm text-emerald-400">{okMsg}</div>}
            <button className="btn primary w-full" type="submit" disabled={loading}>
              {loading ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
