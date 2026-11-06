/* ==========================================================================
   GimnasioMike · Animaciones de técnica
   Figura articulada en SVG (sin vídeos externos: funciona sin conexión).
   Cada animación es una lista de poses clave; la figura se interpola entre
   ellas y resalta el músculo objetivo con el color del tema.

   Convenciones
   - Lienzo 200×170, suelo en y=160. Vista lateral mirando a la derecha.
   - Ángulos en grados: 0 = abajo, 90 = adelante, 180 = arriba, -90 = atrás.
   - Pose: { hip:[x,y], t: ángulo del torso, c: curvatura de la espalda,
             a1/a2: brazo cercano/lejano, l1/l2: pierna cercana/lejana,
             ft/ft2: ángulo del pie }
     Un miembro puede ser [ángulo1, ángulo2] o un objetivo para IK:
     { to:[x,y] | ['hip'|'sh', dx, dy], bend:[hx,hy] }  (bend = hacia dónde dobla)
   - view:'front' dibuja de frente; a2/l2 se reflejan si no se indican.
   ========================================================================== */
window.GM = window.GM || {};

GM.anim = (() => {
  const L = { torso: 44, neck: 13, head: 8, ua: 24, fa: 22, th: 32, sh: 32, foot: 9 };
  const GROUND = 160;
  const rad = d => (d * Math.PI) / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = v => Math.hypot(v[0], v[1]);
  const unit = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
  const lerpP = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const f = n => Math.round(n * 10) / 10;

  /* ---------- Piezas de pose reutilizables ---------- */
  const FEET = [100, 156];
  const KNEE_FWD = [1, 0], KNEE_UP = [0.3, -1], DOWN = [0, 1], UP = [0, -1], BACK = [-1, 0];
  const legTo = (x, y, bend = KNEE_FWD) => ({ to: [x, y], bend });
  const armTo = (x, y, bend = DOWN) => ({ to: [x, y], bend });
  const rel = (j, dx, dy, bend = DOWN) => ({ to: [j, dx, dy], bend });
  const STAND = { hip: [97, 93], t: 180, a1: [4, 2], l1: legTo(100, 156), l2: legTo(104, 156) };
  const P = (base, o) => Object.assign({}, base, o);

  /* Equipamiento */
  const bench = (x, y, w = 90) => [{ k: 'rect', x, y, w, h: 7, r: 2 }, { k: 'rect', x: x + 8, y: y + 7, w: 5, h: GROUND - y - 7 }, { k: 'rect', x: x + w - 13, y: y + 7, w: 5, h: GROUND - y - 7 }];
  const slab = (x1, y1, x2, y2, w = 7) => ({ k: 'slab', x1, y1, x2, y2, w });
  const plate = (at, r = 14) => ({ k: 'plate', at, r });
  const db = (at = 'w1') => ({ k: 'db', at });
  const grip = (at = 'w1') => ({ k: 'grip', at });
  const cable = (x, y, at = 'w1') => ({ k: 'cable', x, y, at });
  const band = (a, b) => ({ k: 'band', a, b });
  const bar = (x1, x2, y) => ({ k: 'bar', x1, x2, y });

  /* ---------- Biblioteca de animaciones ---------- */
  const A = {};

  /* PECHO */
  const benchPress = {
    eq: [...bench(40, 96, 100), plate('w1', 14)],
    poses: [
      { hip: [124, 90], t: -90, hd: 0, a1: armTo(84, 46, DOWN), l1: legTo(160, 156, KNEE_UP), l2: legTo(150, 156, KNEE_UP) },
      { hip: [124, 90], t: -90, a1: armTo(90, 74, DOWN), l1: legTo(160, 156, KNEE_UP), l2: legTo(150, 156, KNEE_UP) }
    ]
  };
  A.press_banca = benchPress;
  A.press_cerrado = benchPress;
  A.press_inclinado_mc = {
    eq: [slab(118, 104, 74, 80, 8), slab(110, 104, 150, 104, 8), { k: 'rect', x: 120, y: 108, w: 6, h: 52 }, db('w1')],
    poses: [
      { hip: [120, 96], t: -120, a1: armTo(83, 28, DOWN), l1: legTo(160, 156, KNEE_UP), l2: legTo(152, 156, KNEE_UP) },
      { hip: [120, 96], t: -120, a1: armTo(80, 60, DOWN), l1: legTo(160, 156, KNEE_UP), l2: legTo(152, 156, KNEE_UP) }
    ]
  };
  A.aperturas_polea = {
    view: 'front',
    eq: [cable(18, 14, 'w1'), cable(182, 14, 'w2'), grip('w1'), grip('w2')],
    poses: [
      { hip: [100, 93], t: 180, a1: [68, 82], l1: legTo(112, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [-12, -28], l1: legTo(112, 156, [1, 0]) }
    ]
  };
  A.fondos_paralelas = {
    eq: [{ k: 'rect', x: 98, y: 76, w: 5, h: 84 }, { k: 'rect', x: 88, y: 74, w: 26, h: 5, r: 2 }],
    poses: [
      { hip: [80, 74], t: 156, a1: armTo(100, 74, [-1, 0]), l1: [12, -55], l2: [18, -60] },
      { hip: [96, 100], t: 150, a1: armTo(100, 74, [-1, -0.2]), l1: [10, -55], l2: [16, -60] }
    ]
  };
  A.press_maquina = {
    eq: [{ k: 'rect', x: 62, y: 46, w: 7, h: 70, r: 3 }, { k: 'rect', x: 62, y: 112, w: 46, h: 7, r: 2 }, { k: 'rect', x: 80, y: 119, w: 6, h: 41 }, grip('w1')],
    poses: [
      { hip: [78, 108], t: 180, a1: armTo(98, 64, [-1, 0.4]), l1: legTo(112, 156), l2: legTo(118, 156) },
      { hip: [78, 108], t: 180, a1: armTo(122, 64, [-1, 0.4]), l1: legTo(112, 156), l2: legTo(118, 156) }
    ]
  };

  /* ESPALDA */
  A.dominadas = {
    eq: [bar(70, 140, 24)],
    poses: [
      { hip: [100, 114], t: 180, a1: armTo(100, 26, BACK), l1: [22, -60], l2: [28, -62] },
      { hip: [90, 72], t: 172, a1: armTo(100, 26, [-0.6, 1]), l1: [22, -60], l2: [28, -62] }
    ]
  };
  A.remo_barra = {
    eq: [plate('w1', 16)],
    poses: [
      P(STAND, { hip: [76, 100], t: 120, a1: [0, 0] }),
      P(STAND, { hip: [76, 100], t: 120, a1: armTo(98, 100, [-0.4, -1]) })
    ]
  };
  A.jalon_pecho = {
    eq: [{ k: 'rect', x: 70, y: 124, w: 40, h: 7, r: 2 }, { k: 'rect', x: 86, y: 131, w: 6, h: 29 }, { k: 'rect', x: 110, y: 104, w: 14, h: 7, r: 3 }, cable(98, 2, 'w1'), grip('w1')],
    poses: [
      { hip: [90, 118], t: 190, a1: armTo(96, 26, BACK), l1: legTo(124, 156), l2: legTo(128, 156) },
      { hip: [90, 118], t: 196, a1: armTo(92, 70, [-0.4, 1]), l1: legTo(124, 156), l2: legTo(128, 156) }
    ]
  };
  A.remo_mancuerna = {
    eq: [...bench(116, 126, 64), db('w1')],
    poses: [
      { hip: [72, 92], t: 100, a1: [0, 0], a2: armTo(128, 126, BACK), l1: legTo(58, 156), l2: legTo(94, 156) },
      { hip: [72, 92], t: 100, a1: armTo(90, 94, [-0.3, -1]), a2: armTo(128, 126, BACK), l1: legTo(58, 156), l2: legTo(94, 156) }
    ]
  };
  A.remo_polea_baja = {
    eq: [{ k: 'rect', x: 46, y: 140, w: 52, h: 6, r: 2 }, slab(140, 128, 140, 160, 6), cable(170, 146, 'w1'), grip('w1')],
    poses: [
      { hip: [70, 134], t: 145, a1: armTo(134, 114, DOWN), l1: legTo(134, 148, KNEE_UP), l2: legTo(134, 152, KNEE_UP) },
      { hip: [70, 134], t: 184, a1: armTo(90, 106, BACK), l1: legTo(134, 148, KNEE_UP), l2: legTo(134, 152, KNEE_UP) }
    ]
  };
  A.peso_muerto = {
    eq: [plate('w1', 17)],
    poses: [
      { hip: [72, 116], t: 113, a1: [2, 0], l1: legTo(100, 156), l2: legTo(104, 156) },
      P(STAND, { a1: [2, 0] })
    ]
  };

  /* HOMBROS */
  A.press_militar = {
    eq: [plate('w1', 11)],
    poses: [
      P(STAND, { a1: armTo(112, 50, [0.3, 1]) }),
      P(STAND, { t: 182, a1: armTo(100, 4, [0.3, 1]) })
    ]
  };
  A.press_arnold = {
    eq: [{ k: 'rect', x: 66, y: 120, w: 44, h: 7, r: 2 }, { k: 'rect', x: 84, y: 127, w: 6, h: 33 }, slab(78, 118, 78, 60, 7), db('w1')],
    poses: [
      { hip: [90, 114], t: 180, a1: armTo(104, 74, [0.6, 1]), l1: legTo(126, 156), l2: legTo(130, 156) },
      { hip: [90, 114], t: 180, a1: armTo(92, 26, [0.3, 1]), l1: legTo(126, 156), l2: legTo(130, 156) }
    ]
  };
  A.elevaciones_lat = {
    view: 'front', eq: [db('w1'), db('w2')],
    poses: [
      { hip: [100, 93], t: 180, a1: [10, 8], l1: legTo(110, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [84, 92], l1: legTo(110, 156, [1, 0]) }
    ]
  };
  A.face_pull = {
    eq: [cable(180, 34, 'w1'), grip('w1')],
    poses: [
      P(STAND, { a1: armTo(140, 44, [-1, -0.2]) }),
      P(STAND, { a1: armTo(106, 36, [-1, -0.6]) })
    ]
  };

  /* BRAZOS */
  A.curl_barra = { eq: [plate('w1', 12)], poses: [P(STAND, { a1: [4, 6] }), P(STAND, { a1: [12, 162] })] };
  A.curl_martillo = { eq: [db('w1')], poses: [P(STAND, { a1: [4, 6] }), P(STAND, { a1: [10, 158] })] };
  A.curl_inclinado = {
    eq: [slab(88, 114, 62, 70, 8), slab(84, 120, 120, 120, 8), { k: 'rect', x: 96, y: 124, w: 6, h: 36 }, db('w1')],
    poses: [
      { hip: [96, 112], t: -150, a1: [-6, -4], l1: legTo(132, 156), l2: legTo(138, 156) },
      { hip: [96, 112], t: -150, a1: [-4, 150], l1: legTo(132, 156), l2: legTo(138, 156) }
    ]
  };
  A.press_frances = {
    eq: [...bench(40, 96, 100), plate('w1', 10)],
    poses: [
      { hip: [124, 90], t: -90, a1: [-172, -178], l1: legTo(160, 156, KNEE_UP), l2: legTo(150, 156, KNEE_UP) },
      { hip: [124, 90], t: -90, a1: [-168, -72], l1: legTo(160, 156, KNEE_UP), l2: legTo(150, 156, KNEE_UP) }
    ]
  };
  A.extension_polea = {
    eq: [cable(124, 4, 'w1'), grip('w1')],
    poses: [P(STAND, { t: 172, a1: [-4, 128] }), P(STAND, { t: 172, a1: [-4, 8] })]
  };

  /* PIERNA */
  A.sentadilla = {
    eq: [{ k: 'plate', at: 'sh', dx: -7, dy: 5, r: 12 }],
    poses: [
      P(STAND, { t: 176, a1: [-30, 168] }),
      P(STAND, { hip: [70, 124], t: 140, a1: [-30, 168] })
    ]
  };
  A.prensa = {
    eq: [slab(66, 128, 26, 96, 8), slab(60, 128, 100, 128, 8), { k: 'rect', x: 74, y: 132, w: 6, h: 28 }, { k: 'sled', at: 'a1' }, slab(110, 150, 170, 90, 3)],
    poses: [
      { hip: [72, 120], t: -128, a1: armTo(78, 120, DOWN), l1: legTo(124, 72, [-0.4, -1]), l2: legTo(128, 76, [-0.4, -1]) },
      { hip: [72, 120], t: -128, a1: armTo(78, 120, DOWN), l1: legTo(100, 96, [-0.4, -1]), l2: legTo(104, 100, [-0.4, -1]) }
    ]
  };
  A.sentadilla_bulgara = {
    eq: [...bench(30, 118, 44), db('w1')],
    poses: [
      { hip: [94, 94], t: 178, a1: [2, 0], l1: legTo(120, 156), l2: legTo(62, 118, [0.2, 1]) },
      { hip: [90, 124], t: 168, a1: [2, 0], l1: legTo(120, 156), l2: legTo(62, 118, [0.2, 1]) }
    ]
  };
  A.extension_cuad = {
    eq: [{ k: 'rect', x: 66, y: 122, w: 54, h: 7, r: 2 }, { k: 'rect', x: 84, y: 129, w: 6, h: 31 }, slab(70, 120, 66, 70, 7), { k: 'roller', at: 'a1' }],
    poses: [
      { hip: [86, 116], t: 184, a1: armTo(96, 124, DOWN), l1: [90, 12] },
      { hip: [86, 116], t: 184, a1: armTo(96, 124, DOWN), l1: [90, 84] }
    ]
  };
  A.zancadas = {
    eq: [db('w1')],
    poses: [
      { hip: [96, 94], t: 180, a1: [2, 0], l1: legTo(126, 156), l2: legTo(64, 156, [0.2, 1]) },
      { hip: [94, 126], t: 178, a1: [2, 0], l1: legTo(126, 156), l2: legTo(64, 156, [0.2, 1]) }
    ]
  };
  A.peso_muerto_rumano = {
    eq: [plate('w1', 14)],
    poses: [P(STAND, { a1: [2, 0] }), P(STAND, { hip: [74, 98], t: 106, a1: [2, 0] })]
  };
  A.curl_femoral = {
    flip: true,
    eq: [{ k: 'rect', x: 40, y: 118, w: 114, h: 7, r: 2 }, { k: 'rect', x: 50, y: 125, w: 6, h: 35 }, { k: 'rect', x: 140, y: 125, w: 6, h: 35 }, { k: 'roller', at: 'a1' }],
    poses: [
      { hip: [108, 112], t: -90, a1: armTo(58, 128, BACK), l1: [90, 88] },
      { hip: [108, 112], t: -90, a1: armTo(58, 128, BACK), l1: [90, -150] }
    ]
  };
  A.curl_femoral_sent = {
    eq: [{ k: 'rect', x: 66, y: 122, w: 54, h: 7, r: 2 }, { k: 'rect', x: 84, y: 129, w: 6, h: 31 }, slab(70, 120, 66, 70, 7), { k: 'roller', at: 'a1' }],
    poses: [
      { hip: [86, 116], t: 184, a1: armTo(96, 124, DOWN), l1: [90, 78] },
      { hip: [86, 116], t: 184, a1: armTo(96, 124, DOWN), l1: [90, -12] }
    ]
  };
  A.hip_thrust = {
    eq: [...bench(30, 104, 46), plate('hip', 15)],
    poses: [
      { hip: [94, 140], t: -140, a1: rel('hip', 0, -8, UP), l1: legTo(128, 156, KNEE_UP), l2: legTo(132, 156, KNEE_UP) },
      { hip: [102, 102], t: -92, a1: rel('hip', 0, -8, UP), l1: legTo(128, 156, KNEE_UP), l2: legTo(132, 156, KNEE_UP) }
    ]
  };
  A.abduccion = {
    view: 'front', thighScale: 0.5,
    eq: [{ k: 'rect', x: 72, y: 112, w: 56, h: 7, r: 2 }, { k: 'rect', x: 97, y: 119, w: 6, h: 41 }, { k: 'pad', at: 'k1' }, { k: 'pad', at: 'k2' }],
    poses: [
      { hip: [100, 108], t: 180, a1: armTo(124, 114, [1, 0]), l1: [22, 0] },
      { hip: [100, 108], t: 180, a1: armTo(124, 114, [1, 0]), l1: [84, 0] }
    ]
  };
  A.gemelo_pie = {
    anchor: { toe: [118, 140] },
    eq: [{ k: 'rect', x: 106, y: 140, w: 60, h: 20, r: 2, fixed: true }, db('w1')],
    poses: [P(STAND, { a1: [2, 0], l1: [0, 0], l2: [0, 0], ft: 112, ft2: 112 }), P(STAND, { a1: [2, 0], l1: [0, 0], l2: [0, 0], ft: 48, ft2: 48 })]
  };
  A.gemelo_sentado = {
    anchor: { toe: [136, 146] },
    eq: [{ k: 'rect', x: 124, y: 146, w: 30, h: 14, r: 2, fixed: true }, { k: 'pad', at: 'k1' }, { k: 'rect', at: 'hip', dx: -22, dy: 6, w: 50, h: 7, r: 2 }],
    poses: [
      { hip: [90, 116], t: 180, a1: armTo(116, 112, DOWN), l1: [90, 0], ft: 112 },
      { hip: [90, 116], t: 180, a1: armTo(116, 112, DOWN), l1: [90, 0], ft: 50 }
    ]
  };

  /* CORE */
  A.plancha = {
    poses: [
      { hip: [103, 140], t: -101, a1: [0, 90], l1: [79, 79], ft: 170 },
      { hip: [103, 137], t: -101, a1: [0, 90], l1: [80, 80], ft: 170 }
    ], hold: 900
  };
  A.rueda_abdominal = {
    eq: [{ k: 'wheel', at: 'w1' }],
    poses: [
      { hip: [100, 118], t: 148, a1: armTo(128, 150, BACK), l1: [0, -90], ft: 180 },
      { hip: [122, 128], t: 98, a1: armTo(186, 150, UP), l1: [-44, -90], ft: 180 }
    ]
  };
  A.elev_piernas = {
    eq: [bar(70, 140, 10)],
    poses: [
      { hip: [100, 100], t: 180, a1: armTo(100, 12, BACK), l1: [4, 2] },
      { hip: [96, 100], t: 184, a1: armTo(100, 12, BACK), l1: [92, 92] }
    ]
  };
  A.crunch_polea = {
    eq: [cable(150, 4, 'w1'), grip('w1')],
    poses: [
      { hip: [96, 120], t: 168, c: 0, a1: rel('sh', 10, -4, DOWN), l1: [0, -90], ft: 180 },
      { hip: [96, 120], t: 92, c: -9, a1: rel('sh', 10, -4, DOWN), l1: [0, -90], ft: 180 }
    ]
  };
  A.pallof = {
    eq: [cable(24, 66, 'w1'), grip('w1')],
    poses: [P(STAND, { a1: armTo(112, 66, DOWN) }), P(STAND, { a1: armTo(142, 64, DOWN) })], hold: 700
  };

  /* ---------- CALENTAMIENTO ---------- */
  const crank = [112, 136];
  const pedal = k => [crank[0] + 15 * Math.sin(k), crank[1] - 15 * Math.cos(k)];
  A.w_cardio = {
    eq: [{ k: 'rect', x: 74, y: 92, w: 22, h: 6, r: 3 }, slab(86, 98, 108, 136, 5), slab(108, 136, 136, 72, 5), slab(128, 72, 140, 72, 5), { k: 'circle', x: crank[0], y: crank[1], r: 15 }, slab(80, 160, 150, 160, 6)],
    cycle: 'wrap', seg: 380, hold: 0,
    poses: [0, 1, 2, 3, 4].map(i => {
      const k = (i * Math.PI) / 2;
      return { hip: [86, 92], t: 140, a1: armTo(136, 74, DOWN), l1: legTo(...pedal(k)), l2: legTo(...pedal(k + Math.PI)) };
    })
  };
  A.w_movilidad = {
    cycle: 'wrap', seg: 450, hold: 0,
    poses: [0, 90, 180, 270, 360].map(a => P(STAND, { a1: [a, a], a2: [a + 180, a + 180] }))
  };
  A.w_rot_ext = {
    view: 'front', eq: [band('w1', 'w2')],
    poses: [
      { hip: [100, 93], t: 180, a1: [4, -78], l1: legTo(110, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [10, 70], l1: legTo(110, 156, [1, 0]) }
    ]
  };
  A.w_flex_escap = { poses: [{ hip: [102, 116], t: -102, a1: armTo(58, 156, [1, 0]), l1: [79, 79], ft: 170 }, { hip: [102, 113], t: -104, a1: armTo(58, 156, [1, 0]), l1: [79, 79], ft: 170 }] };
  A.w_flexiones = { poses: [{ hip: [104, 118], t: -103, a1: armTo(58, 156, [1, -1]), l1: [80, 80], ft: 170 }, { hip: [104, 140], t: -93, a1: armTo(58, 156, [1, -1]), l1: [85, 85], ft: 170 }] };
  A.w_pull_apart = {
    view: 'front', eq: [band('w1', 'w2')],
    poses: [
      { hip: [100, 93], t: 180, a1: [-58, -62], l1: legTo(110, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [88, 90], l1: legTo(110, 156, [1, 0]) }
    ]
  };
  A.w_colgarse = {
    eq: [bar(70, 140, 12)],
    poses: [
      { hip: [100, 104], t: 180, a1: armTo(100, 14, BACK), l1: [6, -40], l2: [10, -44] },
      { hip: [100, 98], t: 180, a1: armTo(100, 14, BACK), l1: [6, -40], l2: [10, -44] }
    ], hold: 700
  };
  const quad = (c, hd) => ({ hip: [70, 120], t: 96, c, hd, a1: [0, 0], l1: [0, -90], ft: 180 });
  A.w_gato_camello = { poses: [quad(9, 30), quad(-11, -40)] };
  A.w_dislocaciones = {
    eq: [grip('w1')], cycle: 'bounce', seg: 900,
    poses: [P(STAND, { a1: [40, 40] }), P(STAND, { a1: [178, 178] }), P(STAND, { a1: [-60, -60] })]
  };
  A.w_ytw = {
    view: 'front', seg: 700,
    poses: [
      { hip: [100, 93], t: 180, a1: [150, 152], l1: legTo(110, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [90, 90], l1: legTo(110, 156, [1, 0]) },
      { hip: [100, 93], t: 180, a1: [55, 160], l1: legTo(110, 156, [1, 0]) }
    ]
  };
  A.w_curl_banda = { eq: [band('w1', 'a1')], poses: [P(STAND, { a1: [4, 6] }), P(STAND, { a1: [12, 162] })] };
  A.w_muneca = { poses: [P(STAND, { a1: [88, 88], hand: 40 }), P(STAND, { a1: [88, 88], hand: 140 })] };
  A.w_ext_banda = { eq: [band('w1', [124, 4])], poses: [P(STAND, { t: 174, a1: [-4, 128] }), P(STAND, { t: 174, a1: [-4, 8] })] };
  A.w_circ_codo = {
    view: 'front', cycle: 'wrap', seg: 380, hold: 0,
    poses: [0, 90, 180, 270, 360].map(a => ({ hip: [100, 93], t: 180, a1: [88, 88 + 60 * Math.sin(rad(a))], l1: legTo(110, 156, [1, 0]) }))
  };
  A.w_goblet = {
    eq: [db('w1')],
    poses: [P(STAND, { t: 178, a1: armTo(108, 66, DOWN) }), P(STAND, { hip: [74, 126], t: 152, a1: rel('sh', 12, 14, DOWN) })]
  };
  A.w_balanceo_frontal = { poses: [P(STAND, { a1: [6, 4], l1: [-34, -30] }), P(STAND, { a1: [6, 4], l1: [72, 70] })] };
  A.w_tobillo = {
    eq: [{ k: 'rect', x: 156, y: 30, w: 8, h: 130, fixed: true }],
    poses: [
      { hip: [104, 118], t: 176, a1: armTo(156, 70, DOWN), l1: legTo(136, 156), l2: legTo(80, 156, [0.2, 1]) },
      { hip: [114, 118], t: 172, a1: armTo(156, 70, DOWN), l1: legTo(136, 156), l2: legTo(80, 156, [0.2, 1]) }
    ]
  };
  A.w_buenos_dias = { poses: [P(STAND, { a1: rel('sh', -2, -14, [1, -0.4]) }), P(STAND, { hip: [76, 96], t: 102, a1: rel('sh', -2, -14, [1, -0.4]) })] };
  A.w_balanceo_lateral = {
    view: 'front',
    poses: [
      { hip: [100, 93], t: 180, a1: [30, 20], a2: [-20, -10], l1: [-22, -20], l2: legTo(92, 156, [-1, 0]) },
      { hip: [100, 93], t: 180, a1: [30, 20], a2: [-20, -10], l1: [44, 44], l2: legTo(92, 156, [-1, 0]) }
    ]
  };
  const bridge = (hipY, t, fx) => ({ hip: [100, hipY], t, a1: rel('sh', 40, 6, UP), l1: legTo(fx, 156, KNEE_UP), l2: legTo(fx + 4, 156, KNEE_UP) });
  A.w_puente_isq = { poses: [bridge(151, -90, 152), bridge(132, -67, 152)] };
  A.w_puente_gluteo = { poses: [bridge(151, -90, 132), bridge(126, -61, 132)] };
  A.w_monster = {
    view: 'front', eq: [band('k1', 'k2')],
    poses: [
      { hip: [100, 98], t: 180, a1: [12, 30], l1: legTo(118, 156, [1, 0]), l2: legTo(82, 156, [-1, 0]) },
      { hip: [108, 98], t: 180, a1: [12, 30], l1: legTo(136, 156, [1, 0]), l2: legTo(84, 156, [-1, 0]) },
      { hip: [116, 98], t: 180, a1: [12, 30], l1: legTo(136, 156, [1, 0]), l2: legTo(100, 156, [-1, 0]) }
    ], cycle: 'bounce'
  };
  const wiper = side => ({ hip: [100, 146], t: 180, a1: armTo(128, 156, [1, -0.3]), l1: legTo(132, 156, [side, -0.7]), l2: legTo(68, 156, [side, -0.7]) });
  A.w_9090 = { view: 'front', thighScale: 0.75, poses: [wiper(1), wiper(-1)] };
  A.w_talones = {
    anchor: { toe: [108, 156] },
    poses: [P(STAND, { a1: [4, 2], l1: [0, 0], l2: [0, 0], ft: 90, ft2: 90 }), P(STAND, { a1: [4, 2], l1: [0, 0], l2: [0, 0], ft: 48, ft2: 48 })]
  };
  A.w_comba = {
    seg: 260, hold: 60,
    poses: [
      { hip: [100, 94], t: 180, a1: [18, 50], l1: [4, -4], l2: [8, -8], ft: 80, ft2: 80 },
      { hip: [100, 84], t: 180, a1: [22, 60], l1: [2, -2], l2: [4, -4], ft: 40, ft2: 40 }
    ]
  };
  A.w_dead_bug = {
    seg: 800,
    poses: [
      { hip: [110, 152], t: -90, a1: [-180, -180], a2: [-180, -180], l1: [180, 90], l2: [180, 90], ft: 180, ft2: 180 },
      { hip: [110, 152], t: -90, a1: [-180, -180], a2: [-95, -95], l1: [96, 92], l2: [180, 90], ft: 180, ft2: 180 }
    ]
  };
  A.w_bird_dog = {
    seg: 800,
    poses: [
      { hip: [70, 120], t: 96, a1: [0, 0], a2: [0, 0], l1: [0, -90], l2: [0, -90], ft: 180, ft2: 180 },
      { hip: [70, 120], t: 96, a1: [0, 0], a2: [96, 96], l1: [-92, -92], l2: [0, -90], ft: -90, ft2: 180 }
    ]
  };

  /* ---------- Resolución de la pose ---------- */
  function ik(root, target, a, b, hint) {
    const v = sub(target, root);
    let d = len(v);
    const base = Math.atan2(v[1], v[0]);
    const dd = Math.max(Math.abs(a - b) + 0.5, Math.min(a + b - 0.3, d));
    const off = Math.acos(Math.max(-1, Math.min(1, (a * a + dd * dd - b * b) / (2 * a * dd))));
    const c1 = [root[0] + a * Math.cos(base + off), root[1] + a * Math.sin(base + off)];
    const c2 = [root[0] + a * Math.cos(base - off), root[1] + a * Math.sin(base - off)];
    const mid = lerpP(root, target, 0.5);
    const s1 = (c1[0] - mid[0]) * hint[0] + (c1[1] - mid[1]) * hint[1];
    const s2 = (c2[0] - mid[0]) * hint[0] + (c2[1] - mid[1]) * hint[1];
    const joint = s1 >= s2 ? c1 : c2;
    const end = add(joint, unit(sub(target, joint)), b);
    return [joint, end];
  }

  const mirrorLimb = spec => {
    if (!spec) return spec;
    if (Array.isArray(spec)) return spec.map(a => -a);
    const to = spec.to;
    return { mirror: true, to, bend: [-spec.bend[0], spec.bend[1]] };
  };

  function limb(root, spec, la, lb, J, cx) {
    if (Array.isArray(spec)) {
      const j = add(root, dir(spec[0]), la);
      return [j, add(j, dir(spec[1]), lb)];
    }
    let to = spec.to;
    if (typeof to[0] === 'string') to = add(J[to[0]], [to[1], to[2]]);
    if (spec.mirror) to = [2 * cx - to[0], to[1]];
    return ik(root, to, la, lb, spec.bend);
  }

  function solve(anim, p) {
    const front = anim.view === 'front';
    const hip = p.hip;
    const t = p.t ?? 180;
    const sh = add(hip, dir(t), L.torso);
    const J = { hip, sh, t, c: p.c || 0 };
    J.head = add(sh, dir(t + (p.hd || 0)), L.neck);
    const sx = front ? 12 : 0, hx = front ? 7 : 0;
    const cx = hip[0];
    const thL = L.th * (anim.thighScale || 1);
    [1, 2].forEach(i => {
      const sgn = i === 1 ? 1 : -1;
      const s = [sh[0] + sgn * sx, sh[1]], h = [hip[0] + sgn * hx, hip[1]];
      J['s' + i] = s; J['h' + i] = h;
      let aSpec = p['a' + i], lSpec = p['l' + i];
      if (i === 2) {
        if (!aSpec) aSpec = front ? mirrorLimb(p.a1) : p.a1;
        if (!lSpec) lSpec = front ? mirrorLimb(p.l1) : p.l1;
      }
      if (aSpec) { const [e, w] = limb(s, aSpec, L.ua, L.fa, J, cx); J['e' + i] = e; J['w' + i] = w; }
      if (lSpec) {
        const [k, a] = limb(h, lSpec, thL, L.sh, J, cx);
        J['k' + i] = k; J['a' + i] = a;
        let ftA = i === 1 ? p.ft : (p.ft2 ?? p.ft);
        const shinAng = Math.atan2(a[0] - k[0], a[1] - k[1]) * 180 / Math.PI;
        if (front) ftA = (i === 1 ? 90 : -90);
        J['toe' + i] = add(a, dir(ftA ?? shinAng + 90), L.foot);
      }
    });
    if (p.hand != null) J.hand1 = p.hand;
    // anclajes
    if (anim.anchor && anim.anchor.toe) {
      const d = sub(anim.anchor.toe, J.toe1);
      Object.keys(J).forEach(k => { if (Array.isArray(J[k])) J[k] = add(J[k], d); });
    }
    return J;
  }

  /* Interpolación genérica entre dos poses */
  function lerpVal(a, b, k) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerpVal(v, b[i], k));
    if (a && b && typeof a === 'object') { const o = {}; for (const key in a) o[key] = key in b ? lerpVal(a[key], b[key], k) : a[key]; return o; }
    return k < 0.5 ? a : b;
  }

  function poseAt(anim, ms, reduced) {
    const poses = anim.poses;
    const seg = anim.seg ?? 1100, hold = anim.hold ?? 380;
    const n = poses.length;
    let order;
    if (anim.cycle === 'wrap') order = poses.map((_, i) => i);
    else if (anim.cycle === 'bounce' || n > 2) order = n === 2 ? [0, 1] : [...poses.keys(), ...[...poses.keys()].slice(1, -1).reverse()];
    else order = [0, 1];
    const steps = anim.cycle === 'wrap' ? n - 1 : order.length;
    const stepT = seg + hold;
    const total = steps * stepT;
    const tt = ms % total;
    const i = Math.floor(tt / stepT);
    const within = tt - i * stepT;
    const from = order[i], to = anim.cycle === 'wrap' ? order[i + 1] : order[(i + 1) % order.length];
    if (within < hold) return poses[from];
    let k = (within - hold) / seg;
    if (reduced) k = k < 0.5 ? 0 : 1;
    k = (1 - Math.cos(Math.PI * k)) / 2;
    return lerpVal(poses[from], poses[to], k);
  }

  /* ---------- Dibujo ---------- */
  const line = (a, b, cls, extra = '') => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" class="${cls}" ${extra}/>`;

  function torsoPath(J, off = 0, from = 0, to = 1) {
    const v = sub(J.sh, J.hip), n = unit([-v[1], v[0]]);
    const c = J.c || 0;
    const P0 = add(J.hip, n, off), P2 = add(J.sh, n, off);
    const ctrl = add(lerpP(P0, P2, 0.5), n, c * 2);
    const q = s => { const a = lerpP(P0, ctrl, s), b = lerpP(ctrl, P2, s); return lerpP(a, b, s); };
    const a = q(from), m = q((from + to) / 2), b = q(to);
    const ctl = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
    return `M${f(a[0])},${f(a[1])} Q${f(ctl[0])},${f(ctl[1])} ${f(b[0])},${f(b[1])}`;
  }

  function hlLimb(p1, p2, side, flip, from = 0.12, to = 0.88) {
    const v = unit(sub(p2, p1));
    let n = [v[1], -v[0]];
    if (side < 0) n = [-n[0], -n[1]];
    if (flip) n = [-n[0], -n[1]];
    const a = add(lerpP(p1, p2, from), n, 3.2), b = add(lerpP(p1, p2, to), n, 3.2);
    return line(a, b, 'hl');
  }

  function highlights(anim, J, group) {
    if (!group) return '';
    const front = anim.view === 'front';
    const flip = !!anim.flip;
    const out = [];
    const torsoSide = s => {
      const sign = (flip ? -1 : 1) * s;
      return `<path d="${torsoPath(J, 3.6 * sign, s > 0 && group === 'core' ? 0.08 : 0.38, s > 0 && group === 'core' ? 0.55 : 0.92)}" class="hl"/>`;
    };
    const both = fn => (front ? [1, 2] : [1]).forEach(fn);
    switch (group) {
      case 'pecho':
        if (front) [-1, 1].forEach(s => out.push(line(add(J.sh, [s * 6, 6]), add(J.sh, [s * 6, 16]), 'hl')));
        else out.push(torsoSide(1));
        break;
      case 'espalda': out.push(front ? line(add(J.sh, [0, 4]), lerpP(J.sh, J.hip, 0.7), 'hl') : torsoSide(-1)); break;
      case 'core': out.push(front ? line(lerpP(J.hip, J.sh, 0.1), lerpP(J.hip, J.sh, 0.5), 'hl') : torsoSide(1)); break;
      case 'hombros': both(i => J['s' + i] && out.push(`<circle cx="${f(J['s' + i][0])}" cy="${f(J['s' + i][1])}" r="5" class="hl-dot"/>`)); break;
      case 'biceps': both(i => J['e' + i] && out.push(hlLimb(J['s' + i], J['e' + i], front ? 1 : 1, flip))); break;
      case 'triceps': both(i => J['e' + i] && out.push(hlLimb(J['s' + i], J['e' + i], -1, flip))); break;
      case 'cuadriceps': both(i => J['k' + i] && out.push(hlLimb(J['h' + i], J['k' + i], 1, flip))); break;
      case 'isquios': both(i => J['k' + i] && out.push(hlLimb(J['h' + i], J['k' + i], -1, flip))); break;
      case 'gemelos': both(i => J['a' + i] && out.push(hlLimb(J['k' + i], J['a' + i], -1, flip, 0.1, 0.6))); break;
      case 'gluteos': {
        const v = sub(J.sh, J.hip), n = unit([v[1], -v[0]]);
        const sgn = flip ? -1 : 1;
        both(i => { const c = front ? J['h' + i] : add(J.hip, n, 4 * sgn); out.push(`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="5.5" class="hl-dot"/>`); });
        break;
      }
    }
    return out.join('');
  }

  function equipment(anim, J, layer) {
    return (anim.eq || []).map(e => {
      const isBack = e.k === 'rect' || e.k === 'slab' || e.k === 'bar' || e.k === 'circle' || e.k === 'cable';
      if ((layer === 'back') !== isBack) return '';
      const at = e.at && typeof e.at === 'string' ? J[e.at] : null;
      switch (e.k) {
        case 'rect': {
          const x = e.at ? J[e.at][0] + e.dx : e.x, y = e.at ? J[e.at][1] + e.dy : e.y;
          return `<rect x="${f(x)}" y="${f(y)}" width="${e.w}" height="${e.h}" rx="${e.r || 1}" class="eq"/>`;
        }
        case 'slab': return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" class="eq-line" stroke-width="${e.w}"/>`;
        case 'bar': return `<line x1="${e.x1}" y1="${e.y}" x2="${e.x2}" y2="${e.y}" class="eq-line" stroke-width="4"/>`;
        case 'circle': return `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" class="eq-ring"/>`;
        case 'cable': return at ? `<line x1="${e.x}" y1="${e.y}" x2="${f(at[0])}" y2="${f(at[1])}" class="cable"/><circle cx="${e.x}" cy="${e.y}" r="4" class="eq"/>` : '';
        case 'plate': {
          if (!at) return '';
          const c = add(at, [e.dx || 0, e.dy || 0]);
          return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${e.r}" class="plate"/><circle cx="${f(c[0])}" cy="${f(c[1])}" r="2.5" class="eq"/>`;
        }
        case 'db': return at ? `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="6" class="plate"/>` : '';
        case 'grip': return at ? `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="3.5" class="eq"/>` : '';
        case 'wheel': return at ? `<circle cx="${f(at[0])}" cy="${f(at[1] + 1)}" r="8" class="plate"/>` : '';
        case 'roller': return at ? `<circle cx="${f(at[0])}" cy="${f(at[1] - 2)}" r="5.5" class="eq"/>` : '';
        case 'pad': return at ? `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="5" class="eq"/>` : '';
        case 'band': {
          const a = typeof e.a === 'string' ? J[e.a] : e.a, b = typeof e.b === 'string' ? J[e.b] : e.b;
          return a && b ? `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" class="band"/>` : '';
        }
        case 'sled': {
          if (!at) return '';
          const d = [0.7, 0.7];
          return line(add(at, d, -18), add(at, d, 14), 'eq-line', 'stroke-width="6"');
        }
      }
      return '';
    }).join('');
  }

  function figure(anim, J, group) {
    const front = anim.view === 'front';
    const limbs = i => {
      let s = '';
      if (J['k' + i]) s += `<polyline points="${[J['h' + i], J['k' + i], J['a' + i], J['toe' + i]].map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" class="limb"/>`;
      return s;
    };
    const arm = i => {
      if (!J['e' + i]) return '';
      let s = `<polyline points="${[J['s' + i], J['e' + i], J['w' + i]].map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" class="limb"/>`;
      if (i === 1 && J.hand1 != null) s += line(J.w1, add(J.w1, dir(J.hand1), 6), 'limb');
      return s;
    };
    const far = front ? '' : 'class="far"';
    return `
      <g ${far}>${arm(2)}${limbs(2)}</g>
      <path d="${torsoPath(J)}" class="torso"/>
      ${front ? arm(2) + limbs(2) : ''}
      ${limbs(1)}
      <circle cx="${f(J.head[0])}" cy="${f(J.head[1])}" r="${L.head}" class="head"/>
      ${highlights(anim, J, group)}
      ${arm(1)}`;
  }

  function render(key, ms = 0, group = null, reduced = false) {
    const anim = A[key];
    if (!anim) return '';
    const J = solve(anim, poseAt(anim, ms, reduced));
    return `<line x1="4" y1="${GROUND + 1}" x2="196" y2="${GROUND + 1}" class="ground"/>
      ${equipment(anim, J, 'back')}${figure(anim, J, group)}${equipment(anim, J, 'front')}`;
  }

  /* ---------- Montaje y bucle ---------- */
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = new Set();
  const visible = new WeakSet();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  }) : null;
  let raf = null, last = 0;
  const t0 = performance.now();

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return; // ~30 fps es suficiente
    last = now;
    live.forEach(el => {
      if (!el.isConnected) { live.delete(el); io && io.unobserve(el); return; }
      if (io && !visible.has(el)) return;
      const svg = el.firstElementChild;
      if (svg) svg.innerHTML = render(el.dataset.anim, now - t0 + (Number(el.dataset.offset) || 0), el.dataset.group, reduced);
    });
    if (!live.size) { cancelAnimationFrame(raf); raf = null; }
  }

  function html(key, group = '', cls = '') {
    if (!A[key]) return '';
    return `<div class="anim ${cls}" data-anim="${key}" data-group="${group || ''}" role="img" aria-label="Animación de la técnica">
      <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid meet">${render(key, 0, group)}</svg></div>`;
  }

  function scan(root = document) {
    root.querySelectorAll('.anim[data-anim]').forEach(el => {
      if (live.has(el)) return;
      live.add(el);
      io ? io.observe(el) : visible.add(el);
    });
    if (live.size && !raf) raf = requestAnimationFrame(loop);
  }

  return { html, scan, render, has: key => !!A[key], keys: () => Object.keys(A), LIB: A };
})();
