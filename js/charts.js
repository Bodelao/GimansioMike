/* ==========================================================================
   Carmaikel Fitness · Gráficas (canvas, sin dependencias externas)
   Barras y líneas de una sola serie con tooltip al pasar/tocar.
   ========================================================================== */
window.GM = window.GM || {};

GM.charts = (() => {
  /* Colores leídos del tema activo (variables CSS) en cada dibujo */
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rgba = (hex, a) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const C = {};
  function refreshColors() {
    const mark = css('--chart') || '#d95926', text = css('--text') || '#f0efec';
    Object.assign(C, {
      mark, markSoft: rgba(mark, 0.28), areaTop: rgba(mark, 0.22), areaBottom: rgba(mark, 0),
      grid: css('--line') || 'rgba(255,255,255,0.08)', axis: css('--muted') || '#8b8a85',
      text: css('--text-2') || '#c3c2b7', surface: css('--surface') || '#1a1a19', cross: rgba(text, 0.25)
    });
  }

  function setup(canvas, height) {
    refreshColors();
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    canvas.style.width = w + 'px';
    canvas.style.height = height + 'px';
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: height };
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function roundTopRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function axes(ctx, w, h, pad, max, fmt) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = C.axis;
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (h - pad.t - pad.b) * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(fmt(max * i / 4), pad.l - 6, y);
    }
  }

  function xLabels(ctx, labels, xs, h, pad) {
    ctx.fillStyle = C.axis;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = Math.ceil(labels.length / 8);
    const last = labels.length - 1;
    labels.forEach((l, i) => {
      const show = i === last || (i % step === 0 && last - i >= step);
      if (show) ctx.fillText(l, xs[i], h - pad.b + 6);
    });
  }

  /* Tooltip compartido */
  function tooltip(canvas, hitTest) {
    const tip = canvas.parentElement.querySelector('.chart-tip') || (() => {
      const t = document.createElement('div'); t.className = 'chart-tip'; canvas.parentElement.appendChild(t); return t;
    })();
    const move = ev => {
      const r = canvas.getBoundingClientRect();
      const p = ev.touches ? ev.touches[0] : ev;
      const x = p.clientX - r.left, y = p.clientY - r.top;
      const hit = hitTest(x, y);
      if (!hit) { tip.style.opacity = 0; canvas._hover = -1; canvas._redraw && canvas._redraw(); return; }
      tip.innerHTML = hit.html;
      tip.style.opacity = 1;
      const tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(r.width - tw, hit.x - tw / 2)) + 'px';
      tip.style.top = Math.max(0, hit.y - tip.offsetHeight - 10) + 'px';
      if (canvas._hover !== hit.i) { canvas._hover = hit.i; canvas._redraw && canvas._redraw(); }
    };
    canvas.onmousemove = move;
    canvas.ontouchstart = move;
    canvas.ontouchmove = move;
    canvas.onmouseleave = () => { tip.style.opacity = 0; canvas._hover = -1; canvas._redraw && canvas._redraw(); };
  }

  /* Barras verticales, una serie */
  function bars(canvas, { labels, values, fmt = v => GM.fmtNum(Math.round(v)), tip, height = 200 }) {
    canvas._hover = -1;
    const draw = () => {
      const { ctx, w, h } = setup(canvas, height);
      const pad = { t: 12, r: 8, b: 24, l: 48 };
      const max = niceMax(Math.max(...values, 1));
      axes(ctx, w, h, pad, max, fmt);
      const n = values.length;
      const band = (w - pad.l - pad.r) / n;
      const bw = Math.max(4, Math.min(36, band - 2)); // 2px de separación mínima
      const xs = [];
      values.forEach((v, i) => {
        const x = pad.l + band * i + (band - bw) / 2;
        xs.push(x + bw / 2);
        const bh = (h - pad.t - pad.b) * (v / max);
        if (bh <= 0) return;
        ctx.fillStyle = canvas._hover === -1 || canvas._hover === i ? C.mark : C.markSoft;
        roundTopRect(ctx, x, h - pad.b - bh, bw, bh, 4);
        ctx.fill();
      });
      xLabels(ctx, labels, xs, h, pad);
      canvas._geom = { xs, band, pad, max, h };
    };
    canvas._redraw = draw;
    draw();
    tooltip(canvas, (x) => {
      const g = canvas._geom;
      const i = Math.floor((x - g.pad.l) / g.band);
      if (i < 0 || i >= values.length) return null;
      const y = g.h - g.pad.b - (g.h - g.pad.t - g.pad.b) * (values[i] / g.max);
      return { i, x: g.xs[i], y, html: tip ? tip(i) : `<b>${labels[i]}</b><br>${fmt(values[i])}` };
    });
  }

  /* Línea, una serie, con marcadores */
  function line(canvas, { labels, values, fmt = v => GM.fmtNum(Math.round(v)), tip, height = 200 }) {
    canvas._hover = -1;
    const draw = () => {
      const { ctx, w, h } = setup(canvas, height);
      const pad = { t: 14, r: 14, b: 24, l: 48 };
      const vmax = Math.max(...values, 1), vmin = Math.min(...values);
      const stepY = niceMax(((vmax - vmin) || vmax * 0.2 || 1) / 3);
      const lo = Math.max(0, Math.floor((vmin - stepY * 0.5) / stepY) * stepY);
      const max = lo + Math.ceil((vmax - lo) / stepY + 0.3) * stepY;
      const scaleY = v => pad.t + (h - pad.t - pad.b) * (1 - (v - lo) / (max - lo));
      // grid
      ctx.font = '11px system-ui, sans-serif';
      ctx.strokeStyle = C.grid; ctx.fillStyle = C.axis; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let v = lo; v <= max + 1e-9; v += stepY) {
        const y = scaleY(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.fillText(fmt(v), pad.l - 6, y);
      }
      const n = values.length;
      const xs = values.map((_, i) => pad.l + (n === 1 ? (w - pad.l - pad.r) / 2 : (w - pad.l - pad.r) * i / (n - 1)));
      // área suave
      ctx.beginPath();
      values.forEach((v, i) => (i ? ctx.lineTo(xs[i], scaleY(v)) : ctx.moveTo(xs[i], scaleY(v))));
      ctx.lineTo(xs[n - 1], h - pad.b); ctx.lineTo(xs[0], h - pad.b); ctx.closePath();
      const grd = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      grd.addColorStop(0, C.areaTop); grd.addColorStop(1, C.areaBottom);
      ctx.fillStyle = grd; ctx.fill();
      // línea 2px
      ctx.beginPath();
      values.forEach((v, i) => (i ? ctx.lineTo(xs[i], scaleY(v)) : ctx.moveTo(xs[i], scaleY(v))));
      ctx.strokeStyle = C.mark; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      // crosshair
      if (canvas._hover >= 0) {
        ctx.strokeStyle = C.cross; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xs[canvas._hover], pad.t); ctx.lineTo(xs[canvas._hover], h - pad.b); ctx.stroke();
      }
      // marcadores (anillo del color de fondo)
      values.forEach((v, i) => {
        const r = canvas._hover === i ? 6 : 4;
        ctx.beginPath(); ctx.arc(xs[i], scaleY(v), r + 2, 0, Math.PI * 2); ctx.fillStyle = C.surface; ctx.fill();
        ctx.beginPath(); ctx.arc(xs[i], scaleY(v), r, 0, Math.PI * 2); ctx.fillStyle = C.mark; ctx.fill();
      });
      // etiqueta directa en el último punto
      ctx.fillStyle = C.text; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(fmt(values[n - 1]), xs[n - 1] - 6, scaleY(values[n - 1]) - 8);
      ctx.font = '11px system-ui, sans-serif';
      xLabels(ctx, labels, xs, h, pad);
      canvas._geom = { xs, scaleY };
    };
    canvas._redraw = draw;
    draw();
    tooltip(canvas, (x) => {
      const g = canvas._geom;
      let best = 0;
      g.xs.forEach((xx, i) => { if (Math.abs(xx - x) < Math.abs(g.xs[best] - x)) best = i; });
      return { i: best, x: g.xs[best], y: g.scaleY(values[best]), html: tip ? tip(best) : `<b>${labels[best]}</b><br>${fmt(values[best])}` };
    });
  }

  return { bars, line, colors: C };
})();
