(function attachThemeCatalog(globalObject) {
  const DEFAULT_THEME = 'gunmetal';
  const THEMES = [
    { id: 'gunmetal', label: 'Gunmetal Neon', tone: 'dark' },
    { id: 'synth', label: 'Synthwave Teal', tone: 'dark' },
    { id: 'titanium', label: 'Titanio Azul', tone: 'dark' },
    { id: 'bronze', label: 'Cobre Industrial', tone: 'dark' },
    { id: 'alloy', label: 'Aco Neblina', tone: 'light' },
    { id: 'light', label: 'Claro Metalico', tone: 'light' }
  ];

  const themeMap = new Map(THEMES.map((theme) => [theme.id, theme]));
  const THEME_IDS = THEMES.map((theme) => theme.id);

  function normalizeTheme(value) {
    const key = String(value || '').trim().toLowerCase();
    return themeMap.has(key) ? key : DEFAULT_THEME;
  }

  function isLightTheme(value) {
    return themeMap.get(normalizeTheme(value))?.tone === 'light';
  }

  function getThemeClass(value) {
    return `theme-${normalizeTheme(value)}`;
  }

  function detectThemeFromClassList(classList) {
    return THEME_IDS.find((themeId) => classList.contains(`theme-${themeId}`)) || DEFAULT_THEME;
  }

  globalObject.ThemeCatalog = {
    DEFAULT_THEME,
    THEMES,
    THEME_IDS,
    normalizeTheme,
    isLightTheme,
    getThemeClass,
    detectThemeFromClassList
  };
})(window);
