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

  // Create content structure safely without innerHTML
  const contentSpan = document.createElement('span');
  contentSpan.setAttribute('data-component', 'buttonContent');
  contentSpan.setAttribute('data-align', 'center');
  contentSpan.className = 'prc-Button-ButtonContent-Iohp5';

  const visualSpan = document.createElement('span');
  visualSpan.setAttribute('data-component', 'leadingVisual');
  visualSpan.className = 'prc-Button-Visual-YNt2F prc-Button-VisualWrap-E4cnq';

  // Create SVG icon
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('display', 'inline-block');
  svg.setAttribute('overflow', 'visible');
  svg.style.verticalAlign = 'text-bottom';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z');
  
  svg.appendChild(path);
  visualSpan.appendChild(svg);

  const textSpan = document.createElement('span');
  textSpan.setAttribute('data-component', 'text');
  textSpan.className = 'prc-Button-Label-FWkx3';
  textSpan.textContent = 'Issue Lens';

  contentSpan.appendChild(visualSpan);
  contentSpan.appendChild(textSpan);
  button.appendChild(contentSpan);

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

    // Watch for the specific toolbar container to be added to DOM
    const observer = new MutationObserver((mutations) => {
      // Fast check if our container might be present
      const addedNodes = mutations.flatMap(m => Array.from(m.addedNodes));
      const hasRelevantUpdates = addedNodes.some(node => 
        node instanceof Element && (
          node.classList?.contains('SearchBarActions-module__buttons--DBEMp') || 
          node.querySelector?.('.SearchBarActions-module__buttons--DBEMp') ||
          node.querySelector?.('[class*="SearchBarActions-module__buttons"]')
        )
      );
      
      if (hasRelevantUpdates) {
        tryInject();
      }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Re-inject on GitHub's turbo navigation
    document.addEventListener('turbo:load', () => setTimeout(tryInject, 300));
    document.addEventListener('turbo:render', () => setTimeout(tryInject, 300));

    console.log('[Issue Lens] Setup complete');
  },
});
