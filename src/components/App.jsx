// src/components/App.jsx (trecho)
function App() {
  const [authed, setAuthed] = React.useState(() => window.MOCK_AUTH || null);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      if (!authed) return;
      try {
        // ✅ pega do window, não de require
        const prof = await window.SupabaseQueries.getProfile();
        window.AppState = window.AppState || {};
        window.AppState.profile = prof;
        setProfile(prof);
      } catch (e) {
        console.error('[App] erro ao carregar profile:', e);
      }
    })();
  }, [authed]);

  if (!authed) {
    return (
      <>
        {/* injeta o mesmo tema usado no app inteiro */}
        <StyleTag theme="gunmetal" />
        <LoginGate onLogged={setAuthed} />
      </>
    );
  }


  return (
    <>
      <StyleTag theme={profile?.theme || 'gunmetal'} />
      <PostLoginMock />
    </>
  );
}

