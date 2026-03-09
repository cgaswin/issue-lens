import { findButtonAnchor } from './anchor';
import { RECONCILE_CONFIG } from './config';
import { ensureButtonMounted, isButtonMounted } from './mountButton';
import { createPanelMountHandle, PanelMountHandle } from './mountPanel';
import { bindReconcileSignals, SignalHandle } from './signals';

interface Controller {
  start: () => Promise<void>;
  dispose: () => void;
}

let activeController: Controller | null = null;

function isIssuesRoute(): boolean {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts.length >= 3 && parts[2] === 'issues';
}

export function createIssueLensController(ctx: any): Controller {
  let disposed = false;
  let panel: PanelMountHandle | null = null;
  let signals: SignalHandle | null = null;
  let fastRetryTimer: ReturnType<typeof setInterval> | null = null;
  let steadyRetryTimer: ReturnType<typeof setInterval> | null = null;
  let fastRetryStopTimer: ReturnType<typeof setTimeout> | null = null;

  const openPanel = () => {
    window.dispatchEvent(new CustomEvent('issue-lens:open-panel'));
  };

  const reconcile = () => {
    if (disposed) return;
    if (!isIssuesRoute()) {
      document.querySelector('[data-issue-lens="filter-button"]')?.remove();
      return;
    }

    const anchor = findButtonAnchor();
    if (!anchor) return;

    const mounted = ensureButtonMounted(anchor, openPanel);
    if (mounted && anchor.strategy !== 'body-fallback') {
      document.querySelector('[data-issue-lens="fallback-anchor"]')?.remove();
    }
  };

  const stopTimers = () => {
    if (fastRetryTimer) {
      clearInterval(fastRetryTimer);
      fastRetryTimer = null;
    }
    if (steadyRetryTimer) {
      clearInterval(steadyRetryTimer);
      steadyRetryTimer = null;
    }
    if (fastRetryStopTimer) {
      clearTimeout(fastRetryStopTimer);
      fastRetryStopTimer = null;
    }
  };

  const startRetryLoops = () => {
    fastRetryTimer = setInterval(() => {
      reconcile();
      if (isButtonMounted()) {
        if (fastRetryTimer) {
          clearInterval(fastRetryTimer);
          fastRetryTimer = null;
        }
      }
    }, RECONCILE_CONFIG.fastRetryIntervalMs);

    fastRetryStopTimer = setTimeout(() => {
      if (fastRetryTimer) {
        clearInterval(fastRetryTimer);
        fastRetryTimer = null;
      }
    }, RECONCILE_CONFIG.fastRetryDurationMs);

    steadyRetryTimer = setInterval(() => {
      reconcile();
    }, RECONCILE_CONFIG.steadyRetryIntervalMs);
  };

  return {
    start: async () => {
      panel = await createPanelMountHandle(ctx);
      panel.mount();

      setTimeout(reconcile, 50);
      setTimeout(reconcile, 250);
      setTimeout(reconcile, 750);
      reconcile();
      startRetryLoops();
      signals = bindReconcileSignals(reconcile);
    },
    dispose: () => {
      disposed = true;
      stopTimers();
      signals?.dispose();
      signals = null;
      panel?.remove();
      panel = null;
    },
  };
}

export function getOrCreateIssueLensController(ctx: any): Controller {
  if (!activeController) {
    activeController = createIssueLensController(ctx);
  }

  return {
    start: () => activeController!.start(),
    dispose: () => {
      activeController?.dispose();
      activeController = null;
    },
  };
}
