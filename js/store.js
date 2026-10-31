/* ==========================================================================
   GimnasioMike · Almacenamiento y analítica
   Todo se guarda en localStorage (en el navegador). Exportable a JSON.
   ========================================================================== */
window.GM = window.GM || {};

const STORAGE_KEY = 'gimnasioMike.v1';

GM.store = {
  state: null,

  defaults() {
    return {
      version: 1,
      profile: { name: 'Mike', days: 4, intensity: 2, bodyweight: null, sound: true },
      overrides: {},     // { exId: { sets, reps } }  ← series/reps personalizadas
      dayCustom: {},     // { dayId: [exId, ...] }    ← ejercicios personalizados por día
      sessions: [],      // histórico de entrenamientos
      active: null,      // sesión en curso
      rotation: 0        // índice del próximo día del programa
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      const d = this.defaults();
      this.state = saved ? Object.assign(d, saved, { profile: Object.assign(d.profile, saved.profile || {}) }) : d;
    } catch (e) {
      console.error('Error leyendo datos', e);
      this.state = this.defaults();
    }
    return this.state;
  },

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },

  reset() { this.state = this.defaults(); this.save(); },

  /* ---------- Ejercicios y programa ---------- */
  exercise(id) {
    const base = GM.EXERCISES[id];
    if (!base) return null;
    const o = this.state.overrides[id] || {};
    const reps = o.reps || base.reps;
    const [repMin, repMax] = String(reps).split('-').map(Number);
    return Object.assign({ id, unit: 'reps' }, base, o, { reps, repMin, repMax: repMax || repMin });
  },

  setOverride(id, sets, reps) {
    const base = GM.EXERCISES[id];
    const o = {};
    if (sets && Number(sets) !== base.sets) o.sets = Number(sets);
    if (reps && reps !== base.reps) o.reps = reps;
    if (Object.keys(o).length) this.state.overrides[id] = o; else delete this.state.overrides[id];
    this.save();
  },

  program() { return GM.PROGRAMS[this.state.profile.days]; },

  dayExercises(dayId) {
    return (this.state.dayCustom[dayId] || GM.DAY_TEMPLATES[dayId].exercises).filter(id => GM.EXERCISES[id]);
  },

  setDayExercises(dayId, list) {
    this.state.dayCustom[dayId] = list;
    this.save();
  },

  resetDay(dayId) { delete this.state.dayCustom[dayId]; this.save(); },

  nextDayId() {
    const days = this.program().days;
    return days[this.state.rotation % days.length];
  },

  dayGroups(dayId) {
    const set = new Set();
    this.dayExercises(dayId).forEach(id => set.add(GM.EXERCISES[id].group));
    return [...set];
  },

  /* Series semanales planificadas por grupo (secundarios = 0,5) */
  plannedWeeklySets() {
    const t = {};
    Object.keys(GM.GROUPS).forEach(g => (t[g] = 0));
    this.program().days.forEach(dayId => {
      this.dayExercises(dayId).forEach(id => {
        const ex = this.exercise(id);
        t[ex.group] += ex.sets;
        (ex.secondary || []).forEach(s => (t[s] += ex.sets / 2));
      });
    });
    return t;
  },

  /* ---------- Sesiones ---------- */
  startSession(dayId) {
    const exercises = this.dayExercises(dayId).map(id => {
      const ex = this.exercise(id);
      const sug = this.suggestion(id);
      return {
        exId: id,
        sets: Array.from({ length: ex.sets }, () => ({ w: sug.weight ?? '', r: '', done: false }))
      };
    });
    this.state.active = { id: 's' + Date.now(), dayId, start: Date.now(), warmupDone: {}, exercises };
    this.save();
    return this.state.active;
  },

  finishSession(notes = '') {
    const a = this.state.active;
    if (!a) return null;
    const prsBefore = {};
    a.exercises.forEach(e => (prsBefore[e.exId] = this.bestE1RM(e.exId)));

    const session = {
      id: a.id,
      date: new Date(a.start).toISOString(),
      dayId: a.dayId,
      dayName: GM.DAY_TEMPLATES[a.dayId].name,
      duration: Math.round((Date.now() - a.start) / 60000),
      notes,
      exercises: a.exercises
        .map(e => ({ exId: e.exId, sets: e.sets.filter(s => s.done).map(s => ({ w: Number(s.w) || 0, r: Number(s.r) || 0 })) }))
        .filter(e => e.sets.length)
    };
    session.volume = this.sessionVolume(session);
    session.totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
    session.plannedSets = a.exercises.reduce((n, e) => n + e.sets.length, 0);

    const prs = [];
    session.exercises.forEach(e => {
      const best = Math.max(...e.sets.map(s => GM.e1rm(s.w, s.r)));
      if (best > 0 && best > (prsBefore[e.exId] || 0) && prsBefore[e.exId] > 0) prs.push({ exId: e.exId, e1rm: best });
    });
    session.prs = prs.map(p => p.exId);

    this.state.sessions.push(session);
    this.state.sessions.sort((x, y) => new Date(x.date) - new Date(y.date));
    this.state.rotation = (this.program().days.indexOf(a.dayId) + 1) % this.program().days.length;
    this.state.active = null;
    this.save();
    return { session, prs };
  },

  cancelSession() { this.state.active = null; this.save(); },

  deleteSession(id) {
    this.state.sessions = this.state.sessions.filter(s => s.id !== id);
    this.save();
  },

  sessionVolume(s) {
    return Math.round(s.exercises.reduce((v, e) => {
      const ex = GM.EXERCISES[e.exId];
      if (ex && ex.unit === 'seg') return v;
      return v + e.sets.reduce((a, st) => a + st.w * st.r, 0);
    }, 0));
  },

  /* ---------- Analítica ---------- */
  history(exId) {
    return this.state.sessions
      .map(s => ({ date: s.date, ex: s.exercises.find(e => e.exId === exId) }))
      .filter(x => x.ex && x.ex.sets.length);
  },

  lastPerformance(exId) {
    const h = this.history(exId);
    return h.length ? h[h.length - 1] : null;
  },

  bestE1RM(exId) {
    let best = 0;
    this.history(exId).forEach(h => h.ex.sets.forEach(s => (best = Math.max(best, GM.e1rm(s.w, s.r)))));
    return best;
  },

  /* Sobrecarga progresiva: si completaste todas las series en el tope del rango, sube carga */
  suggestion(exId) {
    const ex = this.exercise(exId);
    const last = this.lastPerformance(exId);
    if (!last) return { weight: null, text: 'Primera vez: elige un peso con el que llegues justo al rango con 1-2 reps en reserva.' };
    const sets = last.ex.sets;
    const topW = Math.max(...sets.map(s => s.w));
    const allTop = sets.length >= ex.sets && sets.every(s => s.r >= ex.repMax);
    const anyLow = sets.some(s => s.r < ex.repMin);
    if (ex.unit === 'seg') {
      return { weight: topW || null, text: allTop ? 'Has dominado el tiempo: añade 10-15 s o lastre.' : `Objetivo: ${ex.repMax} s en todas las series.` };
    }
    if (allTop && ex.inc > 0) {
      const nw = Math.round((topW + ex.inc) * 100) / 100;
      return { weight: nw, up: true, text: `¡Sube a ${nw} kg! La última vez reventaste el rango (${sets.map(s => s.r).join('/')}).` };
    }
    if (anyLow) return { weight: topW, text: `Mantén ${topW} kg y completa el rango (${ex.reps}). La última vez: ${sets.map(s => s.r).join('/')}.` };
    return { weight: topW, text: `Repite ${topW} kg y saca más reps que la última vez (${sets.map(s => s.r).join('/')}).` };
  },

  /* Series efectivas por grupo en un rango de fechas */
  setsByGroup(from, to) {
    const t = {};
    Object.keys(GM.GROUPS).forEach(g => (t[g] = 0));
    this.state.sessions.forEach(s => {
      const d = new Date(s.date);
      if (d < from || d >= to) return;
      s.exercises.forEach(e => {
        const ex = GM.EXERCISES[e.exId];
        if (!ex) return;
        t[ex.group] += e.sets.length;
        (ex.secondary || []).forEach(g => (t[g] += e.sets.length / 2));
      });
    });
    return t;
  },

  sessionsBetween(from, to) {
    return this.state.sessions.filter(s => { const d = new Date(s.date); return d >= from && d < to; });
  },

  daysSinceLast() {
    const s = this.state.sessions;
    if (!s.length) return null;
    return Math.floor((GM.startOfDay(new Date()) - GM.startOfDay(new Date(s[s.length - 1].date))) / 86400000);
  },

  /* Racha de semanas consecutivas cumpliendo el objetivo de días */
  weekStreak() {
    let streak = 0;
    let wk = GM.startOfWeek(new Date());
    const target = this.state.profile.days;
    // la semana actual cuenta si ya está cumplida
    const thisWeek = this.sessionsBetween(wk, GM.addDays(wk, 7)).length;
    if (thisWeek >= target) streak++;
    for (let i = 0; i < 104; i++) {
      wk = GM.addDays(wk, -7);
      const n = this.sessionsBetween(wk, GM.addDays(wk, 7)).length;
      if (n >= target) streak++; else break;
    }
    return streak;
  },

  /* ---------- Copia de seguridad ---------- */
  exportJSON() { return JSON.stringify(this.state, null, 2); },
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.sessions)) throw new Error('Archivo no válido');
    this.state = Object.assign(this.defaults(), data);
    this.save();
  },

  /* Genera 8 semanas de datos de ejemplo para ver las gráficas */
  seedDemo() {
    const prog = this.program();
    const start = GM.addDays(GM.startOfWeek(new Date()), -7 * 7); // 7 semanas pasadas + la actual
    const offsets = { 'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4, 'Sábado': 5, 'Domingo': 6 };
    const base = {};
    const sessions = [];
    for (let w = 0; w < 8; w++) {
      prog.days.forEach((dayId, i) => {
        if (Math.random() < 0.1) return; // alguna sesión saltada (¡mal!)
        const date = GM.addDays(start, w * 7 + offsets[prog.schedule[i]]);
        date.setHours(18, 30);
        const s = {
          id: 'demo' + date.getTime(), date: date.toISOString(), dayId, dayName: GM.DAY_TEMPLATES[dayId].name,
          duration: 55 + Math.round(Math.random() * 25), notes: '',
          exercises: this.dayExercises(dayId).map(id => {
            const ex = this.exercise(id);
            if (!base[id]) base[id] = ex.unit === 'seg' ? 0 : (ex.type === 'compuesto' ? 40 + Math.random() * 40 : 10 + Math.random() * 15);
            const w0 = Math.round((base[id] * (1 + w * 0.025)) / 2.5) * 2.5;
            return { exId: id, sets: Array.from({ length: ex.sets }, (_, k) => ({
              w: w0, r: ex.unit === 'seg' ? ex.repMin + w * 2 : Math.max(ex.repMin - 1, ex.repMax - k - Math.round(Math.random())) })) };
          })
        };
        s.volume = this.sessionVolume(s);
        s.totalSets = s.plannedSets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
        s.prs = [];
        sessions.push(s);
      });
    }
    this.state.sessions = sessions.filter(s => new Date(s.date) < new Date());
    const last = this.state.sessions[this.state.sessions.length - 1];
    this.state.rotation = last ? (prog.days.indexOf(last.dayId) + 1) % prog.days.length : 0;
    this.save();
  }
};

/* ---------- Utilidades ---------- */
GM.e1rm = (w, r) => (w > 0 && r > 0 ? Math.round(w * (1 + Math.min(r, 12) / 30) * 10) / 10 : 0); // Epley
GM.startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
GM.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
GM.startOfWeek = d => { const x = GM.startOfDay(d); const wd = (x.getDay() + 6) % 7; return GM.addDays(x, -wd); };
GM.fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('es-ES', opts);
GM.fmtNum = n => Number(n).toLocaleString('es-ES');
