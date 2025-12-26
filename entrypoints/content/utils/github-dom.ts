export interface GitHubIssue {
  id: string;
  title: string;
  labels: string[];
  assignees: string[];
  hasLinkedPr: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  element: HTMLElement;
}

/**
 * Parse all issues from the current page
 */
export function parseIssues(): GitHubIssue[] {
  const issues: GitHubIssue[] = [];

  // First, try to find issue links - they contain /issues/<number>
  // Use a very broad selector first
  const allLinks = document.querySelectorAll('a[href*="/issues/"]');

  console.log('[Issue Lens] Found links with /issues/:', allLinks.length);

  // Filter to only issue number links (not /issues/new, etc.)
  const issueLinks: HTMLAnchorElement[] = [];
  allLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    // Match patterns like /issues/123 but not /issues/new or /issues/assigned
    if (/\/issues\/\d+/.test(href)) {
      issueLinks.push(link as HTMLAnchorElement);
    }
  });

  console.log('[Issue Lens] Issue links after filtering:', issueLinks.length);

  const processedIds = new Set<string>();

  issueLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/issues\/(\d+)/);
    const id = match ? match[1] : '';

    // Skip duplicates (same issue linked multiple times)
    if (!id || processedIds.has(id)) return;
    processedIds.add(id);

    // Find the parent row element - walk up until we find a reasonable container
    let rowElement: HTMLElement | null = link as HTMLElement;
    let parent: HTMLElement | null = rowElement.parentElement;

    while (parent) {
      // Check if parent looks like a row container
      const isRow =
        parent.classList.contains('Box-row') ||
        parent.getAttribute('role') === 'listitem' ||
        parent.tagName === 'LI' ||
        (parent.tagName === 'DIV' &&
          parent.parentElement?.getAttribute('role') === 'list') ||
        parent.classList.contains('js-issue-row');

      if (isRow) {
        rowElement = parent;
        break;
      }

      // Stop if we've gone too far up (more than 8 levels)
      parent = parent.parentElement;
      if (!parent || parent.tagName === 'BODY') break;
    }

    const element = rowElement;

    // Get title - it's usually the link text itself
    const title = link.textContent?.trim() || '';

    // Get labels - look for label elements within the row
    const labels: string[] = [];
    const labelElements = element.querySelectorAll(
      '.IssueLabel, ' +
      'a[data-name], ' +
      '[class*="Label"], ' +
      'span[style*="background"]' // GitHub labels often have inline background colors
    );
    labelElements.forEach((label) => {
      const labelText = label.getAttribute('data-name') ||
        label.getAttribute('title') ||
        label.textContent?.trim();
      if (labelText && labelText.length < 50 && !labels.includes(labelText)) {
        labels.push(labelText);
      }
    });

    // Get assignees - look for avatars
    const assignees: string[] = [];
    const assigneeElements = element.querySelectorAll('img[alt]');
    assigneeElements.forEach((avatar) => {
      const alt = avatar.getAttribute('alt') || '';
      // GitHub uses @username or just username for alt text on avatars
      if (alt.startsWith('@') || (alt && avatar.classList.contains('avatar'))) {
        const username = alt.replace(/^@/, '');
        if (username && !assignees.includes(username)) {
          assignees.push(username);
        }
      }
    });

    // Check for linked PR - look for PR icon
    const prLink = element.querySelector(
      'svg.octicon-git-pull-request, ' +
      '.octicon-git-pull-request, ' +
      '[data-testid="pull-request-link"], ' +
      'a[href*="/pull/"]'
    );
    const hasLinkedPr = prLink !== null;

    // Get comment count
    let commentCount = 0;
    const commentIcons = element.querySelectorAll('svg.octicon-comment, .octicon-comment');
    commentIcons.forEach((icon) => {
      const parent = icon.closest('a, span, div');
      const text = parent?.textContent?.trim() || '';
      const num = parseInt(text.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > 0) commentCount = num;
    });

    // Get timestamps
    const timeElement = element.querySelector('relative-time, time');
    const createdAt = timeElement?.getAttribute('datetime') || '';

    issues.push({
      id,
      title,
      labels,
      assignees,
      hasLinkedPr,
      commentCount,
      createdAt,
      updatedAt: createdAt,
      element,
    });
  });

  console.log('[Issue Lens] Final parsed issues:', issues.length);
  if (issues.length > 0) {
    console.log('[Issue Lens] First issue sample:', {
      id: issues[0].id,
      title: issues[0].title?.substring(0, 40),
      hasLinkedPr: issues[0].hasLinkedPr,
      labels: issues[0].labels,
      element: issues[0].element?.tagName
    });
  }

  return issues;
}

/**
 * Extract all unique labels from parsed issues
 */
export function extractLabels(issues: GitHubIssue[]): string[] {
  const labelSet = new Set<string>();
  issues.forEach((issue) => {
    issue.labels.forEach((label) => labelSet.add(label));
  });
  return Array.from(labelSet).sort();
}

/**
 * Extract all unique assignees from parsed issues
 */
export function extractAssignees(issues: GitHubIssue[]): string[] {
  const assigneeSet = new Set<string>();
  issues.forEach((issue) => {
    issue.assignees.forEach((assignee) => assigneeSet.add(assignee));
  });
  return Array.from(assigneeSet).sort();
}
