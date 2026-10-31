/* ==========================================================================
   GimnasioMike · El Coach
   Frases de motivación según el momento y el nivel de caña elegido.
   Niveles: 1 = Motivador · 2 = Duro · 3 = Sin piedad
   ========================================================================== */
window.GM = window.GM || {};

GM.COACH_LINES = {
  welcome: {
    1: ['¡Hola {name}! Hoy es un gran día para ser un poco mejor que ayer.',
        'Vamos {name}, paso a paso se construye un físico de verdad.'],
    2: ['{name}, aquí no se viene a mirar el móvil. Se viene a SUDAR.',
        'Otra oportunidad para ser mejor, {name}. No la desperdicies.',
        'El hierro no se levanta solo, {name}. A currar.'],
    3: ['¿Otra vez pensándotelo, {name}? Mueve el culo al gimnasio. YA.',
        '{name}, tu sofá no te va a dar abdominales. El hierro sí.',
        'Las excusas no queman calorías, {name}. Las sentadillas sí.',
        'Hoy no es un día para "más o menos". Hoy se rompe, {name}.']
  },
  inactive: {
    1: ['Llevas {days} días sin entrenar, {name}. ¡Hoy es perfecto para volver!'],
    2: ['{days} días sin pisar el gimnasio, {name}. Los músculos no esperan.',
        '{days} días de vacaciones. Se acabó el recreo, {name}.'],
    3: ['¡{days} DÍAS, {name}! ¿Te has mudado al sofá? Vuelve y paga la deuda.',
        '{days} días sin entrenar. Tus pesas preguntan por ti, y yo también. Hoy, sin falta.',
        '{days} días. Ni una excusa más, {name}. Ponte las zapatillas AHORA.']
  },
  start: {
    1: ['¡Vamos allá! Empieza por el calentamiento, sin prisa.'],
    2: ['Calienta bien y luego a matar. Concentración total.',
        'Móvil en modo avión mental. Solo tú y la barra.'],
    3: ['Calienta como un profesional y entrena como un animal. ¡AL LÍO!',
        'Hoy vengo a ver sangre, sudor y repeticiones. Empieza.',
        'Si sales de aquí con fuerzas para hablar, no has entrenado. ¡Dale!']
  },
  set_done: {
    1: ['¡Bien hecho! Respira y a por la siguiente.', 'Buena serie, sigue así.'],
    2: ['Eso es. Ahora la siguiente MEJOR.', 'Bien. Descansa lo justo, ni un segundo más.',
        'Serie al saco. Que no baje la intensidad.'],
    3: ['¿Eso es todo? La siguiente quiero verte sufrir.', 'Bien, pero sé que tienes una rep más dentro. SÁCALA.',
        'Descansa, que la siguiente va a doler. Y te va a gustar.',
        'Una serie menos. Ni se te ocurra aflojar ahora.']
  },
  set_low: {
    1: ['Te has quedado por debajo del rango. Prueba a bajar un poco el peso.'],
    2: ['Por debajo del rango. Ajusta el peso o aprieta más, tú eliges.'],
    3: ['¿Eso son repeticiones o una siesta? Por debajo del rango, {name}. O bajas peso o te dejas el alma.']
  },
  set_high: {
    1: ['¡Te has pasado del rango! La próxima, sube un poco de peso.'],
    2: ['Demasiado fácil. Sube el peso la próxima vez.'],
    3: ['¿Me estás vacilando? Si te sobran reps, te sobra la carga ligera. ¡SUBE ESE PESO!']
  },
  rest_over: {
    1: ['Descanso terminado. ¡A por ella!'],
    2: ['Se acabó el descanso. A la barra.'],
    3: ['¡ARRIBA! El descanso es para los muertos. A la barra YA.', '¡Tiempo! ¿Qué haces sentado? ¡A LA BARRA!']
  },
  exercise_done: {
    1: ['Ejercicio completado. ¡Gran trabajo!'],
    2: ['Uno menos. Siguiente ejercicio, misma intensidad.'],
    3: ['Ejercicio muerto. Siguiente víctima.', 'Ese ya está. Que el siguiente sufra lo mismo.']
  },
  pr: {
    1: ['¡NUEVO RÉCORD en {exercise}! Estás progresando muchísimo.'],
    2: ['¡RÉCORD PERSONAL en {exercise}! Esto es lo que pasa cuando no fallas.'],
    3: ['¡¡RÉCORD EN {exercise}!! ¿Ves lo que pasa cuando dejas de quejarte? ¡BESTIA!']
  },
  finish: {
    1: ['¡Entrenamiento completado, {name}! Descansa, come bien e hidrátate.'],
    2: ['Hecho. {volume} kg movidos hoy. Mañana, recupera como un profesional.',
        'Sesión terminada. Proteína, agua y a dormir 8 horas. Mañana más.'],
    3: ['{volume} kg movidos. No está mal... para empezar. La próxima, más.',
        'Has sobrevivido, {name}. Ahora come, duerme y vuelve más fuerte. Sin excusas.',
        'Bien. Pero recuerda: el de la semana pasada ya no es tu rival. Lo es el de mañana.']
  },
  finish_incomplete: {
    1: ['Has dejado algunas series sin hacer. ¡No pasa nada, la próxima vez a tope!'],
    2: ['Series sin completar. Eso se paga la próxima sesión.'],
    3: ['¿Te has dejado series, {name}? Eso aquí no se perdona. La próxima, doble ración de caña.']
  },
  week_done: {
    1: ['¡Objetivo semanal cumplido! Eres constante, sigue así.'],
    2: ['Semana cerrada: {done}/{target} sesiones. Esto es disciplina.'],
    3: ['{done}/{target}. Semana cumplida. No te emociones, el lunes se empieza de cero.']
  },
  week_progress: {
    1: ['Llevas {done} de {target} sesiones esta semana. ¡Vas genial!'],
    2: ['{done}/{target} sesiones esta semana. Faltan {left}. No me falles.'],
    3: ['{done}/{target}. Faltan {left} y no acepto ni una menos, {name}.']
  },
  rest_day: {
    1: ['Hoy toca descanso. Paseo, estiramientos y buena comida.'],
    2: ['Día de descanso: recuperar también es entrenar. Proteína y sueño.'],
    3: ['Hoy descansas, pero que no te vea comiendo basura. La recuperación también se entrena.']
  }
};

GM.coach = {
  level() { return (GM.store && GM.store.state.profile.intensity) || 2; },
  say(event, ctx = {}) {
    const bank = GM.COACH_LINES[event];
    if (!bank) return '';
    const lines = bank[this.level()] || bank[2];
    let line = lines[Math.floor(Math.random() * lines.length)];
    const vars = Object.assign({ name: (GM.store && GM.store.state.profile.name) || 'campeón' }, ctx);
    return line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
  },
  /* Muestra un "bocadillo" flotante del coach */
  shout(event, ctx) {
    const msg = typeof event === 'string' && GM.COACH_LINES[event] ? this.say(event, ctx) : event;
    const el = document.getElementById('coach-toast');
    if (!el || !msg) return;
    el.querySelector('.coach-toast-text').textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth; // reinicia animación
    el.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => el.classList.remove('show'), 4200);
  }
};
