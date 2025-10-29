function App() {
  const [auth, setAuth] = React.useState(() => window.MOCK_AUTH || null);

  React.useEffect(() => {
    // no futuro: checar supabase.auth.getUser() e setAuth(user)
  }, []);

  return (
    <div className="min-h-screen">
      <StyleTag />
      {auth ? (
        <PostLoginMock />
      ) : (
        <LoginGate onLogged={(a)=> setAuth(a)} />
      )}
    </div>
  );
}
