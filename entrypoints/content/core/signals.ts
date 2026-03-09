import { RECONCILE_CONFIG } from './config';

export interface SignalHandle {
  dispose: () => void;
}

export function bindReconcileSignals(reconcile: () => void): SignalHandle {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      reconcile();
    }, RECONCILE_CONFIG.debounceMs);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      if (mutation.addedNodes.length === 0 && mutation.removedNodes.length === 0) continue;

      schedule();
      return;
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const onTurboLoad = () => schedule();
  const onTurboRender = () => schedule();
  const onPopState = () => schedule();
  const onPageShow = () => schedule();
  const onHashChange = () => schedule();
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      schedule();
    }
  };

  document.addEventListener('turbo:load', onTurboLoad);
  document.addEventListener('turbo:render', onTurboRender);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('hashchange', onHashChange);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    dispose: () => {
      observer.disconnect();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      document.removeEventListener('turbo:load', onTurboLoad);
      document.removeEventListener('turbo:render', onTurboRender);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
