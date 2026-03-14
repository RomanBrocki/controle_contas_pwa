(function attachPostLoginController(globalObject) {
  const React = globalObject.React;
  const defaultTheme = globalObject.ThemeCatalog?.DEFAULT_THEME || 'gunmetal';
  const normalizeTheme = globalObject.ThemeCatalog?.normalizeTheme || ((value) => value || defaultTheme);

  const {
    accountIdentityKey: postLoginAccountIdentityKey,
    buildNewEditingState: postLoginBuildNewEditingState,
    buildEditEditingState: postLoginBuildEditEditingState,
    parseMoneyValue: postLoginParseMoneyValue,
    pickRandomReply: postLoginPickRandomReply,
    selfChatReplies: postLoginSelfChatReplies,
  } = globalObject.PostLoginHelpers;

  const {
    resolveViewFromHash: postLoginResolveViewFromHash,
    listen: postLoginListen,
    registerRoutes: postLoginRegisterRoutes,
    goToMonth: postLoginGoToMonth,
    goToDashboard: postLoginGoToDashboard,
    clearToastTimer: postLoginClearToastTimer,
    showTemporaryToast: postLoginShowTemporaryToast,
  } = globalObject.PostLoginRuntime;

  const {
    loadShellBootstrap: postLoginLoadShellBootstrap,
    loadDistinctAccountsSnapshot: postLoginLoadDistinctAccountsSnapshot,
    saveProfileSnapshot: postLoginSaveProfileSnapshot,
    loadPayersSnapshot: postLoginLoadPayersSnapshot,
    loadMonthSnapshot: postLoginLoadMonthSnapshot,
    loadPendingSnapshot: postLoginLoadPendingSnapshot,
    saveContaAndReloadMonth: postLoginSaveContaAndReloadMonth,
    deleteContaAndReloadMonth: postLoginDeleteContaAndReloadMonth,
  } = globalObject.PostLoginWorkflows;

  function removeTimer(timerListRef, timerId) {
    timerListRef.current = timerListRef.current.filter((currentId) => currentId !== timerId);
  }

  function usePostLoginController() {
    const [theme, setTheme] = React.useState(defaultTheme);
    const [currentView, setCurrentView] = React.useState(() => (
      postLoginResolveViewFromHash(globalObject.location.hash)
    ));
    const [showOverlay, setShowOverlay] = React.useState(true);
    const [editing, setEditing] = React.useState(null);
    const [typeOpts, setTypeOpts] = React.useState([]);
    const [activeId, setActiveId] = React.useState(null);
    const [showReports, setShowReports] = React.useState(false);
    const [reportsTab, setReportsTab] = React.useState('home');
    const [showSettings, setShowSettings] = React.useState(false);
    const [profile, setProfile] = React.useState(null);
    const [contasDisp, setContasDisp] = React.useState([]);
    const [showSelfChat, setShowSelfChat] = React.useState(false);
    const [selfMsgs, setSelfMsgs] = React.useState([]);
    const [years, setYears] = React.useState([]);
    const [monthsByYear, setMonthsByYear] = React.useState({});
    const [pendentes, setPendentes] = React.useState(null);
    const [pendLoading, setPendLoading] = React.useState(false);
    const [itens, setItens] = React.useState(null);
    const [toast, setToast] = React.useState(null);
    const [payersDB, setPayersDB] = React.useState([]);

    const nowRef = React.useRef(new Date());
    const toastTimerRef = React.useRef(null);
    const activeCardTimerRef = React.useRef(null);
    const selfChatTimerRefs = React.useRef([]);
    const [yearSel, setYearSel] = React.useState(nowRef.current.getFullYear());
    const [monthSel, setMonthSel] = React.useState(nowRef.current.getMonth() + 1);

    function clearSelfChatTimers() {
      selfChatTimerRefs.current.forEach((timerId) => globalObject.clearTimeout(timerId));
      selfChatTimerRefs.current = [];
    }

    React.useEffect(() => {
      return function cleanupController() {
        postLoginClearToastTimer(toastTimerRef);
        if (activeCardTimerRef.current) {
          globalObject.clearTimeout(activeCardTimerRef.current);
          activeCardTimerRef.current = null;
        }
        clearSelfChatTimers();
      };
    }, []);

    React.useEffect(() => {
      function handleOpenSelfChat() {
        clearSelfChatTimers();
        setShowSelfChat(true);
        setSelfMsgs([]);
      }

      return postLoginListen('open-self-chat', handleOpenSelfChat);
    }, []);

    React.useEffect(() => {
      if (!showSettings) return undefined;

      let alive = true;
      (async () => {
        try {
          const list = await postLoginLoadDistinctAccountsSnapshot();
          if (alive) setContasDisp(list);
        } catch (error) {
          console.warn('[settings] contas 12m', error);
          if (alive) setContasDisp([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, [showSettings]);

    React.useEffect(() => {
      let alive = true;

      (async () => {
        try {
          const bootstrap = await postLoginLoadShellBootstrap(theme);
          if (!alive) return;
          setYears(bootstrap.years);
          setMonthsByYear(bootstrap.monthsByYear);
          setProfile(bootstrap.profile);
          if (bootstrap.theme) setTheme(normalizeTheme(bootstrap.theme));
        } catch (error) {
          console.error('[ui] Erro ao carregar shell pos-login', error);
        }
      })();

      return () => {
        alive = false;
      };
    }, []);

    React.useEffect(() => {
      if (years.length && (yearSel == null || Number.isNaN(Number(yearSel)))) {
        setYearSel(years[0]);
      }
    }, [years, yearSel]);

    React.useEffect(() => {
      let alive = true;

      (async () => {
        if (!editing) return;
        try {
          const list = await postLoginLoadDistinctAccountsSnapshot();
          if (alive) setTypeOpts(list);
        } catch (error) {
          console.warn('[tipo de conta] usando fallback COMMON_TYPES', error);
          if (alive) setTypeOpts([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, [editing]);

    React.useEffect(() => {
      function openManual() {
        setShowOverlay(true);
      }

      return postLoginListen('open-reminder-manual', openManual);
    }, []);

    React.useEffect(() => {
      return postLoginRegisterRoutes({
        mes: ({ ano, mes } = {}) => {
          setCurrentView('controle');
          setShowReports(false);
          if (ano) setYearSel(Number(ano));
          if (mes) setMonthSel(Number(mes));
        },
        relatorios: () => {
          setCurrentView('controle');
          setReportsTab('home');
          setShowReports(true);
        },
        dashboard: () => {
          setCurrentView('dashboard');
          setShowReports(false);
        },
      });
    }, []);

    React.useEffect(() => {
      let alive = true;

      (async () => {
        try {
          setPendLoading(true);
          const pendingSnapshot = await postLoginLoadPendingSnapshot(yearSel, monthSel);
          if (!alive) return;
          setPendentes(pendingSnapshot.pendingItems);
          setShowOverlay(pendingSnapshot.shouldAutoOpen);
        } catch (error) {
          console.error('[pendentes] erro ao calcular', error);
          if (!alive) return;
          setPendentes([]);
          setShowOverlay(false);
        } finally {
          if (alive) setPendLoading(false);
        }
      })();

      return () => {
        alive = false;
      };
    }, [yearSel, monthSel]);

    React.useEffect(() => {
      let alive = true;

      (async () => {
        try {
          const mapped = await postLoginLoadMonthSnapshot(yearSel, monthSel);
          if (alive) setItens(mapped);
        } catch (error) {
          console.error('[ui] Falha ao carregar mes', error);
          if (alive) setItens([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, [yearSel, monthSel]);

    React.useEffect(() => {
      let alive = true;

      (async () => {
        try {
          const list = await postLoginLoadPayersSnapshot();
          if (alive) setPayersDB(list || []);
        } catch (error) {
          console.error('[ui] payersDistinct', error);
          if (alive) setPayersDB([]);
        }
      })();

      return () => {
        alive = false;
      };
    }, []);

    const totalMes = React.useMemo(
      () => (itens ? itens.reduce((accumulator, item) => accumulator + postLoginParseMoneyValue(item.valor), 0) : 0),
      [itens]
    );

    function showToast(msg, type = 'ok') {
      postLoginShowTemporaryToast(toastTimerRef, setToast, msg, type);
    }

    async function handleSaveRequest(mode, initialId, form) {
      try {
        const mapped = await postLoginSaveContaAndReloadMonth({
          mode,
          initialId,
          form,
          year: yearSel,
          month: monthSel,
        });
        setItens(mapped);
        showToast('Conta salva com sucesso.', 'ok');
        setEditing(null);
      } catch (error) {
        console.error('[save] erro', error);
        showToast('Erro ao salvar a conta.', 'err');
      }
    }

    async function handleDeleteRequest(id) {
      try {
        const mapped = await postLoginDeleteContaAndReloadMonth({
          id,
          year: yearSel,
          month: monthSel,
        });
        setItens(mapped);
        showToast('Conta excluida com sucesso.', 'ok');
        setEditing(null);
      } catch (error) {
        console.error('[delete] erro', error);
        showToast('Erro ao excluir a conta.', 'err');
      }
    }

    function popCard(id) {
      if (activeCardTimerRef.current) {
        globalObject.clearTimeout(activeCardTimerRef.current);
      }

      setActiveId(id);
      activeCardTimerRef.current = globalObject.setTimeout(() => {
        setActiveId(null);
        activeCardTimerRef.current = null;
      }, 650);
    }

    function openNew(prefill) {
      popCard('new');
      setEditing(postLoginBuildNewEditingState(prefill));
    }

    function openEdit(item) {
      popCard(item.id);
      setEditing(postLoginBuildEditEditingState(item));
    }

    function handleYearSelection(nextYear) {
      setYearSel(nextYear);
      postLoginGoToMonth(nextYear, monthSel);
    }

    function handleMonthSelection(nextMonth) {
      setMonthSel(nextMonth);
      postLoginGoToMonth(yearSel, nextMonth);
    }

    function handleLaunchPending(item) {
      setShowOverlay(false);
      openNew({
        nome: item.nome,
        instancia: item.instancia,
        quem: item.quem,
        dividida: item.dividida,
      });
    }

    function handleSelfChatSend(text) {
      const reply = postLoginPickRandomReply(postLoginSelfChatReplies);
      const messageId = `self-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setSelfMsgs((previous) => [...previous, { id: messageId, user: text, bot: '...' }]);

      const timerId = globalObject.setTimeout(() => {
        setSelfMsgs((previous) => previous.map((message) => (
          message.id === messageId
            ? { ...message, bot: reply }
            : message
        )));
        removeTimer(selfChatTimerRefs, timerId);
      }, 400 + Math.random() * 700);

      selfChatTimerRefs.current.push(timerId);
    }

    function openReportsHome() {
      setReportsTab('home');
      setShowReports(true);
    }

    function handleSettingsSaved(nextProfile) {
      setProfile(nextProfile);
      if (nextProfile?.theme) setTheme(normalizeTheme(nextProfile.theme));
    }

    async function handleSettingsSaveRequest(profileDraft) {
      const nextProfile = await postLoginSaveProfileSnapshot(profileDraft);
      handleSettingsSaved(nextProfile);
      return nextProfile;
    }

    function closeEditing() {
      setEditing(null);
    }

    function closeReports() {
      setShowReports(false);
    }

    function closeSettings() {
      setShowSettings(false);
    }

    function closeSelfChat() {
      setShowSelfChat(false);
    }

    function goToControl() {
      postLoginGoToMonth(yearSel, monthSel);
    }

    function goToDashboard() {
      postLoginGoToDashboard();
    }

    function goToControlToMonth(year, month) {
      postLoginGoToMonth(year, month);
    }

    return {
      theme,
      currentView,
      showOverlay,
      editing,
      typeOpts,
      activeId,
      showReports,
      reportsTab,
      showSettings,
      profile,
      contasDisp,
      showSelfChat,
      selfMsgs,
      years,
      monthsByYear,
      yearSel,
      monthSel,
      pendentes,
      pendLoading,
      itens,
      toast,
      payersDB,
      totalMes,
      defaultReportSelection: Array.isArray(profile?.chart_accounts) ? profile.chart_accounts : [],
      accountIdentityKey: postLoginAccountIdentityKey,
      setShowOverlay,
      setReportsTab,
      openNew,
      openEdit,
      openReportsHome,
      openSettings: () => setShowSettings(true),
      closeEditing,
      closeReports,
      closeSettings,
      closeSelfChat,
      handleSettingsSaveRequest,
      handleSaveRequest,
      handleDeleteRequest,
      handleYearSelection,
      handleMonthSelection,
      handleLaunchPending,
      handleSelfChatSend,
      goToControl,
      goToDashboard,
      goToControlToMonth,
    };
  }

  globalObject.PostLoginController = {
    usePostLoginController,
  };
})(window);
