export const ISSUE_LENS_BUTTON_SELECTOR = '[data-issue-lens="filter-button"]';

export const RECONCILE_CONFIG = {
  debounceMs: 120,
  fastRetryIntervalMs: 250,
  fastRetryDurationMs: 10000,
  steadyRetryIntervalMs: 5000,
} as const;
