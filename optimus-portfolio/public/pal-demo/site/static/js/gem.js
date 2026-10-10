// A measured movement map, not an inferred feasible envelope. Filled facets
// interpolate successful observations for comparison; they do not prove that
// commands between observations pass. The faint wire shell is a fixed reference.
const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const WIDTH = 600;
const HEIGHT = 398;
const CENTER = [300, 191];
const RADIUS = 133;
const SCALE = { translation: 3, yaw: 2 };
const VIEWS = [
  { id: 'forward', label: 'Forward', short: 'Fwd', vector: [0, 1, 0] },
  { id: 'forward-right', label: 'Forward-right', short: 'Fwd-R', vector: [Math.SQRT1_2, Math.SQRT1_2, 0] },
  { id: 'right', label: 'Right', vector: [1, 0, 0] },
  { id: 'backward-right', label: 'Backward-right', short: 'Back-R', vector: [Math.SQRT1_2, -Math.SQRT1_2, 0] },
  { id: 'backward', label: 'Backward', short: 'Back', vector: [0, -1, 0] },
  { id: 'backward-left', label: 'Backward-left', short: 'Back-L', vector: [-Math.SQRT1_2, -Math.SQRT1_2, 0] },
  { id: 'left', label: 'Left', vector: [-1, 0, 0] },
  { id: 'forward-left', label: 'Forward-left', short: 'Fwd-L', vector: [-Math.SQRT1_2, Math.SQRT1_2, 0] },
  { id: 'yaw-ccw', label: 'CCW yaw +', short: 'CCW +', name: 'Counterclockwise yaw: top-down view', vector: [0, 0, 1] },
  { id: 'yaw-cw', label: 'CW yaw −', short: 'CW −', name: 'Clockwise yaw: bottom-up view', vector: [0, 0, -1] },
];

function multiply(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

function unit(value) {
  const length = Math.hypot(...value);
  return value.map(v => v / (length || 1));
}

function axisAngle(axis, angle) {
  return [...axis.map(v => v * Math.sin(angle / 2)), Math.cos(angle / 2)];
}

function rotate(q, v) {
  return multiply(multiply(q, [...v, 0]), [-q[0], -q[1], -q[2], q[3]]).slice(0, 3);
}

function between(a, b) {
  const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  if (dot < -0.999999) {
    const axis = Math.abs(a[0]) < 0.8 ? [0, a[2], -a[1]] : [-a[2], 0, a[0]];
    return [...unit(axis), 0];
  }
  return unit([...cross, 1 + dot]);
}

function svgNode(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function format(value) {
  return Number(value).toFixed(2).replace(/^-0\.00$/, '0.00');
}

function actualFor(point) {
  const value = point.measured ?? point.velocity;
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? value : null;
}

// Orthographic depth test against the same projected triangles we draw. Ignore
// edge-on faces and equal depths so a label does not hide behind its own vertex.
function occluded(point, faces) {
  return faces.some(([a, b, c]) => {
    const area = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(area) < 1e-6) return false;
    const u = ((b[1] - c[1]) * (point[0] - c[0]) + (c[0] - b[0]) * (point[1] - c[1])) / area;
    const v = ((c[1] - a[1]) * (point[0] - c[0]) + (a[0] - c[0]) * (point[1] - c[1])) / area;
    const w = 1 - u - v;
    return Math.min(u, v, w) >= -1e-6 && u * a[2] + v * b[2] + w * c[2] > point[2] + 1e-4;
  });
}

// An incremental hull gives the character card a shape determined only by its
// observations. No origin, failed observation, or synthetic zero closes a gap.
// Coplanar/sparse data remains a point map instead of a fabricated 3D volume.
function measuredFacets(vertices) {
  const unique = [];
  for (const v of vertices) {
    if (!unique.some(p => Math.hypot(...v.map((n, i) => n - p[i])) < 1e-6)) unique.push(v);
  }
  if (unique.length < 4) return [];
  const sub = (a, b) => a.map((n, i) => n - b[i]);
  const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const farthest = metric => unique.reduce((best, p, i) => metric(p) > best.distance ? { index: i, distance: metric(p) } : best, { index: -1, distance: 0 });
  const first = 0;
  const second = farthest(p => Math.hypot(...sub(p, unique[first])));
  if (second.distance < 1e-6) return [];
  const baseline = sub(unique[second.index], unique[first]);
  const third = farthest(p => Math.hypot(...cross(baseline, sub(p, unique[first]))) / second.distance);
  if (third.distance < 1e-6) return [];
  const plane = unit(cross(baseline, sub(unique[third.index], unique[first])));
  const fourth = farthest(p => Math.abs(dot(plane, sub(p, unique[first]))));
  if (fourth.distance < 1e-5) return [];
  const initial = [first, second.index, third.index, fourth.index];
  const inside = [0, 1, 2].map(axis => initial.reduce((sum, i) => sum + unique[i][axis], 0) / 4);
  function face(a, b, c) {
    let normal = cross(sub(unique[b], unique[a]), sub(unique[c], unique[a]));
    if (Math.hypot(...normal) < 1e-9) return null;
    if (dot(normal, sub(inside, unique[a])) > 0) {
      [b, c] = [c, b];
      normal = normal.map(n => -n);
    }
    return { indices: [a, b, c], normal: unit(normal) };
  }
  let faces = [face(first, second.index, third.index), face(first, fourth.index, second.index), face(first, third.index, fourth.index), face(second.index, fourth.index, third.index)];
  unique.forEach((point, index) => {
    if (initial.includes(index)) return;
    const visible = faces.filter(f => dot(f.normal, sub(point, unique[f.indices[0]])) > 1e-6);
    if (!visible.length) return;
    const horizon = new Map();
    for (const f of visible) {
      for (let i = 0; i < 3; i++) {
        const a = f.indices[i], b = f.indices[(i + 1) % 3];
        const reverse = `${b}:${a}`;
        if (horizon.has(reverse)) horizon.delete(reverse);
        else horizon.set(`${a}:${b}`, [a, b]);
      }
    }
    faces = faces.filter(f => !visible.includes(f));
    for (const [a, b] of horizon.values()) {
      const next = face(a, b, index);
      if (next) faces.push(next);
    }
  });
  return faces.map(f => f.indices.map(i => unique[i]));
}

/**
 * Mount the interactive gem. Points are independent measured observations:
 * { id, label, command:[vx,vy,wz], measured:[vx,vy,wz], passed:boolean }.
 * `velocity` is accepted as an alias for `measured`. vx is forward, vy is left,
 * and positive wz is counterclockwise. Every policy uses 3 m/s and 2 rad/s
 * reference scales; values beyond the shell remain visible as outside points.
 * setPoints does not reset the user's orientation or zoom.
 */
export function createGem(container, { points = [], onSelect } = {}) {
  const wrapper = element('div', 'policy-gem');
  Object.assign(wrapper.style, {
    color: 'var(--gem-text, #243832)', fontFamily: 'inherit', minWidth: '0',
  });
  const frame = element('div', 'policy-gem-frame');
  Object.assign(frame.style, {
    position: 'relative', borderRadius: '16px', overflow: 'hidden',
    background: 'var(--gem-background, #f4f8f6)',
    border: '1px solid var(--gem-border, #e0e9e4)',
  });
  const svg = svgNode('svg', {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'group', tabindex: '0',
    'aria-label': 'Movement gem. Direction buttons align the view. Drag to rotate freely. Shift-drag or right-drag to roll. Pinch or scroll to zoom. Arrow keys rotate; shift-left or shift-right rolls; plus and minus zoom; Home resets.',
  });
  Object.assign(svg.style, {
    display: 'block', width: '100%', height: 'auto', touchAction: 'none',
    cursor: 'grab', userSelect: 'none', outlineOffset: '-3px',
  });
  const title = svgNode('title');
  title.textContent = 'Movement gem: measured passes on fixed translation and yaw axes';
  svg.appendChild(title);
  const drawing = svgNode('g');
  svg.appendChild(drawing);
  const axisLayer = svgNode('g', { 'aria-label': 'Align gem view' });
  const axisLinks = svgNode('g', { 'aria-hidden': 'true' });
  axisLayer.appendChild(axisLinks);
  svg.appendChild(axisLayer);
  frame.appendChild(svg);

  const empty = element('div', 'policy-gem-empty', 'Run the gauntlet to map motion');
  Object.assign(empty.style, {
    margin: '8px 16px',
    textAlign: 'center', pointerEvents: 'none', fontSize: '13px', fontWeight: '600',
    color: 'var(--gem-muted, #60756c)',
  });
  wrapper.appendChild(frame);
  wrapper.appendChild(empty);

  const viewStatus = element('div', 'policy-gem-view-status', 'Overview');
  viewStatus.setAttribute('aria-live', 'polite');
  Object.assign(viewStatus.style, { fontSize: '13px', fontWeight: '600', flex: '1 1 auto' });

  const toolbar = element('div', 'policy-gem-toolbar');
  Object.assign(toolbar.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '10px' });
  toolbar.appendChild(viewStatus);
  function button(label, text, handler) {
    const node = element('button', 'policy-gem-button', text);
    node.type = 'button';
    node.setAttribute('aria-label', label);
    node.title = label;
    Object.assign(node.style, {
      font: 'inherit', fontSize: '12px', minWidth: '32px', minHeight: '32px',
      padding: '4px 9px', cursor: 'pointer', borderRadius: '8px',
      color: 'inherit', border: '1px solid var(--gem-border, #e0e9e4)',
      background: 'var(--gem-control-background, #fff)',
    });
    node.addEventListener('click', handler);
    toolbar.appendChild(node);
    return node;
  }
  button('Zoom out', '−', () => zoomBy(1 / 1.18));
  button('Zoom in', '+', () => zoomBy(1.18));
  button('Reset gem view', 'Reset', reset);
  wrapper.appendChild(toolbar);
  const inspection = element('details', 'policy-gem-inspect');
  const inspectionSummary = element('summary', '', 'Measurements');
  Object.assign(inspectionSummary.style, { cursor: 'pointer', fontSize: '12px', padding: '5px 0' });
  inspection.appendChild(inspectionSummary);
  wrapper.appendChild(inspection);
  const legend = element('p', 'policy-gem-legend', 'Dots: measured passes. Faces: untested interpolation. Grid: 3 m/s · 2 rad/s.');
  Object.assign(legend.style, { margin: '8px 0 10px', fontSize: '11px', lineHeight: '1.6', color: 'var(--gem-muted, #60756c)' });
  inspection.appendChild(legend);
  const hint = element('p', 'policy-gem-hint', 'Drag to rotate · Scroll/pinch to zoom · Shift/right-drag to roll · Click an axis to align');
  Object.assign(hint.style, { fontSize: '11px', color: 'var(--gem-muted, #60756c)', lineHeight: '1.6' });
  inspection.appendChild(hint);

  const pickerLabel = element('label', 'policy-gem-picker-label');
  Object.assign(pickerLabel.style, { display: 'block', fontSize: '11px', color: 'var(--gem-muted, #60756c)' });
  pickerLabel.appendChild(element('span', '', 'Observation'));
  const picker = element('select', 'policy-gem-picker');
  Object.assign(picker.style, {
    display: 'block', boxSizing: 'border-box', width: '100%', minHeight: '35px',
    font: 'inherit', fontSize: '12px', marginTop: '5px', padding: '6px 9px',
    borderRadius: '8px', border: '1px solid var(--gem-border, #e0e9e4)',
    color: 'var(--gem-text, #243832)', background: 'var(--gem-control-background, #fff)',
  });
  pickerLabel.appendChild(picker);
  inspection.appendChild(pickerLabel);
  const readout = element('div', 'policy-gem-readout');
  readout.setAttribute('aria-live', 'polite');
  readout.setAttribute('aria-atomic', 'true');
  Object.assign(readout.style, { minHeight: '43px', paddingTop: '8px', fontSize: '12px', lineHeight: '1.6' });
  inspection.appendChild(readout);
  container.appendChild(wrapper);

  let measured = [];
  let orientation = initialOrientation();
  let activeView = 'overview';
  let zoom = 1;
  let projectionRadius = RADIUS;
  let selectedIndex = -1;
  let hoverIndex = -1;
  let projected = [];
  let measuredHull = [];
  let pendingFrame = null;
  let destroyed = false;
  let pointerTravel = 0;
  let draggedWithMultiplePointers = false;
  const pointers = new Map();
  const listeners = [];
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(queueDraw);
  resizeObserver?.observe(frame);

  function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    listeners.push(() => node.removeEventListener(event, handler, options));
  }

  function initialOrientation() {
    return multiply(axisAngle([0, 0, 1], -0.25), axisAngle([1, 0, 0], -0.95));
  }

  function alignView(view) {
    if (view.id === 'yaw-ccw') orientation = [0, 0, 0, 1];
    else if (view.id === 'yaw-cw') orientation = axisAngle([0, 1, 0], Math.PI);
    else {
      // Look from the named direction toward the origin, keeping +yaw up.
      // The front view therefore puts the robot's right on the screen's left.
      const azimuth = Math.atan2(view.vector[0], view.vector[1]);
      orientation = unit(multiply(axisAngle([0, 0, 1], Math.PI),
        multiply(axisAngle([1, 0, 0], Math.PI / 2), axisAngle([0, 0, 1], azimuth))));
    }
    activeView = view.id;
    hoverIndex = -1;
    showReadout(selectedIndex, false);
    queueDraw();
  }

  // Persistent controls keep keyboard focus while geometry is redrawn.
  const axisButtons = VIEWS.map(view => {
    const group = svgNode('g', {
      class: 'policy-gem-axis-button', role: 'button', tabindex: '0', 'data-view': view.id,
      'aria-label': view.name || `${view.label}: align view from this direction`, 'aria-pressed': 'false',
    });
    Object.assign(group.style, { cursor: 'pointer', outline: 'none' });
    const connector = svgNode('line', { 'aria-hidden': 'true', 'pointer-events': 'none' });
    const hit = svgNode('rect', { class: 'policy-gem-axis-hit', 'aria-hidden': 'true', fill: 'transparent', stroke: 'none', 'pointer-events': 'all' });
    const box = svgNode('rect', { class: 'policy-gem-axis-badge', 'aria-hidden': 'true', 'pointer-events': 'none' });
    const text = svgNode('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'aria-hidden': 'true', 'pointer-events': 'none' });
    const title = svgNode('title'); title.textContent = view.name || `${view.label} view`;
    group.appendChild(hit); group.appendChild(box); group.appendChild(text); group.appendChild(title);
    axisLinks.appendChild(connector); axisLayer.appendChild(group);
    const stopPointer = event => event.stopPropagation();
    listen(group, 'pointerdown', event => { event.stopPropagation(); group.focus({ preventScroll: true }); });
    listen(group, 'pointerup', stopPointer);
    listen(group, 'pointermove', stopPointer);
    listen(group, 'click', event => { event.preventDefault(); event.stopPropagation(); alignView(view); });
    listen(group, 'keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat) alignView(view);
    });
    listen(group, 'focus', () => { group.setAttribute('data-focused', 'true'); queueDraw(); });
    listen(group, 'blur', () => { group.setAttribute('data-focused', 'false'); queueDraw(); });
    return { view, group, connector, hit, box, text };
  });

  function drawViewLabels(labelScale, shortLabels, faces) {
    const font = 10 * labelScale, height = 32 * labelScale;
    const badgeHeight = 20 * labelScale;
    const layout = axisButtons.map(button => {
      const endpoint = project(button.view.vector);
      const label = shortLabels ? button.view.short || button.view.label : button.view.label;
      const badgeWidth = label.length * font * 0.62 + 8 * labelScale;
      let x = endpoint[0], y = endpoint[1];
      if (button.view.vector[2]) {
        // Yaw badges float above/below their own poles, never both upward.
        y -= button.view.vector[2] * (badgeHeight / 2 + 18 * labelScale);
      } else {
        // Keep a readable gap beyond each radial point. Ease the offset to zero
        // near view poles so crossing the center never flips a tag abruptly.
        const dx = x - CENTER[0], dy = y - CENTER[1];
        const length = Math.max(Math.hypot(dx, dy), projectionRadius * zoom * 0.4);
        const ux = dx / length, uy = dy / length;
        const offset = 20 * labelScale + Math.abs(ux) * badgeWidth / 2 + Math.abs(uy) * badgeHeight / 2;
        x += ux * offset; y += uy * offset;
      }
      return { ...button, endpoint, label, badgeWidth, depth: endpoint[2], width: Math.max(32 * labelScale, badgeWidth),
        height, x, y };
    });
    const overlaps = (a, b) => Math.abs(a.x - b.x) < (a.badgeWidth + b.badgeWidth) / 2
      && Math.abs(a.y - b.y) < badgeHeight;
    const alignedDirection = VIEWS.find(view => view.id === activeView)?.vector;
    const visible = [];
    // Only visible badges and measured surfaces occlude tags. The reference
    // cage, anchor points and invisible touch padding must not hide them.
    for (const item of [...layout].sort((a, b) => b.depth - a.depth)) {
      // An aligned view labels only axes in its viewing plane. Filter before
      // overlap checks so oblique directions cannot cover the side-axis tags.
      const inViewPlane = !alignedDirection || Math.abs(item.view.vector.reduce(
        (dot, value, axis) => dot + value * alignedDirection[axis], 0)) < 1e-6;
      item.visible = inViewPlane
        && !occluded([item.x, item.y, item.depth], faces)
        && !visible.some(other => other.depth > item.depth + 1e-4 && overlaps(item, other));
      if (item.visible) visible.push(item);
    }
    for (const item of layout) {
      // Move focus before display:none lets the browser drop it to the page.
      if (!item.visible && document.activeElement === item.group) svg.focus({ preventScroll: true });
      item.group.setAttribute('display', item.visible ? 'inline' : 'none');
      item.connector.setAttribute('display', item.visible ? 'inline' : 'none');
      item.group.setAttribute('aria-hidden', String(!item.visible));
      item.group.setAttribute('tabindex', item.visible ? '0' : '-1');
      const pressed = activeView === item.view.id;
      const focused = item.group.getAttribute('data-focused') === 'true';
      item.group.setAttribute('aria-pressed', String(pressed));
      item.group.setAttribute('transform', `translate(${item.x} ${item.y})`);
      // Keep generous invisible click targets around compact visible labels.
      for (const [key, value] of Object.entries({ x: -item.width / 2, y: -height / 2, width: item.width, height })) item.hit.setAttribute(key, value);
      for (const [key, value] of Object.entries({ x: -item.badgeWidth / 2, y: -badgeHeight / 2, width: item.badgeWidth, height: badgeHeight, rx: 3 * labelScale,
        fill: pressed ? 'var(--gem-selected, #bb6a33)' : 'var(--gem-background, #f4f8f6)', 'fill-opacity': pressed ? '1' : '0.94',
        stroke: focused || pressed ? 'var(--gem-selected, #bb6a33)' : 'var(--gem-grid, #aabdb3)', 'stroke-width': (focused ? 2.5 : 1) * labelScale })) item.box.setAttribute(key, value);
      for (const [key, value] of Object.entries({ x: 0, y: 0, 'font-size': font, 'font-weight': pressed ? '600' : '500',
        fill: pressed ? 'var(--gem-active-text, #fff)' : 'var(--gem-text, #243832)' })) item.text.setAttribute(key, value);
      item.text.textContent = item.label;
      for (const [key, value] of Object.entries({ x1: item.endpoint[0], y1: item.endpoint[1], x2: item.x, y2: item.y,
        stroke: 'var(--gem-grid, #aabdb3)', 'stroke-opacity': '0.65', 'stroke-width': labelScale })) item.connector.setAttribute(key, value);
    }
    const name = activeView === 'overview' ? 'Overview' : VIEWS.find(view => view.id === activeView)?.label || 'Free orbit';
    const status = name;
    if (viewStatus.textContent !== status) viewStatus.textContent = status;
  }

  function project(value) {
    const [x, y, z] = rotate(orientation, value);
    return [CENTER[0] + x * projectionRadius * zoom, CENTER[1] - y * projectionRadius * zoom, z];
  }

  function coordinate(velocity) {
    return [-velocity[1] / SCALE.translation, velocity[0] / SCALE.translation, velocity[2] / SCALE.yaw];
  }

  function queueDraw() {
    if (pendingFrame !== null || destroyed) return;
    pendingFrame = requestAnimationFrame(() => { pendingFrame = null; draw(); });
  }

  function line(a, b, attrs = {}) {
    return svgNode('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs });
  }

  function draw() {
    const fragment = document.createDocumentFragment();
    const displayWidth = svg.getBoundingClientRect?.().width || WIDTH;
    const labelScale = Math.max(1, WIDTH / displayWidth);
    // Reserve label room at the default zoom on small screens. This depends
    // only on frame size, so orbiting never changes the scale or moves anchors.
    projectionRadius = Math.min(RADIUS, Math.max(40, Math.min(CENTER[1], HEIGHT - CENTER[1]) - 44 * labelScale));
    const shortLabels = displayWidth < 440;
    const equator = Array.from({ length: 8 }, (_, i) => [Math.sin(i * TAU / 8), Math.cos(i * TAU / 8), 0]);
    const north = project([0, 0, 1]);
    const south = project([0, 0, -1]);
    const ring = equator.map(project);
    const origin = project([0, 0, 0]);
    const facets = [];
    ring.forEach((point, i) => {
      const next = ring[(i + 1) % ring.length];
      for (const pole of [north, south]) {
        facets.push({ points: [point, next, pole], depth: (point[2] + next[2] + pole[2]) / 3, upper: pole === north });
      }
    });
    facets.sort((a, b) => a.depth - b.depth).forEach(face => {
      fragment.appendChild(svgNode('polygon', {
        points: face.points.map(point => `${point[0]},${point[1]}`).join(' '),
        fill: face.upper ? 'var(--gem-facet-top, #a7d8c5)' : 'var(--gem-facet-bottom, #b7c8e1)',
        'fill-opacity': face.depth > 0 ? '0.09' : '0.04',
        stroke: 'var(--gem-grid, #aabdb3)', 'stroke-opacity': '0.42',
        'stroke-width': '0.8', 'stroke-dasharray': '3 5',
      }));
    });
    fragment.appendChild(svgNode('polygon', {
      points: equator.map(v => project(v.map(n => n * 0.5))).map(p => `${p[0]},${p[1]}`).join(' '),
      fill: 'none', stroke: 'var(--gem-grid, #aabdb3)', 'stroke-opacity': '0.3', 'stroke-dasharray': '2 5',
    }));
    for (const direction of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      fragment.appendChild(line(project(direction.map(v => -v)), project(direction), {
        stroke: 'var(--gem-grid, #aabdb3)', 'stroke-width': '1', 'stroke-opacity': '0.6',
      }));
    }
    const measuredFaces = measuredHull.map(vertices => {
      const projectedFace = vertices.map(project);
      return { projectedFace, depth: projectedFace.reduce((sum, p) => sum + p[2], 0) / 3 };
    }).sort((a, b) => a.depth - b.depth);
    measuredFaces.forEach(({ projectedFace, depth }) => {
      fragment.appendChild(svgNode('polygon', {
        'data-measured-facet': 'true',
        points: projectedFace.map(p => `${p[0]},${p[1]}`).join(' '),
        fill: depth < 0 ? 'var(--gem-measured-back, #4eafa0)' : 'var(--gem-measured-front, #16866e)',
        'fill-opacity': depth < 0 ? '0.12' : '0.24',
        stroke: 'var(--gem-point, #25886a)', 'stroke-opacity': '0.4', 'stroke-width': '0.9',
      }));
    });
    fragment.appendChild(svgNode('circle', { cx: origin[0], cy: origin[1], r: '2.5', fill: 'var(--gem-grid, #aabdb3)' }));
    projected = measured.map((point, index) => ({ point, index, position: project(coordinate(actualFor(point))) }));
    projected.sort((a, b) => a.position[2] - b.position[2]);
    for (const { index, position: p } of projected) {
      const active = index === (hoverIndex >= 0 ? hoverIndex : selectedIndex);
      fragment.appendChild(line(origin, p, {
        stroke: active ? 'var(--gem-selected, #bb6a33)' : 'var(--gem-point, #25886a)',
        'stroke-width': active ? '1.7' : '0.8', 'stroke-opacity': active ? '0.65' : '0.12',
      }));
      if (active) fragment.appendChild(svgNode('circle', {
        cx: p[0], cy: p[1], r: '10', fill: 'var(--gem-selected, #bb6a33)', 'fill-opacity': '0.12',
      }));
      const dot = svgNode('circle', {
        cx: p[0], cy: p[1], r: active ? '5.5' : '4.2',
        fill: active ? 'var(--gem-selected, #bb6a33)' : 'var(--gem-point, #25886a)',
        'fill-opacity': p[2] < 0 && !active ? '0.62' : '1', stroke: '#fff', 'stroke-width': '1.4',
      });
      const description = svgNode('title');
      description.textContent = describe(measured[index]);
      dot.appendChild(description);
      fragment.appendChild(dot);
    }
    drawing.replaceChildren(fragment);
    drawViewLabels(labelScale, shortLabels, measuredFaces.map(face => face.projectedFace));
  }

  function describe(point) {
    const actual = actualFor(point);
    return `${point.label || point.id || 'Observation'}: forward ${format(actual[0])} m/s, left ${format(actual[1])} m/s, yaw ${format(actual[2])} rad/s`;
  }

  function showReadout(index, announce = true) {
    // Hover is visually inspectable without flooding assistive technology.
    readout.setAttribute('aria-live', announce ? 'polite' : 'off');
    const point = measured[index];
    if (!point) {
      readout.textContent = measured.length ? 'Select a dot or observation.' : 'No passed observations yet.';
      return;
    }
    const heading = element('strong', '', point.label || point.id || 'Observation');
    heading.style.display = 'block';
    const actual = actualFor(point);
    const summary = element('span', '', `Actual · fwd ${format(actual[0])} m/s · left ${format(actual[1])} m/s · yaw ${format(actual[2])} rad/s`);
    const children = [heading, summary];
    if (Array.isArray(point.command) && point.command.length === 3 && point.command.every(Number.isFinite)) {
      const command = element('span', '', `Target · fwd ${format(point.command[0])} m/s · left ${format(point.command[1])} m/s · yaw ${format(point.command[2])} rad/s`);
      Object.assign(command.style, { display: 'block', color: 'var(--gem-muted, #60756c)', fontSize: '11px' });
      children.push(command);
    }
    readout.replaceChildren(...children);
  }

  function select(index) {
    selectedIndex = index;
    hoverIndex = -1;
    picker.value = index < 0 ? '' : String(index);
    showReadout(index);
    queueDraw();
    if (index >= 0 && typeof onSelect === 'function') onSelect(measured[index]);
  }

  function setPoints(nextPoints) {
    const selectedId = measured[selectedIndex]?.id;
    measured = (Array.isArray(nextPoints) ? nextPoints : []).filter(point => point?.passed === true && actualFor(point));
    measuredHull = measuredFacets(measured.map(point => coordinate(actualFor(point))));
    selectedIndex = selectedId === undefined ? -1 : measured.findIndex(point => point.id === selectedId);
    hoverIndex = -1;
    const blank = element('option', '', measured.length ? `${measured.length} passes · select one` : 'Awaiting evaluation');
    blank.value = '';
    picker.replaceChildren(blank);
    measured.forEach((point, index) => {
      const option = element('option', '', point.label || point.id || describe(point));
      option.value = String(index);
      picker.appendChild(option);
    });
    picker.value = selectedIndex < 0 ? '' : String(selectedIndex);
    picker.disabled = measured.length === 0;
    empty.hidden = measured.length !== 0;
    showReadout(selectedIndex, false);
    queueDraw();
  }

  function localPoint(event) {
    const matrix = svg.getScreenCTM();
    if (matrix) {
      const p = svg.createSVGPoint();
      p.x = event.clientX;
      p.y = event.clientY;
      const local = p.matrixTransform(matrix.inverse());
      return [local.x, local.y];
    }
    const rect = svg.getBoundingClientRect();
    return [(event.clientX - rect.left) * WIDTH / rect.width, (event.clientY - rect.top) * HEIGHT / rect.height];
  }

  function trackball(position) {
    const x = (position[0] - CENTER[0]) / RADIUS;
    const y = (CENTER[1] - position[1]) / RADIUS;
    const distance = x * x + y * y;
    // A hyperbolic continuation keeps rotation smooth outside the sphere.
    const z = distance <= 0.5 ? Math.sqrt(1 - distance) : 0.5 / Math.sqrt(distance);
    return unit([x, y, z]);
  }

  function zoomBy(factor) {
    zoom = Math.max(0.35, Math.min(3.5, zoom * factor));
    queueDraw();
  }

  function reset() {
    orientation = initialOrientation();
    activeView = 'overview';
    zoom = 1;
    queueDraw();
  }

  function hitTest(position) {
    let nearest = -1;
    let distance = 15;
    for (const point of projected) {
      const d = Math.hypot(position[0] - point.position[0], position[1] - point.position[1]);
      if (d <= distance) { nearest = point.index; distance = d; }
    }
    return nearest;
  }

  listen(picker, 'change', () => select(picker.value === '' ? -1 : Number(picker.value)));
  listen(svg, 'pointerdown', event => {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    svg.focus({ preventScroll: true });
    svg.setPointerCapture(event.pointerId);
    if (!pointers.size) { pointerTravel = 0; draggedWithMultiplePointers = false; }
    pointers.set(event.pointerId, { position: localPoint(event), roll: event.button === 2 || event.shiftKey });
    if (pointers.size > 1) draggedWithMultiplePointers = true;
    svg.style.cursor = 'grabbing';
  });
  listen(svg, 'pointermove', event => {
    const position = localPoint(event);
    if (!pointers.has(event.pointerId)) {
      const index = hitTest(position);
      if (hoverIndex !== index) {
        hoverIndex = index;
        showReadout(index >= 0 ? index : selectedIndex, false);
        queueDraw();
      }
      svg.style.cursor = index >= 0 ? 'pointer' : 'grab';
      return;
    }
    event.preventDefault();
    const previous = pointers.get(event.pointerId);
    pointerTravel += Math.hypot(position[0] - previous.position[0], position[1] - previous.position[1]);
    if (pointers.size > 1) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1].position;
      const before = [previous.position[0] - other[0], previous.position[1] - other[1]];
      const after = [position[0] - other[0], position[1] - other[1]];
      if (Math.hypot(...before) > 2 && Math.hypot(...after) > 2) {
        zoomBy(Math.hypot(...after) / Math.hypot(...before));
        orientation = unit(multiply(axisAngle([0, 0, 1], Math.atan2(before[1], before[0]) - Math.atan2(after[1], after[0])), orientation));
      }
    } else if (previous.roll || event.shiftKey) {
      orientation = unit(multiply(axisAngle([0, 0, 1], (position[0] - previous.position[0]) * 0.012), orientation));
    } else {
      orientation = unit(multiply(between(trackball(previous.position), trackball(position)), orientation));
    }
    pointers.set(event.pointerId, { ...previous, position });
    activeView = null;
    hoverIndex = -1;
    queueDraw();
  });
  function releasePointer(event) {
    if (!pointers.has(event.pointerId)) return;
    const canSelect = event.type === 'pointerup' && pointers.size === 1 && pointerTravel < 5 && !draggedWithMultiplePointers && event.button === 0;
    pointers.delete(event.pointerId);
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (canSelect) select(hitTest(localPoint(event)));
    if (!pointers.size) {
      svg.style.cursor = 'grab';
      showReadout(selectedIndex, false);
    }
  }
  listen(svg, 'pointerup', releasePointer);
  listen(svg, 'pointercancel', releasePointer);
  listen(svg, 'lostpointercapture', releasePointer);
  listen(svg, 'pointerleave', () => {
    if (pointers.size) return;
    hoverIndex = -1;
    showReadout(selectedIndex, false);
    queueDraw();
  });
  listen(svg, 'contextmenu', event => event.preventDefault());
  listen(svg, 'wheel', event => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? HEIGHT : 1);
    zoomBy(Math.exp(-delta * 0.0018));
  }, { passive: false });
  listen(svg, 'keydown', event => {
    const step = Math.PI / 18;
    const rotations = {
      ArrowLeft: [event.shiftKey ? [0, 0, 1] : [0, 1, 0], -step],
      ArrowRight: [event.shiftKey ? [0, 0, 1] : [0, 1, 0], step],
      ArrowUp: [[1, 0, 0], -step], ArrowDown: [[1, 0, 0], step],
    };
    if (rotations[event.key]) {
      event.preventDefault();
      orientation = unit(multiply(axisAngle(...rotations[event.key]), orientation));
      activeView = null;
      queueDraw();
    } else if (['+', '=', '-', '_', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') reset();
      else zoomBy(event.key === '+' || event.key === '=' ? 1.15 : 1 / 1.15);
    }
  });
  setPoints(points);
  return {
    setPoints,
    destroy() {
      destroyed = true;
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      resizeObserver?.disconnect();
      for (const dispose of listeners) dispose();
      pointers.clear();
      wrapper.remove();
    },
  };
}
