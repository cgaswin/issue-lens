export interface AnchorTarget {
  container: HTMLElement;
  insertBefore?: Element | null;
  strategy: string;
}

const TOOLBAR_SELECTORS = [
  'nav[aria-label="Issues filters"]',
  'div[data-testid="issue-list-filters"]',
  'div[data-testid="issues-filters"]',
  'div[data-testid="issues-toolbar"]',
  '.Subnav',
  '[data-testid="issues-toolbar"]',
] as const;

function asHtmlElement(node: Element | null | undefined): HTMLElement | null {
  return node instanceof HTMLElement ? node : null;
}

function getRepoPathPrefix(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length < 3) return null;
  return `/${parts[0]}/${parts[1]}`;
}

function getIssueScopedLink(hrefSuffix: string): HTMLAnchorElement | null {
  const base = getRepoPathPrefix();
  if (!base) return null;
  return document.querySelector(`a[href^="${base}/${hrefSuffix}"]`);
}

function byNavigationContainer(): AnchorTarget | null {
  for (const selector of TOOLBAR_SELECTORS) {
    const nav = asHtmlElement(document.querySelector(selector));
    if (!nav) continue;

    const labels = nav.querySelector('a[href*="/labels"]');
    const labelsParent = asHtmlElement(labels?.parentElement);
    return {
      container: labelsParent || nav,
      insertBefore: labels,
      strategy: `toolbar:${selector}`,
    };
  }

  return null;
}

function byLabelsOrMilestonesLinks(): AnchorTarget | null {
  const labelsLink =
    getIssueScopedLink('labels') ||
    (document.querySelector('a[href$="/labels"]') as HTMLAnchorElement | null) ||
    (document.querySelector('a[href*="/labels"]') as HTMLAnchorElement | null);

  if (labelsLink) {
    const container =
      asHtmlElement(labelsLink.parentElement) || asHtmlElement(labelsLink.closest('nav, .subnav, .Subnav'));
    if (container) {
      return {
        container,
        insertBefore: labelsLink,
        strategy: 'labels-link-parent',
      };
    }
  }

  const milestonesLink =
    getIssueScopedLink('milestones') ||
    (document.querySelector('a[href$="/milestones"]') as HTMLAnchorElement | null) ||
    (document.querySelector('a[href*="/milestones"]') as HTMLAnchorElement | null);

  if (!milestonesLink) return null;

  const container =
    asHtmlElement(milestonesLink.parentElement) || asHtmlElement(milestonesLink.closest('nav, .subnav, .Subnav'));
  if (!container) return null;

  return {
    container,
    insertBefore: milestonesLink,
    strategy: 'milestones-link-parent',
  };
}

function bySearchInputProximity(): AnchorTarget | null {
  const queryInput = document.querySelector<HTMLInputElement>(
    'input[name="q"], input[aria-label*="issues" i], input[placeholder*="issues" i]',
  );
  if (!queryInput) return null;

  const topToolbar = asHtmlElement(
    queryInput.closest('div[data-testid="issues-filters"], div[data-testid="issue-list-filters"], .Subnav, .subnav'),
  );
  const container = topToolbar || asHtmlElement(queryInput.closest('form, [role="search"], .subnav'));
  if (!container) return null;

  return {
    container,
    strategy: 'search-proximity',
  };
}

function byFallbackBodyMount(): AnchorTarget | null {
  const body = document.body;
  if (!body) return null;

  let fallback = document.querySelector<HTMLElement>('[data-issue-lens="fallback-anchor"]');
  if (!fallback) {
    fallback = document.createElement('div');
    fallback.setAttribute('data-issue-lens', 'fallback-anchor');
    fallback.style.position = 'fixed';
    fallback.style.top = '12px';
    fallback.style.right = '12px';
    fallback.style.zIndex = '9996';
    body.appendChild(fallback);
  }

  return {
    container: fallback,
    strategy: 'body-fallback',
  };
}

function byIssueSearchRow(): AnchorTarget | null {
  const input = document.querySelector<HTMLInputElement>('input[name="q"]');
  if (!input) return null;

  const row = asHtmlElement(input.closest('div, form'));
  if (!row) return null;

  const labels = row.querySelector('a[href*="/labels"]');
  if (labels) {
    const container = asHtmlElement(labels.parentElement) || row;
    return {
      container,
      insertBefore: labels,
      strategy: 'search-row-labels',
    };
  }

  const milestones = row.querySelector('a[href*="/milestones"]');
  if (milestones) {
    const container = asHtmlElement(milestones.parentElement) || row;
    return {
      container,
      insertBefore: milestones,
      strategy: 'search-row-milestones',
    };
  }

  return {
    container: row,
    strategy: 'search-row',
  };
}

export function findButtonAnchor(): AnchorTarget | null {
  return (
    byNavigationContainer() ||
    byLabelsOrMilestonesLinks() ||
    byIssueSearchRow() ||
    bySearchInputProximity() ||
    byFallbackBodyMount()
  );
}
