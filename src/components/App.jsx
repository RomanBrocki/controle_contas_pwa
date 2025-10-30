function App() {
  // 1) continua usando o mock
  const [auth, setAuth] = React.useState(() => window.MOCK_AUTH || null);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    // só tenta pegar profile se "logou" (mesmo mock)
    if (!auth) return;

    (async () => {
      try {
        // usa o getProfile que JÁ está em queries.js
        const { getProfile } = await import('./src/supabase/queries.js');
        const prof = await getProfile();   // <- aqui ele usa o uid() do client.js
        if (prof) {
          setProfile(prof);

          // importante: coloca no global que o ReportsModal já lê
          window.AppState = window.AppState || {};
          window.AppState.profile = prof;
        }
      } catch (err) {
        console.warn('[App] erro ao carregar profile:', err);
      }
    })();
  }, [auth]);  // roda toda vez que "logar" (mesmo mock)

  return (
    <div className="min-h-screen">
      <StyleTag />
      {auth ? (
        <PostLoginMock profile={profile} />
      ) : (
        <LoginGate onLogged={(a)=> setAuth(a)} />
      )}
    </div>
  );
}

