// Vice Sunset — cover renderer. Pure canvas drawing: given a state object it
// paints a multi-panel GTA-style poster cover onto any 2d context, at any size.
// No network, no fonts beyond the two bundled under app/fonts/.

export const GRADES = {
  sunset: { name: 'Sunset', sky: ['#ff9a3d', '#ff5e62', '#c6427a'], wash: 'rgba(255,110,60,0.16)', deep: '#2b1055' },
  neon: { name: 'Neon', sky: ['#00e5ff', '#ff2fb3', '#7b2fff'], wash: 'rgba(0,229,255,0.14)', deep: '#12002e' },
  noir: { name: 'Noir', sky: ['#d8d8d8', '#8a8a8a', '#2a2a2a'], wash: 'rgba(0,0,0,0.22)', deep: '#0a0a0a' },
  palmdusk: { name: 'Palm Dusk', sky: ['#ffd166', '#ef476f', '#5e2b97'], wash: 'rgba(94,43,151,0.18)', deep: '#1d1140' },
  vicepop: { name: 'Vice Pop', sky: ['#ffe259', '#ff7ad9', '#00c2ff'], wash: 'rgba(255,122,217,0.14)', deep: '#3a0ca3' },
};

export const LAYOUTS = {
  hero: { name: 'Hero + Three', panels: 4 },
  grid: { name: 'Four Grid', panels: 4 },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export function defaultState() {
  return {
    layout: 'hero',
    size: 'square',
    title: 'VICE SUNSET',
    script: 'Welcome to',
    subtitle: 'LEONIDA  •  2026',
    grade: 'sunset',
    badgeText: 'VICE CITY',
    halftone: true,
    grain: true,
    vignette: true,
    goldRule: true,
    badge: true,
    fillAll: false,
    photos: [null, null, null, null],
    crops: [
      { zoom: 1.05, ox: 0.4, oy: 0.3 },
      { zoom: 1.25, ox: 0.5, oy: 0.5 },
      { zoom: 1.25, ox: 0.5, oy: 0.5 },
      { zoom: 1.25, ox: 0.5, oy: 0.5 },
    ],
  };
}

// Panel rectangles for a layout, in cover space. gap is the white gutter.
export function panelRects(layout, W, H) {
  const gap = Math.round(Math.min(W, H) * 0.018);
  const outer = Math.round(Math.min(W, H) * 0.028);
  const x0 = outer, y0 = outer, x1 = W - outer, y1 = H - outer;
  if (layout === 'grid') {
    const hw = (x1 - x0 - gap) / 2;
    const hh = (y1 - y0 - gap) / 2;
    return [
      { x: x0, y: y0, w: hw, h: hh },
      { x: x0 + hw + gap, y: y0, w: hw, h: hh },
      { x: x0, y: y0 + hh + gap, w: hw, h: hh },
      { x: x0 + hw + gap, y: y0 + hh + gap, w: hw, h: hh },
    ];
  }
  // hero: one wide panel on top, three equal panels below.
  const heroH = (y1 - y0) * 0.56;
  const rowY = y0 + heroH + gap;
  const rowH = y1 - rowY;
  const cw = (x1 - x0 - gap * 2) / 3;
  return [
    { x: x0, y: y0, w: x1 - x0, h: heroH },
    { x: x0, y: rowY, w: cw, h: rowH },
    { x: x0 + cw + gap, y: rowY, w: cw, h: rowH },
    { x: x0 + cw * 2 + gap * 2, y: rowY, w: cw, h: rowH },
  ];
}

// Cover-fit draw of one photo into a panel rect, honouring zoom + focal point.
export function drawPhotoPanel(ctx, img, crop, rect) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a2b5c');
    g.addColorStop(0.55, '#c6427a');
    g.addColorStop(1, '#ff9a3d');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.round(h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * (crop.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = x + (w - dw) * (crop.ox ?? 0.5);
  const dy = y + (h - dh) * (crop.oy ?? 0.5);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function gradeWash(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, 'rgba(255,255,255,0.05)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, grade.wash);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// Halftone sun: concentric dotted rings, the poster's sun.
export function drawHalftoneSun(ctx, cx, cy, r, grade) {
  const rings = 9;
  for (let i = rings; i >= 1; i--) {
    const rr = (r * i) / rings;
    const t = i / rings;
    const col = grade.sky[Math.min(grade.sky.length - 1, Math.floor(t * grade.sky.length))];
    ctx.fillStyle = col;
    const dots = Math.max(10, Math.round(rr * 0.55));
    for (let d = 0; d < dots; d++) {
      const a = (d / dots) * Math.PI * 2 + i * 0.35;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.92;
      const dotR = Math.max(1, r * 0.028 * (1.25 - t * 0.5));
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = grade.sky[0];
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

let grainTile = null;
function grainPattern(ctx, size) {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 140;
  t.height = 140;
  const tc = t.getContext('2d');
  const img = tc.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  tc.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(t, 'repeat');
  return grainTile;
}

function fitFont(ctx, text, maxW, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

// Bold caption with hard outline, laid over the bottom of the cover.
export function drawCaption(ctx, state, W, H) {
  const grade = GRADES[state.grade];
  const pad = Math.round(Math.min(W, H) * 0.045);
  const bandH = H * 0.3;
  const bandY = H - bandH - pad * 0.4;
  // Soft dark band so lettering reads on any photo.
  const bg = ctx.createLinearGradient(0, bandY - H * 0.06, 0, H);
  bg.addColorStop(0, 'rgba(10,4,24,0)');
  bg.addColorStop(0.45, 'rgba(10,4,24,0.55)');
  bg.addColorStop(1, 'rgba(10,4,24,0.82)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY - H * 0.06, W, H - bandY + H * 0.06);

  const cx = W / 2;
  const title = (state.title || 'VICE SUNSET').toUpperCase();
  const tpx = fitFont(ctx, title, W - pad * 2, Math.round(H * 0.11), '"Anton", sans-serif', 400);
  const spx2 = state.subtitle
    ? fitFont(ctx, state.subtitle, W * 0.8, Math.round(H * 0.034), '"Anton", sans-serif', 400)
    : 0;

  let y = bandY + H * 0.06;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (state.script) {
    const spx = fitFont(ctx, state.script, W * 0.7, Math.round(H * 0.05), '"Pacifico", cursive', 400);
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(-0.045);
    ctx.fillStyle = grade.sky[0];
    ctx.font = `400 ${spx}px "Pacifico", cursive`;
    ctx.fillText(state.script, 0, 0);
    ctx.restore();
    // Title cap-height rises ~0.72 * tpx above its baseline: leave a real gap.
    y += spx * 0.55 + tpx * 0.72;
  } else {
    y += tpx * 0.72;
  }

  ctx.font = `400 ${tpx}px "Anton", sans-serif`;
  const grad = ctx.createLinearGradient(0, y - tpx, 0, y + tpx * 0.2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, grade.sky[0]);
  grad.addColorStop(1, grade.sky[1]);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14061f';
  ctx.lineWidth = Math.max(3, tpx * 0.09);
  ctx.strokeText(title, cx, y);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, y);
  y += tpx * 0.34 + spx2;

  if (state.subtitle) {
    ctx.font = `400 ${spx2}px "Anton", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(state.subtitle.toUpperCase(), cx, y);
  }
}

function drawBadge(ctx, state, W, H) {
  const grade = GRADES[state.grade];
  const bw = W * 0.34;
  const bh = Math.round(H * 0.045);
  const bx = (W - bw) / 2;
  const by = Math.round(H * 0.028);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw - bh * 0.5, by + bh);
  ctx.lineTo(bx + bh * 0.5, by + bh);
  ctx.closePath();
  ctx.fillStyle = grade.deep;
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, H * 0.002);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = `400 ${Math.round(bh * 0.52)}px "Anton", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((state.badgeText || 'VICE CITY').toUpperCase(), W / 2, by + bh / 2 + 1);
  ctx.restore();
}

// The whole cover. state.photos holds HTMLImageElements (or null).
export function renderCover(ctx, state, W, H) {
  const grade = GRADES[state.grade];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0e0718';
  ctx.fillRect(0, 0, W, H);

  // Sky wash behind the panels.
  const sky = ctx.createLinearGradient(0, 0, W, H);
  sky.addColorStop(0, grade.sky[2]);
  sky.addColorStop(0.5, grade.sky[1]);
  sky.addColorStop(1, grade.sky[0]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rects = panelRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    const photo = state.fillAll ? state.photos[0] : state.photos[i];
    drawPhotoPanel(ctx, photo, state.crops[i], rect);
    gradeWash(ctx, rect, grade);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.006);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  if (state.halftone) {
    const hero = rects[0];
    const r = Math.min(hero.w, hero.h) * 0.18;
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawHalftoneSun(ctx, hero.x + hero.w * 0.86, hero.y + hero.h * 0.16, r, grade);
    ctx.restore();
  }

  if (state.goldRule) {
    const m = Math.round(Math.min(W, H) * 0.012);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.004);
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  }

  drawCaption(ctx, state, W, H);

  if (state.badge) drawBadge(ctx, state, W, H);

  if (state.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
