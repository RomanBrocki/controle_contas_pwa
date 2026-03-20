const {
  buildAuthSnapshot: appShellBuildAuthSnapshot,
  commitAuthSnapshot: appShellCommitAuthSnapshot
} = window.AppShellRuntime;

function LoginGate({ onLogged }) {
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  const [pwd2, setPwd2] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [okMsg, setOkMsg] = React.useState('');

  function resetMessages() {
    setErr('');
    setOkMsg('');
  }

  function commitLoggedUser(user) {
    const authSnapshot = appShellCommitAuthSnapshot(appShellBuildAuthSnapshot(user));
    onLogged?.(authSnapshot);
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { supabase } = window.SupabaseClient || {};
      if (!supabase) throw new Error('Supabase client nao disponivel');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd
      });

      if (error) {
        console.warn('[Auth] Erro Supabase (login):', error);
        setErr(error.message || 'Falha ao autenticar.');
        return;
      }

      if (!data?.user) {
        setErr('Falha ao autenticar.');
        return;
      }

      console.log('[Auth] logado como', data.user.id);
      commitLoggedUser(data.user);
    } catch (error) {
      console.error(error);
      setErr('Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    resetMessages();

    if (!email || !pwd || !pwd2) {
      setErr('Preencha todos os campos.');
      return;
    }
    if (pwd !== pwd2) {
      setErr('As senhas nao conferem.');
      return;
    }

    setLoading(true);
    try {
      const { supabase } = window.SupabaseClient || {};
      if (!supabase) throw new Error('Supabase client nao disponivel');

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd
      });

      if (error) {
        console.warn('[Auth] Erro Supabase (signup):', error);
        setErr(error.message || 'Falha ao cadastrar.');
        return;
      }

      if (data?.user) {
        console.log('[Auth] cadastrado e logado como', data.user.id);
        commitLoggedUser(data.user);
        return;
      }

      setOkMsg('Cadastro criado. Verifique seu e-mail para confirmar.');
      setMode('login');
    } catch (error) {
      console.error(error);
      setErr('Falha ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen theme-gunmetal flex items-center justify-center p-4 sm:p-6">
      <div className="modal solid login-panel max-w-md w-full md:max-w-lg">
        <h1 className="brand mb-4 flex items-center gap-3 relative">
          <img
            src="./icons/icon-512.png"
            alt={'\u00cdcone Controle de Contas'}
            width="62"
            height="62"
            className="absolute left-0 translate-x-[-20%] md:translate-x-[-20%] rounded-full shadow-md"
          />
          <span className="w-full text-center block">Controle de Contas</span>
        </h1>

        <div className="flex mb-4 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
            className={`flex-1 py-2 rounded text-sm ${mode === 'login' ? 'bg-white/10' : 'bg-black/10'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              resetMessages();
            }}
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
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPwd(event.target.value)}
                placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                required
              />
            </div>
            {err ? <div className="text-sm text-red-400">{err}</div> : null}
            {okMsg ? <div className="text-sm text-emerald-400">{okMsg}</div> : null}
            <button className="btn primary w-full" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
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
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPwd(event.target.value)}
                placeholder={'m\u00edn. 6 caracteres'}
                required
              />
            </div>
            <div>
              <label className="text-sm opacity-80">Confirmar senha</label>
              <input
                className="w-full input"
                type="password"
                value={pwd2}
                onChange={(event) => setPwd2(event.target.value)}
                placeholder="repita a senha"
                required
              />
            </div>
            {err ? <div className="text-sm text-red-400">{err}</div> : null}
            {okMsg ? <div className="text-sm text-emerald-400">{okMsg}</div> : null}
            <button className="btn primary w-full" type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
