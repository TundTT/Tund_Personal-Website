// Directional stopping travel in meters. Missing probes never become zero.
import { getStoppingSample } from './stopping-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DIRECTIONS = [
  ['forward', 'Forward'], ['forward-right', 'Forward right'],
  ['right', 'Right'], ['backward-right', 'Back right'],
  ['backward', 'Backward'], ['backward-left', 'Back left'],
  ['left', 'Left'], ['forward-left', 'Forward left'],
];
const SPEEDS = [0.5, 1, 2];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function shape(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs || {})) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
function number(value) { return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); }
function isMeasured(stop) {
  return Number.isFinite(stop?.distance) && stop.distance >= 0 &&
    Number.isFinite(stop.successRate) && stop.successRate > 0 && (stop.legacy || stop.passed > 0);
}
function niceScale(value) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 0.01)));
  return [1, 2, 2.5, 5, 10].map(n => n * magnitude).find(n => n >= value) || magnitude * 10;
}

/** Create a stopping footprint. setResult accepts the gauntlet result object. */
export function createBraking(container, { speed = 1 } = {}) {
  let result = null;
  let approachSpeed = SPEEDS.includes(speed) ? speed : 1;
  let selectedDirection = null;
  let directionControls = [];
  const root = element('div', undefined, 'braking-footprint');
  const header = element('div', undefined, 'braking-heading');
  const title = element('div');
  title.append(element('h3', 'Stopping footprint'), element('p', 'Travel during the recorded stop window. Only stops that pass approach tracking and hold standstill count.'));
  const label = element('label', 'Approach speed');
  const picker = element('select');
  picker.setAttribute('aria-label', 'Stopping footprint approach speed');
  for (const value of SPEEDS) {
    const option = element('option', `${value} m/s`);
    option.value = String(value);
    picker.appendChild(option);
  }
  picker.value = String(approachSpeed);
  label.appendChild(picker);
  header.append(title, label);
  const summary = element('p', undefined, 'braking-summary');
  const criteria = element('p', undefined, 'braking-criteria');
  const figure = element('div', undefined, 'braking-figure');
  const svg = shape('svg', { viewBox: '0 0 480 380', role: 'group', 'aria-label': 'Successful stopping distances in meters, with selectable failure and untested status markers' });
  const caption = element('p', undefined, 'braking-caption');
  const readout = element('p', undefined, 'braking-readout');
  readout.setAttribute('aria-live', 'polite');
  const outcomeScroll = element('div', undefined, 'braking-outcome-scroll');
  const outcomes = element('table', undefined, 'braking-outcomes');
  outcomes.appendChild(element('caption', 'Stopping outcomes at the selected approach speed', 'sr-only'));
  const head = element('thead');
  const headers = element('tr');
  for (const text of ['Direction', 'Successful stop', 'Outcome']) {
    const cell = element('th', text); cell.setAttribute('scope', 'col'); headers.appendChild(cell);
  }
  head.appendChild(headers);
  const rows = element('tbody');
  outcomes.append(head, rows);
  outcomeScroll.appendChild(outcomes);
  figure.append(svg, caption);
  root.append(header, summary, criteria, figure, readout, outcomeScroll);
  container.appendChild(root);

  function samples(speed = approachSpeed) {
    return DIRECTIONS.map(([id, text]) => {
      const stop = getStoppingSample(result, id, speed);
      return { id, text, stop, measured: isMeasured(stop) };
    });
  }
  function failures(sample) {
    return (sample.stop.failures || []).map(failure => `${failure.label}${failure.count > 0 ? ` (${failure.count})` : ''}`).join('; ');
  }
  function rate(sample) {
    const stop = sample.stop;
    if (!stop.tested) return 'Not tested';
    const percent = Number.isFinite(stop.successRate) ? ` (${Math.round(stop.successRate * 100)}%)` : '';
    if (Number.isFinite(stop.total) && stop.total > 0 && Number.isFinite(stop.passed)) return `${stop.passed}/${stop.total} stops successful${percent}`;
    return Number.isFinite(stop.successRate) ? `${Math.round(stop.successRate * 100)}% successful stops · legacy summary` : 'Outcome details unavailable';
  }
  function describe(sample) {
    const prefix = `${sample.text} at ${approachSpeed} m/s: `;
    if (!sample.stop.tested) return `${prefix}not tested. No stopping distance is available.`;
    const failureText = failures(sample);
    if (!sample.measured) return `${prefix}${rate(sample)}. ${failureText ? `${failureText}. ` : ''}No successful stopping distance.`;
    const worst = !sample.stop.legacy && Number.isFinite(sample.stop.worstDistance)
      ? ` Worst successful stop: ${number(sample.stop.worstDistance)} m.`
      : sample.stop.legacy ? ' Worst successful stop is unavailable in this legacy summary.' : '';
    return `${prefix}${number(sample.stop.distance)} m mean successful stopping travel during the recorded stop window.${worst} ${rate(sample)}.${failureText ? ` ${failureText}.` : ''}`;
  }
  function select(sample) {
    selectedDirection = sample.id;
    readout.textContent = describe(sample);
    for (const { control, id } of directionControls) control.setAttribute('aria-pressed', String(id === selectedDirection));
  }
  function makeSelectable(control, sample) {
    control.setAttribute('aria-label', describe(sample));
    control.setAttribute('aria-pressed', String(sample.id === selectedDirection));
    control.addEventListener('click', () => select(sample));
    control.addEventListener('focus', () => select(sample));
    // Native HTML buttons handle Enter and Space themselves.
    if (control.tagName?.toLowerCase() !== 'button') {
      control.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(sample); }
      });
    }
    directionControls.push({ control, id: sample.id });
    return control;
  }
  function outcomeRows(data) {
    rows.replaceChildren();
    for (const sample of data) {
      const state = !sample.stop.tested ? 'untested' : !sample.measured ? 'failed' : sample.stop.successRate < 1 ? 'partial' : 'passed';
      const row = element('tr', undefined, `is-${state}`);
      row.setAttribute('data-stopping-outcome', sample.id);
      const direction = element('th'); direction.setAttribute('scope', 'row');
      const button = element('button', sample.text, 'braking-direction-button'); button.type = 'button';
      direction.appendChild(makeSelectable(button, sample));
      const distance = element('td', undefined, 'braking-outcome-distance');
      distance.append(element('strong', sample.measured ? `${number(sample.stop.distance)} m` : '—'));
      distance.append(element('span', sample.measured ? 'Mean successful window travel' : sample.stop.tested ? 'No successful stop' : 'Not tested', 'braking-outcome-reason'));
      const outcome = element('td');
      outcome.append(element('strong', rate(sample), 'braking-outcome-status'));
      const reason = failures(sample) || (sample.stop.legacy ? 'Detailed outcomes unavailable in legacy summary' : sample.measured ? 'Passed approach tracking and held standstill' : sample.stop.tested ? 'No valid successful measurement' : 'No attempt recorded');
      outcome.append(element('span', reason, 'braking-outcome-reason'));
      row.append(direction, distance, outcome);
      rows.appendChild(row);
    }
  }
  function draw() {
    const limits = result?.protocol?.thresholds || { stopLinear: 0.08, stopYaw: 0.12, holdSeconds: 0.75 };
    criteria.textContent = `Hold check: raw planar speed ≤ ${limits.stopLinear} m/s AND raw yaw speed ≤ ${limits.stopYaw} rad/s for the final ${limits.holdSeconds} s of the stop window. Staying upright is not enough: a robot that stops traveling can still fail because of rotation or yaw oscillation. FALL is reported separately.`;
    const data = samples();
    const allMeasured = data.every(point => point.measured);
    const measuredCount = data.filter(point => point.measured).length;
    const allDistances = SPEEDS.flatMap(speed => samples(speed).filter(sample => sample.measured).map(sample => sample.stop.distance));
    // Scale remains unchanged when switching speeds for a given result.
    const extent = allDistances.length ? niceScale(Math.max(0.1, ...allDistances)) : 1;
    const pointAt = (index, radius) => [240 + Math.sin(index * Math.PI / 4) * radius, 185 - Math.cos(index * Math.PI / 4) * radius];
    directionControls = [];
    const fragment = document.createDocumentFragment();
    fragment.appendChild(shape('title', {}, `Stopping from ${approachSpeed} m/s. ${data.map(describe).join(' ')}`));
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      const tickX = 240 + Math.sin(3 * Math.PI / 8) * 118 * fraction + 4;
      const tickY = 185 - Math.cos(3 * Math.PI / 8) * 118 * fraction - 7;
      fragment.appendChild(shape('polygon', {
        points: DIRECTIONS.map((_, i) => pointAt(i, 118 * fraction).join(',')).join(' '),
        fill: 'none', stroke: 'var(--braking-grid, #718472)', 'stroke-width': '1.3', 'stroke-opacity': '0.75',
      }));
      if (fraction === 0.5 || fraction === 1) fragment.appendChild(shape('text', {
        class: 'braking-ring-label', x: tickX, y: tickY, 'font-size': '12', 'font-weight': '600', fill: 'var(--braking-label, #30462a)',
        'paint-order': 'stroke', stroke: 'var(--braking-background, #edf0d8)', 'stroke-width': '4',
      }, `${number(extent * fraction)} m`));
    }
    data.forEach((sample, index) => {
      const end = pointAt(index, 118);
      fragment.appendChild(shape('line', { x1: 240, y1: 185, x2: end[0], y2: end[1], stroke: 'var(--braking-grid, #718472)', 'stroke-width': '1', 'stroke-opacity': '0.55' }));
      const label = pointAt(index, index % 2 ? 168 : 160);
      fragment.appendChild(shape('text', { class: 'braking-axis-label', x: label[0], y: label[1] + 5, 'text-anchor': index === 2 ? 'start' : index === 6 ? 'end' : 'middle', 'font-size': '15', 'font-weight': '600', fill: 'var(--braking-label, #30462a)' }, sample.text));
    });
    const positions = data.map((sample, index) => sample.measured ? pointAt(index, 118 * sample.stop.distance / extent) : null);
    if (allMeasured) {
      fragment.appendChild(shape('polygon', {
        'data-stopping-polygon': 'true', points: positions.map(point => point.join(',')).join(' '),
        fill: 'var(--braking-pass, #176d50)', 'fill-opacity': '0.2', stroke: 'var(--braking-pass, #176d50)', 'stroke-width': '2.5',
      }));
    } else {
      for (let index = 0; index < positions.length; index++) {
        const a = positions[index], b = positions[(index + 1) % positions.length];
        if (!a || !b) continue;
        fragment.appendChild(shape('line', {
          'data-stopping-segment': 'true', x1: a[0], y1: a[1], x2: b[0], y2: b[1],
          stroke: 'var(--braking-pass, #176d50)', 'stroke-width': '2.5',
        }));
      }
    }
    data.forEach((sample, index) => {
      if (!sample.measured) {
        const point = pointAt(index, 118);
        const fell = (sample.stop.failures || []).some(failure => /fell|fall/i.test(failure.label));
        const text = !sample.stop.tested ? 'N/A' : fell ? 'FALL' : 'FAIL';
        const color = sample.stop.tested ? 'var(--braking-fail, #973b2c)' : 'var(--braking-label, #526048)';
        const marker = shape('g', { 'data-stopping-status': sample.id, tabindex: '0', role: 'button' });
        marker.appendChild(shape('title', {}, describe(sample)));
        marker.appendChild(shape('rect', { x: point[0] - 24, y: point[1] - 13, width: 48, height: 26, rx: 4, fill: 'var(--braking-background, #edf0d8)', stroke: color, 'stroke-width': '1.8', 'stroke-dasharray': sample.stop.tested ? 'none' : '4 3' }));
        marker.appendChild(shape('text', { class: 'braking-status-label', x: point[0], y: point[1] + 4, 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '700', fill: color }, text));
        fragment.appendChild(makeSelectable(marker, sample));
        return;
      }
      const point = positions[index];
      const dot = shape('circle', {
        'data-stopping-point': sample.id, cx: point[0], cy: point[1], r: 7,
        fill: sample.stop.successRate < 1 ? 'var(--braking-partial, #a75a12)' : 'var(--braking-pass, #176d50)', stroke: 'var(--braking-background, #edf0d8)', 'stroke-width': '2',
        tabindex: '0', role: 'button',
      });
      dot.appendChild(shape('title', {}, describe(sample)));
      fragment.appendChild(makeSelectable(dot, sample));
    });
    if (!measuredCount) {
      fragment.appendChild(shape('rect', { x: 150, y: 157, width: 180, height: 55, rx: 5, fill: 'var(--braking-background, #edf0d8)' }));
      fragment.appendChild(shape('text', { class: 'braking-empty-label', x: 240, y: 181, 'text-anchor': 'middle', 'font-size': '15', 'font-weight': '600', fill: 'var(--braking-label, #30462a)' }, result ? 'No stops passed' : 'Not yet measured'));
      fragment.appendChild(shape('text', { class: 'braking-empty-label', x: 240, y: 201, 'text-anchor': 'middle', 'font-size': '13', fill: 'var(--braking-label, #30462a)' }, result ? 'See outcomes below' : 'Run the gauntlet'));
    }
    svg.replaceChildren(fragment);
    const failureCounts = new Map();
    for (const sample of data) for (const failure of sample.stop.failures || []) {
      const previous = failureCounts.get(failure.label);
      failureCounts.set(failure.label, previous === null || !Number.isFinite(failure.count) ? null : (previous || 0) + failure.count);
    }
    const failureSummary = [...failureCounts].map(([label, count]) => count === null ? label : `${label}: ${count}`).join(' · ');
    const totalsKnown = data.filter(sample => sample.stop.tested).every(sample => !sample.stop.legacy && Number.isFinite(sample.stop.total));
    const total = data.reduce((sum, sample) => sum + (sample.stop.total || 0), 0);
    const passed = data.reduce((sum, sample) => sum + (sample.stop.passed || 0), 0);
    summary.textContent = `${totalsKnown && total ? `${passed}/${total} successful stops` : `${measuredCount}/8 directions with a successful stop`} at ${approachSpeed} m/s.${failureSummary ? ` ${failureSummary}.` : ''}${!result ? ' No evaluation recorded yet.' : ''}`;
    caption.textContent = `Auto scale: outer ring ${number(extent)} m. Filled dots are successful distances; amber means mixed success. FALL / FAIL / N/A markers at the rim show status, not distance.`;
    outcomeRows(data);
    const selected = data.find(sample => sample.id === selectedDirection);
    readout.textContent = selected ? describe(selected) : 'Select any marker or direction below to inspect the outcome. Smaller successful distances are better. Lines connect measured directions; intermediate directions are untested.';
  }
  function changeSpeed() { approachSpeed = Number(picker.value); draw(); }
  picker.addEventListener('change', changeSpeed);
  draw();
  return {
    setResult(nextResult) { result = nextResult || null; draw(); },
    destroy() { picker.removeEventListener('change', changeSpeed); root.remove(); },
  };
}

export function renderBraking(container, result, speed = 1) {
  const footprint = createBraking(container, { speed });
  footprint.setResult(result);
  return footprint;
}
