/* ==========================================================================
   GimnasioMike · Temas
   Modo (oscuro / claro / automático) + color de acento.
   ========================================================================== */
window.GM = window.GM || {};

GM.theme = (() => {
  const MODES = { dark: 'Oscuro', light: 'Claro', auto: 'Automático' };
  const ACCENTS = {
    naranja: { name: 'Naranja', dark: '#ff6b2c', light: '#c94a12' },
    rojo:    { name: 'Rojo',    dark: '#ff4d5e', light: '#d62839' },
    azul:    { name: 'Azul',    dark: '#4d9fff', light: '#1f6fd6' },
    verde:   { name: 'Verde',   dark: '#2fd18a', light: '#0d8a55' },
    morado:  { name: 'Morado',  dark: '#a78bfa', light: '#6250d6' },
    rosa:    { name: 'Rosa',    dark: '#ff6fb5', light: '#c2307a' }
  };
  const mq = window.matchMedia('(prefers-color-scheme: light)');

  const current = () => Object.assign({ mode: 'dark', accent: 'naranja' }, (GM.store && GM.store.state.profile.theme) || {});
  const resolvedMode = (mode = current().mode) => (mode === 'auto' ? (mq.matches ? 'light' : 'dark') : mode);

  function apply() {
    const t = current();
    const root = document.documentElement;
    root.dataset.mode = resolvedMode(t.mode);
    root.dataset.accent = ACCENTS[t.accent] ? t.accent : 'naranja';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#121211';
  }

  function set(patch) {
    GM.store.state.profile.theme = Object.assign(current(), patch);
    GM.store.save();
    apply();
  }

  mq.addEventListener && mq.addEventListener('change', () => { if (current().mode === 'auto') { apply(); document.dispatchEvent(new Event('gm:theme')); } });

  return { MODES, ACCENTS, current, resolvedMode, apply, set };
})();
