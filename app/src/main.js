// Vice Sunset — editor wiring: state, controls, preview, export.
// All photos stay on the machine: file inputs are read with FileReader into
// data URLs and drawn to canvas; nothing is ever uploaded.

import { GRADES, LAYOUTS, SIZES, defaultState, renderCover } from './cover.js';
import { applyShotParams, shotMode } from './shots.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
let previewScale = 1;

const preview = $('preview');
const pctx = preview.getContext('2d');
const exportCanvas = document.createElement('canvas');

function currentSize() {
  return SIZES[state.size];
}

function drawPreview() {
  const { w, h } = currentSize();
  const box = $('stage');
  const availW = Math.min(box.clientWidth - 8, 640);
  const availH = Math.min(window.innerHeight - 260, 640);
  previewScale = Math.min(availW / w, availH / h, 1);
  preview.width = Math.round(w * previewScale);
  preview.height = Math.round(h * previewScale);
  pctx.setTransform(previewScale, 0, 0, previewScale, 0, 0);
  renderCover(pctx, state, w, h);
  $('sizeLabel').textContent = `${SIZES[state.size].label}  •  preview ${preview.width}x${preview.height}`;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('bad image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('sample missing'));
    img.src = `samples/${name}.jpg`;
  });
}

async function setPhoto(index, img) {
  state.photos[index] = img;
  if (state.fillAll) {
    for (let i = 0; i < 4; i++) state.photos[i] = img;
  }
  refreshPanelList();
  drawPreview();
}

function refreshPanelList() {
  const list = $('panels');
  list.querySelectorAll('.panel-row').forEach((row, i) => {
    const img = state.photos[i];
    row.querySelector('.panel-thumb').textContent = img ? 'PHOTO LOADED' : 'EMPTY';
    row.querySelector('.panel-thumb').classList.toggle('loaded', !!img);
  });
}

function buildPanelRows() {
  const list = $('panels');
  list.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `
      <span class="panel-num">P${i + 1}</span>
      <span class="panel-thumb">EMPTY</span>
      <label class="btn small">Upload
        <input type="file" accept="image/*" hidden data-panel="${i}">
      </label>
      <label class="crop">Zoom
        <input type="range" min="1" max="2.5" step="0.05" value="${state.crops[i].zoom}" data-crop="${i}" data-axis="zoom">
      </label>
      <label class="crop">Left–Right
        <input type="range" min="0" max="1" step="0.02" value="${state.crops[i].ox}" data-crop="${i}" data-axis="ox">
      </label>
      <label class="crop">Up–Down
        <input type="range" min="0" max="1" step="0.02" value="${state.crops[i].oy}" data-crop="${i}" data-axis="oy">
      </label>`;
    list.appendChild(row);
  }
  list.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const img = await loadImageFile(file);
        await setPhoto(Number(input.dataset.panel), img);
      } catch {
        $('status').textContent = 'That file could not be read as a photo.';
      }
      input.value = '';
    });
  });
  list.querySelectorAll('input[type="range"]').forEach((input) => {
    input.addEventListener('input', () => {
      const crop = state.crops[Number(input.dataset.crop)];
      crop[input.dataset.axis] = Number(input.value);
      drawPreview();
    });
  });
}

function buildGradeButtons() {
  const wrap = $('grades');
  wrap.innerHTML = '';
  for (const [key, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade' + (state.grade === key ? ' active' : '');
    b.dataset.grade = key;
    b.style.background = `linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]} 55%, ${g.sky[2]})`;
    b.textContent = g.name;
    b.addEventListener('click', () => {
      state.grade = key;
      wrap.querySelectorAll('.grade').forEach((el) => el.classList.toggle('active', el.dataset.grade === key));
      drawPreview();
    });
    wrap.appendChild(b);
  }
}

function buildLayoutButtons() {
  const wrap = $('layouts');
  wrap.innerHTML = '';
  for (const [key, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn' + (state.layout === key ? ' active' : '');
    b.dataset.layout = key;
    b.textContent = l.name;
    b.addEventListener('click', () => {
      state.layout = key;
      wrap.querySelectorAll('.layout-btn').forEach((el) => el.classList.toggle('active', el.dataset.layout === key));
      drawPreview();
    });
    wrap.appendChild(b);
  }
}

function buildSizeButtons() {
  const wrap = $('sizes');
  wrap.innerHTML = '';
  for (const [key, s] of Object.entries(SIZES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size-btn' + (state.size === key ? ' active' : '');
    b.dataset.size = key;
    b.textContent = s.label;
    b.addEventListener('click', () => {
      state.size = key;
      wrap.querySelectorAll('.size-btn').forEach((el) => el.classList.toggle('active', el.dataset.size === key));
      drawPreview();
    });
    wrap.appendChild(b);
  }
}

function bindEffects() {
  const defs = [
    ['fxHalftone', 'halftone'],
    ['fxGrain', 'grain'],
    ['fxVignette', 'vignette'],
    ['fxGold', 'goldRule'],
    ['fxBadge', 'badge'],
  ];
  for (const [id, key] of defs) {
    const el = $(id);
    el.checked = state[key];
    el.addEventListener('change', () => {
      state[key] = el.checked;
      drawPreview();
    });
  }
}

function bindText() {
  const map = [['capTitle', 'title'], ['capScript', 'script'], ['capSub', 'subtitle'], ['capBadge', 'badgeText']];
  for (const [id, key] of map) {
    const el = $(id);
    el.value = state[key];
    el.addEventListener('input', () => {
      state[key] = el.value;
      drawPreview();
    });
  }
}

async function exportPNG() {
  const { w, h } = currentSize();
  exportCanvas.width = w;
  exportCanvas.height = h;
  const ctx = exportCanvas.getContext('2d');
  renderCover(ctx, state, w, h);
  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-sunset-${state.size}-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve({ w, h, bytes: blob.size });
    }, 'image/png');
  });
}

async function init() {
  buildPanelRows();
  buildGradeButtons();
  buildLayoutButtons();
  buildSizeButtons();
  bindEffects();
  bindText();

  $('fillAll').addEventListener('change', (e) => {
    state.fillAll = e.target.checked;
    if (state.fillAll && state.photos[0]) {
      for (let i = 1; i < 4; i++) state.photos[i] = state.photos[0];
    }
    drawPreview();
  });

  $('samplePier').addEventListener('click', async () => {
    const img = await loadSample('pier');
    await setPhoto(0, img);
    $('status').textContent = 'Sample photo "pier" loaded into the hero panel.';
  });
  $('sampleBoulevard').addEventListener('click', async () => {
    const img = await loadSample('boulevard');
    await setPhoto(0, img);
    $('status').textContent = 'Sample photo "boulevard" loaded into the hero panel.';
  });

  $('exportBtn').addEventListener('click', async () => {
    $('status').textContent = 'Exporting PNG…';
    const { w, h, bytes } = await exportPNG();
    $('status').textContent = `Exported ${w}x${h} PNG (${Math.round(bytes / 1024)} KiB). Saved to your downloads.`;
  });

  $('shuffleBtn').addEventListener('click', () => {
    const keys = Object.keys(GRADES);
    state.grade = keys[Math.floor(Math.random() * keys.length)];
    document.querySelectorAll('.grade').forEach((el) => el.classList.toggle('active', el.dataset.grade === state.grade));
    drawPreview();
  });

  // Shot mode (for screenshots): ?shot=cover|editor&photo=pier|boulevard&caption=...
  const mode = shotMode();
  if (mode) {
    await applyShotParams(state, { loadSample, setPhoto, drawPreview });
    if (mode === 'cover') {
      document.body.classList.add('shot-cover');
      const { w, h } = currentSize();
      preview.width = w;
      preview.height = h;
      preview.style.width = `${w}px`;
      preview.style.height = `${h}px`;
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      renderCover(pctx, state, w, h);
      document.title = 'Vice Sunset — cover';
      return;
    }
    document.body.classList.add('shot-editor');
  }

  drawPreview();
  window.addEventListener('resize', drawPreview);
  document.fonts.ready.then(drawPreview);
}

init().catch((err) => {
  $('status').textContent = `Could not start: ${err.message}`;
});
