// src/components/App.jsx
const {
  resolveSectionFromHash: appShellResolveSectionFromHash,
  ensureControlRoute: appShellEnsureControlRoute,
  getAuthSnapshot: appShellGetAuthSnapshot,
  hasAuthSnapshot: appShellHasAuthSnapshot,
  syncAuthFromSupabaseSession: appShellSyncAuthFromSupabaseSession,
  commitAuthSnapshot: appShellCommitAuthSnapshot,
  signOut: appShellSignOut,
  loadProfile: appShellLoadProfile
} = window.AppShellRuntime;

function App() {
  const [authed, setAuthed] = React.useState(() => appShellGetAuthSnapshot());
  const [profile, setProfile] = React.useState(null);
  const [checking, setChecking] = React.useState(() => !appShellHasAuthSnapshot());
  const [currentSection, setCurrentSection] = React.useState(() => (
    appShellResolveSectionFromHash(window.location.hash)
  ));

  React.useEffect(() => {
    function syncCurrentSection() {
      setCurrentSection(appShellResolveSectionFromHash(window.location.hash));
    }

    syncCurrentSection();
    window.addEventListener('hashchange', syncCurrentSection);
    return () => window.removeEventListener('hashchange', syncCurrentSection);
  }, []);

  React.useEffect(() => {
    if (appShellHasAuthSnapshot()) {
      setAuthed(appShellGetAuthSnapshot());
      setChecking(false);
      return undefined;
    }

    let alive = true;
    (async () => {
      try {
        const authSnapshot = await appShellSyncAuthFromSupabaseSession();
        if (!alive) return;
        setAuthed(authSnapshot);
      } catch (error) {
        console.warn('[App] erro ao checar sessao:', error);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!authed) return undefined;

    let alive = true;
    (async () => {
      try {
        const nextProfile = await appShellLoadProfile();
        if (!alive) return;
        setProfile(nextProfile);
      } catch (error) {
        console.error('[App] erro ao carregar profile:', error);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authed]);

  async function handleLogout() {
    try {
      await appShellSignOut();
    } catch (error) {
      console.warn('[App] erro ao fazer signOut:', error);
    }

    setAuthed(null);
    setProfile(null);
    setChecking(false);
  }

  function handleLogged(authSnapshot) {
    const committedAuth = appShellCommitAuthSnapshot(authSnapshot);
    appShellEnsureControlRoute();
    setAuthed(committedAuth);
  }

  if (checking) {
    return (
      <>
        <StyleTag theme="gunmetal" />
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          {'Verificando sess\u00e3o...'}
        </div>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <StyleTag theme="gunmetal" />
        <LoginGate onLogged={handleLogged} />
      </>
    );
  }

  return (
    <>
      <StyleTag theme={profile?.theme || 'gunmetal'} />
      <AppChrome currentSection={currentSection} onLogout={handleLogout} />
      <PostLoginMock />
    </>
  );
}
