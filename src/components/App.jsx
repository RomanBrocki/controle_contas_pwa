// src/components/App.jsx
function App() {
  const [authed, setAuthed] = React.useState(() => window.MOCK_AUTH || null);
  const [profile, setProfile] = React.useState(null);
  const [checking, setChecking] = React.useState(() => !window.MOCK_AUTH);
  const [currentSection, setCurrentSection] = React.useState(() => (
    window.location.hash && window.location.hash.startsWith('#/dashboard')
      ? 'dashboard'
      : 'controle'
  ));

  React.useEffect(() => {
    function syncCurrentSection() {
      setCurrentSection(
        window.location.hash && window.location.hash.startsWith('#/dashboard')
          ? 'dashboard'
          : 'controle'
      );
    }

    syncCurrentSection();
    window.addEventListener('hashchange', syncCurrentSection);
    return () => window.removeEventListener('hashchange', syncCurrentSection);
  }, []);

  // 🔍 checa sessão real do Supabase na montagem
  React.useEffect(() => {
    if (window.MOCK_AUTH) return;

    let alive = true;
    (async () => {
      try {
        const { supabase } = window.SupabaseClient || {};
        if (!supabase) {
          setChecking(false);
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[App] getSession erro:', error);
          if (alive) setChecking(false);
          return;
        }
        const user = data?.session?.user;
        if (user && alive) {
          if (window.location.hash !== '#/mes') {
            window.location.hash = '#/mes';
          }
          // 👇 isso é o que está “auto-logando” hoje
          window.MOCK_AUTH = { user_id: user.id, email: user.email };
          window.SupabaseClient = window.SupabaseClient || {};
          window.SupabaseClient.__lastAuthUid = user.id;
          setAuthed(window.MOCK_AUTH);
        }
      } catch (e) {
        console.warn('[App] erro ao checar sessão:', e);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 🧑‍💻 carrega o profile
  React.useEffect(() => {
    if (!authed) return;
    let alive = true;
    (async () => {
      try {
        const prof = await window.SupabaseQueries.getProfile();
        if (!alive) return;
        window.AppState = window.AppState || {};
        window.AppState.profile = prof;
        setProfile(prof);
      } catch (e) {
        console.error('[App] erro ao carregar profile:', e);
      }
    })();
    return () => { alive = false; };
  }, [authed]);

  // 🚪 logout (enxuto)
async function handleLogout() {
  try {
    const { supabase } = window.SupabaseClient || {};
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.warn('[App] erro ao fazer signOut:', e);
  }

  // 👇 só tira o usuário atual
  window.MOCK_AUTH = null;
  if (window.SupabaseClient) {
    window.SupabaseClient.__lastAuthUid = null;
  }

  // 👇 NÃO mexe em window.AppState.profile aqui
  // porque isso pode ter coisas que você montou no Settings

  setAuthed(null);
  // volta pro login
  setProfile(null); // só o state do App, não o global
  setChecking(false);
}

  function handleLogged(auth) {
    if (window.location.hash !== '#/mes') {
      window.location.hash = '#/mes';
    }
    setAuthed(auth);
  }


  // ⏳ carregando
  if (checking) {
    return (
      <>
        <StyleTag theme="gunmetal" />
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Verificando sessão…
        </div>
      </>
    );
  }

  // 🔒 não logado
  if (!authed) {
    return (
      <>
        <StyleTag theme="gunmetal" />
        <LoginGate onLogged={handleLogged} />
      </>
    );
  }

  // ✅ logado
  return (
    <>
      <StyleTag theme={profile?.theme || 'gunmetal'} />
      {/* cabeçalho simples só pra ter o botão */}
      <div className="w-full flex items-center justify-between gap-2 px-4 py-2">
  
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-self-chat'))}
          className="text-sm px-3 py-1 rounded bg-slate-500/40 hover:bg-slate-500/70 text-white"
        >
          🤬 Fale com tosco
        </button>

        {currentSection !== 'dashboard' ? (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-reminder-manual'))}
            className="text-sm px-3 py-1 rounded bg-slate-500/40 hover:bg-slate-500/70 text-white"
          >
            🔔 Pendências
          </button>
        ) : null}

        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
        >
          Sair
        </button>

      </div>

      <PostLoginMock />

    </>
  );
}
