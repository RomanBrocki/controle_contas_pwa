function PostLoginMock() {
  const {
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
    defaultReportSelection,
    accountIdentityKey,
    setShowOverlay,
    setReportsTab,
    openNew,
    openEdit,
    openReportsHome,
    openSettings,
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
  } = window.PostLoginController.usePostLoginController();

  return (
    <div className={`theme-${theme} min-h-screen relative p-4 md:p-6`}>
      <div className="mx-auto w-full max-w-5xl">
        <PostLoginHeader
          currentView={currentView}
          newButtonActive={activeId === 'new'}
          onGoControl={goToControl}
          onGoDashboard={goToDashboard}
          onOpenNew={() => openNew()}
          onOpenReports={openReportsHome}
          onOpenSettings={openSettings}
        />

        {currentView === 'dashboard' ? (
          <DashboardView
            years={years}
            monthsByYear={monthsByYear}
            currentYear={yearSel}
            currentMonth={monthSel}
            onGoControlToMonth={goToControlToMonth}
          />
        ) : (
          <>
            <PendingAccountsOverlay
              open={showOverlay}
              loading={pendLoading}
              pendingItems={pendentes}
              getItemKey={accountIdentityKey}
              onClose={() => setShowOverlay(false)}
              onLaunchItem={handleLaunchPending}
            />

            <ControlMonthSummary
              totalMes={totalMes}
              yearSel={yearSel}
              monthSel={monthSel}
              years={years}
              monthsByYear={monthsByYear}
              onYearChange={handleYearSelection}
              onMonthChange={handleMonthSelection}
            />

            <MonthlyAccountsPanel
              items={itens}
              activeId={activeId}
              onCreateFirstAccount={() => openNew()}
              onEditItem={openEdit}
            />
          </>
        )}

        {editing && currentView === 'controle' ? (
          <EditPopup
            data={editing}
            payers={payersDB}
            typeOpts={typeOpts}
            onClose={closeEditing}
            onSave={handleSaveRequest}
            onDelete={handleDeleteRequest}
          />
        ) : null}

        {showReports ? (
          <ReportsModal
            tab={reportsTab}
            onChangeTab={setReportsTab}
            onClose={closeReports}
            years={years}
            monthsByYear={monthsByYear}
            currentYear={yearSel}
            currentMonth={monthSel}
            defaultSel={defaultReportSelection}
            configuredChartAccounts={defaultReportSelection}
          />
        ) : null}

        {showSettings ? (
          <SettingsModal
            initial={profile}
            contasDisponiveis={contasDisp}
            onClose={closeSettings}
            onSave={handleSettingsSaveRequest}
          />
        ) : null}

        <SelfChatModal
          open={showSelfChat}
          messages={selfMsgs}
          onClose={closeSelfChat}
          onSend={handleSelfChatSend}
        />
        <PostLoginToast toast={toast} />
      </div>
    </div>
  );
}
