import { ISSUE_LENS_BUTTON_SELECTOR } from './config';
import { AnchorTarget } from './anchor';

function isConnectedToDocument(element: Element): boolean {
  return document.body.contains(element);
}

function createIssueLensButton(onClick: () => void): HTMLAnchorElement {
  const button = document.createElement('a');
  button.setAttribute('type', 'button');
  button.setAttribute('data-issue-lens', 'filter-button');
  button.className = 'prc-Button-ButtonBase-9n-Xk';
  button.setAttribute('data-loading', 'false');
  button.setAttribute('data-size', 'medium');
  button.setAttribute('data-variant', 'default');
  button.style.cursor = 'pointer';

  const contentSpan = document.createElement('span');
  contentSpan.setAttribute('data-component', 'buttonContent');
  contentSpan.setAttribute('data-align', 'center');
  contentSpan.className = 'prc-Button-ButtonContent-Iohp5';

  const visualSpan = document.createElement('span');
  visualSpan.setAttribute('data-component', 'leadingVisual');
  visualSpan.className = 'prc-Button-Visual-YNt2F prc-Button-VisualWrap-E4cnq';

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
  path.setAttribute(
    'd',
    'M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
  );

  svg.appendChild(path);
  visualSpan.appendChild(svg);

  const textSpan = document.createElement('span');
  textSpan.setAttribute('data-component', 'text');
  textSpan.className = 'prc-Button-Label-FWkx3';
  textSpan.textContent = 'Issue Lens';

  contentSpan.appendChild(visualSpan);
  contentSpan.appendChild(textSpan);
  button.appendChild(contentSpan);

  button.addEventListener('click', (event) => {
    event.preventDefault();
    onClick();
  });

  return button;
}

export function isButtonMounted(): boolean {
  return document.querySelector(ISSUE_LENS_BUTTON_SELECTOR) !== null;
}

export function ensureButtonMounted(anchor: AnchorTarget, onClick: () => void): boolean {
  const existing = document.querySelector<HTMLAnchorElement>(ISSUE_LENS_BUTTON_SELECTOR);
  const insertBefore =
    anchor.insertBefore && isConnectedToDocument(anchor.insertBefore) ? anchor.insertBefore : null;
  const canUseContainer = isConnectedToDocument(anchor.container);

  if (!canUseContainer) {
    return false;
  }

  if (existing) {
    if (insertBefore?.parentElement === anchor.container) {
      if (existing.nextElementSibling !== insertBefore) {
        anchor.container.insertBefore(existing, insertBefore);
      }
    } else if (existing.parentElement !== anchor.container) {
      anchor.container.prepend(existing);
    }
    return true;
  }

  const button = createIssueLensButton(onClick);
  if (insertBefore?.parentElement === anchor.container) {
    anchor.container.insertBefore(button, insertBefore);
  } else {
    anchor.container.prepend(button);
  }

  return true;
}
