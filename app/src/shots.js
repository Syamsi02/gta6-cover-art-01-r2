// Vice Sunset — screenshot mode. The screenshots in screenshots/ are taken by
// loading the app with a query string, e.g.
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&size=wide
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
// shot=cover renders the finished cover full-frame (the app's own drawing of
// the exported PNG, at export size); shot=editor shows the editor with the
// sample photo already loaded. No shot param means the normal editor.

export function shotMode() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot === 'cover' || shot === 'editor') return shot;
  return null;
}

export async function applyShotParams(state, helpers) {
  const q = new URLSearchParams(location.search);
  const { loadSample, setPhoto, drawPreview } = helpers;

  const caption = q.get('caption');
  if (caption) state.title = caption;
  const script = q.get('script');
  if (script !== null) state.script = script;
  const subtitle = q.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const grade = q.get('grade');
  if (grade && grade in (await import('./cover.js')).GRADES) state.grade = grade;
  const layout = q.get('layout');
  if (layout === 'hero' || layout === 'grid') state.layout = layout;
  const size = q.get('size');
  if (size === 'square' || size === 'portrait' || size === 'wide') state.size = size;
  const fill = q.get('fill');
  if (fill === 'all') {
    state.fillAll = true;
    const box = document.getElementById('fillAll');
    if (box) box.checked = true;
  }

  const photo = q.get('photo');
  if (photo === 'pier' || photo === 'boulevard') {
    const img = await loadSample(photo);
    await setPhoto(0, img);
    if (state.fillAll) {
      for (let i = 1; i < 4; i++) state.photos[i] = img;
    }
    const st = document.getElementById('status');
    if (st) st.textContent = `Sample photo "${photo}" loaded — edit the caption, pick a grade, export.`;
  }

  // Keep the text inputs in sync with the query values.
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };
  set('capTitle', state.title);
  set('capScript', state.script);
  set('capSub', state.subtitle);
  set('capBadge', state.badgeText);
  document.querySelectorAll('.grade').forEach((el) => el.classList.toggle('active', el.dataset.grade === state.grade));
  document.querySelectorAll('.layout-btn').forEach((el) => el.classList.toggle('active', el.dataset.layout === state.layout));
  document.querySelectorAll('.size-btn').forEach((el) => el.classList.toggle('active', el.dataset.size === state.size));

  // Fonts must be ready before the cover is drawn, or the caption falls back.
  await document.fonts.ready;
  drawPreview();
}
