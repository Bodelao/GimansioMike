/* ==========================================================================
   Carmaikel Fitness · App instalable y sin conexión
   - Registra el service worker (caché offline)
   - Gestiona la instalación (Android/Chrome: botón · iOS: instrucciones)
   - Mantiene la pantalla encendida durante el entrenamiento
   - Pide almacenamiento persistente para que el navegador no borre tus datos
   ========================================================================== */
window.GM = window.GM || {};

GM.pwa = (() => {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const canSW = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);

  const state = { deferredPrompt: null, waiting: null, persisted: null, wakeLock: null };
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => fn());

  /* ---------- Service worker ---------- */
  function showUpdate(worker) {
    state.waiting = worker;
    const bar = document.getElementById('update-bar');
    if (bar) bar.hidden = false;
  }

  if (canSW) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(nw);
          });
        });
        // busca actualizaciones al volver a la app
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(err => console.warn('SW no registrado', err));
    });
    // recarga solo cuando el usuario ha pedido actualizar (no en la primera instalación)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (state.updating) { state.updating = false; location.reload(); }
    });
  }

  function applyUpdate() {
    if (state.waiting) { state.updating = true; state.waiting.postMessage('SKIP_WAITING'); }
    else location.reload();
  }

  /* ---------- Instalación ---------- */
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null;
    localStorage.setItem('gm.installed', '1');
    emit();
    GM.coach && GM.coach.shout('App instalada. Ya no tienes excusa: me llevas en el bolsillo. 💪');
  });

  async function promptInstall() {
    if (!state.deferredPrompt) return false;
    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    emit();
    return outcome === 'accepted';
  }

  /** 'installed' | 'prompt' (Android/Chrome) | 'ios' | 'manual' | 'unsupported' */
  function installMode() {
    if (isStandalone()) return 'installed';
    if (state.deferredPrompt) return 'prompt';
    if (isIOS) return 'ios';
    if (!canSW) return 'unsupported';
    return 'manual';
  }

  /* ---------- Almacenamiento persistente ---------- */
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(p => (p ? p : navigator.storage.persist())).then(p => { state.persisted = p; emit(); }).catch(() => {});
  }

  /* ---------- Pantalla siempre encendida durante la sesión ---------- */
  async function keepAwake(on) {
    if (!('wakeLock' in navigator)) return;
    try {
      if (on && !state.wakeLock) {
        state.wakeLock = await navigator.wakeLock.request('screen');
        state.wakeLock.addEventListener('release', () => { state.wakeLock = null; });
      } else if (!on && state.wakeLock) {
        await state.wakeLock.release();
        state.wakeLock = null;
      }
    } catch (e) { /* p. ej. batería baja */ }
  }
  // el bloqueo se suelta al salir de la app: lo recuperamos al volver si hay sesión activa
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && GM.store && GM.store.state && GM.store.state.active) keepAwake(true);
  });

  /* ---------- Conexión ---------- */
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);

  return {
    state, isIOS, isStandalone, canSW, installMode, promptInstall, applyUpdate, keepAwake,
    online: () => navigator.onLine,
    onChange: fn => listeners.add(fn)
  };
})();
