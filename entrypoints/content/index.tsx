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

  // Find the search/filter actions toolbar - try multiple selectors
  const buttonsContainer = 
    // Primary: Look for any container with buttons that has Labels/Milestones
    document.querySelector('.ActionList-module__actionList--Tnkgx') ||
    document.querySelector('nav[aria-label="Issues filters"]') ||
    document.querySelector('.search-clear-button')?.closest('div[class*="ActionList"]') ||
    // Fallback: find by looking for Labels button and getting its parent
    document.querySelector('a[href*="/labels"]')?.closest('div[class*="ActionList"], div[class*="ButtonGroup"]') ||
    document.querySelector('a[href*="/milestones"]')?.closest('div[class*="ActionList"], div[class*="ButtonGroup"]') ||
    // Legacy fallbacks
    document.querySelector('.SearchBarActions-module__buttons--DBEMp') ||
    document.querySelector('[class*="SearchBarActions-module__buttons"]') ||
    // Very broad: any container with both Labels and Milestones links
    Array.from(document.querySelectorAll('div')).find(div => 
      div.querySelector('a[href*="/labels"]') && 
      div.querySelector('a[href*="/milestones"]')
    );

  if (buttonsContainer) {
    const button = createIssueLensButton(onClick);
    
    // Try to insert before Labels button for consistency
    const labelsBtn = buttonsContainer.querySelector('a[href*="/labels"]');
    if (labelsBtn) {
      labelsBtn.before(button);
    } else {
      buttonsContainer.prepend(button);
    }
    
    console.log('[Issue Lens] Button injected successfully');
    return true;
  }

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

    // Create shadow DOM for the panel first (fast)
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

    // Try to inject button immediately and retry aggressively
    let attempts = 0;
    const maxAttempts = 100; // Max 10 seconds of retrying
    
    const tryInject = () => {
      attempts++;
      const injected = injectButton(openPanel);
      
      if (!injected && attempts < maxAttempts) {
        // Retry faster (100ms) for better responsiveness
        setTimeout(tryInject, 100);
      } else if (injected) {
        console.log(`[Issue Lens] Button injected after ${attempts} attempt(s)`);
      } else {
        console.log('[Issue Lens] Failed to inject button after max attempts');
      }
    };

    // Start immediately
    tryInject();

    // Watch for DOM changes that might add the toolbar
    const observer = new MutationObserver((mutations) => {
      // Check if any added node is or contains our target
      const hasRelevantUpdates = mutations.some(m => {
        return Array.from(m.addedNodes).some(node => {
          if (!(node instanceof Element)) return false;
          // Check if it's the toolbar or contains it
          return (
            node.querySelector?.('a[href*="/labels"]') ||
            node.querySelector?.('a[href*="/milestones"]') ||
            node.querySelector?.('.ActionList-module__actionList--Tnkgx')
          );
        });
      });
      
      if (hasRelevantUpdates) {
        attempts = 0; // Reset attempts when we see relevant changes
        tryInject();
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Re-inject on GitHub's turbo navigation
    const handleNavigation = () => {
      attempts = 0;
      setTimeout(tryInject, 100);
    };
    
    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);

    console.log('[Issue Lens] Setup complete - button injection active');
  },
});
