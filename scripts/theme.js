// "auto" is a real theme, not a value resolved away at boot: themes.css has a
// `:root[data-theme='auto']` block that follows prefers-color-scheme, so the
// attribute must survive onto the element for it to apply.
const THEMES = ['light', 'dark', 'sepia', 'contrast', 'auto'];
const ICONS = { light: '🌙', dark: '☀️', sepia: '📜', contrast: '🌓', auto: '🖥️' };
const THEME_COLORS = {
  light: '#2c6cb0',
  dark: '#252525',
  sepia: '#8c5f28',
  contrast: '#000000',
};

export function setTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const resolved = theme === 'auto' ? getSystemTheme() : theme;
    meta.setAttribute('content', THEME_COLORS[resolved] || THEME_COLORS.light);
  }
}

export function cycleTheme(current) {
  const idx = THEMES.indexOf(current);
  return THEMES[(idx + 1) % THEMES.length];
}

export function themeIcon(theme) {
  return ICONS[theme] || '🌙';
}

export function themeLabelKey(theme) {
  return `theme${theme.charAt(0).toUpperCase()}${theme.slice(1)}`;
}

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
