/* ==========================================================================
   GimnasioMike · Aplicación (vistas y eventos)
   ========================================================================== */
(() => {
  const S = GM.store;
  S.load();

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const INTENSITY = { 1: 'Motivador', 2: 'Duro', 3: 'Sin piedad' };

  let tab = 'hoy';
  let progressEx = null;      // ejercicio seleccionado en Progreso
  let lastFinish = null;      // resultado de la última sesión terminada

  /* ---------------- Utilidades de UI ---------------- */
  const videoUrl = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' técnica correcta')}`;
  const videoBtn = name => `<a class="btn-ghost sm video-link" href="${videoUrl(name)}" target="_blank" rel="noopener">▶ Ver vídeo</a>`;
  /* Fila de calentamiento con su animación (pulsa la animación para verla en grande) */
  const warmRow = (w, gkey, lead = '') => `<div class="warm-item">${lead}
      <div style="flex:1;min-width:0"><b>${w.name}</b><div class="muted" style="font-size:13px">${w.detail}</div></div>
      ${w.anim ? `<button class="warm-anim" data-action="tech" data-key="${w.anim}" data-group="${gkey || ''}" data-title="${esc(w.name)}" data-detail="${esc(w.detail)}" aria-label="Ver ${esc(w.name)} en grande">${GM.anim.html(w.anim, gkey, 'mini')}</button>` : ''}
    </div>`;
  const groupChip = g => `<span class="chip"><i style="background:${GM.GROUPS[g].color}"></i>${GM.GROUPS[g].name}</span>`;
  const scheme = ex => `${ex.sets}×${ex.reps}${ex.unit === 'seg' ? ' s' : ''}`;

  function weekInfo() {
    const ws = GM.startOfWeek(new Date());
    const sessions = S.sessionsBetween(ws, GM.addDays(ws, 7));
    const target = S.state.profile.days;
    return { ws, sessions, done: sessions.length, target, left: Math.max(0, target - sessions.length) };
  }

  function updateTopbar() {
    const w = weekInfo();
    const streak = S.weekStreak();
    $('#topbar-right').innerHTML =
      (streak ? `<span class="pill" title="Semanas seguidas cumpliendo objetivo">🔥 ${streak} sem</span>` : '') +
      `<span class="pill accent" title="Sesiones esta semana">${w.done}/${w.target} esta semana</span>`;
    if (!GM.pwa.online()) $('#topbar-right').insertAdjacentHTML('afterbegin', '<span class="pill offline" title="Todo se guarda en el móvil">📴 Sin conexión</span>');
  }

  /* ---------------- Instalación de la app ---------------- */
  function iosSteps() {
    return `<ol class="steps">
      <li>Abre esta página en <b>Safari</b>.</li>
      <li>Pulsa el botón <b>Compartir</b> <span class="ios-share">⬆︎</span> de la barra inferior.</li>
      <li>Elige <b>"Añadir a pantalla de inicio"</b> y confirma con <b>Añadir</b>.</li>
      <li>Abre GimnasioMike desde el icono nuevo: pantalla completa y sin conexión.</li>
    </ol>`;
  }

  function installCardHTML(compact) {
    const mode = GM.pwa.installMode();
    if (mode === 'installed') return '';
    if (compact && (localStorage.getItem('gm.installDismissed') || mode === 'unsupported' || mode === 'manual')) return '';
    const sub = {
      prompt: 'Instálala en tu móvil: icono propio, pantalla completa y funciona sin cobertura en el gimnasio.',
      ios: 'Añádela a tu pantalla de inicio y funcionará como una app, incluso sin cobertura.',
      manual: 'En el menú del navegador (⋮) elige "Instalar aplicación" o "Añadir a pantalla de inicio".',
      unsupported: 'Para instalarla y usarla sin conexión, ábrela desde su dirección web (https), no como archivo local.'
    }[mode];
    const btn = mode === 'prompt' ? '<button class="btn primary sm" data-action="install">Instalar</button>'
      : mode === 'ios' ? '<button class="btn primary sm" data-action="ios-help">Cómo</button>' : '';
    return `<section class="card">
      <div class="install-card"><img src="icons/icon-192.png" alt="">
        <div class="info"><b>Lleva a tu coach en el bolsillo</b><div class="muted" style="font-size:13px">${sub}</div></div>
        ${btn}
      </div>
      ${compact ? '<div style="text-align:right;margin-top:6px"><button class="btn-ghost sm" data-action="install-dismiss">Ahora no</button></div>' : ''}
    </section>`;
  }

  function openModal(title, html) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('#modal').hidden = false;
    GM.anim.scan($('#modal'));
  }
  function closeModal() { $('#modal').hidden = true; }

  /* ---------------- Sonido ---------------- */
  let audioCtx;
  function beep(times = 3) {
    if (!S.state.profile.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = i === times - 1 ? 1320 : 880;
        o.connect(g); g.connect(audioCtx.destination);
        const t = audioCtx.currentTime + i * 0.25;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
      }
    } catch (e) { /* sin audio */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  /* ---------------- Temporizador de descanso ---------------- */
  const rest = {
    end: 0, total: 0, iv: null,
    start(sec, label) {
      this.total = sec; this.end = Date.now() + sec * 1000;
      $('#rest-label').textContent = label || 'Recupera';
      const el = $('#rest-timer'); el.hidden = false; el.classList.remove('over');
      document.body.classList.add('has-timer');
      clearInterval(this.iv); this.tick(); this.iv = setInterval(() => this.tick(), 250);
    },
    tick() {
      const left = Math.max(0, Math.round((this.end - Date.now()) / 1000));
      $('#rest-time').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      $('#rest-timer .fg').style.strokeDashoffset = 119.4 * (1 - left / Math.max(1, this.total));
      if (left <= 0) {
        clearInterval(this.iv);
        $('#rest-timer').classList.add('over');
        beep();
        GM.coach.shout('rest_over');
        setTimeout(() => this.stop(), 4000);
      }
    },
    adjust(d) { this.end += d * 1000; this.total = Math.max(this.total + d, 1); this.tick(); },
    stop() { clearInterval(this.iv); $('#rest-timer').hidden = true; document.body.classList.remove('has-timer'); }
  };

  /* ================================================================
     VISTA: HOY
     ================================================================ */
  function renderHoy() {
    if (S.state.active) return renderSession();
    if (lastFinish) return renderFinish();

    const p = S.state.profile;
    const w = weekInfo();
    const since = S.daysSinceLast();
    const prog = S.program();
    const nextId = S.nextDayId();
    const day = GM.DAY_TEMPLATES[nextId];
    const exs = S.dayExercises(nextId).map(id => S.exercise(id));
    const todayIdx = (new Date().getDay() + 6) % 7;
    const doneDays = new Set(w.sessions.map(s => (new Date(s.date).getDay() + 6) % 7));
    const plannedDays = new Set(prog.schedule.map(d => DAY_NAMES.indexOf(d)));

    let coachMsg;
    if (since !== null && since >= 3) coachMsg = GM.coach.say('inactive', { days: since });
    else if (w.done >= w.target) coachMsg = GM.coach.say('week_done', w);
    else if (w.done > 0) coachMsg = GM.coach.say('week_progress', w);
    else coachMsg = GM.coach.say('welcome');

    const weekVol = w.sessions.reduce((a, s) => a + s.volume, 0);
    const estMin = exs.reduce((m, e) => m + e.sets * (e.rest / 60 + 0.75), 10);
    const groups = S.dayGroups(nextId);

    view.innerHTML = `
      ${installCardHTML(true)}
      <section class="card coach-hero">
        <div class="coach-line">
          <div class="coach-avatar">🔥</div>
          <div><div class="coach-name">Tu coach · modo ${INTENSITY[p.intensity]}</div>
          <div class="coach-quote">${esc(coachMsg)}</div></div>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Esta semana</h3><small>${w.done} de ${w.target} sesiones</small></div>
        <div class="week-dots">
          ${DAY_LETTERS.map((l, i) => `<span class="${doneDays.has(i) ? 'done' : plannedDays.has(i) ? 'planned' : ''} ${i === todayIdx ? 'today' : ''}" title="${DAY_NAMES[i]}">${doneDays.has(i) ? '✓' : l}</span>`).join('')}
        </div>
        <div class="grid-3" style="margin-top:12px">
          <div class="stat"><div class="v">${S.weekStreak()}</div><div class="l">Semanas en racha</div></div>
          <div class="stat"><div class="v">${GM.fmtNum(Math.round(weekVol / 1000 * 10) / 10)} t</div><div class="l">Volumen semana</div></div>
          <div class="stat"><div class="v">${S.state.sessions.length}</div><div class="l">Sesiones totales</div></div>
        </div>
      </section>

      <div class="section-title">Próximo entrenamiento</div>
      <section class="card day-card next">
        <span class="day-tag">Día ${prog.days.indexOf(nextId) + 1} de ${prog.days.length} · ${prog.name}</span>
        <h2 style="font-size:22px;margin-bottom:10px">${day.name}</h2>
        <div class="chips" style="margin-bottom:12px">${groups.map(groupChip).join('')}</div>
        <div class="row" style="margin-bottom:12px">
          <span class="pill">⏱ ~${Math.round(estMin / 5) * 5} min</span>
          <span class="pill">🏋️ ${exs.length} ejercicios</span>
          <span class="pill">📊 ${exs.reduce((n, e) => n + e.sets, 0)} series</span>
        </div>
        <div class="ex-list">
          ${exs.map((e, i) => {
            const sug = S.suggestion(e.id);
            return `<div class="ex-item"><div class="num">${i + 1}</div>
              <div class="info"><div class="name">${e.name}</div><div class="meta">${GM.GROUPS[e.group].name}${sug.weight ? ` · último ${sug.weight} kg` : ''}${sug.up ? ' · <span style="color:var(--good)">▲ toca subir</span>' : ''}</div></div>
              <div class="scheme">${scheme(e)}</div></div>`;
          }).join('')}
        </div>
        <div class="grid-2" style="margin-top:14px">
          <button class="btn" data-action="pick-day">Cambiar día</button>
          <button class="btn primary lg" data-action="start" data-day="${nextId}">¡A ENTRENAR! 💪</button>
        </div>
      </section>`;
  }

  /* ================================================================
     VISTA: SESIÓN EN CURSO
     ================================================================ */
  function renderSession() {
    const a = S.state.active;
    const day = GM.DAY_TEMPLATES[a.dayId];
    const groups = [...new Set(a.exercises.map(e => GM.EXERCISES[e.exId].group))];
    const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
    const done = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
    const firstCompound = a.exercises.find(e => GM.EXERCISES[e.exId].type === 'compuesto');

    const warmItems = [
      ...GM.WARMUP_GENERAL.map((w, i) => ({ key: 'g' + i, group: 'General', gkey: '', ...w })),
      ...groups.flatMap(g => GM.WARMUP_BY_GROUP[g].map((w, i) => ({ key: g + i, group: GM.GROUPS[g].name, gkey: g, ...w })))
    ];
    const warmDone = warmItems.filter(w => a.warmupDone[w.key]).length;
    let lastGroup = '';

    view.innerHTML = `
      <section class="card session-head">
        <div class="row">
          <div style="flex:1;min-width:0"><small>Entrenando · <span id="elapsed" class="kbd">0:00</span></small>
          <h3 style="font-size:18px">${day.name}</h3></div>
          <button class="btn-ghost sm" data-action="cancel">Abandonar</button>
        </div>
        <div class="row" style="margin-top:10px"><div class="progress" style="flex:1"><div style="width:${total ? (done / total) * 100 : 0}%"></div></div><small class="kbd">${done}/${total}</small></div>
      </section>

      <details class="card" ${warmDone < warmItems.length && done === 0 ? 'open' : ''}>
        <summary class="row" style="cursor:pointer;list-style:none">
          <h3 style="flex:1">🔥 Calentamiento</h3><small>${warmDone}/${warmItems.length}</small>
        </summary>
        <p class="muted" style="margin:8px 0 0;font-size:13px">Específico para: ${groups.map(g => GM.GROUPS[g].name).join(', ')}. Ni se te ocurra saltártelo.</p>
        ${warmItems.map(w => {
          const head = w.group !== lastGroup ? `<div class="warm-group">${w.group}</div>` : '';
          lastGroup = w.group;
          return head + warmRow(w, w.gkey, `<button class="check ${a.warmupDone[w.key] ? 'on' : ''}" data-action="warm" data-key="${w.key}" aria-label="Marcar">✓</button>`);
        }).join('')}
        ${firstCompound ? `<div class="warm-group">Series de aproximación · ${GM.EXERCISES[firstCompound.exId].name}</div>
          <ol class="ramp">${GM.RAMP_UP.map(r => {
            const w = Number(firstCompound.sets[0].w);
            const kg = r.pct && w ? ` → <b>${Math.round((w * r.pct / 100) / 2.5) * 2.5} kg</b>` : '';
            return `<li>${r.label} × ${r.reps}${kg}</li>`;
          }).join('')}</ol>` : ''}
      </details>

      ${a.exercises.map((e, ei) => exerciseCard(e, ei)).join('')}

      <button class="btn block" data-action="add-ex-session">+ Añadir ejercicio</button>
      <button class="btn primary block lg" data-action="finish">Terminar entrenamiento 🏁</button>`;
    tickElapsed();
    GM.anim.scan(view);
  }

  function exerciseCard(e, ei) {
    const ex = S.exercise(e.exId);
    const last = S.lastPerformance(e.exId);
    const sug = S.suggestion(e.exId);
    const allDone = e.sets.length && e.sets.every(s => s.done);
    const unitLbl = ex.unit === 'seg' ? 'Seg' : 'Reps';
    return `
      <section class="card ex-card ${allDone ? 'done' : ''}" id="ex-${ei}">
        <div class="row" style="align-items:flex-start">
          <div style="flex:1;min-width:0">
            <small>${ei + 1} · ${GM.GROUPS[ex.group].name} · ${ex.type}</small>
            <h3 style="font-size:17px">${ex.name} ${allDone ? '✅' : ''}</h3>
          </div>
          <div class="scheme" style="color:var(--accent);font-weight:800">${scheme(ex)}</div>
          <button class="icon-btn" data-action="ex-menu" data-ei="${ei}" aria-label="Opciones">⋯</button>
        </div>
        <div class="ex-visual">
          <button class="anim-btn" data-action="tech" data-key="${e.exId}" data-group="${ex.group}" data-title="${esc(ex.name)}" data-detail="${esc(ex.tip)}" aria-label="Ver la técnica en grande">${GM.anim.html(e.exId, ex.group)}</button>
          <div class="ex-visual-txt">
            <div class="tip">💡 ${ex.tip} <span class="muted">· Descanso ${ex.rest}s</span></div>
            ${videoBtn(ex.name)}
          </div>
        </div>
        <div class="sug ${sug.up ? 'up' : ''}">🎯 ${sug.text}</div>
        <table class="set-table">
          <thead><tr><th>#</th><th>Anterior</th><th>Kg</th><th>${unitLbl}</th><th></th></tr></thead>
          <tbody>
            ${e.sets.map((s, si) => {
              const prev = last && last.ex.sets[si] ? `${last.ex.sets[si].w}×${last.ex.sets[si].r}` : '—';
              return `<tr class="${s.done ? 'set-done' : ''}">
                <td>${si + 1}</td><td class="prev">${prev}</td>
                <td><input class="set-input" inputmode="decimal" placeholder="kg" value="${esc(s.w)}" data-field="w" data-ei="${ei}" data-si="${si}"></td>
                <td><input class="set-input" inputmode="numeric" placeholder="${ex.repMax}" value="${esc(s.r)}" data-field="r" data-ei="${ei}" data-si="${si}"></td>
                <td><button class="set-check" data-action="set-done" data-ei="${ei}" data-si="${si}" aria-label="Serie hecha">✓</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="row" style="justify-content:flex-end;gap:6px">
          <button class="btn-ghost sm" data-action="rm-set" data-ei="${ei}">− Serie</button>
          <button class="btn-ghost sm" data-action="add-set" data-ei="${ei}">+ Serie</button>
        </div>
      </section>`;
  }

  let elapsedIv;
  function tickElapsed() {
    clearInterval(elapsedIv);
    const upd = () => {
      const el = $('#elapsed');
      if (!el || !S.state.active) return clearInterval(elapsedIv);
      const m = Math.floor((Date.now() - S.state.active.start) / 60000);
      el.textContent = m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
    };
    upd(); elapsedIv = setInterval(upd, 15000);
  }

  function toggleSet(ei, si) {
    const a = S.state.active;
    const e = a.exercises[ei];
    const s = e.sets[si];
    const ex = S.exercise(e.exId);
    s.done = !s.done;
    if (s.done) {
      if (s.r === '' || s.r == null) s.r = ex.repMax;
      if ((s.w === '' || s.w == null) && si > 0) s.w = e.sets[si - 1].w;
      // propaga el peso a las series siguientes vacías
      e.sets.slice(si + 1).forEach(n => { if (!n.done && (n.w === '' || n.w == null)) n.w = s.w; });
      const r = Number(s.r);
      const allDone = e.sets.every(x => x.done);
      if (r < ex.repMin) GM.coach.shout('set_low');
      else if (r > ex.repMax) GM.coach.shout('set_high');
      else if (allDone) GM.coach.shout('exercise_done');
      else if (Math.random() < 0.45) GM.coach.shout('set_done');
      const nextEx = allDone ? a.exercises[ei + 1] : e;
      if (!(allDone && !nextEx)) rest.start(ex.rest, allDone && nextEx ? `Siguiente: ${GM.EXERCISES[nextEx.exId].name}` : `${ex.name} · serie ${si + 2}`);
    }
    S.save();
    const y = window.scrollY;
    renderSession();
    window.scrollTo(0, y);
    if (s.done && e.sets.every(x => x.done)) {
      const nx = document.getElementById('ex-' + (ei + 1));
      if (nx) setTimeout(() => nx.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }

  function finishSession() {
    const a = S.state.active;
    const pending = a.exercises.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0);
    const doneCount = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
    if (!doneCount) {
      openModal('¿Sin series?', `<p>No has marcado ninguna serie, ${esc(S.state.profile.name)}. ¿Seguro que quieres terminar? Eso no cuenta como entreno.</p>
        <div class="grid-2"><button class="btn" data-close>Seguir entrenando</button><button class="btn danger" data-action="cancel-confirm">Descartar</button></div>`);
      return;
    }
    openModal('Terminar entrenamiento', `
      ${pending ? `<p style="color:var(--warn)">⚠️ Te quedan <b>${pending}</b> series sin marcar.</p>` : '<p>💪 Todas las series completadas. Así se hace.</p>'}
      <label class="field">Notas de la sesión (opcional)<textarea id="finish-notes" class="input" rows="3" placeholder="Sensaciones, molestias, energía..."></textarea></label>
      <div class="grid-2"><button class="btn" data-close>Volver</button><button class="btn primary" data-action="finish-confirm">Guardar 🏁</button></div>`);
  }

  function renderFinish() {
    const { session, prs } = lastFinish;
    const incomplete = session.totalSets < session.plannedSets;
    const msg = incomplete ? GM.coach.say('finish_incomplete') : GM.coach.say('finish', { volume: GM.fmtNum(session.volume) });
    view.innerHTML = `
      <section class="card coach-hero finish-hero">
        <div class="big">${prs.length ? '🏆' : '🔥'}</div>
        <h2>¡Sesión completada!</h2>
        <p class="coach-quote" style="font-weight:600">${esc(msg)}</p>
      </section>
      <section class="grid-3">
        <div class="stat"><div class="v">${session.duration}′</div><div class="l">Duración</div></div>
        <div class="stat"><div class="v">${session.totalSets}</div><div class="l">Series</div></div>
        <div class="stat"><div class="v">${GM.fmtNum(session.volume)}</div><div class="l">Kg movidos</div></div>
      </section>
      ${prs.length ? `<section class="card"><div class="card-head"><h3>🏆 Récords personales</h3></div>
        ${prs.map(p => `<div class="ex-item" style="margin-bottom:6px"><div class="info"><div class="name">${GM.EXERCISES[p.exId].name}</div><div class="meta">1RM estimado</div></div><div class="scheme">${p.e1rm} kg</div></div>`).join('')}</section>` : ''}
      <button class="btn primary block lg" data-action="finish-close">Hecho</button>`;
    if (prs.length) setTimeout(() => GM.coach.shout('pr', { exercise: GM.EXERCISES[prs[0].exId].name.toUpperCase() }), 600);
  }

  /* ================================================================
     VISTA: PLAN
     ================================================================ */
  function balanceHTML(values) {
    const maxScale = Math.max(24, ...Object.values(values));
    return `<div class="balance">${Object.keys(GM.GROUPS).map(g => {
      const v = Math.round(values[g] * 2) / 2;
      const [lo, hi] = GM.WEEKLY_TARGET[g];
      const st = v < lo ? ['low', '▼ Bajo'] : v > hi ? ['high', '▲ Alto'] : ['ok', '● Óptimo'];
      return `<div class="bal-row" title="${GM.GROUPS[g].name}: ${v} series (objetivo ${lo}-${hi})">
        <span>${GM.GROUPS[g].name}</span>
        <div class="bal-track">
          <div class="bal-band" style="left:${lo / maxScale * 100}%;width:${(hi - lo) / maxScale * 100}%"></div>
          <div class="bal-fill" style="width:${Math.min(100, v / maxScale * 100)}%"></div>
        </div>
        <span class="bal-val">${GM.fmtNum(v)} <span class="status ${st[0]}">${st[1].split(' ')[0]}</span></span>
      </div>`;
    }).join('')}</div>
    <div class="legend"><span><i class="sw"></i>Series semanales</span><span><i class="sw band"></i>Rango objetivo</span>
      <span class="status ok">● Óptimo</span><span class="status low">▼ Bajo</span><span class="status high">▲ Alto</span></div>`;
  }

  function renderPlan() {
    const p = S.state.profile;
    const prog = S.program();
    const nextId = S.nextDayId();
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h3>¿Cuántos días vas a venir?</h3></div>
        <div class="seg">${[3, 4, 5].map(d => `<button class="${p.days === d ? 'on' : ''}" data-action="set-days" data-days="${d}">${d} días</button>`).join('')}</div>
        <h2 style="font-size:20px;margin-top:14px">${prog.name}</h2>
        <p class="muted" style="margin:6px 0 0">${prog.why}</p>
      </section>

      <section class="card">
        <div class="card-head"><h3>⚖️ Equilibrio semanal planificado</h3><small>series por grupo</small></div>
        <p class="muted" style="margin:-4px 0 12px;font-size:13px">Las series de músculos secundarios cuentan como media serie. La zona punteada es el rango recomendado.</p>
        ${balanceHTML(S.plannedWeeklySets())}
      </section>

      ${prog.days.map((dayId, i) => {
        const day = GM.DAY_TEMPLATES[dayId];
        const exs = S.dayExercises(dayId).map(id => S.exercise(id));
        const custom = !!S.state.dayCustom[dayId];
        return `<section class="card day-card ${dayId === nextId ? 'next' : ''}">
          <div class="row"><span class="day-tag" style="flex:1">Día ${i + 1} · ${prog.schedule[i]}${dayId === nextId ? ' · Siguiente' : ''}</span>
            ${custom ? `<button class="btn-ghost sm" data-action="reset-day" data-day="${dayId}">Restaurar</button>` : ''}</div>
          <h3 style="font-size:18px;margin-bottom:8px">${day.name}</h3>
          <div class="chips" style="margin-bottom:10px">${S.dayGroups(dayId).map(groupChip).join('')}</div>
          <div class="ex-list">
            ${exs.map((e, k) => `<div class="ex-item" data-action="edit-ex" data-day="${dayId}" data-id="${e.id}" style="cursor:pointer">
              <div class="num">${k + 1}</div><div class="info"><div class="name">${e.name}</div><div class="meta">${GM.GROUPS[e.group].name} · descanso ${e.rest}s</div></div>
              <div class="scheme">${scheme(e)}</div></div>`).join('')}
          </div>
          <div class="grid-2" style="margin-top:10px">
            <button class="btn" data-action="add-ex" data-day="${dayId}">+ Ejercicio</button>
            <button class="btn" data-action="warmup-info" data-day="${dayId}">🔥 Calentamiento</button>
          </div>
          <button class="btn primary block" style="margin-top:10px" data-action="start" data-day="${dayId}">Empezar este día</button>
        </section>`;
      }).join('')}`;
  }

  function editExerciseModal(dayId, id) {
    const ex = S.exercise(id);
    const best = S.bestE1RM(id);
    const last = S.lastPerformance(id);
    openModal(ex.name, `
      ${GM.anim.html(id, ex.group, 'big')}
      <div class="chips">${groupChip(ex.group)}${(ex.secondary || []).map(groupChip).join('')}</div>
      <div class="tip" style="font-size:13px;color:var(--text-2)">💡 ${ex.tip}</div>
      ${videoBtn(ex.name)}
      <div class="grid-2">
        <label class="field">Series<input id="ed-sets" class="input" type="number" min="1" max="10" value="${ex.sets}"></label>
        <label class="field">${ex.unit === 'seg' ? 'Segundos' : 'Repeticiones'} (rango)<input id="ed-reps" class="input" value="${ex.reps}" placeholder="8-12"></label>
      </div>
      <div class="grid-2">
        <div class="stat"><div class="v">${best ? best + ' kg' : '—'}</div><div class="l">Mejor 1RM estimado</div></div>
        <div class="stat"><div class="v" style="font-size:16px">${last ? last.ex.sets.map(s => `${s.w}×${s.r}`).join(' · ') : '—'}</div><div class="l">Última vez</div></div>
      </div>
      <button class="btn primary block" data-action="save-ex" data-id="${id}">Guardar</button>
      <div class="grid-2">
        <button class="btn" data-action="swap-ex" data-day="${dayId}" data-id="${id}">🔄 Cambiar</button>
        <button class="btn danger" data-action="rm-ex" data-day="${dayId}" data-id="${id}">Quitar del día</button>
      </div>
      <div class="grid-2">
        <button class="btn-ghost" data-action="move-ex" data-dir="-1" data-day="${dayId}" data-id="${id}">↑ Subir</button>
        <button class="btn-ghost" data-action="move-ex" data-dir="1" data-day="${dayId}" data-id="${id}">↓ Bajar</button>
      </div>`);
  }

  function pickExerciseModal(title, onlyGroup, ctx) {
    const groups = onlyGroup ? [onlyGroup] : Object.keys(GM.GROUPS);
    openModal(title, groups.map(g => `
      <div class="warm-group">${GM.GROUPS[g].name}</div>
      <div class="ex-list">${Object.entries(GM.EXERCISES).filter(([, e]) => e.group === g).map(([id]) => {
        const e = S.exercise(id);
        return `<div class="ex-item" style="cursor:pointer" data-action="pick-ex" data-id="${id}" data-ctx="${esc(JSON.stringify(ctx))}">
          <div class="thumb">${GM.anim.html(id, e.group, 'mini')}</div>
          <div class="info"><div class="name">${e.name}</div><div class="meta">${e.type}</div></div><div class="scheme">${scheme(e)}</div></div>`;
      }).join('')}</div>`).join(''));
  }

  function warmupModal(dayId) {
    const groups = S.dayGroups(dayId);
    openModal('Calentamiento · ' + GM.DAY_TEMPLATES[dayId].name, `
      <div class="warm-group">General (8-10 min)</div>
      ${GM.WARMUP_GENERAL.map(w => warmRow(w, '')).join('')}
      ${groups.map(g => `<div class="warm-group">${GM.GROUPS[g].name}</div>
        ${GM.WARMUP_BY_GROUP[g].map(w => warmRow(w, g)).join('')}`).join('')}
      <div class="warm-group">Series de aproximación (primer compuesto)</div>
      <ol class="ramp">${GM.RAMP_UP.map(r => `<li>${r.label} × ${r.reps}</li>`).join('')}</ol>`);
  }

  /* ================================================================
     VISTA: PROGRESO
     ================================================================ */
  function renderProgreso() {
    const sessions = S.state.sessions;
    if (!sessions.length) {
      view.innerHTML = `<section class="card empty"><div class="big">📈</div><h3>Aún no hay datos</h3>
        <p>Entrena y aquí verás tu evolución. ¿Quieres ver cómo quedará? Carga datos de ejemplo.</p>
        <button class="btn" data-action="demo">Cargar datos de ejemplo</button></section>`;
      return;
    }
    const totalVol = sessions.reduce((a, s) => a + s.volume, 0);
    const avgDur = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / sessions.length);

    // Volumen semanal (12 semanas)
    const ws = GM.startOfWeek(new Date());
    const weeks = Array.from({ length: 12 }, (_, i) => GM.addDays(ws, -7 * (11 - i)));
    const weekVol = weeks.map(w => S.sessionsBetween(w, GM.addDays(w, 7)).reduce((a, s) => a + s.volume, 0));
    const weekCnt = weeks.map(w => S.sessionsBetween(w, GM.addDays(w, 7)).length);
    const weekLbl = weeks.map(w => GM.fmtDate(w, { day: 'numeric', month: 'short' }));

    // Ejercicios con historial
    const exIds = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.exId)))]
      .filter(id => GM.EXERCISES[id] && GM.EXERCISES[id].unit !== 'seg');
    if (!progressEx || !exIds.includes(progressEx)) progressEx = exIds.includes('press_banca') ? 'press_banca' : exIds[0];

    const actual = S.setsByGroup(GM.addDays(new Date(), -7), new Date());

    view.innerHTML = `
      <section class="grid-2">
        <div class="stat"><div class="v">${sessions.length}</div><div class="l">Sesiones</div></div>
        <div class="stat"><div class="v">${GM.fmtNum(Math.round(totalVol / 100) / 10)} t</div><div class="l">Volumen total</div></div>
        <div class="stat"><div class="v">${S.weekStreak()} 🔥</div><div class="l">Semanas en racha</div></div>
        <div class="stat"><div class="v">${avgDur}′</div><div class="l">Duración media</div></div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Progresión por ejercicio</h3><small>1RM estimado (kg)</small></div>
        <select class="input" data-action="progress-ex" style="margin-bottom:12px">
          ${exIds.map(id => `<option value="${id}" ${id === progressEx ? 'selected' : ''}>${GM.EXERCISES[id].name}</option>`).join('')}
        </select>
        <div id="ex-summary" class="grid-3" style="margin-bottom:12px"></div>
        <div class="chart-wrap"><canvas id="ch-ex"></canvas></div>
        <details class="table-toggle"><summary>Ver tabla de datos</summary><div id="ex-table"></div></details>
      </section>

      <section class="card">
        <div class="card-head"><h3>Volumen semanal</h3><small>kg × reps · 12 semanas</small></div>
        <div class="chart-wrap"><canvas id="ch-vol"></canvas></div>
        <details class="table-toggle"><summary>Ver tabla de datos</summary>
          <table class="data"><thead><tr><th>Semana</th><th class="n">Sesiones</th><th class="n">Volumen (kg)</th></tr></thead>
          <tbody>${weeks.map((w, i) => `<tr><td>${weekLbl[i]}</td><td class="n">${weekCnt[i]}</td><td class="n">${GM.fmtNum(weekVol[i])}</td></tr>`).join('')}</tbody></table>
        </details>
      </section>

      <section class="card">
        <div class="card-head"><h3>⚖️ Equilibrio real</h3><small>últimos 7 días</small></div>
        ${balanceHTML(actual)}
      </section>

      <section class="card">
        <div class="card-head"><h3>Constancia</h3><small>últimas 20 semanas</small></div>
        ${heatmapHTML()}
      </section>`;

    GM.charts.bars($('#ch-vol'), {
      labels: weekLbl, values: weekVol,
      fmt: v => v >= 1000 ? GM.fmtNum(Math.round(v / 100) / 10) + 'k' : GM.fmtNum(v),
      tip: i => `<b>Semana del ${weekLbl[i]}</b><br>${GM.fmtNum(weekVol[i])} kg · ${weekCnt[i]} sesiones`
    });
    drawExerciseChart();
  }

  function drawExerciseChart() {
    const h = S.history(progressEx);
    const pts = h.map(x => {
      const best = x.ex.sets.reduce((b, s) => (GM.e1rm(s.w, s.r) > GM.e1rm(b.w, b.r) ? s : b), x.ex.sets[0]);
      return { date: x.date, e1rm: GM.e1rm(best.w, best.r), best, sets: x.ex.sets };
    });
    const vals = pts.map(p => p.e1rm);
    const first = vals[0] || 0, lastV = vals[vals.length - 1] || 0, max = Math.max(...vals, 0);
    const diff = first ? Math.round((lastV - first) / first * 100) : 0;
    $('#ex-summary').innerHTML = `
      <div class="stat"><div class="v">${max}</div><div class="l">Récord (kg)</div></div>
      <div class="stat"><div class="v">${lastV}</div><div class="l">Actual (kg)</div></div>
      <div class="stat"><div class="v" style="color:${diff >= 0 ? 'var(--good)' : 'var(--bad)'}">${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)}%</div><div class="l">Desde el inicio</div></div>`;
    const labels = pts.map(p => GM.fmtDate(p.date, { day: 'numeric', month: 'short' }));
    GM.charts.line($('#ch-ex'), {
      labels, values: vals, fmt: v => GM.fmtNum(Math.round(v)),
      tip: i => `<b>${labels[i]}</b><br>1RM est. ${vals[i]} kg<br><span class="muted">Mejor serie ${pts[i].best.w} kg × ${pts[i].best.r}</span>`
    });
    $('#ex-table').innerHTML = `<table class="data"><thead><tr><th>Fecha</th><th>Series</th><th class="n">1RM est.</th></tr></thead>
      <tbody>${pts.slice().reverse().map((p, i) => `<tr><td>${labels[pts.length - 1 - i]}</td><td>${p.sets.map(s => `${s.w}×${s.r}`).join(' · ')}</td><td class="n">${p.e1rm}</td></tr>`).join('')}</tbody></table>`;
  }

  function heatmapHTML() {
    const weeks = 20;
    const start = GM.addDays(GM.startOfWeek(new Date()), -7 * (weeks - 1));
    const today = GM.startOfDay(new Date());
    const vols = {};
    S.state.sessions.forEach(s => { const k = GM.startOfDay(new Date(s.date)).getTime(); vols[k] = (vols[k] || 0) + s.volume; });
    const maxV = Math.max(1, ...Object.values(vols));
    let cells = '';
    for (let i = 0; i < weeks * 7; i++) {
      const d = GM.addDays(start, i);
      const v = vols[d.getTime()];
      const lvl = d > today ? 'future' : v ? (v > maxV * 0.66 ? 'l3' : v > maxV * 0.33 ? 'l2' : 'l1') : '';
      cells += `<div class="${lvl}" title="${GM.fmtDate(d)}${v ? ' · ' + GM.fmtNum(v) + ' kg' : ''}"></div>`;
    }
    return `<div class="heat-wrap"><div class="heat-days">${DAY_LETTERS.map((l, i) => `<span>${i % 2 === 0 ? l : ''}</span>`).join('')}</div><div class="heat">${cells}</div></div>
      <div class="legend"><span>Menos</span><span class="row" style="gap:3px"><i class="sw" style="background:var(--surface-2)"></i><i class="sw" style="background:color-mix(in srgb, var(--accent) 35%, transparent)"></i><i class="sw" style="background:color-mix(in srgb, var(--accent) 65%, transparent)"></i><i class="sw" style="background:var(--accent)"></i></span><span>Más volumen</span></div>`;
  }

  /* ================================================================
     VISTA: HISTORIAL
     ================================================================ */
  function renderHistorial() {
    const sessions = S.state.sessions.slice().reverse();
    if (!sessions.length) {
      view.innerHTML = `<section class="card empty"><div class="big">🗓️</div><h3>Historial vacío</h3><p>Tu primera sesión te está esperando. ¿A qué esperas?</p>
        <button class="btn primary" data-tab-go="hoy">Ir a entrenar</button></section>`;
      return;
    }
    let lastMonth = '';
    view.innerHTML = sessions.map(s => {
      const d = new Date(s.date);
      const month = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const head = month !== lastMonth ? `<div class="section-title">${month}</div>` : '';
      lastMonth = month;
      return `${head}<div class="hist-item" data-action="session-detail" data-id="${s.id}">
        <div class="hist-date"><div class="d">${d.getDate()}</div><div class="m">${d.toLocaleDateString('es-ES', { weekday: 'short' })}</div></div>
        <div class="info"><div class="name" style="font-weight:650">${s.dayName} ${s.prs && s.prs.length ? '<span class="badge-pr">PR</span>' : ''}</div>
          <div class="meta muted" style="font-size:12.5px">${s.duration} min · ${s.totalSets} series · ${GM.fmtNum(s.volume)} kg</div></div>
        <span class="muted">›</span></div>`;
    }).join('');
  }

  function sessionDetail(id) {
    const s = S.state.sessions.find(x => x.id === id);
    if (!s) return;
    openModal(s.dayName, `
      <small>${GM.fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
      <div class="grid-3">
        <div class="stat"><div class="v">${s.duration}′</div><div class="l">Duración</div></div>
        <div class="stat"><div class="v">${s.totalSets}</div><div class="l">Series</div></div>
        <div class="stat"><div class="v">${GM.fmtNum(s.volume)}</div><div class="l">Kg</div></div>
      </div>
      <table class="data"><thead><tr><th>Ejercicio</th><th>Series (kg×reps)</th></tr></thead>
        <tbody>${s.exercises.map(e => `<tr><td>${GM.EXERCISES[e.exId] ? GM.EXERCISES[e.exId].name : e.exId} ${(s.prs || []).includes(e.exId) ? '<span class="badge-pr">PR</span>' : ''}</td>
          <td>${e.sets.map(x => `${x.w}×${x.r}`).join(' · ')}</td></tr>`).join('')}</tbody></table>
      ${s.notes ? `<div class="tip" style="font-size:13px">📝 ${esc(s.notes)}</div>` : ''}
      <button class="btn danger block" data-action="delete-session" data-id="${s.id}">Eliminar sesión</button>`);
  }

  /* ================================================================
     VISTA: AJUSTES
     ================================================================ */
  function renderAjustes() {
    const p = S.state.profile;
    view.innerHTML = `
      <section class="card">
        <div class="card-head"><h3>Perfil</h3></div>
        <div class="grid-2">
          <label class="field">Nombre<input class="input" data-pf="name" value="${esc(p.name)}"></label>
          <label class="field">Peso corporal (kg)<input class="input" data-pf="bodyweight" inputmode="decimal" value="${esc(p.bodyweight ?? '')}"></label>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h3>🎨 Tema</h3><small>${GM.theme.MODES[GM.theme.current().mode]}</small></div>
        <div class="seg">${Object.entries(GM.theme.MODES).map(([k, n]) => `<button class="${GM.theme.current().mode === k ? 'on' : ''}" data-action="set-mode" data-mode="${k}">${n}</button>`).join('')}</div>
        <div class="swatches" role="radiogroup" aria-label="Color de acento">
          ${Object.entries(GM.theme.ACCENTS).map(([k, a]) => {
            const on = GM.theme.current().accent === k;
            return `<button class="swatch ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-action="set-accent" data-accent="${k}" title="${a.name}">
              <i style="background:${a[GM.theme.resolvedMode()]}"></i><span>${a.name}</span></button>`;
          }).join('')}
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h3>Nivel de caña del coach</h3></div>
        <div class="seg">${[1, 2, 3].map(l => `<button class="${p.intensity === l ? 'on' : ''}" data-action="set-intensity" data-l="${l}">${INTENSITY[l]}</button>`).join('')}</div>
        <p class="muted" style="font-size:13px;margin:10px 0 0">"${esc(GM.coach.say('welcome'))}"</p>
      </section>
      <section class="card">
        <div class="card-head"><h3>Días por semana</h3></div>
        <div class="seg">${[3, 4, 5].map(d => `<button class="${p.days === d ? 'on' : ''}" data-action="set-days" data-days="${d}">${d} días</button>`).join('')}</div>
      </section>
      <section class="card">
        <div class="row"><div style="flex:1"><h3>Sonido y vibración</h3><small>Al terminar el descanso</small></div>
        <button class="check ${p.sound ? 'on' : ''}" data-action="toggle-sound">✓</button></div>
      </section>
      <section class="card">
        <div class="card-head"><h3>Datos</h3><small>Se guardan en este dispositivo</small></div>
        <div class="grid-2">
          <button class="btn" data-action="export">⬇️ Exportar copia</button>
          <label class="btn" style="cursor:pointer">⬆️ Importar<input type="file" accept="application/json" id="import-file" hidden></label>
          <button class="btn" data-action="demo">🧪 Datos de ejemplo</button>
          <button class="btn danger" data-action="reset">🗑️ Borrar todo</button>
        </div>
      </section>
      <div class="section-title">App</div>
      ${installCardHTML(false)}
      <section class="card">
        <div class="card-head"><h3>Estado</h3></div>
        <table class="data"><tbody>
          <tr><td>Instalada</td><td class="n">${GM.pwa.isStandalone() ? '✅ Sí' : '— No'}</td></tr>
          <tr><td>Lista para usar sin conexión</td><td class="n">${navigator.serviceWorker && navigator.serviceWorker.controller ? '✅ Sí' : GM.pwa.canSW ? '⏳ Preparando…' : '❌ No (abre la versión web)'}</td></tr>
          <tr><td>Datos protegidos frente a limpiezas del navegador</td><td class="n">${GM.pwa.state.persisted ? '✅ Sí' : '⚠️ No garantizado'}</td></tr>
          <tr><td>Conexión</td><td class="n">${GM.pwa.online() ? '🟢 En línea' : '📴 Sin conexión'}</td></tr>
        </tbody></table>
        <p class="muted" style="font-size:12.5px;margin:10px 0 0">Tus entrenamientos se guardan en este móvil. Exporta una copia de vez en cuando por si lo cambias o lo pierdes.</p>
      </section>
      <p class="muted" style="text-align:center;font-size:12px">GimnasioMike · v0.2</p>`;
  }

  /* ================================================================
     NAVEGACIÓN
     ================================================================ */
  function render() {
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    ({ hoy: renderHoy, plan: renderPlan, progreso: renderProgreso, historial: renderHistorial, ajustes: renderAjustes })[tab]();
    updateTopbar();
    GM.anim.scan(view);
  }
  function go(t) { tab = t; window.scrollTo(0, 0); render(); }

  /* ---------------- Eventos ---------------- */
  document.addEventListener('click', ev => {
    const tabBtn = ev.target.closest('[data-tab]');
    if (tabBtn) return go(tabBtn.dataset.tab);
    const tabGo = ev.target.closest('[data-tab-go]');
    if (tabGo) return go(tabGo.dataset.tabGo);
    if (ev.target.closest('[data-close]') || ev.target.id === 'modal') return closeModal();
    const restBtn = ev.target.closest('[data-rest]');
    if (restBtn) { const v = restBtn.dataset.rest; return v === 'skip' ? rest.stop() : rest.adjust(Number(v)); }

    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const d = el.dataset;
    const a = S.state.active;

    switch (d.action) {
      case 'start':
        if (a) { closeModal(); return go('hoy'); }
        S.startSession(d.day); closeModal(); go('hoy');
        GM.pwa.keepAwake(true);
        GM.coach.shout('start');
        break;
      case 'pick-day': {
        const prog = S.program();
        openModal('¿Qué toca hoy?', prog.days.map((id, i) => `<div class="ex-item" style="cursor:pointer" data-action="start" data-day="${id}">
          <div class="num">${i + 1}</div><div class="info"><div class="name">${GM.DAY_TEMPLATES[id].name}</div><div class="meta">${S.dayGroups(id).map(g => GM.GROUPS[g].name).join(', ')}</div></div><span>›</span></div>`).join(''));
        break;
      }
      case 'warm':
        a.warmupDone[d.key] = !a.warmupDone[d.key]; S.save();
        el.classList.toggle('on');
        break;
      case 'set-done': toggleSet(Number(d.ei), Number(d.si)); break;
      case 'add-set': {
        const e = a.exercises[d.ei]; const lastSet = e.sets[e.sets.length - 1];
        e.sets.push({ w: lastSet ? lastSet.w : '', r: '', done: false }); S.save(); renderSession(); break;
      }
      case 'rm-set': {
        const e = a.exercises[d.ei];
        if (e.sets.length > 1) { e.sets.pop(); S.save(); renderSession(); }
        break;
      }
      case 'ex-menu': {
        const e = a.exercises[d.ei];
        openModal(GM.EXERCISES[e.exId].name, `
          <button class="btn block" data-action="swap-session" data-ei="${d.ei}">🔄 Cambiar por otro de ${GM.GROUPS[GM.EXERCISES[e.exId].group].name}</button>
          <button class="btn danger block" data-action="rm-session-ex" data-ei="${d.ei}">Quitar de esta sesión</button>`);
        break;
      }
      case 'swap-session': pickExerciseModal('Cambiar ejercicio', GM.EXERCISES[a.exercises[d.ei].exId].group, { mode: 'swap-session', ei: Number(d.ei) }); break;
      case 'rm-session-ex': a.exercises.splice(Number(d.ei), 1); S.save(); closeModal(); renderSession(); break;
      case 'add-ex-session': pickExerciseModal('Añadir ejercicio', null, { mode: 'add-session' }); break;
      case 'cancel':
        openModal('¿Abandonar?', `<p>¿Te vas a rajar, ${esc(S.state.profile.name)}? Se perderá lo que llevas de sesión.</p>
          <div class="grid-2"><button class="btn primary" data-close>¡Sigo! 💪</button><button class="btn danger" data-action="cancel-confirm">Abandonar</button></div>`);
        break;
      case 'cancel-confirm': S.cancelSession(); rest.stop(); GM.pwa.keepAwake(false); closeModal(); go('hoy'); break;
      case 'finish': finishSession(); break;
      case 'finish-confirm': {
        const notes = ($('#finish-notes') || {}).value || '';
        lastFinish = S.finishSession(notes); rest.stop(); GM.pwa.keepAwake(false); closeModal(); go('hoy');
        break;
      }
      case 'finish-close': lastFinish = null; go('hoy'); break;

      // Plan
      case 'set-days':
        S.state.profile.days = Number(d.days); S.state.rotation = 0; S.save(); render();
        GM.coach.shout(`${d.days} días por semana. Te tomo la palabra: no acepto ni uno menos.`);
        break;
      case 'edit-ex': editExerciseModal(d.day, d.id); break;
      case 'save-ex': {
        const sets = $('#ed-sets').value, reps = $('#ed-reps').value.trim().replace(/\s/g, '');
        if (!/^\d+(-\d+)?$/.test(reps)) { alert('Rango no válido. Usa por ejemplo 8-12 o 10'); return; }
        S.setOverride(d.id, sets, reps); closeModal(); render(); break;
      }
      case 'rm-ex': {
        const list = S.dayExercises(d.day).filter(x => x !== d.id);
        S.setDayExercises(d.day, list); closeModal(); render(); break;
      }
      case 'move-ex': {
        const list = S.dayExercises(d.day).slice(); const i = list.indexOf(d.id); const j = i + Number(d.dir);
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]]; S.setDayExercises(d.day, list); closeModal(); render(); break;
      }
      case 'swap-ex': pickExerciseModal('Cambiar ejercicio', GM.EXERCISES[d.id].group, { mode: 'swap-plan', day: d.day, id: d.id }); break;
      case 'add-ex': pickExerciseModal('Añadir ejercicio', null, { mode: 'add-plan', day: d.day }); break;
      case 'reset-day': S.resetDay(d.day); render(); break;
      case 'warmup-info': warmupModal(d.day); break;
      case 'pick-ex': {
        const c = JSON.parse(d.ctx);
        if (c.mode === 'add-plan') S.setDayExercises(c.day, [...S.dayExercises(c.day), d.id]);
        if (c.mode === 'swap-plan') S.setDayExercises(c.day, S.dayExercises(c.day).map(x => (x === c.id ? d.id : x)));
        if (c.mode === 'add-session' || c.mode === 'swap-session') {
          const ex = S.exercise(d.id); const sug = S.suggestion(d.id);
          const item = { exId: d.id, sets: Array.from({ length: ex.sets }, () => ({ w: sug.weight ?? '', r: '', done: false })) };
          if (c.mode === 'add-session') a.exercises.push(item); else a.exercises[c.ei] = item;
          S.save();
        }
        closeModal(); render(); break;
      }

      // Historial
      case 'session-detail': sessionDetail(d.id); break;
      case 'delete-session':
        if (confirm('¿Eliminar esta sesión del historial?')) { S.deleteSession(d.id); closeModal(); render(); }
        break;

      // Técnica y tema
      case 'tech':
        openModal(d.title, `${GM.anim.html(d.key, d.group, 'big')}
          <div class="tip" style="font-size:14px;color:var(--text-2)">💡 ${esc(d.detail)}</div>
          ${videoBtn(d.title)}`);
        break;
      case 'set-mode': GM.theme.set({ mode: d.mode }); render(); break;
      case 'set-accent': GM.theme.set({ accent: d.accent }); render(); break;

      // App
      case 'install':
        GM.pwa.promptInstall().then(() => render());
        break;
      case 'install-dismiss': localStorage.setItem('gm.installDismissed', '1'); render(); break;
      case 'ios-help': openModal('Instalar en iPhone', iosSteps()); break;
      case 'apply-update': GM.pwa.applyUpdate(); break;

      // Ajustes
      case 'set-intensity':
        S.state.profile.intensity = Number(d.l); S.save(); render(); GM.coach.shout('welcome'); break;
      case 'toggle-sound': S.state.profile.sound = !S.state.profile.sound; S.save(); render(); break;
      case 'export': {
        const blob = new Blob([S.exportJSON()], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gimnasiomike-${new Date().toISOString().slice(0, 10)}.json`;
        link.click(); URL.revokeObjectURL(link.href);
        break;
      }
      case 'demo':
        if (!S.state.sessions.length || confirm('Esto reemplaza tu historial por datos de ejemplo. ¿Seguro?')) {
          S.seedDemo(); progressEx = null; render(); GM.coach.shout('Datos de ejemplo cargados. Ahora a por los reales.');
        }
        break;
      case 'reset':
        if (confirm('¿Borrar TODOS tus datos? No se puede deshacer.')) { S.reset(); lastFinish = null; render(); }
        break;
    }
  });

  document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.matches('.set-input')) {
      const s = S.state.active.exercises[t.dataset.ei].sets[t.dataset.si];
      s[t.dataset.field] = t.value.replace(',', '.');
      S.save();
    } else if (t.matches('[data-pf]')) {
      const k = t.dataset.pf;
      S.state.profile[k] = k === 'bodyweight' ? (t.value ? Number(t.value.replace(',', '.')) : null) : t.value;
      S.save(); updateTopbar();
    }
  });

  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.matches('[data-action="progress-ex"]')) { progressEx = t.value; drawExerciseChart(); }
    if (t.id === 'import-file' && t.files[0]) {
      t.files[0].text().then(txt => {
        try { S.importJSON(txt); render(); GM.coach.shout('Copia importada. Tu historial ha vuelto. Ahora a sumarle más.'); }
        catch (e) { alert('No se pudo importar: ' + e.message); }
      });
    }
  });

  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeModal(); });

  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => tab === 'progreso' && render(), 200); });

  // refresca la interfaz cuando cambia la conexión o la instalación (sin interrumpir una sesión)
  GM.pwa.onChange(() => {
    updateTopbar();
    if (!S.state.active && (tab === 'hoy' || tab === 'ajustes') && $('#modal').hidden) render();
  });
  if (S.state.active) GM.pwa.keepAwake(true);
  GM.theme.apply();
  document.addEventListener('gm:theme', () => { if (!S.state.active) render(); });

  render();
})();
