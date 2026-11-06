/* ==========================================================================
   Carmaikel Fitness · Base de datos de entrenamiento
   Grupos musculares, ejercicios, calentamientos y programas semanales.
   ========================================================================== */
window.GM = window.GM || {};

/* ---------- Grupos musculares ---------- */
GM.GROUPS = {
  pecho:      { name: 'Pecho',       region: 'superior', color: '#ff4d4d' },
  espalda:    { name: 'Espalda',     region: 'superior', color: '#4d9fff' },
  hombros:    { name: 'Hombros',     region: 'superior', color: '#ffb84d' },
  biceps:     { name: 'Bíceps',      region: 'superior', color: '#c77dff' },
  triceps:    { name: 'Tríceps',     region: 'superior', color: '#ff7ac6' },
  cuadriceps: { name: 'Cuádriceps',  region: 'inferior', color: '#3ddc97' },
  isquios:    { name: 'Isquios',     region: 'inferior', color: '#2ec4b6' },
  gluteos:    { name: 'Glúteos',     region: 'inferior', color: '#a3e635' },
  gemelos:    { name: 'Gemelos',     region: 'inferior', color: '#facc15' },
  core:       { name: 'Core',        region: 'core',     color: '#94a3b8' }
};

/* Rango de series semanales efectivas recomendado por grupo (hipertrofia/fuerza) */
GM.WEEKLY_TARGET = {
  pecho: [10, 20], espalda: [10, 20], hombros: [8, 20], biceps: [6, 14], triceps: [6, 14],
  cuadriceps: [10, 20], isquios: [8, 18], gluteos: [6, 18], gemelos: [6, 12], core: [6, 12]
};

/* ---------- Ejercicios ----------
   sets/reps: valores por defecto (editables por el usuario)
   secondary: grupos que trabajan de forma secundaria (cuentan 0,5 series)
   inc: incremento de carga sugerido (kg) cuando completas el rango alto */
GM.EXERCISES = {
  // PECHO
  press_banca:        { name: 'Press banca con barra',          group: 'pecho',   secondary: ['triceps','hombros'], type: 'compuesto',   sets: 4, reps: '6-8',   rest: 150, inc: 2.5, tip: 'Escápulas retraídas, pies firmes, baja controlado al esternón.' },
  press_inclinado_mc: { name: 'Press inclinado con mancuernas', group: 'pecho',   secondary: ['hombros','triceps'], type: 'compuesto',   sets: 4, reps: '8-10',  rest: 120, inc: 2,   tip: 'Banco a 30°. Codos a 45°, estira abajo sin perder tensión.' },
  aperturas_polea:    { name: 'Cruces en polea',                group: 'pecho',   secondary: [],                    type: 'aislamiento', sets: 3, reps: '12-15', rest: 75,  inc: 2.5, tip: 'Abraza un árbol. Aprieta 1 s en el centro.' },
  fondos_paralelas:   { name: 'Fondos en paralelas',            group: 'pecho',   secondary: ['triceps','hombros'], type: 'compuesto',   sets: 3, reps: '8-12',  rest: 120, inc: 2.5, tip: 'Torso inclinado adelante para cargar el pecho.' },
  press_maquina:      { name: 'Press de pecho en máquina',      group: 'pecho',   secondary: ['triceps'],           type: 'compuesto',   sets: 3, reps: '10-12', rest: 90,  inc: 5,   tip: 'Empuja explosivo, vuelve lento en 3 segundos.' },

  // ESPALDA
  dominadas:          { name: 'Dominadas',                      group: 'espalda', secondary: ['biceps'],            type: 'compuesto',   sets: 4, reps: '6-10',  rest: 150, inc: 2.5, tip: 'Pecho a la barra, sin balanceo. Si no salen, usa lastre negativo o banda.' },
  remo_barra:         { name: 'Remo con barra',                 group: 'espalda', secondary: ['biceps','isquios'],  type: 'compuesto',   sets: 4, reps: '8-10',  rest: 120, inc: 2.5, tip: 'Torso a 45°, tira hacia el ombligo, espalda neutra.' },
  jalon_pecho:        { name: 'Jalón al pecho',                 group: 'espalda', secondary: ['biceps'],            type: 'compuesto',   sets: 3, reps: '10-12', rest: 90,  inc: 5,   tip: 'Lleva los codos a los bolsillos traseros.' },
  remo_mancuerna:     { name: 'Remo con mancuerna a una mano',  group: 'espalda', secondary: ['biceps'],            type: 'compuesto',   sets: 3, reps: '10-12', rest: 90,  inc: 2,   tip: 'Rema hacia la cadera, no hacia el hombro.' },
  remo_polea_baja:    { name: 'Remo en polea baja',             group: 'espalda', secondary: ['biceps'],            type: 'compuesto',   sets: 3, reps: '10-12', rest: 90,  inc: 5,   tip: 'Pecho fuera, junta escápulas al final.' },
  peso_muerto:        { name: 'Peso muerto convencional',       group: 'espalda', secondary: ['isquios','gluteos'], type: 'compuesto',   sets: 3, reps: '4-6',   rest: 180, inc: 5,   tip: 'Barra pegada a las piernas, empuja el suelo, bloquea con glúteo.' },

  // HOMBROS
  press_militar:      { name: 'Press militar de pie',           group: 'hombros', secondary: ['triceps'],           type: 'compuesto',   sets: 4, reps: '6-8',   rest: 150, inc: 2.5, tip: 'Glúteos y abdomen apretados. Cabeza atraviesa la ventana.' },
  press_arnold:       { name: 'Press Arnold',                   group: 'hombros', secondary: ['triceps'],           type: 'compuesto',   sets: 3, reps: '8-12',  rest: 90,  inc: 2,   tip: 'Rotación completa y controlada.' },
  elevaciones_lat:    { name: 'Elevaciones laterales',          group: 'hombros', secondary: [],                    type: 'aislamiento', sets: 4, reps: '12-15', rest: 60,  inc: 1,   tip: 'Sube con el codo, no con la mano. Cero balanceo.' },
  face_pull:          { name: 'Face pull',                      group: 'hombros', secondary: ['espalda'],           type: 'aislamiento', sets: 3, reps: '15-20', rest: 60,  inc: 2.5, tip: 'Tira hacia la frente abriendo manos. Salud del hombro.' },

  // BÍCEPS
  curl_barra:         { name: 'Curl con barra',                 group: 'biceps',  secondary: [],                    type: 'aislamiento', sets: 3, reps: '8-12',  rest: 75,  inc: 2.5, tip: 'Codos fijos, sin tirones de espalda.' },
  curl_martillo:      { name: 'Curl martillo',                  group: 'biceps',  secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-12', rest: 60,  inc: 2,   tip: 'Agarre neutro, controla la bajada.' },
  curl_inclinado:     { name: 'Curl inclinado con mancuernas',  group: 'biceps',  secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-12', rest: 60,  inc: 1,   tip: 'Brazo por detrás del cuerpo: estiramiento máximo.' },

  // TRÍCEPS
  press_frances:      { name: 'Press francés con barra Z',      group: 'triceps', secondary: [],                    type: 'aislamiento', sets: 3, reps: '8-12',  rest: 75,  inc: 2.5, tip: 'Baja detrás de la cabeza, codos quietos.' },
  extension_polea:    { name: 'Extensión de tríceps en polea',  group: 'triceps', secondary: [],                    type: 'aislamiento', sets: 3, reps: '12-15', rest: 60,  inc: 2.5, tip: 'Bloquea abajo y aprieta 1 segundo.' },
  press_cerrado:      { name: 'Press banca agarre cerrado',     group: 'triceps', secondary: ['pecho'],             type: 'compuesto',   sets: 3, reps: '6-10',  rest: 120, inc: 2.5, tip: 'Manos a la anchura de hombros, codos pegados.' },

  // CUÁDRICEPS
  sentadilla:         { name: 'Sentadilla trasera',             group: 'cuadriceps', secondary: ['gluteos'],        type: 'compuesto',   sets: 4, reps: '6-8',   rest: 180, inc: 5,   tip: 'Rompe el paralelo, rodillas hacia fuera, pecho arriba.' },
  prensa:             { name: 'Prensa de piernas',              group: 'cuadriceps', secondary: ['gluteos'],        type: 'compuesto',   sets: 3, reps: '10-12', rest: 120, inc: 10,  tip: 'Recorrido completo sin despegar la zona lumbar.' },
  sentadilla_bulgara: { name: 'Sentadilla búlgara',             group: 'cuadriceps', secondary: ['gluteos'],        type: 'compuesto',   sets: 3, reps: '8-10',  rest: 90,  inc: 2,   tip: 'Reps por pierna. Torso recto = más cuádriceps.' },
  extension_cuad:     { name: 'Extensión de cuádriceps',        group: 'cuadriceps', secondary: [],                 type: 'aislamiento', sets: 3, reps: '12-15', rest: 60,  inc: 5,   tip: 'Pausa de 1 s arriba. Quema = progreso.' },
  zancadas:           { name: 'Zancadas caminando',             group: 'cuadriceps', secondary: ['gluteos'],        type: 'compuesto',   sets: 3, reps: '10-12', rest: 90,  inc: 2,   tip: 'Reps por pierna, paso largo y estable.' },

  // ISQUIOS
  peso_muerto_rumano: { name: 'Peso muerto rumano',             group: 'isquios', secondary: ['gluteos','espalda'], type: 'compuesto',   sets: 3, reps: '8-10',  rest: 120, inc: 5,   tip: 'Cadera atrás, rodillas semiflexionadas, siente el estiramiento.' },
  curl_femoral:       { name: 'Curl femoral tumbado',           group: 'isquios', secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-12', rest: 75,  inc: 5,   tip: 'Cadera pegada al banco, baja en 3 s.' },
  curl_femoral_sent:  { name: 'Curl femoral sentado',           group: 'isquios', secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-12', rest: 75,  inc: 5,   tip: 'Inclínate adelante para más estiramiento.' },

  // GLÚTEOS
  hip_thrust:         { name: 'Hip thrust con barra',           group: 'gluteos', secondary: ['isquios'],           type: 'compuesto',   sets: 4, reps: '8-12',  rest: 120, inc: 5,   tip: 'Mentón al pecho, pausa arriba apretando glúteo.' },
  abduccion:          { name: 'Abducción en máquina',           group: 'gluteos', secondary: [],                    type: 'aislamiento', sets: 3, reps: '15-20', rest: 60,  inc: 5,   tip: 'Inclínate adelante para glúteo medio.' },

  // GEMELOS
  gemelo_pie:         { name: 'Elevación de talones de pie',    group: 'gemelos', secondary: [],                    type: 'aislamiento', sets: 4, reps: '10-15', rest: 60,  inc: 5,   tip: 'Pausa abajo en estiramiento 2 s. Nada de rebotes.' },
  gemelo_sentado:     { name: 'Elevación de talones sentado',   group: 'gemelos', secondary: [],                    type: 'aislamiento', sets: 3, reps: '12-20', rest: 60,  inc: 5,   tip: 'Trabaja el sóleo. Recorrido completo.' },

  // CORE
  plancha:            { name: 'Plancha abdominal',              group: 'core',    secondary: [],                    type: 'aislamiento', sets: 3, reps: '45-60', unit: 'seg', rest: 45, inc: 0, tip: 'Glúteos apretados, costillas abajo. Segundos, no reps.' },
  rueda_abdominal:    { name: 'Rueda abdominal',                group: 'core',    secondary: [],                    type: 'aislamiento', sets: 3, reps: '8-12',  rest: 60,  inc: 0,   tip: 'No dejes caer la cadera. Rango que controles.' },
  elev_piernas:       { name: 'Elevación de piernas colgado',   group: 'core',    secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-15', rest: 60,  inc: 0,   tip: 'Enrolla la pelvis, no balancees.' },
  crunch_polea:       { name: 'Crunch en polea alta',           group: 'core',    secondary: [],                    type: 'aislamiento', sets: 3, reps: '12-15', rest: 60,  inc: 2.5, tip: 'Flexiona la columna, no la cadera.' },
  pallof:             { name: 'Press Pallof',                   group: 'core',    secondary: [],                    type: 'aislamiento', sets: 3, reps: '10-12', rest: 45,  inc: 2.5, tip: 'Antirrotación: que la polea no te gire.' }
};

/* ---------- Calentamientos ---------- */
GM.WARMUP_GENERAL = [
  { name: 'Cardio suave', anim: 'w_cardio', detail: '5-8 min de bici, remo o elíptica subiendo pulsaciones progresivamente.' },
  { name: 'Movilidad articular', anim: 'w_movilidad', detail: 'Círculos de cuello, hombros, muñecas, cadera, rodillas y tobillos: 10 por lado.' }
];

GM.WARMUP_BY_GROUP = {
  pecho:      [ { name: 'Rotaciones de hombro con banda', anim: 'w_rot_ext', detail: '2×15 rotaciones externas' },
                { name: 'Flexiones escapulares', anim: 'w_flex_escap', detail: '2×10 activando serrato' },
                { name: 'Flexiones lentas', anim: 'w_flexiones', detail: '1×10-15 a ritmo controlado' } ],
  espalda:    [ { name: 'Pull-apart con banda', anim: 'w_pull_apart', detail: '2×15 juntando escápulas' },
                { name: 'Colgarse de la barra', anim: 'w_colgarse', detail: '2×20-30 s, descompresión activa' },
                { name: 'Gato-camello', anim: 'w_gato_camello', detail: '10 repeticiones lentas' } ],
  hombros:    [ { name: 'Dislocaciones con pica/banda', anim: 'w_dislocaciones', detail: '2×10 con agarre amplio' },
                { name: 'Y-T-W en banco inclinado', anim: 'w_ytw', detail: '1×8 de cada letra sin peso o 1 kg' },
                { name: 'Rotación externa con banda', anim: 'w_rot_ext', detail: '2×12 por brazo' } ],
  biceps:     [ { name: 'Curl ligero con banda', anim: 'w_curl_banda', detail: '1×20 bombeando sangre' },
                { name: 'Estiramiento dinámico de muñeca', anim: 'w_muneca', detail: '30 s flexión/extensión' } ],
  triceps:    [ { name: 'Extensión ligera con banda', anim: 'w_ext_banda', detail: '1×20 sin bloquear brusco' },
                { name: 'Círculos de codo', anim: 'w_circ_codo', detail: '10 por lado' } ],
  cuadriceps: [ { name: 'Sentadilla goblet ligera', anim: 'w_goblet', detail: '2×10 con pausa abajo' },
                { name: 'Balanceos de pierna frontales', anim: 'w_balanceo_frontal', detail: '10 por pierna' },
                { name: 'Movilidad de tobillo a la pared', anim: 'w_tobillo', detail: '10 por lado' } ],
  isquios:    [ { name: 'Buenos días sin carga', anim: 'w_buenos_dias', detail: '2×12 con bisagra de cadera' },
                { name: 'Balanceos laterales de pierna', anim: 'w_balanceo_lateral', detail: '10 por pierna' },
                { name: 'Puente de isquios', anim: 'w_puente_isq', detail: '1×12' } ],
  gluteos:    [ { name: 'Puente de glúteo', anim: 'w_puente_gluteo', detail: '2×15 con pausa arriba' },
                { name: 'Monster walk con banda', anim: 'w_monster', detail: '2×10 pasos por lado' },
                { name: 'Apertura 90/90 de cadera', anim: 'w_9090', detail: '8 cambios por lado' } ],
  gemelos:    [ { name: 'Elevaciones de talón sin peso', anim: 'w_talones', detail: '1×20 rango completo' },
                { name: 'Saltos suaves a la comba', anim: 'w_comba', detail: '30-60 s' } ],
  core:       [ { name: 'Dead bug', anim: 'w_dead_bug', detail: '2×8 por lado' },
                { name: 'Bird dog', anim: 'w_bird_dog', detail: '1×8 por lado' } ]
};

/* Series de aproximación para el primer ejercicio compuesto del día */
GM.RAMP_UP = [
  { pct: 0,   reps: 10, label: 'Barra vacía / muy ligero' },
  { pct: 40,  reps: 8,  label: '40% del peso de trabajo' },
  { pct: 60,  reps: 5,  label: '60% del peso de trabajo' },
  { pct: 80,  reps: 3,  label: '80% del peso de trabajo' }
];

/* ---------- Días de entrenamiento (plantillas) ---------- */
GM.DAY_TEMPLATES = {
  superior_fuerza: { name: 'Tren superior · Fuerza', short: 'Superior F', focus: 'superior',
    exercises: ['press_banca', 'remo_barra', 'press_militar', 'dominadas', 'curl_barra', 'press_frances'] },
  superior_hiper:  { name: 'Tren superior · Hipertrofia', short: 'Superior H', focus: 'superior',
    exercises: ['press_inclinado_mc', 'jalon_pecho', 'elevaciones_lat', 'remo_polea_baja', 'aperturas_polea', 'face_pull', 'curl_martillo', 'extension_polea'] },
  inferior_cuad:   { name: 'Tren inferior · Cuádriceps', short: 'Inferior Q', focus: 'inferior',
    exercises: ['sentadilla', 'prensa', 'peso_muerto_rumano', 'extension_cuad', 'gemelo_pie', 'plancha'] },
  inferior_post:   { name: 'Tren inferior · Cadena posterior', short: 'Inferior P', focus: 'inferior',
    exercises: ['peso_muerto', 'hip_thrust', 'sentadilla_bulgara', 'curl_femoral', 'gemelo_sentado', 'rueda_abdominal'] },
  empuje:          { name: 'Empuje · Pecho, hombro, tríceps', short: 'Empuje', focus: 'superior',
    exercises: ['press_banca', 'press_militar', 'press_inclinado_mc', 'elevaciones_lat', 'fondos_paralelas', 'extension_polea'] },
  tiron:           { name: 'Tirón · Espalda y bíceps', short: 'Tirón', focus: 'superior',
    exercises: ['dominadas', 'remo_barra', 'remo_mancuerna', 'face_pull', 'curl_barra', 'elev_piernas'] },
  fullbody:        { name: 'Cuerpo completo', short: 'Full body', focus: 'completo',
    exercises: ['sentadilla_bulgara', 'press_inclinado_mc', 'curl_femoral', 'remo_polea_baja', 'hip_thrust', 'aperturas_polea', 'gemelo_pie', 'crunch_polea'] }
};

/* ---------- Programas según días por semana ---------- */
GM.PROGRAMS = {
  3: { name: 'Superior / Inferior / Full body',
       why: 'Con 3 días cada grupo recibe estímulo ~2 veces por semana: un día de torso, uno de pierna y un full body que remata el volumen.',
       days: ['superior_fuerza', 'inferior_cuad', 'fullbody'],
       schedule: ['Lunes', 'Miércoles', 'Viernes'] },
  4: { name: 'Torso / Pierna ×2',
       why: 'El clásico Upper/Lower: frecuencia 2 por grupo, un día de fuerza y otro de hipertrofia para cada mitad del cuerpo.',
       days: ['superior_fuerza', 'inferior_cuad', 'superior_hiper', 'inferior_post'],
       schedule: ['Lunes', 'Martes', 'Jueves', 'Viernes'] },
  5: { name: 'Empuje / Tirón / Pierna + Full body / Pierna',
       why: 'Híbrido PPL: empuje y tirón para el torso, dos días de pierna (cuádriceps y cadena posterior) y un full body que equilibra todo. Frecuencia 2 en todos los grupos.',
       days: ['empuje', 'tiron', 'inferior_cuad', 'fullbody', 'inferior_post'],
       schedule: ['Lunes', 'Martes', 'Miércoles', 'Viernes', 'Sábado'] }
};
