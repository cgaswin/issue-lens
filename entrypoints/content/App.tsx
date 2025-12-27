import { useState, useCallback, useEffect } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { useFilterState } from './hooks/useFilterState';
import { useGitHubLabels } from './hooks/useGitHubLabels.ts';
import { useIssueCount } from './hooks/useIssueCount';

const PANEL_STATE_KEY = 'issue-lens-panel-open';

export default function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    try {
      return sessionStorage.getItem(PANEL_STATE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const { filters, setFilters, resetFilters, activeFilterCount } = useFilterState();
  const { labels, assignees } = useGitHubLabels();
  const { openCount } = useIssueCount();

  // Listen for open panel event from injected button
  useEffect(() => {
    const handleOpenPanel = () => {
      setIsPanelOpen(true);
    };

    window.addEventListener('issue-lens:open-panel', handleOpenPanel);
    return () => window.removeEventListener('issue-lens:open-panel', handleOpenPanel);
  }, []);

  // Persist panel open state
  useEffect(() => {
    try {
      sessionStorage.setItem(PANEL_STATE_KEY, isPanelOpen ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
  }, [isPanelOpen]);

  // Build the search URL from current filters
  const buildSearchUrl = useCallback(() => {
    const url = new URL(window.location.href);
    const currentQuery = url.searchParams.get('q') || '';

    let baseQuery = currentQuery
      .replace(/-linked:pr/g, '')
      .replace(/linked:pr/g, '')
      .replace(/no:assignee/g, '')
      .replace(/label:"[^"]+"/g, '')
      .replace(/label:\S+/g, '')
      .replace(/assignee:\S+/g, '')
      .replace(/sort:\S+/g, '')
      .replace(/is:issue/g, '')
      .replace(/is:open/g, '')
      .replace(/is:closed/g, '')
      .replace(/state:open/g, '')
      .replace(/state:closed/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const queryParts: string[] = ['is:issue', 'is:open'];

    if (baseQuery) {
      queryParts.push(baseQuery);
    }

    if (filters.noPr) {
      queryParts.push('-linked:pr');
    }

    if (filters.noAssignee) {
      queryParts.push('no:assignee');
    }

    filters.labels.forEach((label) => {
      if (label.includes(' ')) {
        queryParts.push(`label:"${label}"`);
      } else {
        queryParts.push(`label:${label}`);
      }
    });

    filters.assignees.forEach((assignee) => {
      queryParts.push(`assignee:${assignee}`);
    });

    const sortMap: Record<string, string> = {
      'newest': 'sort:created-desc',
      'oldest': 'sort:created-asc',
      'most-commented': 'sort:comments-desc',
      'recently-updated': 'sort:updated-desc',
    };
    if (filters.sortBy && sortMap[filters.sortBy]) {
      queryParts.push(sortMap[filters.sortBy]);
    }

    const newQuery = queryParts.filter(Boolean).join(' ').trim();
    url.searchParams.set('q', newQuery);

    return url.toString();
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    // Save panel state as CLOSED before navigating
    // This ensures that when the page reloads, the panel is not opened automatically
    try {
      sessionStorage.setItem(PANEL_STATE_KEY, 'false');
    } catch { }

    const newUrl = buildSearchUrl();
    window.location.href = newUrl;
  }, [buildSearchUrl]);

  const handlePanelToggle = useCallback((open: boolean) => {
    setIsPanelOpen(open);
  }, []);

  return (
    <FilterPanel
      open={isPanelOpen}
      onOpenChange={handlePanelToggle}
      filters={filters}
      setFilters={setFilters}
      resetFilters={resetFilters}
      labels={labels}
      assignees={assignees}
      activeFilterCount={activeFilterCount}
      issueCount={openCount}
      onApply={handleApplyFilters}
    />
  );
}
