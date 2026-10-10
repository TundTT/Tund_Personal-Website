// A single framed evaluation reports only to its same-origin gallery parent.
// Standalone detail pages do not install this bridge.
export function createBatchWorker(slug) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('batch');
  if (!token || window.parent === window || window.location.origin === 'null') return null;
  const origin = window.location.origin;
  const parent = window.parent;
  let lastProgress = -Infinity;
  const worker = {
    paused: false, cancelled: false, finished: false, started: false,
    pace: ['1', '4', '8', 'max'].includes(params.get('pace')) ? params.get('pace') : null,
    post(type, payload = {}) {
      parent.postMessage({ ...payload, channel: 'gallery-batch', token, slug, type }, origin);
    },
    progress(snapshot = {}) {
      if (this.cancelled || this.finished || performance.now() - lastProgress < 100) return;
      lastProgress = performance.now();
      this.post('progress', { progress: snapshot.progress ?? 0,
        label: snapshot.current ? `${snapshot.current.label} · ${snapshot.current.phase}` : snapshot.label || (snapshot.progress === 1 ? 'Saving scorecard…' : 'Loading native package…'),
        completed: snapshot.completed ?? 0, total: snapshot.total ?? 0, paused: this.paused });
    },
    complete(result, saved) {
      if (this.cancelled || this.finished) return;
      if (result.status !== 'complete' || result.suite !== 'full') {
        this.fail('The batch evaluation did not produce a complete scorecard.');
        return;
      }
      if (!saved?.local && !saved?.server) {
        this.fail(`Could not save the completed scorecard: ${saved?.error || 'No result storage is available.'}`, { result, saved });
        return;
      }
      this.post('complete', { result, saved });
      this.finished = true;
    },
    fail(error, payload = {}) {
      if (this.cancelled || this.finished) return;
      this.post('error', { ...payload, error: String(error?.message || error || 'Evaluation failed.') });
      this.finished = true;
    },
  };
  window.addEventListener('message', event => {
    const message = event.data;
    if (event.source !== parent || event.origin !== origin || !message ||
      message.channel !== 'gallery-batch' || message.token !== token || worker.cancelled || worker.finished) return;
    if (message.type === 'pause' && typeof message.paused === 'boolean') {
      worker.paused = message.paused;
      worker.onPause?.(message.paused);
    } else if (message.type === 'cancel') {
      worker.cancelled = true;
      worker.onCancel?.();
    }
  });
  window.addEventListener('error', event => worker.fail(event.error || event.message));
  window.addEventListener('unhandledrejection', event => worker.fail(event.reason));
  document.body.classList.add('batch-embedded');
  worker.progress();
  return worker;
}
