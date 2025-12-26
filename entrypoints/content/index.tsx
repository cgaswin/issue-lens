import './style.css';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { createRoot, Root } from 'react-dom/client';
import App from './App';

console.log('[Issue Lens] Content script loaded!');

// Create the Issue Lens button matching GitHub's button style
function createIssueLensButton(onClick: () => void): HTMLElement {
  const button = document.createElement('a');
  button.setAttribute('type', 'button');
  button.setAttribute('data-issue-lens', 'filter-button');
  button.className = 'prc-Button-ButtonBase-9n-Xk';
  button.setAttribute('data-loading', 'false');
  button.setAttribute('data-size', 'medium');
  button.setAttribute('data-variant', 'default');
  button.style.cursor = 'pointer';

  button.innerHTML = `
    <span data-component="buttonContent" data-align="center" class="prc-Button-ButtonContent-Iohp5">
      <span data-component="leadingVisual" class="prc-Button-Visual-YNt2F prc-Button-VisualWrap-E4cnq">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align: text-bottom;">
          <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
        </svg>
      </span>
      <span data-component="text" class="prc-Button-Label-FWkx3">Issue Lens</span>
    </span>
  `;

  button.addEventListener('click', (e) => {
    e.preventDefault();
    onClick();
  });

  return button;
}

// Find the buttons container and inject our button
function injectButton(onClick: () => void): boolean {
  // Remove existing button if any
  const existing = document.querySelector('[data-issue-lens="filter-button"]');
  if (existing) {
    existing.remove();
  }

  // Find the buttons container (next to Labels/Milestones)
  const buttonsContainer = document.querySelector('.SearchBarActions-module__buttons--DBEMp') ||
    document.querySelector('[class*="SearchBarActions-module__buttons"]');

  if (buttonsContainer) {
    const button = createIssueLensButton(onClick);
    // Insert before Labels button
    const labelsBtn = buttonsContainer.querySelector('a[href*="/labels"]');
    if (labelsBtn) {
      labelsBtn.before(button);
    } else {
      buttonsContainer.prepend(button);
    }
    console.log('[Issue Lens] Button injected into toolbar');
    return true;
  }

  console.log('[Issue Lens] Buttons container not found');
  return false;
}

export default defineContentScript({
  matches: ['*://github.com/*/issues', '*://github.com/*/issues?*'],
  cssInjectionMode: 'ui',
  runAt: 'document_end',

  async main(ctx) {
    console.log('[Issue Lens] Content script main() executing on:', window.location.href);

    const openPanel = () => {
      window.dispatchEvent(new CustomEvent('issue-lens:open-panel'));
    };

    // Try to inject button, retry if DOM not ready
    const tryInject = () => {
      if (!injectButton(openPanel)) {
        setTimeout(tryInject, 500);
      }
    };

    // Create shadow DOM for the panel only
    const ui = await createShadowRootUi(ctx, {
      name: 'issue-lens-panel',
      position: 'overlay',
      onMount: (container: HTMLElement) => {
        console.log('[Issue Lens] Panel shadow DOM mounted');
        const root = createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root: Root | undefined) => {
        root?.unmount();
      },
    });

    ui.mount();

    // Inject button after page is ready
    setTimeout(tryInject, 500);

    // Re-inject on GitHub's turbo navigation
    document.addEventListener('turbo:load', () => setTimeout(tryInject, 300));
    document.addEventListener('turbo:render', () => setTimeout(tryInject, 300));

    console.log('[Issue Lens] Setup complete');
  },
});
